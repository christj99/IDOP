# CODEX_GOAL.md — Driving the Idop build with Codex `/goal`

> `/goal` turns a Codex prompt into a persistent **plan → act → test → review → iterate** loop that runs until a *verifiable* stop condition is met or it hits a wall. It rewards: a legible repo with all context present, an explicit verification surface (tests/CI), and explicit "what-must-not-change" constraints. Its failure modes are vague scope, missing context, and runaway token spend. This file is written to exploit the strengths and avoid the failure modes.

---

## 0. One-time setup before any goal run

1. **Repo is context-complete.** Confirm `AGENTS.md`, `BACKLOG.md`, and `docs/` (bible, PRD, tech spec) are committed and at the repo root. Codex reads `AGENTS.md` automatically; the rest must be present so the agent doesn't invent behavior.
2. **CLI & feature.** Use a current Codex CLI (the `/goal` feature shipped in `0.128.0+`). If your version requires enabling goal features via `config.toml`, follow the **current** Codex docs for the exact flag — don't guess it.
3. **Safety rails for long autonomous runs:**
   - Work on a **fresh git branch** per milestone (`git checkout -b m1-engine`).
   - Run in a **sandboxed** environment, full-auto mode.
   - Enable **output logging** so the run is auditable.
   - **Set a spending limit in your OpenAI account.** `/goal` can run for hours and use orders of magnitude more tokens than normal prompting; an unattended overnight run without a cap can produce a surprising bill.
4. **CI is the verdict.** Every milestone's stop condition is "acceptance tests pass + CI green." Make sure CI runs `lint`, `typecheck`, `test` (set up in M0).

---

## 1. Recommended workflow

- **Go milestone-by-milestone**, in `BACKLOG.md` order. Don't hand it the whole backlog as one goal on the first outings — bounded goals with a clean green-tests stop condition are where `/goal` shines and where it's safe to leave unattended.
- **Engine/data/API milestones (M0, M1, M2, M3, M6, M8, M9)** are objectively testable → safe to run `/goal` autonomously and walk away (with a spend cap).
- **UI/feel milestones (M4, M5, M7)** → scope the goal to the *automated* acceptance only, then **you** do the human checks against the PRD before merging. `/goal` is weak on subjective polish; don't let it self-certify feel.
- After each goal completes, **review the diff and CI**, merge, then start the next milestone on a new branch.

---

## 2. The goal prompts (copy-paste)

Each prompt names the milestone, points at the repo's own docs (so the agent reads them rather than guessing), states the verification contract, and reminds it of the constraints. Replace `<MILESTONE>` runs in order.

### 2a. Per-milestone goal (use this form for each item)

```
/goal
Objective: Complete milestone <Mx> from BACKLOG.md in this repo, and stop when its
Definition of Done is satisfied.

Context to read first (do not skip):
- AGENTS.md  (hard constraints — these must never be violated)
- BACKLOG.md (this milestone's objective, build, acceptance criteria, DoD)
- docs/Idop_Technical_Spec_first_build.md (the "how")
- docs/Idop_PRD_first_build.md (the "what")

Verification contract (this is the stop condition — completion is evidence-based):
- Implement the milestone, writing tests in the same change.
- The milestone's Acceptance criteria in BACKLOG.md must pass as automated tests.
- CI (lint + typecheck + test) must be green.
- Stop when CI is green and all acceptance tests for <Mx> pass. Do not start other milestones.

Constraints that must not change (from AGENTS.md) — treat any violation as a bug:
- Determinism & server authority; no Math.random()/Date.now() in packages/engine.
- Compute-on-read only; no always-on journey workers.
- Fairness: real-world data is a bounded modifier, never a gate; the game must stay
  rich/varied with weather disabled (keep the fairness test green).
- No loss-aversion; nothing is ever lost to the player's absence.
- Privacy: precise location is transient and discarded; store coarse regions only;
  no cross-user location resolution.
- No social / no free text / no UGC / no monetization in this build.
- MemoryEvents are append-only; current_state is a projection.
- Every completed journey commits a visible change (not just a log line).

If something is genuinely ambiguous about PRODUCT behavior, do not invent it: implement the
documented default, centralize it, leave a `// TODO(human): <question>`, and continue with the
rest of the milestone. If a task seems to require breaking a constraint above, stop and leave a
`// TODO(human): constraint conflict` instead of violating it.

