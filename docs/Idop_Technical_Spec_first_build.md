# IDOP — Technical Specification (Lean)
### First Build (Stage 1 → early Stage 2)

**Companion to:** Idop Product Bible v0.2 and the first-build PRD. The bible holds the "why"; the PRD holds the "what"; this holds the "how." References like *Bible §18* / *PRD §5.5* point back.
**Scope:** Architecture sufficient to build the single-player loop (Capsule + Hearth + active archive), engineered to be **operable by one person** and **forward-compatible** with later stages without building them now (Bible §18, §20).
**Design center:** a deterministic-stochastic simulation resolved **lazily (compute-on-read)** so idle server cost approaches zero and every outcome is reproducible and explainable.
**Status:** v0.1 of the tech spec.

---

## 1. Principles (non-negotiable)

1. **Compute-on-read, not continuous ticking.** A journey is *defined* at launch and *resolved* when the client reads it. No always-on simulation workers (Bible §18). This is what makes solo operation and premium economics viable.
2. **Deterministic + reproducible.** Given the same inputs (seed + stored world snapshots + player influence events), resolution always yields the same result — enabling debugging, dispute resolution, and the "explain why" requirement (PRD §5.5).
3. **Server-authoritative.** Outcomes, timing, and seeds are computed server-side. The client renders; it never decides outcomes. Force-quitting changes nothing (PRD §10).
4. **Real-world data is a bounded modifier, never a gate.** The deterministic baseline guarantees a rich journey for every player in every climate (Bible §8). Real data adds flavor, bounded bonuses, and rare-window triggers on top.
5. **Privacy by construction.** Precise location lives only transiently in memory to derive a coarse region and fetch weather, then is discarded. Only coarse regions are stored. No continuous trail (Bible §17).
6. **No free text, no strangers, near-zero moderation** — a property of the design, preserved in the data model (Bible §14).

---

## 2. High-level architecture

```
Mobile client (RN/Expo)
   │  HTTPS / JSON
   ▼
API (stateless app server)
   ├─ Auth & identity
   ├─ Object service        (Capsule, Hearth CRUD + current-state projections)
   ├─ Journey service       (launch, lazy-resolve, influence events)
   ├─ Memory ledger         (append-only MemoryEvents; archive read models)
   ├─ World-data service     (fetch → canonicalize → translate → snapshot cache)
   └─ Notification scheduler (gentle, real-moment-anchored)
   ▼
Postgres (+ PostGIS, + JSONB)   ·   Redis (hot state, rate limits, locks)
Object storage (assets, exports)   ·   Secrets manager (server seed secret, versioned)
External: weather/time/astronomy API   ·   Push (FCM/APNs)   ·   Map tiles (self-hosted/MapLibre)
```

There are **no journey worker processes** in this build. The only background job is the notification scheduler (and optional cache warming).

---

## 3. The determinism engine

### 3.1 Journey seed
Computed once at launch and stored as a hash (never store the raw secret):

```
journey_seed = HMAC_SHA256(
    key   = server_secret[secret_version],
    msg   = capsule_id ‖ launch_time_server_utc ‖ coarse_region_id ‖ intent_id ‖ journey_nonce
)
store: seed_hash = SHA256(journey_seed), secret_version
```

- `launch_time_server_utc` uses **server time**, so device clock changes can't influence outcomes (PRD §10).
- `journey_nonce` is a random per-journey value ensuring two identical builds launched together still diverge.
- `secret_version` is stored per journey so the server secret can be rotated without breaking reproducibility of past journeys (the old version is retained, read-only, for replay).

### 3.2 Deterministic rolls
Any randomness needed during resolution is derived, never stored:

```
roll(phase, tick_index, rule_id) =
    first 8 bytes of HMAC_SHA256(journey_seed, phase ‖ tick_index ‖ rule_id) → float in [0,1)
```

Same coordinates → same roll, always. No RNG state is persisted.

### 3.3 Rule format (data-driven)
Designers add/balance rules as data, not code (Bible §16). A rule is a JSON record evaluated during resolution:

