# AGENTS.md

> This file is read automatically by Codex (and other agentic coding tools). Keep it high-signal. It is the contract for how to work in this repo.
> The full reasoning lives in `/docs`. This file is the operational summary plus the **hard constraints that must never be violated**.

---

## Project in one paragraph

We are building **Idop** (working name) — a single-player-first **cozy mobile game**. The player builds a small object (a **Capsule**), launches it into a stylized world for hours-to-overnight, and gets it back **visibly changed**, with a permanent memory committed to a growing, active **archive**. A persistent **Hearth** (the player's home/companion) shapes each launch, watches real-world conditions, and reacts to returns. The emotional centerpiece is **the return**; the retention spine is **the archive**. Outcomes are produced by a **deterministic-stochastic simulation resolved lazily (compute-on-read)** so there are no always-on servers and every outcome is reproducible and explainable.

**This build is single-player only.** No social, no chat, no user-generated text, no monetization surfaces, no AR. (See Scope below.)

---

## Source-of-truth documents (read these before non-trivial work)

- `docs/Idop_Product_Bible_v0.2.md` — vision, soul, the "why" behind every constraint.
- `docs/Idop_PRD_first_build.md` — what to build: features, content sets, screens, acceptance criteria.
- `docs/Idop_Technical_Spec_first_build.md` — how to build: the determinism engine, lazy resolution algorithm, data model, world-data pipeline, privacy.
- `BACKLOG.md` — the sequenced milestones with testable acceptance criteria (the work queue).

When this file and a doc disagree, **this file wins for constraints**; the spec wins for detail. If something is genuinely ambiguous, prefer the most privacy-preserving, most cozy, most deterministic interpretation, leave a `// TODO(human):` note, and keep going — do not silently invent product behavior.

---

## ⛔ Hard constraints — NEVER violate these (they define the product)

These are the things that must remain true no matter what you refactor or add. Treat any change that breaks one as a bug, even if it makes something else easier.

1. **Determinism & server authority.** All journey outcomes, timing, and seeds are computed server-side from a stored seed + stored world snapshots + the player's influence events. Resolving the same journey at the same logical time MUST yield identical results. Never make the client decide an outcome. Never introduce non-reproducible randomness into resolution (no `Math.random()` in the engine — use the seeded `roll()` only).
2. **Compute-on-read, not continuous ticking.** Journeys are *defined* at launch and *resolved when read*. Do NOT add always-on simulation workers/cron that tick journeys. The only background job permitted in this build is the notification scheduler. (Why: solo-operable + near-zero idle cost.)
3. **Fairness: real-world data is a bounded modifier, never a gate.** A player in any climate must get a rich, varied journey and access to every outcome category. Real weather/time/season may add flavor, bounded bonuses, and rare-window triggers ON TOP of a deterministic baseline — it may never remove access to an outcome. **The game must be fully playable and varied with weather data disabled.** There is a test for this; it must stay green.
4. **No loss-aversion. Nothing is ever lost to the player's absence.** A Capsule not retrieved in time waits or returns on its own. No withering, no decay-on-neglect, no "come back or lose it," no streak-pressure. Stakes are *transformative* (a journey can go badly and the Capsule shows it), never *punitive*.
5. **Privacy by construction.** Precise location is used only transiently in memory to derive a coarse region and trigger a weather fetch, then **discarded** — never written to durable storage, never put in URLs/query strings. Store only coarse regions. No continuous location trail. No field or endpoint may let one user resolve another user's location (matters for future social; don't create the door now).
6. **No free text, no strangers, no UGC in this build.** No messaging, no public posts, no free-text fields that other users can see. (This keeps the moderation surface near zero.)
7. **Memory ledger is append-only; current state is a projection.** `MemoryEvent`s are the source of truth for a Capsule's history and must be append-only. `Capsule.current_state` is a denormalized cache rebuildable by replaying events. Never mutate history in place.
8. **The return always delivers a *visible* change.** Every completed journey commits at least one visible mark/transformation on the Capsule (not just a log line) plus a short (≤ ~3 sentences) myth and a legible cause (≤ 3 causes surfaced). Never ship a return that is only a text log.

If a task seems to require breaking one of these, stop and leave a `// TODO(human): constraint conflict — <which> — <why>` rather than violating it.

---

## Tech stack (defaults — change only via a human-approved edit to this file)

TypeScript end-to-end, to keep one language across the stack and maximize agent reliability.

