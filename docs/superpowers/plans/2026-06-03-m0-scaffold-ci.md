# M0 Scaffold And CI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build M0 from `BACKLOG.md`: a pnpm TypeScript monorepo with the expected Idop workspace shape, green local verification commands, and a GitHub Actions CI workflow.

**Architecture:** The root owns shared tooling and commands. `apps/mobile`, `apps/server`, `packages/engine`, and `packages/shared` are minimal TypeScript workspaces so later milestones can add behavior without changing the repo contract.

**Tech Stack:** pnpm workspaces, TypeScript strict mode, Vitest, ESLint flat config, Prettier, GitHub Actions.

---

### Task 1: Docs And Workspace Shape

**Files:**
- Create or verify: `AGENTS.md`, `BACKLOG.md`, `CODEX_GOAL.md`, `HANDOFF_README.md`
- Create or verify: `docs/Idop_Product_Bible_v0.2.md`
- Create or verify: `docs/Idop_PRD_first_build.md`
- Create or verify: `docs/Idop_Technical_Spec_first_build.md`
- Create: `apps/mobile/`, `apps/server/`, `packages/engine/`, `packages/shared/`, `infra/`

- [x] Extract `codex docs.zip` into the repo root.
- [x] Extract `spec docs.zip` into `docs/`.
- [x] Copy the product bible into `docs/`.

### Task 2: Root Tooling

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `tsconfig.base.json`
- Create: `tsconfig.json`
- Create: `eslint.config.js`
- Create: `vitest.config.ts`
- Create: `.prettierrc.json`
- Create: `.prettierignore`
- Create: `.npmrc`
- Create: `.gitignore`

- [x] Add root scripts for `dev:server`, `dev:mobile`, `test`, `test:engine`, `lint`, `typecheck`, `format`, and `db:migrate`.
- [x] Configure strict TypeScript and repo-wide Vitest.
- [x] Configure ESLint and Prettier.

### Task 3: Red-Green CI Smoke Test

**Files:**
- Create: `packages/engine/package.json`
- Create: `packages/engine/src/index.test.ts`
- Create after red: `packages/engine/src/index.ts`

- [x] Write the failing test first:

```ts
expect(enginePackageName()).toBe("@idop/engine");
```

- [x] Run `pnpm test:engine` and verify it fails because `./index` is missing.
- [x] Add `packages/engine/src/index.ts` with `enginePackageName`.
- [x] Run `pnpm test:engine` and verify it passes.

### Task 4: App And Package Stubs

**Files:**
- Create: `apps/server/package.json`
- Create: `apps/server/src/index.ts`
- Create: `apps/mobile/package.json`
- Create: `apps/mobile/app.json`
- Create: `apps/mobile/App.tsx`
- Create: `packages/shared/package.json`
- Create: `packages/shared/src/index.ts`
- Create: `infra/README.md`

- [x] Add minimal Fastify health server.
- [x] Add minimal Expo app shell.
- [x] Add shared package export.
- [x] Add infra placeholder README.

### Task 5: CI Workflow And Verification

**Files:**
- Create: `.github/workflows/ci.yml`

- [x] Add GitHub Actions workflow that runs install, lint, typecheck, and test.
- [x] Run `pnpm install`.
- [x] Run `pnpm lint`.
- [x] Run `pnpm typecheck`.
- [x] Run `pnpm test`.
- [x] Audit M0 DoD and record any gap that cannot be verified without a GitHub remote or PR.

**Audit note:** The M0 scaffold exists locally, the repo has been initialized on `main`, and
`pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, and
`pnpm format` pass. The `CI is green on a PR` DoD item cannot be verified from this
workspace yet because no GitHub remote or pull request exists.