```json
{
  "id": "rain_paper_water_stain",
  "phase": "tick",
  "when": {
    "world_signals_any": ["rain_light", "rain_moderate"],
    "shell_in": ["paper", "cloth"],
    "capsule_durability_lt": 60
  },
  "chance": {
    "base": 0.35,
    "modifiers": [
      { "if": { "tools_contains": "shelter_active" }, "delta": -0.20 },
      { "if": { "core": "brave" }, "delta": 0.05 }
    ]
  },
  "effects": [
    { "add_scar": "water_stain" },
    { "add_stamp_if_absent": "first_rain" },
    { "mood_delta": { "nervous": 1 } }
  ],
  "explain": "Because {name} crossed rain with a {shell} shell, it gained a water stain.",
  "causes": ["shell", "world_signal:rain", "roll"]
}
```

`explain` and `causes` are what power the PRD §5.5 "why" (≤3 causes surfaced). The §4 PRD content table is the initial rule set.

### 3.4 Outcome composition (the fairness rule)
```
journey_outcome = deterministic_baseline(seed, intent, capsule)
                 ⊕ realworld_modifiers(world_snapshots)   // bounded; flavor + bonuses + rare windows
```
`deterministic_baseline` alone must already produce a varied, satisfying, full-range journey. `realworld_modifiers` can boost odds, add flavor signals, and unlock rare windows, but **cannot remove access to any outcome category**. Enforced by keeping real-world contributions to bounded additive deltas and additive rare-window rules only (PRD §7 guardrail: the game must pass with weather disabled).

---

## 4. Lazy journey resolution (compute-on-read)

A **Journey** persists only: `id, capsule_id, intent_id, launch_time, duration, coarse_region_id, seed_hash, secret_version, status, capsule_snapshot_at_launch, influence_events[]`. Everything else is derived on read.

**On `GET journey state` at wall-clock time T:**

1. `t_end = launch_time + duration`; `t_eval = min(T, t_end)`.
2. Determine elapsed ticks at coarse granularity (e.g., one tick / 30–60 min) **plus** any event-triggered ticks; this keeps compute tiny.
3. For each tick `i` up to `t_eval`:
   a. Fetch the **stored world snapshot** for `(coarse_region_id, tick_time_window)` (see §5). Snapshots are cached at fetch time precisely so past inputs are reproducible.
   b. Apply any `influence_events` whose timestamp ≤ tick time.
   c. Evaluate the rule set against `(capsule state, world signals, roll(...))`; accumulate state deltas, dispatches, and any decision-point availability.
4. **If `T < t_end`:** return the projected in-progress state (status `travelling` / `decision_point` / `nearing_return`) with dispatches so far. Persist nothing except that the read happened (optional, for analytics).
5. **If `T ≥ t_end`:** run **completion + memory commit** (§6) inside a per-journey lock; mark `status = returned`. The commit is **idempotent** (keyed by `journey_id`) so concurrent reads can't double-commit.

**Influence actions** (`POST influence`) simply append `InfluenceEvent(journey_id, type, t_server)` to the journey (subject to per-type use limits). Because resolution recomputes on read, the action deterministically changes subsequent ticks. Consequently a journey's *final* outcome is not fully fixed until `t_end` — correct and desired (the player can still matter).

**Why store world snapshots?** Weather can't be reliably/cheaply re-fetched for past windows, and determinism + "explain why" require the *exact* inputs used. So the world-data service caches each snapshot it produces, keyed by region+window, and the resolver only ever reads cached snapshots (§5).

---

## 5. World-data pipeline (thin for this build)

**Sources:** weather + time/astronomy. Default **Open-Meteo** (note: the free tier is **non-commercial** — use the commercial tier, ~\$29/mo for ~1M calls, before any launch; Bible §18). Sunrise/sunset/golden-hour/moon-phase can be computed locally from coordinates/date (no API needed).

**Flow (only for active/needed regions and windows):**
1. Client obtains precise location **only at launch/scan**, sends it once. Server derives `coarse_region_id` (low-resolution H3 or equivalent) and **discards precise coords immediately** (§7).
2. World-data service fetches conditions for that coarse region + the journey's time windows **only if not already cached**.
3. Normalize raw inputs → **canonical world facts** (e.g., `{ rain: "moderate", wind: "medium", daylight: "night", place_type: "near_water" }`).
4. Translate canonical facts → **game signals** (`["rain_polish","night_cover","river_pull"]`).
5. Store a **WorldSnapshot** `(coarse_region_id, time_window, canonical, signals, source_version, confidence)`; cache by region+window (not per-user). Stale-while-revalidate for non-critical reads.

