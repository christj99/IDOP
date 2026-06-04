# BACKLOG.md — Idop First Build

> This is the work queue and the **goal target**. Codex `/goal` should drive items in order. Each item's **Definition of Done (DoD)** is the stop condition: the listed acceptance criteria pass as automated tests **and** CI is green (lint + typecheck + test).
>
> **Read `AGENTS.md` first** — its hard constraints override anything here. Detail lives in `docs/Idop_Technical_Spec_first_build.md` (the "how") and `docs/Idop_PRD_first_build.md` (the "what"). Section refs like *Spec §3* point there.
>
> **Verification reality:** engine/data/API milestones (M1–M3, M6) are objectively testable — `/goal` is strong here, run it freely. UI/feel milestones (M4, M5, M7) need a **human check against PRD acceptance criteria** in addition to component/build tests — `/goal` is weaker on subjective polish, so cap its autonomy there.

Legend: each item lists **Objective → Build → Acceptance (testable) → DoD**. Constraints in `AGENTS.md` apply to all.

---

## M0 — Scaffold & CI

**Objective:** a legible, buildable monorepo with green CI, so every later goal has a verification surface.
**Build:** the workspace per `AGENTS.md` structure (`apps/mobile`, `apps/server`, `packages/engine`, `packages/shared`, `docs`, `infra`); pnpm workspaces; TypeScript strict; Vitest; ESLint+Prettier; GitHub Actions running lint+typecheck+test; the `pnpm` scripts in `AGENTS.md`; a placeholder failing-then-passing test to prove CI works; copy the three `docs/*` files into `/docs`.
**Acceptance (testable):**
- `pnpm install`, `pnpm typecheck`, `pnpm lint`, `pnpm test` all succeed locally and in CI.
- CI is green on a PR.
**DoD:** green CI; repo structure matches `AGENTS.md`; docs present in `/docs`.

---

## M1 — The determinism engine (CROWN JEWEL; test-first)

**Objective:** a pure, deterministic, reproducible simulation core with no I/O. This is the highest-correctness item; do it before anything that depends on it.
**Build (in `packages/engine`, see Spec §3–§4):**
- `seed(input)` → `journey_seed` via `HMAC_SHA256(server_secret[version], capsule_id ‖ launch_time_utc ‖ coarse_region_id ‖ intent_id ‖ journey_nonce)`; expose `seed_hash` + `secret_version`. Server time only.
- `roll(journey_seed, phase, tick_index, rule_id)` → float in `[0,1)` from `HMAC_SHA256`. No stored RNG state.
- A **data-driven rule type** (`when` / `chance{base,modifiers}` / `effects` / `explain` / `causes`) and a rule evaluator (Spec §3.3). Seed the rule set from the **PRD §4 scar/transformation table**.
- `resolveJourney({seed, launchTime, duration, intent, capsuleSnapshot, worldSnapshots[], influenceEvents[]}, atTime)` implementing the **lazy compute-on-read** algorithm (Spec §4): tick to `min(atTime, end)`, apply influence events ≤ tick time, evaluate rules, accumulate state deltas + dispatches + decision-point availability; if `atTime ≥ end`, produce the completion result (visible change(s), stamps, causes, short myth slot).
- `deterministic_baseline(...)` such that outcomes are rich/varied from the seed ALONE; `realworld_modifiers(...)` apply only bounded additive deltas + additive rare-window rules (Spec §3.4).
**Acceptance (testable — these are the contract):**
- **Reproducibility:** `resolveJourney(sameInputs, sameT)` twice → deep-equal results, including the full dispatch list and final marks. (byte/structurally identical)
- **Roll determinism:** identical `(seed,phase,tick,rule_id)` → identical float; different coordinates → different floats; distribution roughly uniform over many samples.
- **Influence causality:** adding an influence event before tick *k* changes ticks ≥ *k* deterministically and leaves ticks < *k* unchanged.
- **Time monotonicity:** resolving at `T1 < T2` yields a dispatch/state prefix relationship (state at T2 is a continuation of T1, never a contradiction).
- **No raw randomness:** a lint/test rule fails if `Math.random` (or `Date.now()` for seeding) appears in `packages/engine`.
- **FAIRNESS (must stay green forever):** with `worldSnapshots = []` (weather disabled), over N seeded journeys the engine still produces (a) every outcome *category* at least once, and (b) variety above a threshold (no degenerate single-outcome collapse). Real-world modifiers, when present, only increase frequencies/flavor — never remove an outcome category.
**DoD:** all acceptance tests pass; engine has zero I/O imports; coverage on the resolver and rule evaluator is high; CI green.

