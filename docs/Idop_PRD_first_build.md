# IDOP — Product Requirements Document (PRD)
### First Build (Stage 1 → early Stage 2)

**Companion to:** Idop Product Bible v0.2 (the "why" lives there; this is the "what to build"). Section references like *Bible §6* point back to it.
**Scope:** The first shippable build — the single-Capsule core loop, the Hearth, and the active archive. Social (even Tier 0) is **out of scope** for this build (Bible §21, §22).
**Status:** v0.1 of the PRD. Update alongside the bible.
**Audience:** The builder (you), and any future collaborator/designer.

---

## 1. Purpose and success criteria

**What we are building:** a single-player cozy loop where the player builds a small object (a Capsule), launches it into a stylized world for hours-to-overnight, and gets it back *visibly changed*, with a permanent memory committed to a growing, active archive. A persistent Hearth shapes each launch and reacts to returns.

**The one thing this build must prove (Bible §22, Stage 1 gate):**
- After **one full cycle**, a majority of testers spontaneously **name or narrate** their Capsule.
- Testers can **articulate why** their Capsule changed.
- Testers **voluntarily revisit** the archive without being prompted.

If those three hold, the loop works and we proceed to cadence tuning (Stage 2). If they don't, we fix legibility and the visibility of change before adding anything (Bible §3).

**Explicit non-goals for this build:** social of any kind, monetization surfaces, real-world data as anything more than a flavor/bonus modifier, deep crafting, economy, lineage, AR.

---

## 2. Players and jobs

Single archetype for this build: a player who wants a *low-pressure, emotionally warm* daily ritual — something alive that's theirs, that they don't have to grind or stress about.

Job stories (the format: *when… I want… so that…*):
- **When** I have a quiet minute, **I want** to send something out into the world, **so that** I have something out there to look forward to.
- **When** I open the app, **I want** to see what happened to my thing, **so that** I feel the small thrill of a changed return.
- **When** my Capsule comes back marked, **I want** to understand *why* it changed, **so that** it feels like a real consequence, not a slot machine.
- **When** I've played for weeks, **I want** to look back over my collection, **so that** my history feels like it accumulated into something.
- **When** I forget to check in, **I want** nothing bad to have happened, **so that** the game stays a refuge, not an obligation (Bible §5, §10).

---

## 3. Feature list and priorities (MoSCoW)

| # | Feature | Priority | Stage-1 gate dependency |
|---|---|---|---|
| F1 | Build a Capsule (shell + core + optional cargo + name + intent) | **Must** | Attachment, naming |
| F2 | Launch flow with legible risk preview | **Must** | Legibility |
| F3 | Away/journey view: status, route mood, dispatches | **Must** | Anticipation |
| F4 | 1–2 influence actions per journey (boost, shelter) | **Must** | Consequential agency (Bible §11) |
| F5 | **Return screen** with visible permanent change + short myth + memory commit | **Must** | The centerpiece (Bible §6) |
| F6 | **Active archive** (gaps, thresholds, Hearth-as-witness) | **Must** | Voluntary revisit |
| F7 | Hearth: launch-window read + 1 light daily tending action + visible evolution | **Must** | "World alive when alone," not-pointless-base (Bible §4.2) |
| F8 | Real-world data as flavor/bonus modifier + "look up" nudge | **Should** | Fairness deferred to Stage 3; ship a thin version |
| F9 | Gentle, real-moment-anchored notifications | **Should** | Re-engagement (Bible §15) |
| F10 | Scripted FTUE (full arc in first session) | **Must** | First-session bonding |
| F11 | Settings: notifications, data/export/delete, age gate | **Must** | Compliance (Bible §17) |
| F12 | Memory utility (archive as ambient almanac surfacing) | **Could** | Nice-to-have; emergent from F6 |
| — | Any social, monetization, economy, AR | **Won't (this build)** | Out of scope |

---

## 4. Content sets for the first build

Keep each set small and legible. These double as the initial content for the rules engine (see Tech Spec §3).

**Shells (5)** — outer body; biases which scars are likely.

| Shell | Feel | Scar lean |
|---|---|---|
| Paper | light, fragile, cheap | water stains, tears, sun-bleach |
| Glass | crisp, fragile, pretty | cracks (beautiful scars), frost-bite |
| Cloth | soft, absorbent, warm | stains, fraying, moss-thread |
| Moss | humid, living, forgiving | regrowth, fog-fragments, salt-crust |
| Tin | sturdy, plain, durable | dents, rust, signal-burn |

