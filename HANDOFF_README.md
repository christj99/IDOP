# Idop — Handoff README

This is the orientation map for building **Idop** with Codex (using the `/goal` feature). It explains what every document is for and the recommended workflow. Read this first, then never again.

---

## What Idop is (10-second version)

A single-player-first cozy mobile game: you build a small object (a **Capsule**), launch it into a stylized world for hours-to-overnight, and get it back **visibly changed**, with a permanent memory you keep in a growing **archive**. A persistent **Hearth** shapes each launch, watches real-world conditions, and reacts to returns. The return is the heart; the archive is the spine. Outcomes come from a **deterministic simulation resolved lazily on read** (no always-on servers).

---

## The document set

**Design & reasoning (the "why" and "what"):**
- `docs/Idop_Product_Bible_v0.2.md` — the canonical vision, the soul, and the reasoning behind every constraint (why it's single-player, why weather can't gate content, why nothing is ever lost, etc.).
- `docs/Idop_PRD_first_build.md` — the build-facing product spec: features (MoSCoW), content sets, screen-by-screen acceptance criteria, FTUE, success metrics.
- `docs/Idop_Technical_Spec_first_build.md` — the engineering spec: the determinism engine, the lazy compute-on-read algorithm, data model, world-data pipeline, privacy implementation, API surface, stack, cost posture.

**Agent handoff (the "how to get Codex to build it"):**
- `AGENTS.md` — **read automatically by Codex.** Operational summary + the **hard constraints that must never be violated**. This is the single most important file for keeping an autonomous agent on the rails.
- `BACKLOG.md` — the sequenced milestones (M0–M9), each with **testable acceptance criteria** and a definition of done. This is the work queue and the goal target.
- `CODEX_GOAL.md` — ready-to-paste `/goal` prompts, the one-time setup, safety rails, and when to pause/intervene.
- `HANDOFF_README.md` — this file.

---

## How the docs relate

```
Bible  ──(why)──►  PRD ──(what)──►  Tech Spec ──(how)──►  BACKLOG (work queue)
                                                              │
AGENTS.md (constraints, auto-read) ───────────────────────────┤
                                                              ▼
                                                      CODEX_GOAL.md (/goal prompts)
```

`AGENTS.md` and `BACKLOG.md` reference the design docs rather than duplicating them, so the agent always has the full context a few clicks away and never has to guess product behavior.

---

## Recommended workflow with Codex

1. **Put everything in the repo.** Commit `AGENTS.md` and `BACKLOG.md` at the root and the three design docs under `/docs`. (A context-complete, legible repo is the #1 thing that makes `/goal` succeed; missing context makes it invent assumptions that compound.)
2. **Set safety rails** (see `CODEX_GOAL.md` §0): fresh branch per milestone, sandbox + full-auto, output logging, and **a spending limit on your OpenAI account** — `/goal` can run for hours and burn far more tokens than normal prompting.
3. **Run milestone-by-milestone**, in `BACKLOG.md` order, using the per-milestone goal prompt in `CODEX_GOAL.md` §2.
   - **M0, M1** first and on their own — scaffold + the determinism engine are correctness-critical. Verify before moving on.
   - **M2, M3, M6, M8, M9** — objectively testable; safe to let `/goal` run autonomously to green CI.
   - **M4, M5, M7** (UI/feel) — let `/goal` do only the *automated* acceptance, then **you** check the subjective "feel" criteria against the PRD before merging. The agent is weak on polish; don't let it self-certify.
4. **After each goal:** review the diff and CI, resolve any `// TODO(human):` notes, merge, start the next milestone.
5. **Done** = `M9`'s audit suite green in CI (fairness, no-loss-aversion, determinism, privacy, visible-return all asserted) + the human-check milestones signed off. That's a playtest-ready build to measure the Stage-1 attachment gate (PRD §11 / Bible §22).

---

## The constraints that define the product (don't let them drift)

These live in full in `AGENTS.md`; they're repeated here because they matter most. Any change that breaks one is a bug, even if it's convenient:
- **Determinism + server authority** — outcomes reproducible from seed + snapshots + influence events; no client-side outcomes; no raw randomness in the engine.
- **Compute-on-read** — no always-on journey simulation workers.
- **Fairness** — real-world data is a bounded modifier, never a gate; the game must stay rich with weather disabled.
- **No loss-aversion** — nothing is ever lost to the player's absence.
- **Privacy** — precise location transient and discarded; coarse regions only; no cross-user location.
- **No social / no free text / no monetization** in this build.
- **Append-only memory; current state is a projection.**
- **Every return delivers a visible change.**

---

## Decisions to make (don't block the build on them)

| Decision | Default | When it's needed |
|---|---|---|
| Age posture | 18+ | Before M8 (age gate). 13+ adds compliance work, not design work. |
| App name | "Idop" placeholder | Before any public/app-store surface; centralized in one constant. |
| Monetization | none this build | Not built now; decide before store setup. |
| Stack specifics | per `AGENTS.md` | Change only by editing `AGENTS.md` *before* the relevant goal run. |
| Weather tier | Open-Meteo free for dev | Commercial tier before real-user launch. |

---

## A realistic note

The bible's verdict stands: this is a viable *first build* for a solo developer precisely because it's single-player, deterministic, cheap to operate, and free of the regulatory/moderation load that sank the original concept. It is **not** a guaranteed commercial hit — mobile discovery is brutal and retention is hard. The plan is deliberately staged so you prove the **attachment gate** (do testers name their Capsule and revisit the archive?) on a small, cheap build *before* investing in anything more. Build the moment first; let the evidence decide the rest.