---

## M2 — Data model, memory ledger, projections

**Objective:** persistence with the mutable-state / append-only-history split (Spec §6).
**Build:** Prisma schema for `User, Capsule, Hearth, Journey, MemoryEvent, WorldSnapshot, Artifact` (fields per Spec §6); JSONB for payloads; migrations; a `projectCurrentState(capsuleId)` that rebuilds `Capsule.current_state` by replaying `MemoryEvent`s; repository functions for the Spec §6 archive read patterns (object profile, journey recap, collection view with **gaps**, threshold progress).
**Acceptance (testable):**
- Append-only enforced: a test proving `MemoryEvent`s cannot be updated/deleted through the app layer (only inserted).
- `projectCurrentState` reproduces the same `current_state` from the event log (replay equals stored cache).
- Collection-view query returns earned-vs-catalog so **gaps** are computable; threshold-progress query returns correct counts.
- `WorldSnapshot` rows carry no user identity.
**DoD:** migrations apply cleanly (`pnpm db:migrate`); read patterns covered by tests; CI green.

---

## M3 — Journey API (launch, resolve-on-read, influence)

**Objective:** the server endpoints that wrap the engine (Spec §8), server-authoritative.
**Build (Fastify + Zod):**
- `POST /journeys` (launch): accept `capsule_id, intent, precise_location`(used **transiently** — derive `coarse_region_id`, fetch/use world snapshots, then **discard precise coords**, Spec §7), compute & store seed_hash+secret_version+nonce, persist the Journey, return journey + launch-window read.
- `GET /journeys/:id`: lazy-resolve to now via the engine; return in-progress state (status, route mood, dispatches-so-far, available influence actions, real-moment return estimate) or the completed return payload. On completion, run **idempotent** memory commit inside a per-journey Redis lock (Spec §4 step 5).
- `POST /journeys/:id/influence`: append a rate-limited boost/shelter event.
- `POST /capsules`, `GET /capsules/:id`.
**Acceptance (testable):**
- Launch never persists precise coordinates (assert only coarse region is stored anywhere).
- Two concurrent `GET` calls on a just-completed journey commit memory **exactly once** (idempotency/lock test).
- Device-clock spoofing in the request cannot change timing/seed (server time authoritative).
- Influence endpoint enforces per-type use limits.
- API outcomes match the engine's pure-function output for the same inputs (server adds no nondeterminism).
**DoD:** endpoint integration tests pass (incl. the privacy + idempotency tests); CI green.

**Deferred / known assumption:** Per-journey completion lock is in-memory (single-server only). Before running >1 server instance, replace with the Redis per-journey lock (Tech Spec §4) so concurrent commits across instances stay once-only. The lock seam exists for this swap.

---

## M4 — Client core screens (build → launch → journey → return)  · human-check

**Objective:** the playable loop UI (PRD §5). **Subjective feel needs a human pass.**
**Build (Expo RN):** Home/Hearth, Build/Workshop (≤4 decisions + **live legible risk preview**), Launch (ceremonial confirm; return shown as a real moment), Journey/Away (status, dispatch feed, the 1–2 influence actions), **Return** (visible-change reveal → ≤3-sentence myth → stamps → memory commit with Hearth reaction → one next action). Wire all to M3.
**Acceptance:**
- *Automated:* components render for every state in PRD §5; the build flow blocks launch until named; the Return screen always shows a visible mark element (fails if absent). App builds (`expo` typecheck/build).
- *Human check (PRD §5 ACs):* a complete build takes ≤60s; the risk preview reads in plain cause→effect; the return is emotionally legible and the player can state *why*; a "bad" journey still produces a satisfying marked return.
**DoD:** automated checks pass + CI green + a human has signed off the PRD §5 ACs (record sign-off in the PR). Do not let `/goal` mark this done on automated tests alone.

---

## M5 — The Hearth (state machine, tend, evolution, witness)  · human-check

**Objective:** the persistent companion with a **light active loop** (PRD §6; avoid the "pointless base").
**Build:** Hearth state (stage, charge, unlocks, appearance); the once-daily **tend** action (additive, never punitive); the visible **evolution stages** (PRD §6 table) driven by archive thresholds + returns; **witness reactions** on returns and threshold hits.
**Acceptance:**
- *Automated:* tend is rate-limited to once/day and is purely additive (skipping changes nothing else); evolution stage advances when its trigger condition is met (unit-tested on the trigger logic); witness reaction fires on return + threshold events.
- *Human check:* the Hearth visibly changes ≥ twice within ~2 weeks of simulated normal play; tending feels satisfying, not chore-like.
**DoD:** automated checks + CI green + human sign-off on the feel checks.