**Cores / temperaments (5)** — behavioral voice + a small bias on event odds.

| Core | Voice | Bias |
|---|---|---|
| Shy | timid, hides | +hide/shelter, −risk |
| Brave | bold, seeks weather | +risk, +rare-window |
| Curious | wandering, distractible | +encounters/traces, +stamps |
| Sleepy | slow, calm | longer journeys, gentler outcomes |
| Stubborn | fixed, persistent | resists redirection, +survive |

**Cargo (4; one optional slot)** — can be lost, transformed, or delivered.

Charm · Note/Wish · Seed · Empty pocket (to bring something home).

**Intents (3)** — the mission shape (Bible §5; v0.1 MVP set).

- **Wander** — open exploration; the cozy default. Optimizes for stamps and traces.
- **Scout** — go looking for a specific condition/window (e.g., "find a storm"). Optimizes for a target signal.
- **Deliver** — carry cargo to a fictional destination. Optimizes for cargo outcomes.

**Scar / transformation library (first build, ~12)** — each with a legible cause. This table is the seed content for the rules engine and the return's "why."

| Outcome | Visible? | Typical cause (signal × shell × event) |
|---|---|---|
| Water stain | yes | rain × paper/cloth |
| Rain-crack | yes | heavy rain × glass |
| Sun-bleach | yes | strong daylight × paper/cloth |
| Frost-bite | yes | freeze × glass/moss |
| Wind-worn edge | yes | high wind × any |
| Salt-crust | yes | near-water signal × moss/cloth |
| Dent | yes | impact event × tin |
| Rust-bloom | yes | rain + time × tin |
| Signal-burn | yes | "storm charge" event × any |
| Moss-thread (regrowth) | yes | survival × moss (transformation) |
| Dimmed beacon | yes | loud/chaotic zone × shy core (transformation) |
| Brightened | yes | rare clear-window survival × brave core (transformation) |

Plus collectible **stamps** (e.g., First Rain, Bridge Echo, Midnight Drift, Full-Moon Drift, First Frost) and possible **cargo results** (lost a charm; returned with a Fog-Fragment).

---

## 5. Screens (surface-by-surface)

For each: purpose, key elements, primary states, acceptance criteria (AC).

### 5.1 Home / Hearth (default screen)
**Purpose:** show what's alive now and what the world is offering. The warm anchor.
**Key elements:** the Hearth (visible, evolving); active journey card(s) with time-to-return; today's launch-window read; the "look up" nudge when present; the daily tend action; entries to Build and Archive.
**States:** no active journey (invites a launch) · one active journey · journey ready to open (return available) · tend-available vs. tend-done-today.
**AC:**
- [ ] If a journey is ready, the return is the most prominent thing on screen.
- [ ] The launch-window read is one glanceable line (e.g., "clear, calm — good drifting").
- [ ] The tend action is a single, satisfying interaction, available once/day, never punitive if skipped.
- [ ] No countdown framed as a threat anywhere on this screen.

### 5.2 Build / Workshop
**Purpose:** make a Capsule feel tactile and expressive in under a minute.
**Key elements:** shell picker, core picker, optional cargo slot, name field, intent picker, and a **legible risk preview** that updates as choices change ("paper + rain tonight → likely to come back stained").
**States:** empty · partial · ready-to-launch.
**AC:**
- [ ] A complete build takes ≤ 60s after onboarding.
- [ ] The risk preview names cause-and-effect in plain words and updates live with each choice.
- [ ] Naming is required (naming drives attachment — Stage-1 gate).
- [ ] No stat spreadsheet; ≤ 4 decisions total.

### 5.3 Launch
**Purpose:** a short, ceremonial commit.
**Key elements:** the translated current conditions; the risk read; a confirm gesture; an estimated return moment ("back by golden hour" / "back at first light").
**States:** confirming · launched (transitions to Away).
**AC:**
- [ ] Conditions shown are the real, translated world state (or the deterministic baseline if data is unavailable — see Tech Spec §5).
- [ ] Return time is expressed as a *real moment*, not a raw countdown.
- [ ] Launch is reversible up to confirm; after confirm, the journey is committed.