| Layer | Default | Notes |
|---|---|---|
| Mobile client | Expo (React Native) + TypeScript | One codebase iOS/Android. |
| API server | Node + TypeScript + **Fastify** | Stateless app servers. Zod for request/response validation. |
| Game engine | A **pure TS package** (`packages/engine`) | No I/O. Deterministic. Heavily unit-tested. The crown jewel. |
| DB | **Postgres** + **Prisma** | JSONB for flexible payloads (raw SQL where Prisma is awkward). PostGIS only for coarse-region/sensitive-area checks. |
| Cache/locks | **Redis** (ioredis) | Hot journey reads, influence rate limits, per-journey completion lock. |
| Tests | **Vitest** | Engine + server unit/integration tests. The determinism + fairness tests live here. |
| CI | **GitHub Actions** | lint + typecheck + test on every PR. **Green CI is the completion signal for backlog items.** |
| Auth | email + Apple/Google (lib-based) | Minimal in first build; a dev-mode auth is fine until the auth task. |
| Push | FCM/APNs | Stub in first build; real wiring is its own task. |
| Weather | Open-Meteo client | Free tier is **non-commercial** — use commercial tier before launch. Cache by region+time-window, never per-user. |
| Map | MapLibre RN + self-hosted/open tiles | Stylized surface only; defer until core loop works. |
| Infra | Managed containers/serverless + IaC | Operable by one person. |

---

## Intended repository structure

```
/apps
  /mobile          Expo RN client (screens, components, client state)
  /server          Fastify API (routes, services, auth, scheduler)
/packages
  /engine          PURE determinism engine: seed, roll, rules, lazy resolver. No I/O. Most tests live here.
  /shared          Shared TS types, Zod schemas, the game-language signal catalog, content tables
/docs              Bible, PRD, Tech Spec, and this handoff set
/infra             IaC
AGENTS.md          (this file)
BACKLOG.md         The work queue / goal target
README.md          Human orientation
```

Keep the **engine pure and isolated** so its correctness can be proven by unit tests with no database or network.

---

## Commands (intended; create these scripts in M0)

```
pnpm install                # install workspace
pnpm dev:server             # run API locally
pnpm dev:mobile             # run Expo client
pnpm test                   # run all Vitest suites
pnpm test:engine            # run engine suite only (determinism + fairness)
pnpm lint && pnpm typecheck # must pass before any PR
pnpm db:migrate             # apply Prisma migrations
```

CI must run `lint`, `typecheck`, and `test` and be green before a backlog item is considered done.

---

## Working conventions

- **Test-first for the engine.** The determinism core and the fairness rule are correctness-critical; write the tests in the same change as the code, and they must pass.
- **Small, reviewable PRs**, one backlog item (or sub-item) per PR where possible. Reference the backlog item ID in the PR title.
- **Every backlog item's "definition of done" includes passing tests + green CI**, plus the item-specific checks listed in `BACKLOG.md`.
- **No secrets in code.** The server seed secret lives in a secrets manager and is **versioned** (rotation must not break reproducibility of past journeys — store `secret_version` per journey).
- **Conventional commits** (`feat:`, `fix:`, `test:`, `chore:`…).
- **Leave `// TODO(human):`** for: product ambiguity, a constraint conflict, anything needing a human decision (see Open Decisions). Do not guess on product behavior.
- **Don't add dependencies casually**; prefer the stack above. New runtime deps need a one-line justification in the PR.

---

## Scope of this build

**In scope:** the single-player loop (build → launch → away → 1–2 influence actions → visible-changed return → memory commit), the Hearth (read window + light daily tend + visible evolution + witness reactions), the active archive (gaps + thresholds), a thin real-world-data flavor/bonus layer, gentle notifications, settings + data export/delete + age gate.

**Out of scope (do not build, even if asked by a vague prompt):** any social/Tier 0/Tier 1, chat or free text, monetization/IAP, economy/crafting/lineage trees, full Satellite networks, AR, continuous real-time simulation. (These are deliberately deferred; see Bible §20.)

---

## Open decisions (need a human; don't block on them — stub and TODO)

1. **Age posture** — default **18+** (simplest compliance). If flipped to 13+, extra compliance work applies. Build the age gate generically.
2. **Name** — "Idop" is a placeholder pending trademark clearance. Don't hardcode it in user-facing copy in a way that's hard to change; centralize the app name in one constant.
3. **Monetization model** — not built this build; don't add IAP.

When you hit one of these, use the documented default, centralize it, and leave a `// TODO(human):`.