Work on the current branch. Keep PR-sized, conventional commits. Report progress against the
acceptance criteria as you go.
```

### 2b. Engine goal (M1 — paste the explicit contract; this is the crown jewel)

For M1, append these explicit test targets to the prompt so the stop condition is unambiguous:

```
For milestone M1 specifically, the engine in packages/engine is a PURE module (no I/O imports).
These tests MUST pass and remain the permanent contract:
- Reproducibility: resolveJourney(sameInputs, sameT) twice is deep-equal (dispatches + final marks).
- Roll determinism: identical (seed,phase,tick,rule_id) -> identical float; uniform-ish over samples.
- Influence causality: an influence event before tick k changes ticks >= k only.
- Time monotonicity: state at T2 is a continuation of state at T1 (T1<T2), never contradictory.
- No raw randomness: a test fails if Math.random or Date.now() appears in packages/engine.
- Fairness: with worldSnapshots=[] (weather disabled), over many seeded journeys every outcome
  category appears and variety exceeds a threshold; real-world modifiers only add, never gate.
Stop when these pass and CI is green.
```

### 2c. UI milestone goal (M4/M5/M7 — cap the autonomy)

```
/goal
Objective: Complete the AUTOMATED acceptance criteria of milestone <Mx> from BACKLOG.md only.
Do NOT self-certify subjective "feel" criteria — those are reserved for human review.

[same Context / Constraints blocks as 2a]

Stop condition: the automated acceptance criteria for <Mx> pass, the app builds/typechecks, and
CI is green. Then STOP and summarize what a human still needs to verify against PRD §5/§6/§7.
```

### 2d. (Optional, later) whole-backlog goal — only once you trust the loop

```
/goal
Objective: Ship the milestones in BACKLOG.md in order. For each, satisfy its Definition of Done
(acceptance tests pass + CI green) before moving to the next. Stop after M9's audit suite is green,
or pause and report at any milestone whose feel-criteria require human review (M4, M5, M7), or at
any unresolved constraint conflict.

[same Context / Constraints blocks as 2a]
```

---

## 3. When to pause / intervene

- The agent leaves `// TODO(human):` notes → resolve the **Open Decisions** (§ below) or the flagged ambiguity, then resume.
- CI can't go green after repeated attempts on a milestone → pause; the spec may be underspecified for that piece; clarify and re-run.
- A diff starts touching out-of-scope areas (social, IAP, continuous workers) → stop; that's a constraint drift.
- Token/time budget approaching your cap → pause (`/goal` supports pause/resume); review and resume deliberately.

---

## 4. Open decisions to resolve early (so goals don't stall)

1. **Age posture** — default 18+. Decide before M8.
2. **Name** — placeholder; needed before any public/app-store surface, not before building.
3. **Backend specifics** — the stack defaults in `AGENTS.md` (Fastify, Prisma, Vitest, Redis) are chosen for agent reliability; change only by editing `AGENTS.md` *before* running the relevant goal, so the agent sees one consistent target.
4. **Weather provider tier** — Open-Meteo commercial tier before any real-user launch (free tier is non-commercial); fine to develop on free tier with caching.

---

## 5. Definition of "build complete"

The first build is done when **M9's audit suite is green in CI** (fairness, no-loss-aversion, determinism, privacy, visible-return all asserted), all `Must` features from the PRD are implemented, and the human-check milestones (M4, M5, M7) have sign-off against the PRD acceptance criteria. At that point you have a playtest-ready build to measure the PRD §11 / Bible §22 Stage-1 attachment gate.