### 5.4 Journey / Away
**Purpose:** build anticipation; offer meaningful, sparse influence.
**Key elements:** status + route mood; a dispatch feed (a few short, evocative lines appearing over time); the **1–2 influence actions** (boost, shelter), each clearly consequential and limited; time-to-return as a real moment.
**States:** travelling · decision-point-available · nearing-return · ready-to-open.
**AC:**
- [ ] Dispatches are short (one line), evocative, and never repeat verbatim within a journey.
- [ ] Each influence action visibly affects odds/texture and is gated (limited uses) so it feels meaningful, not fiddly.
- [ ] No influence action is ever *required*; ignoring them yields a valid, interesting journey (Bible §11).
- [ ] Force-quitting or closing the app never changes the outcome (server-authoritative; see Tech Spec §4).

### 5.5 Return — the centerpiece
**Purpose:** deliver the emotional payoff (Bible §6).
**Key elements, in order:** the **visible change reveal** (the Capsule, now marked); a **short myth** (a few sentences); the **stamps earned**; **anonymized-trace/aggregate line** (thin in this build, e.g., "out during the same storm as many others" — no identities); the **memory commit** to the archive (felt, not silent); **one next action** (relaunch / build new / view in archive).
**States:** revealing · revealed.
**AC:**
- [ ] A *visible* change is present on the Capsule on every return (not just a log line).
- [ ] The myth is ≤ ~3 sentences and references the cause.
- [ ] The player can name *why* it changed from this screen (≤ 3 causes surfaced).
- [ ] The memory commit has a small reactive moment from the Hearth (the "witness").
- [ ] "Bad" journeys still produce a satisfying, marked, story-bearing return — never a dead end (Bible §10).

