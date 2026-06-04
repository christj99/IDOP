# M4 Client Core Screens Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the automated acceptance criteria for M4 only: client screens render all PRD §5 states, build blocks launch until named, Return always renders a visible mark element, and mobile type/build checks pass.

**Architecture:** Keep M4 UI as prop-driven React Native screens plus a small state/API adapter in `apps/mobile`. The screen components stay deterministic and testable without a device runtime, while `App.tsx` wires them into a local first-build flow and calls the M3 HTTP routes through a typed client.

**Tech Stack:** Expo React Native, TypeScript, Vitest, existing pnpm workspace scripts.

---

### Task 1: Screen Contract Tests

**Files:**
- Create: `apps/mobile/src/core-loop.test.tsx`
- Modify: `vitest.config.ts`

- [x] **Step 1: Write failing tests**

Add tests that render/traverse all PRD §5 screen states:
- Home/Hearth: empty, active journey, ready return, tend available, tend done.
- Build/Workshop: empty, partial, ready-to-launch.
- Launch: confirming, launched.
- Journey/Away: travelling, decision-point-available, nearing-return, ready-to-open.
- Return: revealing and revealed, with a required `return-visible-mark` element.

- [x] **Step 2: Verify red**

Run: `corepack pnpm test apps/mobile/src/core-loop.test.tsx`

Expected: FAIL because `apps/mobile/src/core-loop.tsx` does not exist yet.

### Task 2: Implement Pure M4 Screens

**Files:**
- Create: `apps/mobile/src/core-loop.tsx`

- [x] **Step 1: Add prop-driven screen components**

Implement `HomeHearthScreen`, `BuildWorkshopScreen`, `LaunchScreen`, `JourneyAwayScreen`, and `ReturnScreen` with stable `testID`s for each automated acceptance target.

- [x] **Step 2: Verify green**

Run: `corepack pnpm test apps/mobile/src/core-loop.test.tsx`

Expected: PASS, with tests proving the automated screen contracts.

### Task 3: Wire App to M3 API Shape

**Files:**
- Create: `apps/mobile/src/api.ts`
- Modify: `apps/mobile/App.tsx`
- Modify: `apps/mobile/src/core-loop.test.tsx`

- [x] **Step 1: Add state/API tests if the integration surface changes**

Add or extend tests for any app-state helpers that enforce launch blocking until the capsule has a name.

- [x] **Step 2: Implement minimal client flow**

Use the M3 routes (`POST /capsules`, `POST /journeys`, `GET /journeys/:id`, `POST /journeys/:id/influence`) behind a typed API client. Keep screens usable with local state and mockable defaults; do not let the client compute outcomes.

- [x] **Step 3: Verify focused tests**

Run: `corepack pnpm test apps/mobile/src/core-loop.test.tsx`

Expected: PASS.

### Task 4: Verification And PR

**Files:**
- Update: `docs/superpowers/plans/2026-06-04-m4-client-core.md`

- [x] **Step 1: Run full local checks**

Run:
- `corepack pnpm test`
- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm format`

Expected: all exit 0.

- [ ] **Step 2: Push and check CI**

Commit conventionally, push `codex/m4-client-core`, open a draft PR, and verify GitHub Actions is green.

- [ ] **Step 3: Stop at human checks**

Summarize automated evidence and list the remaining PRD §5 human checks: ≤60s complete build, plain cause→effect risk preview, emotionally legible return, and satisfying marked return for a bad journey.