**Fairness backstop:** if a snapshot is missing or flat, the resolver uses the deterministic baseline; real signals only ever *add* (§3.4). Optional seeded in-game seasons can supply variety later (Stage 3).

---

## 6. Data model

Separate **mutable current state** (fast UI) from the **append-only memory ledger** (source of truth for history, replay, archive).

**Core tables (illustrative fields):**

```
User              id, handle, age_band, region_coarse, settings(jsonb),
                  created_at, deleted_at
Capsule           id, owner_id, name, shell, core, cargo, intent_default,
                  current_state(jsonb: durability, mood, visible_marks[]),
                  status(active|home|retired), created_at
Hearth            id, owner_id, stage, charge, tend_last_at,
                  unlocked_features[](jsonb), appearance_state(jsonb)
Journey           id, capsule_id, intent_id, launch_time, duration,
                  coarse_region_id, seed_hash, secret_version,
                  capsule_snapshot_at_launch(jsonb), influence_events(jsonb[]),
                  status(travelling|returned), started_at
MemoryEvent       id, capsule_id, journey_id, type(scar|transform|stamp|
                  cargo|trace|place_time|myth), timestamp,
                  coarse_region_id, payload(jsonb), causes(jsonb), source
WorldSnapshot     coarse_region_id, time_window, canonical(jsonb),
                  signals(jsonb), source_version, confidence
                  (no user identity attached)
Artifact          id, capsule_id, summary, rarity, display_meta(jsonb)
```

**Storage choices:** Postgres for relational state; **JSONB** for flexible rule payloads, memory payloads, and Hearth/appearance state (with indexed expressions for hot queries); **PostGIS** only for sensitive-region checks and coarse boundaries (the spatial layer is de-emphasized in this build); **Redis** for hot journey reads, per-type influence rate limits, and the per-journey completion lock; object storage for exports/assets.

**Archive read patterns:** object profile (current_state + last N MemoryEvents + rare stamps); journey recap (events for journey_id, time-sorted, with stored `explain`); collection view (stamps earned vs. catalog → the **gaps** that drive PRD §5.6); threshold progress (counts over MemoryEvents).

**Current_state is a projection** rebuildable by replaying a Capsule's MemoryEvents — so history is the source of truth and the UI table is a cache.

---

## 7. Privacy implementation (Bible §17)

- **Transient precise location:** used in-memory to (a) derive `coarse_region_id` and (b) trigger a weather fetch, then **discarded**. Never written to durable storage. Never placed in URLs/query strings.
- **Stored location:** only `region_coarse` (user) and `coarse_region_id` (journeys/snapshots/events). No continuous trail.
- **No cross-user location resolution:** no field or endpoint can resolve one user's precise (or even fine) location from another user's perspective. (Forward-compatible note: Tier 0 social, when built, exposes only aggregate counts and identity-stripped overlaps — §9.)
- **Data subject rights:** `export` (all user data + archive as JSON/asset bundle) and `delete` (hard-delete user + cascade; retain only identity-stripped WorldSnapshots and aggregate analytics). Build both from day one — required for any age posture, and reconciles the "permanent archive" with retention rules.
- **Secrets:** the server seed secret lives in a secrets manager, **versioned** (§3.1); rotation never breaks past-journey reproducibility.

---

## 8. API surface (first build)

Minimal, REST-ish, all authenticated and server-authoritative.

| Operation | Notes |
|---|---|
| `POST /capsules` | Build a Capsule (shell, core, cargo, name, default intent). |
| `POST /journeys` | Launch: body includes capsule_id, intent, and one precise-location payload (used transiently, §7). Server computes seed, derives coarse region, fetches/uses world snapshots, returns the journey + launch-window read. |
| `GET /journeys/:id` | **Lazy-resolve** to now (§4); returns status, route mood, dispatches-so-far, available influence actions, return-moment estimate; or the completed return payload. |
| `POST /journeys/:id/influence` | Append a boost/shelter event (rate-limited per type). |
| `GET /capsules/:id` | Current state + recent memory. |
| `GET /archive` | Collection view: owned Capsules, stamps earned vs. catalog (gaps), threshold progress, Hearth witness state. |
| `POST /hearth/tend` | Once-per-day additive tend; updates charge/stage eligibility. |
| `GET /hearth` | Stage, unlocks, appearance, today's window read + look-up nudge. |
| `GET/PUT /settings` · `POST /account/export` · `POST /account/delete` | Notifications, data rights, age gate. |