### 5.6 Archive
**Purpose:** the long-term retention spine — an *active collection*, not a log (Bible §7).
**Key elements:** the collection grid/space of Capsules and their visible marks; **visible gaps** (stamps/scars/conditions not yet earned); **threshold progress** toward unlocks; the Hearth's reactive presence; a display/curation surface for beloved/retired Capsules; (Could) the ambient-almanac surfacing ("a year ago…").
**States:** sparse (early) · filling · threshold-just-hit (celebratory).
**AC:**
- [ ] Gaps are visible and inviting (the player can see what they don't yet have).
- [ ] Hitting a threshold unlocks something real (a Hearth capability, a display option, or a build choice) and is acknowledged with personality.
- [ ] The archive is reachable in ≤ 1 tap from Home.
- [ ] Revisiting is rewarding even with nothing new (curation, re-reading myths, almanac).

---

## 6. The Hearth (behavioral spec)

The Hearth is one persistent entity (Bible §4.2). For this build it must do four things and **must have a light active loop** (avoid the Loop Hero "pointless base").

- **Launch-window read:** translate current coarse conditions into one glanceable line + the risk read.
- **Daily tend action:** a single satisfying interaction available once/day (e.g., "stoke" the Hearth) that banks a small benefit toward the next launch or refreshes the window read. **Skipping it is never punished.**
- **Visible evolution:** the Hearth changes appearance/capability across a few milestone stages, driven by archive thresholds and what Capsules bring home. Proposed first-build stages:

| Stage | Trigger (illustrative) | Unlock |
|---|---|---|
| Ember | start | basic window read |
| Lantern | first 5 returns | the "look up" nudges (F8) turn on |
| Lens | 15 returns / 10 stamps | better window reads (rare-window detection) |
| Shelf | first threshold of archive completeness | expanded display in Archive |
| Glow | deeper completeness | Hearth-light brightens with collection; cosmetic prestige |

- **Witness:** react with personality on every return and threshold (the Archive's voice).

**AC:**
- [ ] The Hearth visibly changes at least twice within the first ~2 weeks of normal play.
- [ ] The tend action is doable in one moment and is purely additive.
- [ ] The Hearth has no standalone game — it only acts in response to launches/returns/tending.

---

## 7. Real-world data (thin version for this build)

Ship a *thin* version now; full fairness work is Stage 3 (Bible §8, §22).

- Pull coarse local weather/time/season/moon (Tech Spec §5).
- Apply as **flavor + bounded bonuses + rare-window triggers** on top of the deterministic baseline. **Never gate content.**
- Surface as the launch-window read and the "look up" nudge (golden hour / full moon / first frost).
- If data is unavailable, fall back silently to the deterministic baseline; the player still gets a full journey.

**AC:**
- [ ] With weather data fully disabled, the game is still fully playable and journeys are still varied.
- [ ] Real conditions visibly *flavor* a journey (the player can see the connection) without ever being required for any outcome.

---

## 8. Notifications

Gentle, real-moment-anchored, never FOMO (Bible §15).

- **Allowed:** "Moss Baby found something." · "Birdhouse-7 is on its way back." · "The moon is full and your sky is clear — a rare drift window is open." · "First frost in your area."
- **Banned:** countdowns framed as loss ("come back or lose…"), guilt, streak-pressure, "your object will die."
- Frequency capped; fully user-controllable in Settings; default conservative.

**AC:**
- [ ] No notification implies loss, urgency-as-threat, or neglect-punishment.
- [ ] The player can disable categories independently.

---

## 9. FTUE (first session)

Run the **entire emotional arc** once, fast, before asking the player to commit (Bible §15).

1. Warm intro; the Hearth greets the player.
2. A starter Capsule (pre-seeded or a 2-choice build) — the player **names** it.
3. One-tap launch into a **guaranteed-short "first flight"** (minutes, not hours).
4. An immediate dispatch (the thing is *out there*).
5. A return that is **good but still marked** — reveals one visible scar/stamp, the first myth, and the **first archive entry**, with a Hearth reaction.
6. Prompt to build/launch the first *real* Capsule.

**AC:**
- [ ] The player experiences build → launch → dispatch → changed-return → archive-entry within the first session.
- [ ] The first return is emotionally legible (they understand what happened and why).
- [ ] Time-to-first-return in FTUE is minutes, not the standard hours.

---

## 10. Edge cases and rules

| Situation | Behavior |
|---|---|
| Player force-quits mid-journey | Outcome unaffected; journey is server-authoritative and resolves on next open (Tech Spec §4). |
| Player opens after days away | Journey already resolved and waiting; **nothing lost**; return is ready to open. |
| No connectivity at launch | Allow launch on deterministic baseline; flavor with real data on reconnect; resolve on read. |
| No connectivity at return | Show last cached state; reconcile on reconnect. |
| Device clock changed | Server time is authoritative for journey timing and seeds (Tech Spec §3). |
| Boring/flat local weather | Deterministic baseline guarantees variety; real data only adds flavor (F7/§7). |
| Player ignores influence actions | Valid, interesting journey; never a worse *category* of outcome, just a different one. |
| Player never tends the Hearth | No penalty; tending is purely additive. |

---

## 11. Success metrics (this build)

Tied to the Stage-1 and Stage-2 gates (Bible §22):
- **Attachment (primary):** % of testers who name/narrate their Capsule after one cycle; % who can explain why it changed; % who revisit the archive unprompted.
- **Cadence (Stage 2):** D1/D7 retention vs. cozy/idle norms (idle stickiness benchmark ≈ 18% DAU/MAU); qualitative "relaxing, not a chore."
- **Guardrail:** zero testers reporting timer-anxiety or "I have to check in." If this appears, strip more loss-pressure (Bible §22, Stage 2 threshold).

---

## 12. Open product decisions (carried from Bible §24)

1. **Age gate** — default 18+ (Bible §17); flip to 13+ adds compliance work, not design work.
2. **Name** — placeholder; clearance needed before any public surface.
3. **Monetization** — one-time vs. generous-free-plus-supporter-sub; not built in this build, but decide before store setup.

---

## 13. Definition of done (this build)

- [ ] All **Must** features (F1–F7, F10, F11) implemented and meeting their ACs.
- [ ] Full loop playable end-to-end with the §4 content sets.
- [ ] Every return delivers a visible change + ≤3-sentence myth + memory commit + Hearth reaction.
- [ ] Archive is an active collection with at least the first two threshold unlocks live.
- [ ] Game fully playable with weather disabled (fairness guardrail).
- [ ] No loss-aversion mechanics anywhere; nothing is ever lost to absence.
- [ ] Data export/delete present; age gate present.
- [ ] Ready for a small closed playtest measuring the §11 metrics.