---

## M6 — World-data pipeline (thin) + fairness wiring

**Objective:** real conditions as flavor/bonus only, with the deterministic backstop (Spec §5, Bible §8).
**Build:** Open-Meteo client (cache by **region+time-window**, not per-user); local sunrise/sunset/golden-hour/moon-phase computation; normalize → **canonical world facts** → **game signals**; persist `WorldSnapshot`s (the resolver reads only cached snapshots — Spec §4 "why store snapshots"); the launch-window read + "look up" nudge (golden hour / full moon / first frost).
**Acceptance (testable):**
- **The fairness test from M1 still passes** with this layer wired in (weather can be disabled and the game stays rich/varied).
- Real conditions measurably *flavor* a journey (a test shows a signal present in the journey) without being required for any outcome category.
- No weather call is made per-user; cache hit on repeated region+window.
- Precise coords never reach the weather cache key or storage (coarse region only).
- Resolves the M2 `// TODO(M6)`: a Zod (or equivalent) validation at the write boundary rejects coordinate-shaped fields inside `WorldSnapshot.canonical` and `MemoryEvent.payload`; a test asserts a coordinate-bearing payload is rejected (mutation-style: it must fail if the validation is removed).
**DoD:** fairness + caching + privacy tests pass; CI green.

---

## M7 — Archive as an active collection  · human-check

**Objective:** the retention spine — gaps, thresholds, witness, curation (PRD §5.6, §7).
**Build:** the collection space (Capsules + visible marks); **visible gaps**; **threshold unlocks** wired to Hearth capabilities/display; reachable in ≤1 tap from Home; (optional) the ambient-almanac surfacing.
**Acceptance:**
- *Automated:* gaps computed from M2's collection-view query render; hitting a threshold triggers a real unlock + acknowledgement; archive route ≤1 tap from Home.
- *Human check (Stage-1 gate):* revisiting is rewarding with nothing new (curation/re-reading/almanac).
**DoD:** automated checks + CI green + human sign-off; **this is the item that proves the Stage-1 "voluntary revisit" gate** — flag it for playtest.

---

## M8 — Notifications, settings, data rights, age gate

**Objective:** gentle re-engagement + compliance basics (PRD §8, §11; Bible §17).
**Build:** the notification scheduler (gentle, real-moment-anchored copy only; **banned**: loss/urgency/streak/neglect framing); per-category notification toggles; **`POST /account/export`** (all user data + archive as JSON/asset bundle) and **`POST /account/delete`** (hard-delete + cascade; retain only identity-stripped snapshots/aggregates); a generic age gate (default 18+, centralized).
**Acceptance (testable):**
- A test asserts no scheduled notification template contains loss/urgency/neglect language (lint against a banned-phrase list).
- Export returns a complete bundle; delete removes the user and cascades, leaving no user-identifying rows except identity-stripped `WorldSnapshot`s.
- Age value is read from one central constant/config.
**DoD:** tests pass; CI green.

---

## M9 — Fairness & wellbeing audit (cross-cutting gate)

**Objective:** prove the product's invariants hold end-to-end before any playtest.
**Build:** an integration/audit test suite that runs the whole stack and asserts the `AGENTS.md` hard constraints.
**Acceptance (testable — these guard the soul of the product):**
- **Fairness:** full game playable with weather disabled; varied outcomes; no outcome category gated by real conditions.
- **No loss-aversion:** simulate long absence → nothing is lost; Capsule waits/returns; no decay applied.
- **Determinism:** a recorded journey replays identically from its seed + snapshots + influence events.
- **Privacy:** scan the DB after a full play session → zero precise coordinates stored anywhere; no cross-user location resolution path exists.
- **Visible return:** every completed journey has ≥1 visible mark committed.
**DoD:** the audit suite is green in CI and wired as a required check; ready for closed playtest measuring the PRD §11 metrics.

---

## Suggested goal decomposition for `/goal`

- Run M0 and M1 as their **own** goals (correctness-critical; verify before proceeding).
- M2, M3, M6, M8, M9 are good autonomous `/goal` targets (objectively testable).
- M4, M5, M7 (UI/feel): scope `/goal` to the **automated** acceptance only, then do the **human checks** yourself against the PRD before marking done.
- Always: a fresh branch per milestone, full-auto + sandbox, CI as the verification surface, and a spend limit set (see `CODEX_GOAL.md`).