No messaging, no social, no UGC endpoints in this build.

---

## 9. Forward-compatibility (don't build now; don't preclude)

Keep these cheap to add later (Bible §14, §20) without designing for them now:
- **Tier 0 social:** anonymized traces = identity-stripped queries over journeys sharing a `(coarse_region_id, time_window)`; collective "I was there" = aggregate counts over MemoryEvents/journeys for a shared real event. The data model already stores coarse region + time on journeys/events, so this is additive — **no schema change required to keep the door open**. Do *not* add any field that ties a memorable event to a resolvable user location.
- **Rules engine** is data-driven, so new scars/intents/events ship as content, not deploys.
- **Lazy resolution** scales by adding read-time caching and, only if ever needed, optional pre-resolution workers — but the default stays compute-on-read.

---

## 10. Tech stack (recommended; optimize for solo speed)

| Concern | Choice | Rationale |
|---|---|---|
| Client | React Native + Expo | Solo speed; one codebase iOS/Android. Native path only if map/anim perf demands it later. |
| Backend | TypeScript/Node (Go or Python equally fine) | Pick familiarity; stateless app servers. |
| DB | Postgres + PostGIS + JSONB | Relational truth + flexible payloads + coarse spatial. |
| Cache/locks | Redis | Hot reads, influence rate limits, per-journey completion lock. |
| Push | FCM/APNs | Free; gentle scheduler only. |
| Map tiles | MapLibre + self-hosted/open tiles | Flatten the one map-ish cost (stylized surface only). |
| Weather | Open-Meteo commercial tier | ~\$29/mo floor; cache by region+window. |
| Infra | Managed containers/serverless + IaC from day one | Operable by one person. |
| Secrets | Managed secrets manager (versioned) | Seed secret rotation safety. |

---

## 11. Cost posture (small scale)

Driven by Bible §18 reasoning:
- **Idle cost ≈ floor**, because there is no continuous simulation (lazy resolution). The unavoidable floor is the weather commercial tier (~\$29/mo) + minimal always-on DB/app footprint.
- Indicative: ~\$50–150/mo at ~1k MAU; ~\$200–600/mo at ~10k MAU (modeled; self-hosted tiles and region+window caching are the main levers).
- **Cost explodes only if** the lazy model is abandoned (continuous ticking), tiles are taken from a metered SDK at volume, or weather is fetched per-user instead of per-region+window. Avoid all three.

---

## 12. Security & operability

- **Auth:** OAuth/Apple/Google/email + secure session tokens.
- **At rest / in transit:** TLS everywhere; encryption at rest for DB and object storage.
- **Abuse:** per-type influence rate limits; standard request limits. (Near-zero moderation surface by design — no free text, no strangers.)
- **Auditability/replay:** seed_hash + stored world snapshots + influence events make any journey replayable for debugging and "explain why."
- **Single-operator guardrails:** no on-call simulation infra; idempotent commits; nothing time-critical that breaks if the operator is asleep (journeys resolve on read, not on a worker SLA).

---

## 13. Build order (engineering)

Mirrors the PRD's prove-the-moment-first discipline (Bible §3, §22):
1. **Determinism core + lazy resolver** with a hardcoded tiny rule set and a fake world snapshot → prove a journey resolves identically every read and produces a visible change with a stored `explain`.
2. **Data model + memory ledger + current-state projection** → archive read patterns and gaps.
3. **Build / launch / journey / return** screens wired to the resolver (PRD §5).
4. **Hearth** state machine + tend + evolution stages + witness reactions (PRD §6).
5. **World-data service** (thin): coarse region derivation, transient-coords discard, snapshot cache, translation (PRD §7, §5 here).
6. **Notifications** (gentle scheduler), **settings**, **export/delete**, **age gate**.
7. **Fairness check:** verify full playability with weather disabled before any playtest.
