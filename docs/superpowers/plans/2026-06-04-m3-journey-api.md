# M3 Journey API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete M3 by adding Fastify + Zod endpoints for capsule creation/profile, journey launch, lazy resolve-on-read, and influence actions.

**Architecture:** Keep the engine pure and wrap it in a server-authoritative API service. Use dependency injection for clock, nonce/id factories, secret lookup, repository, and journey completion lock so integration tests can prove server-time authority, privacy, idempotency, and deterministic engine parity without external services. Use an in-memory repository/lock for M3; the seams are shaped for Prisma/Redis replacement in later work.

**Tech Stack:** Fastify, Zod, Vitest, `@idop/engine`, in-memory server repository.

---

### Task 1: Endpoint Contract Tests

**Files:**
- Create: `apps/server/src/api/journey-api.test.ts`
- Modify later: `apps/server/src/index.ts`
- Create later: `apps/server/src/api/journey-api.ts`

- [x] Write failing Vitest integration tests using `buildServer({ journeyApi: ... })` and `server.inject`.
- [x] Cover `POST /capsules` and `GET /capsules/:id` with a dev user owner.
- [x] Cover `POST /journeys` launch with `capsule_id`, `intent`, `precise_location`, and a spoofed client clock; assert stored/returned journey contains only `coarse_region_id`, `seed_hash`, `secret_version`, and `journey_nonce`, not precise coordinates or raw seed/secret.
- [x] Cover two concurrent `GET /journeys/:id` calls at completion time; assert the memory commit count for that journey is exactly one.
- [x] Cover server-time authority by launching twice with identical injected server time/nonce but different spoofed client times; assert seed hash and launch time are identical.
- [x] Cover `POST /journeys/:id/influence`; assert a second influence of the same type is rejected while another type is accepted.
- [x] Cover engine parity by comparing completed API payload to `resolveJourney(...)` for the same stored seed material and snapshots.
- [x] Run `corepack pnpm test apps/server/src/api/journey-api.test.ts` and verify it fails because the API module/routes do not exist yet.

### Task 2: Journey API Service

**Files:**
- Create: `apps/server/src/api/journey-api.ts`
- Modify: `apps/server/src/index.ts`
- Modify: `apps/server/package.json`

- [x] Add server dependency on `@idop/engine`.
- [x] Define Zod schemas for capsule creation, journey launch, route params, and influence payloads.
- [x] Implement `createInMemoryJourneyRepository()` with maps for capsules, journeys, memory events, and committed journey ids.
- [x] Implement `createInMemoryJourneyLock()` with a per-journey promise chain so concurrent completion reads serialize.
- [x] Implement transient `deriveCoarseRegionId(preciseLocation)` that rounds/quantizes to a coarse region string and never stores precise coordinates.
- [x] Implement deterministic launch: use injected server clock, injected nonce/id factories, `createJourneySeed`, and stored `journeyNonce` to persist only replay material plus `seedHash` and `secretVersion`.
- [x] Implement lazy `GET /journeys/:id`: reconstruct engine input from stored journey/capsule/snapshots, call `resolveJourney`, return in-progress or completed payload, and commit memory once when returned.
- [x] Implement influence append using injected server clock and per-type limit of one action per journey.
- [x] Rerun focused tests until green.

### Task 3: Verification And PR

**Files:**
- Verify all touched files.

- [x] Run `corepack pnpm db:validate` with `DATABASE_URL`.
- [x] Run `corepack pnpm db:migrate` with `DATABASE_URL`.
- [x] Run `corepack pnpm lint`.
- [x] Run `corepack pnpm typecheck`.
- [x] Run `corepack pnpm test`.
- [x] Run `corepack pnpm format`.
- [ ] Commit, push `codex/m3-journey-api`, open a draft PR, and verify GitHub Actions is green.
