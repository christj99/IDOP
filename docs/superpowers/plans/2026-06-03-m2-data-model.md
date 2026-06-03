# M2 Data Model Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete M2 by adding the Prisma data model, migration, append-only memory ledger, current-state projection, and archive read patterns.

**Architecture:** Prisma owns durable Postgres schema and migrations under `apps/server/prisma`. Server data code exposes app-layer repository functions that can be tested without a running DB, while `pnpm db:migrate` proves the migration applies to Postgres.

**Tech Stack:** Prisma, Postgres JSONB, TypeScript, Vitest.

---

### Task 1: App-Layer Data Tests

**Files:**
- Create: `apps/server/src/data/memory-ledger.test.ts`
- Create later: `apps/server/src/data/catalog.ts`
- Create later: `apps/server/src/data/memory-ledger.ts`

- [x] Write failing Vitest tests for append-only memory events, `projectCurrentState`, object profile, journey recap, collection gaps, threshold progress, and world snapshot privacy.
- [x] Run `corepack pnpm test apps/server/src/data/memory-ledger.test.ts` and verify the imports fail.
- [x] Implement the minimal repository/read-model code.
- [x] Rerun the focused tests until green.

### Task 2: Prisma Schema And Migration

**Files:**
- Create: `apps/server/prisma/schema.prisma`
- Create: `apps/server/prisma/migrations/20260603192000_m2_data_model/migration.sql`
- Modify: `apps/server/package.json`
- Modify: `package.json`

- [x] Add models for `User`, `Capsule`, `Hearth`, `Journey`, `MemoryEvent`, `WorldSnapshot`, and `Artifact`.
- [x] Use JSONB-compatible Prisma `Json` fields for payload/current-state/flexible state.
- [x] Ensure `WorldSnapshot` has no user/capsule/journey identity fields.
- [x] Add `db:generate`, `db:validate`, and `db:migrate` scripts.

### Task 3: Migration Verification And CI

**Files:**
- Create: `docker-compose.yml`
- Modify: `.github/workflows/ci.yml`

- [x] Add a local/CI Postgres service.
- [x] Run `corepack pnpm db:migrate` against Postgres.
- [x] Run `corepack pnpm lint`, `corepack pnpm typecheck`, `corepack pnpm test`, and `corepack pnpm format`.
- [ ] Push a draft PR and verify GitHub Actions is green.
