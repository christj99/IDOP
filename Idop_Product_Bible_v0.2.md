# IDOP — Product Bible v0.2
### A small thing you make, send out, and get back changed

**Status:** Working artifact / canonical product bible
**Version:** v0.2 (supersedes v0.1)
**Date:** June 3, 2026
**Working name:** "Idop" is a placeholder — it has trademark/discoverability problems flagged in v0.1 and is retained here only for continuity. Naming is an open decision (§24).

**Core promise (unchanged from v0.1):** *I made this little thing, sent it out into the world, and now it is out there becoming something — and I get to keep what it became.*

> This is a product and game-design planning artifact. It is not legal, tax, privacy, or patent advice. Age posture and any handling of minors' data require counsel before launch.

---

## 0. How to read this document

v0.1 described an ambitious "living object network" — a real-world-powered, map-based, stranger-social object game. Three research passes since then changed the product substantially:

1. **A viability assessment** concluded v0.1 was not buildable or operable by a solo developer. The combination of *minors + precise location + stranger interaction* is a hard regulatory and child-safety blocker that functionally requires a trust & safety team and legal counsel; the location-game category is a commercial graveyard; and continuous server simulation plus 24/7 moderation plus a live-ops content treadmill is unsurvivable for one person. We did not bolt mitigations onto v0.1 — we melted it down to its soul and rebuilt.
2. **Two design refinements** were added: a light *byproduct utility* layer, and a *two-body system* (a traveling Capsule plus a persistent Hearth) that creates an internal feedback loop so the player's own world feels alive without anyone else present.
3. **A game-mechanics stress-test** moved the load-bearing wall. It found that the engagement engine is NOT the timer or the real-world data — it is the *object returning visibly changed* (a permanent scar/transformation) plus an *active, player-built collection*. Real-world weather and the away-timer are seasoning, not structure.

This bible is the synthesis. It is deliberately leaner than v0.1, because the product is now disciplined and focused. Sections that described mature-vision sprawl (full Satellite networks, complex economy, deep lineage trees, always-on AR) are cut or shrunk on purpose; see §20.

---

## 1. Executive summary

Idop is a single-player-first cozy mobile game with an optional asynchronous social layer. You build a small object (a **Capsule**), launch it from your home (a **Hearth**) into a stylized world, and over the next several hours it lives a life you do not pilot. It returns *changed* — carrying a visible scar or transformation, a short story of what happened, and a memory you keep forever in a growing archive. Your Hearth watches the real world (weather, time, season, the sky) and shapes the next launch; what your Capsules bring home slowly evolves the Hearth, which shapes better launches in turn.

The emotional centerpiece is **the return** — the moment of opening a changed object. The retention spine is **the archive** — an active, gap-structured collection you build over months. The magic is that your object's life is partly authored by *your actual world* — tonight's real storm, this morning's golden hour, the full moon over your city.

| Decision | Recommendation |
|---|---|
| Product shape | Single-player-first, return-centered, archive-as-collection. Async social layered on top, optional. |
| Load-bearing mechanics | (1) visible-scar return moment, (2) active biography collection, (3) gentle real-moment daily ritual. |
| Real-world data role | Flavor and bonus modifier + delightful notification hook. **Never a content gate.** |
| Stakes | Transformative, never punitive. The Capsule always comes back; *how* it comes back is the stakes. |
| Age posture | **Default: 18+ at launch** for solo-operability. 13+ is now *defensible* (the dangerous mechanics are gone) but adds compliance work. See §17. |
| Technical posture | Lazy, compute-on-read simulation. Deterministic-stochastic seeded engine. Near-zero continuous server cost. The world supplies novelty, so no content treadmill. |
| Monetization | Premium-leaning. Never paywall the core act of launching/relaunching; never pay-to-save; never sell location advantage. |
| Defensibility | No strong moat. Collective world-memory + craft/taste + emotional switching cost. Enough to hold a loyal niche, not to bar a funded competitor. |
| Largest design risk | The return feels random, the archive feels like a dead log, or the timer feels like a chore. All three are addressed below. |
| Go/no-go test | After one full cycle, do testers spontaneously name or narrate their Capsule, and voluntarily revisit the archive? |

---

## 2. What changed from v0.1, and why

The soul of v0.1 was sound. The *vehicle* was not. The four irreducible soul-truths we are preserving:

1. **Autonomy + return** — you make a thing, let it go without piloting it, and it comes back changed. The surprise on return is the whole loop.
2. **The world is the author** — what changes the object is the real world, made legible. This is what makes it feel real rather than a slot machine.
3. **Memory as identity** — the object becomes precious because of what happened to it. v0.1 called memory "the soul"; that stays true.
4. **Social through objects** — you meet people sideways, through what objects did. This is the most expendable truth, and it carried every blocker, so it is now reduced to a thin, safe, optional layer.

The three blockers and how the melt-down kills each:

| v0.1 blocker | Melt-down response |
|---|---|
| Minors + precise location + strangers (regulatory/child-safety; **the fatal one**) | Default 18+; coarse/transient location only (precise coordinates discarded on the spot); no stranger contact (anonymized traces only) and no free text. The exact features the child-safety codes target are removed. |
| Location-game density requirement (the adoption cliff that killed the category) | The product is single-player-first. It is fully alive with zero other players, via the Capsule↔Hearth loop. Social is additive, never required. |
| Continuous server simulation + 24/7 moderation + live-ops treadmill (un-operable solo) | Lazy compute-on-read simulation (near-zero idle cost). No free text and no strangers → near-zero moderation. The world's real data supplies daily novelty → no content treadmill. |

Map-as-flavor, not map-as-rendezvous: we keep a stylized world surface to watch objects drift across; we cut the "go to this real corner because a stranger's object is there" loop entirely. That loop was the physical-safety and regulatory nightmare, and it is gone.

---

## 3. The load-bearing design philosophy

This is the most important section. Everything downstream serves it.

**The scar and the collection are the game. The weather and the timer are seasoning.**

The mechanics research was unambiguous: across Wildermyth, Dwarf Fortress, Rogue Legacy, XCOM, and Pikmin, players bond to procedurally-generated entities through *visible, permanent change they can see* far more than through logged text or systemic novelty. Wildermyth's players become more attached to its procedural heroes — who grow tree-arms from untreated wounds, slowly turn into bears, lose limbs that never magically heal — than to fully authored characters in linear games. The attachment comes from **apophenia**: the player completes the meaning. The game's job is to give them a vivid, legible, permanent change and a small evocative prompt, then get out of the way.

Three consequences:

- **The return must deliver a *visible* change**, on the object, every time — not merely a sentence in a log.
- **The archive must be an active collection** (gaps to fill, thresholds to unlock, a reactive witness), not a passive append-only history. Passive logs get ignored (the FTL trap); active collections retain (the Animal Crossing museum).
- **Real-world data must never gate content.** A player in a boring climate must still get rich, varied journeys and access to every outcome. Weather modifies and delights; it never decides whether you get to play. (This is the single most important mutation from v0.1.)

If we get the scar and the collection right and everything else mediocre, the game works. If we get the weather and the timer "right" but the return is a dry reward screen and the archive is a dead log, the game fails. Build in that order.

---

## 4. Core objects: the Capsule and the Hearth

Two object families form an internal feedback loop. The Capsule creates stories; the Hearth makes the world feel alive between stories and shapes what comes next.

| Dimension | Capsule (the traveler) | Hearth (home / companion / witness) |
|---|---|---|
| Role | Pet / probe / artifact you send out | Your home base, the thing that watches the sky and remembers |
| Movement | Mobile, semi-autonomous, you influence but don't pilot | Persistent, singular, stays with you |
| Primary output | Stories, scars, transformations, memories | Launch windows, the next journey's conditions, the "look up" nudges, the archive's voice |
| Player control | Influence not control (1–2 meaningful actions per journey) | A light daily tending action + slow visible evolution |
| Emotional job | "My little thing is out there becoming something" | "My world is alive, and it's mine, even when no one's around" |

### 4.1 The Capsule
A small, customizable object the player builds from a *small* set of meaningful, tactile choices — a shell (look and behavior modifier), a core (temperament/identity), and one piece of cargo. v0.1's full component sprawl (shells × cores × tools × cargo × moods × visual identity) is cut to a handful of expressive, legible choices at launch. Depth comes from *what happens to the object*, not from a parts spreadsheet.

The Capsule accumulates a permanent biography (§9). Crucially, that biography is *visible on the body*: scars, stains, mutations, transformations. A Capsule that survived three storms should look like it.

### 4.2 The Hearth
A single persistent entity that is simultaneously your home, your companion, your world-watcher, and the voice of your archive. It is **not** a Satellite network (v0.1's mature-vision sprawl is explicitly cut); it is one evolving thing you have a relationship with. Its four jobs:

1. **Watch the real world** — read your coarse local conditions and translate them into a legible launch-window preview ("clear, calm night — good drifting").
2. **Shape the next launch** — its slow evolution (fed by returning Capsules) gives the next journey better conditions, a blessing, or a new possibility. This is the meta-progression that makes each return improve the next launch.
3. **Carry the light utility** — the "look up" nudges (§13): golden hour, full moon, first frost.
4. **Be the archive's witness** — react with personality when a Capsule returns and when a collection threshold is hit (the "Blathers" role from the Animal Crossing museum, which is a documented engagement driver).

**Design rule (from the Loop Hero cautionary case):** the Hearth must have a *light active loop* — a small thing the player *does* daily and a slow evolution they can *see* — or it becomes vestigial, a "pointless base" the player ignores in favor of the expedition. But it must not compete with the return for attention. It is the warm ground the hero stands on, not a co-protagonist, and it has **no standalone game** — it only acts in response to launches and returns, so the player can never "play the Hearth" instead of launching.

---

## 5. The core loop

**Read the world → build → launch → away → influence → return changed → remember → relaunch better.**

1. **Read the world.** Open the app; the Hearth shows current conditions as a short, legible launch-window preview and a simple risk read (*favored / risky / rare chance / unstable*).
2. **Build.** Assemble a Capsule from a few expressive choices, name it, give it an intent (explore, deliver, scout, hide, haunt a place, etc. — a small set at launch).
3. **Launch.** A short ceremonial moment. Real-world conditions set the journey's flavor and bonuses; the deterministic engine sets its backbone. Takes under a minute after onboarding.
4. **Away (hours to overnight).** The Capsule lives a life you don't pilot. You receive a few short, evocative dispatches. You have **1–2 "influence not control" actions** (e.g., boost, shelter) — meaningful, not fiddly.
5. **Return — the centerpiece (§6).** The Capsule comes back *visibly changed*: one permanent scar/transformation, a short myth of what happened, the stamps it earned, anonymized traces of what it crossed, one memory committed to the archive, and one next action.
6. **Remember.** The archive (§7) grows. The Hearth reacts.
7. **Relaunch better.** The Hearth's evolution and what the Capsule learned shape the next journey.

**Timer design (from AFK Arena's flexible-session model):** journeys run hours-to-overnight, anchored to *natural real moments* (return at first light, at golden hour) rather than arbitrary countdowns. Reward accrual **soft-caps** — it stops filling after a window, so a hyper-engaged player can't run away with the content and a busy player loses nothing. The first session of the day is the strongest; later check-ins taper. The player should "feel smart about leaving, not told to leave."

**Absolute rule (from the FarmVille wither evidence):** a Capsule you don't retrieve in time **waits, or returns on its own. It is never lost, wasted, or punished for your absence.** Loss-aversion timers churn players and harm wellbeing; they are banned from this design.

---

## 6. The return moment

The single designed centerpiece. Its emotional payload is the *visible permanent change plus the committed memory*, NOT the narration.

What every return delivers:
- **One visible, permanent change** on the Capsule, tied to a specific, legible cause ("your paper shell crossed rain → a water stain"). This carries the emotional weight.
- **A short, evocative myth** — a few sentences, never a wall of text. (The FTL trap: long auto-generated prose that repeats becomes skippable noise. Keep it minimal; invite the player to complete the meaning.)
- **The stamps earned**, the **anonymized traces** of what/who it crossed (§14), and **one memory committed** to the archive.
- **One clear next action.**

Legibility (§12) is non-negotiable here: the player must be able to say *why* the Capsule changed, naming at most three causes (a trait, a world signal, an event). "Your object randomly mutated" is a failure; "your shy paper Capsule got scared in a loud zone and hid by a bridge, coming back damp and wary" is the target.

---

## 7. The archive as an active collection

Not a passive log — an **active, gap-structured, player-built collection** modeled on the Animal Crossing museum, which peer-reviewed work found more engaging than traditional virtual collections precisely because it "depends on direct action from the visitor to expand and grow."

Mechanics:
- **Visible gaps** the player wants to fill (places not yet stamped, scars not yet earned, rare conditions not yet witnessed).
- **Threshold unlocks** — reaching milestones unlocks new Hearth capabilities, display options, or build choices (the museum's "25 items unlocks the shop, 50 unlocks the café" pattern).
- **A reactive witness** — the Hearth responds with personality to each return and each threshold, so committing a memory feels seen, not filed.
- **Display and arrangement** — retired and beloved Capsules live here, visibly, as a space the player curates.

The archive is the long-term retention spine. It is also the home of the *memory utility* (§13): over months it becomes an ambient almanac of the player's seasons ("a year ago you launched on the first snow").

---

## 8. World authoring — demoted to flavor and bonus

This is the most important correction from v0.1. Real-world data is a **modifier and a delight, never a gate.**

**The principle (from the Pokémon GO weather cautionary case):** tying outcomes deterministically to real conditions creates a fairness problem — players in stable or boring climates get impoverished, repetitive play and feel cheated; forecast inaccuracy breaks trust; severe weather can lock players out. Niantic's own fix is our blueprint: content is reachable regardless of local weather; weather only *boosts and flavors*.

How it works here:
- A **deterministic content engine** is the backbone of every journey. Every player, in every climate, can get a rich, varied journey and access to *any* outcome.
- **Real-world data (weather, time, season, moon, broad place-type)** is fetched coarsely and transiently, translated into game language ("rain polish," "dawn luck," "bridge echo," "lunar charge"), and applied as *flavor, bonuses, and rare-window triggers* on top of that backbone.
- **Real moments become the best notification hook** — "the moon is full and your sky is clear: a rare drift window is open," "first frost in your region." These are intrinsically delightful, which is why they re-engage better than countdown threats.
- **Fairness backstop:** if real conditions are persistently flat, the deterministic engine and optional seeded in-game seasons guarantee variety. A boring-weather week never means a boring-game week.

Translation must always be *legible*: "your shell crossed rain, so it gained a water stain" — never an invisible modifier the player can't trace.

---

## 9. Memory system

Memory is identity. What the object remembers is what it *is*. All of it is permanent in spirit (the player may hide or annotate, but not rewrite history), and the most important kinds are **visible on the body**.

| Memory type | Records | Visible? | Why it matters |
|---|---|---|---|
| Scar | Damage, survival, stress, a journey that went badly | **Yes** | The load-bearing attachment mechanic. Carries the emotional weight of the return. |
| Transformation / mutation | A trait or behavior gained from an event | **Yes** | Changes future play and identity; a story-seed (cf. Rogue Legacy traits). |
| Stamp | Place, condition, mission, timing achievement | Partly | Collectible proof of experience; fills archive gaps. |
| Trace / witness | Anonymized objects/events it crossed | In archive | Social provenance without contact (§14). |
| Cargo history | What it carried, lost, delivered, transformed | In archive | Supports the deliver/carry intents. |
| Place/time memory | Coarse, privacy-safe location and the day's conditions | In archive | Builds the ambient-almanac utility (§13). |
| Myth | Short generated story of what it's remembered for | In archive | Makes history legible and shareable. Kept short. |

**Example object card:**
> **Moss Baby** — shy, humid, loyal
> *Known for:* surviving its first storm and hiding by a bridge
> *Visible:* Rain-Crack scar, dimmed beacon (a transformation: dims in loud zones)
> *Stamps:* First Rain, Bridge Echo, Midnight Drift
> *Traces:* crossed 3 anonymized objects; out during the same storm as 1,400 others
> *Myth:* "Moss Baby went out under rain cover, got scared by a loud zone, hid near a bridge, and came back damp but wiser."

---

## 10. Stakes, failure, and recovery

Cozy and retentive at the same time — the design threads this needle deliberately.

- **No punitive loss.** Per the Project Horseshoe cozy-games definition, a cozy game has "no impending loss or threat"; activities are voluntary and opt-in. The Capsule always returns. Neglect is never punished (§5).
- **But vulnerability and change deepen attachment.** So the stakes are *transformative*: a journey can "go badly" and the Capsule shows it (a deeper scar, a mood shift, a lost cargo) — meaningful, never a dead end.
- **Failure is generative.** A failed mission yields a scar, a fragment, a strange outcome, a story — never "you failed." This is the Spiritfarer model (a cozy game *about* loss where loss is narrative and meaningful, never an accident).
- **Whimsy ratio.** Hold roughly Spiritfarer's stated balance — about 85–90% whimsical, 10–15% dramatic. The stakes give weight; they never make the player feel bad.
- **Guarantee recovery (the Pikmin rule).** A bad journey always leaves the player able to continue. The game never strands them.
- **Opt-in permadeath, if any.** If a hardcore "your Capsule can truly be lost" mode is ever desired, it is strictly opt-in (the Fire Emblem Classic/Casual model), never the default.

---

## 11. Agency model — influence, not control

The low-agency bet is correct and evidence-backed: indirect control creates *more* attachment than direct control, because the entity feels alive and autonomous (Pikmin, Tamagotchi, Creatures). Players bond to a thing that has a will of its own.

Design rules:
- **1–2 consequential influence actions per journey.** The risk is not too few actions; it's *inconsequential* ones (Reigns proves 1–2 meaningful binary inputs generate rich emergent narrative). The boost/shelter choices must visibly shape the outcome and the resulting scar.
- **Never gate progress on a specific autonomous outcome** (the Black & White cautionary case: players adore the creature until a puzzle requires it to do a specific thing it won't reliably do — then love turns to rage). No mission ever requires the Capsule to behave a particular way.
- **The Capsule's autonomy is the feature.** Surprise is the point. Influence shapes the odds and the texture; it never pilots.

---

## 12. Legibility

The target is **"discoverable but not obvious"** (the Loop Hero standard): opaque enough that mastery is a journey, transparent enough that nothing feels random or unfair.

- Every major outcome stores its **top causes** (trait + world signal + event), and the return surfaces at most three.
- **Personify the engine** to surface "why" without exposing math — the Hearth narrates cause-and-effect in character (the RimWorld named-storyteller technique).
- **Avoid both failure modes:** too opaque feels like a slot machine (the FTL death-cause problem); too transparent feels solved and mechanical (exposed RNG tables). The player should *learn the world by playing it*.
- **Preview risk before launch** in plain terms (favored / risky / rare chance / unstable). Avoid invisible modifiers at launch.

---

## 13. The light utility layer

A *whisper* of real-world usefulness, delivered as a gift the object/Hearth brings — **never a dashboard, never a reason-to-open**. The moment "I open the app to check the weather" becomes the primary loop, the object is instrumentalized and we've drifted into the widget/habit-tracker failure mode. Utility is subordinate to the return, always.

Two kinds, both soul-aligned:
- **Attention utility (best):** the Hearth nudges you to *look up* — golden hour at 7:42, the full moon over a clear sky, the first frost. This gives you small real-world moments you'd otherwise miss; it's additive to your life, and on-soul because the Capsule experiences the moment *with* you. It's also the best gentle re-engagement hook (§15).
- **Memory utility (emergent):** the archive, accumulating timestamped launches tied to each day's conditions, quietly becomes an ambient almanac of your seasons. Costs nothing; deepens the soul.

A third — weather-as-forecast (the launch window doubling as "rain tomorrow?") — is fine as flavor but is the weakest, because it's redundant with the weather app already on the phone. Keep it; don't headline it. If utility ever threatens focus, cut it. It's spice, not structure.

---

## 14. Social layer (async, optional, layered on top)

Built so warmth arrives without contact. The principle: **decouple social *warmth* from social *contact*.** Almost all the emotional payoff of multiplayer — "I'm not alone, others were here, someone noticed my thing" — comes from anonymized traces and aggregate presence, which carry none of the moderation, predator, or regulatory load. Direct contact is where all the danger lives.

**Tier 0 — anonymized traces and aggregate presence (default; zero contact; zero moderation).** Build this first (after the solo loop is proven).
- Your Capsule crosses *anonymized echoes* of strangers' Capsules — no names, no profiles, no messaging.
- Aggregate presence: "3,000 Capsules are out in tonight's storm worldwide."
- **Collective "I was there" marks** for shared real events — the aurora, a full moon, a heatwave. A constellation of strangers, anonymized, no contact. This is delightful, low-risk, and a genuine re-engagement and defensibility driver.
- Non-textual marks (a charm, a footprint, a heart) left at fictional places that others passing the same spot can see and "like," never reply to (the Journey / Death Stranding model).

**Tier 1 — friends-only, mutual-consent, constrained vocabulary (optional; later).** Only after Tier 0 proves the social layer adds warmth without burden.
- Confirmed mutual friends can witness, boost, and send gifts *from an approved library* (no free text). Co-weather the same storm for a shared memory.
- The weather concept shines here: "you sent Maya a sunbeam; her city was overcast, so it arrived as a warm glow."
- Moderation surface is report/block plus an automated name filter — no human review pipeline, no free-text moderation.

**No strangers messaging. No free text. No precise location of anyone.** These are permanent design constraints, not phases.

---

## 15. Session and cadence design

- **Target a 30-second-to-3-minute daily ritual** with one or two natural touchpoints, anchored to real moments (return at golden hour / first light), via AFK Arena's flexible-session model (soft cap, first-session-strongest taper).
- **Gentle notifications, not FOMO.** "Moss Baby found something." "A rare drift window just opened." Never "come back or lose rewards." The cozy-audience evidence is unanimous that forced logins and loss-threats are dealbreakers; the real-moment hooks (golden hour, aurora) re-engage *better* because they're intrinsically delightful. Finch proves the gentle model retains.
- **FTUE: one complete emotional arc in the first session.** The player must experience the entire build → launch → dispatch → changed-return → Hearth-reacts → archive-entry cycle at least once before deciding to stay. Front-load the Tamagotchi bonding loop (a need appears → a few taps fix it → the result changes the bond, not just a score). A reactive, sensory Hearth accelerates first-session attachment.

---

## 16. Defensibility — honest

There is no strong moat, and any pitch claiming a "data moat" from object biographies is false (a personal archive is a retention feature, not a barrier — it never stops a competitor from launching). What *is* available, stacked:

1. **Collective world-memory** — the one genuine scale effect, and crucially it's *collective*, not personal. The shared fictional world accumulates history from everyone's Capsules: fictional places earn reputations, real events leave collective marks. The world gets richer the more people play, and a competitor's world is empty on day one.
2. **Brand / craft / taste** — the strongest indie defensibility and a legitimate one. The *feel* of how reality becomes story is expensive to copy; cozy/craft audiences are loyal, and clones rarely dethrone a beloved original.
3. **Emotional switching cost** — real for retention, but honestly: it keeps the users you have, it doesn't win the ones you don't.

**The right frame for a solo dev is not "moat" but "expensive-in-taste to copy + loved + first."** That's enough to hold a loyal niche against fast-followers. It is not enough to bar a funded competitor — and that's fine; almost no great indie product wins on moats.

---

## 17. Age posture and compliance

**Default recommendation: launch 18+.** For a solo operator this is the single biggest operational simplification — it removes the entire child-safety apparatus (COPPA, state Age-Appropriate Design Codes, the UK Children's Code's child-risk DPIA and age-assurance expectations). Note that even 18+ requires real age assurance, since self-declaration has been held insufficient.

**13+ is now *defensible* (it was reckless under v0.1).** The melt-down removed the exact mechanics the child-safety codes target: precise location (now coarse/transient), stranger contact (now anonymized-only), and free text (now constrained vocabulary). If you choose 13+, budget for: a lightweight DPIA, geolocation-off-by-default conventions, careful handling of the Tier 1 friend graph (mutual-consent, age-banded or kept modest for younger users), and a written data-retention policy (note: the permanent archive must be reconcilable with retention rules — design deletion/export from day one).

Privacy invariants regardless of age:
- Precise location used only transiently to seed regional conditions, then **discarded**; only a coarse region is stored.
- No continuous location trail. No precise location of any user ever resolvable by any other user.
- Minimal data collection; no sensitive-location profiling; no behavioral ad profiling.

This is the one decision defaulted on the author's behalf. Flipping it is straightforward and changes the compliance wrapper, not the design.

---

## 18. Technical posture (lean)

The product is engineered to be *operable by one person*. This is a hard constraint, not an aspiration.

- **Lazy, compute-on-read simulation.** Journeys are computed when the player opens the app, from a deterministic seed — not ticked continuously. The player can't tell the difference; idle server cost approaches zero.
- **Deterministic-stochastic engine.** Each journey's seed derives from object ID + launch time + coarse launch region + intent + a server secret. Rolls are reproducible (for debugging, dispute resolution, and *explaining why*) yet feel unpredictable to the player. A data-driven rules engine lets the designer tune outcomes without redeploying.
- **The world supplies novelty for free.** Real weather/time/season change daily at no content cost, so there is **no live-ops content treadmill** — the structural killer of solo live-service games.
- **Minimal stack.** A managed database (Postgres + a spatial extension and JSONB for flexible memory payloads), coarse region keys for the (de-emphasized) spatial layer, a cache for hot state, push via the platform services, and self-hosted/open map tiles for the stylized world surface to flatten cost. IaC from day one.
- **Near-zero moderation infrastructure** — a consequence of no strangers and no free text (§14).

Explicitly cut from v0.1's mature architecture: full Satellite networks, real-time always-on simulation, AR runtime, complex economy backend, deep lineage/graph systems, multi-source transit/event ingestion, ML moderation pipelines. These can return only if the core loop is proven and the team grows.

---

## 19. Monetization

Premium-leaning, with v0.1's monetization ethics preserved.

- **Either** a one-time purchase plus optional cosmetic packs, **or** a generous free core plus a supporter subscription that buys archive depth, display space, and cosmetics.
- **Never** paywall the core act of creating or relaunching objects.
- **Never** pay-to-save a beloved object from loss (there is no unfair loss anyway, §10).
- **Never** sell location advantage or precise-data benefits.
- The most valuable artifacts are earned through history, not purchased.

The lazy-simulation architecture is what makes premium economics close: with near-zero idle cost, the game doesn't need the constant ARPDAU extraction that forces freemium/live-service models — which is precisely the model that doesn't fit a solo dev.

---

## 20. What this is deliberately NOT

The discipline list. Each of these was either a blocker or a sprawl risk.

- Not a navigate-the-real-world map game (no "go to this real corner"). Map-as-flavor only.
- Not a stranger-messaging social network (no free text with strangers, ever).
- Not a continuous real-time live-service (lazy sim; the world supplies novelty).
- Not a habit / self-improvement tracker (the object lives its own life; it is not your accountability buddy). This is the key distinction from the "weather familiar / Finch" direction we considered: the soul here is autonomy, not self-optimization.
- Not pay-to-save and not loss-aversion-driven.
- Not — at launch — AR, an economy, lineage trees, or a full Satellite network.

---

## 21. First build (MVP) scope

Prove the load-bearing moment before anything else. The order matters.

**In the first build:**
- The single-Capsule loop: build → launch → away (one short, one overnight option) → 1–2 influence actions → **return with a visible permanent scar tied to one legible cause.**
- The Hearth as home + witness + launch-window voice, with one light daily tending action and a slow visible evolution.
- The **archive as an active collection** from day one (visible gaps, threshold unlocks, the Hearth reacting).
- A small set of build choices, a small set of intents, a small set of scar/transformation outcomes.
- Real-world data as a *bonus/flavor modifier and notification hook only*, on top of the deterministic engine.
- Gentle notifications anchored to real moments.

**Cut from the first build:**
- All social (even Tier 0) until the solo loop is proven.
- Tier 1 friends features, deep crafting, economy, lineage, Satellite variety, AR.

---

## 22. Staged plan and decision gates

| Stage | Goal | Build | Gate to proceed | Threshold that changes the plan |
|---|---|---|---|---|
| 1. The moment | Prove attachment | Single-Capsule build→launch→return-with-visible-scar; active archive; reactive Hearth | Majority of testers spontaneously **name or narrate** their Capsule after one return; testers can articulate **why** it changed; testers **voluntarily revisit** the archive | If testers don't bond or can't explain outcomes → fix legibility and the visibility of change before adding anything |
| 2. The cadence | Prove it's relaxing *and* sticky | AFK-style flexible sessions (soft cap, no loss); Hearth's light loop + evolution shaping next launch; gentle real-moment notifications | D7 retention competitive with cozy/idle norms (idle stickiness benchmark ≈ 18% DAU/MAU); self-reported "relaxing, not a chore" | If testers report timer-anxiety or "I *have* to check in" → strip more loss-pressure out |
| 3. The world | Prove fairness | Real-world data as bonus/flavor + notification, with deterministic backstop | **No measurable difference** in journey richness or outcome access between simulated "exciting" and "boring" climates | If boring-climate testers get worse experiences → increase the deterministic engine's weight until parity |
| 4. The social warmth | Prove warmth without burden | Tier 0 anonymized presence + collective "I was there" | These moments **measurably lift re-engagement**; zero moderation incidents | Build Tier 1 only if Tier 0 proves the social layer adds warmth without burden |

---

## 23. Risks and mitigations (mechanics-level)

| Risk | Source case | Mitigation |
|---|---|---|
| The return feels like a dry reward screen | generic mobile rewards | Visible permanent change + short myth + committed memory; the change carries the weight |
| The archive gets ignored | the FTL event-log trap | Active collection: gaps, threshold unlocks, reactive Hearth |
| Outcomes feel random | Norns / FTL opacity | Store and surface top causes; personify the engine; preview risk |
| The world layer feels unfair | Pokémon GO weather | Demote data to flavor/bonus; deterministic backstop; never gate content |
| The timer feels like a chore / hurts wellbeing | FarmVille wither | Soft cap, never lose anything, anchor to real moments, first-session-strongest taper |
| The Hearth feels pointless | Loop Hero base | Give it a light active loop + visible evolution that shapes the next launch |
| Indirect control frustrates | Black & White | Never gate progress on a specific autonomous outcome; guarantee recovery |
| The myth becomes skippable noise | FTL walls of text | Keep myth short and evocative; let the scar speak |
| The real-world hook wears off by week 3 | Walkr / step-trackers | Authored deterministic content underneath; the data is seasoning, not the meal |

---

## 24. Open decisions

1. **Age posture** — defaulted to 18+ (§17). Flip to 13+ if willing to take on the (now manageable) compliance work.
2. **Name** — "Idop" is a placeholder with clearance problems. Needs replacement and trademark clearance before any public surface.
3. **Monetization model** — one-time-purchase vs. generous-free-plus-supporter-sub (§19). Decide before store setup.
4. **Permadeath mode** — whether to ever offer an opt-in hardcore mode (§10). Not a launch concern.

---

## 25. Glossary

- **Capsule** — the small, customizable traveling object the player builds, launches, and gets back changed.
- **Hearth** — the single persistent home/companion that watches the real world, shapes the next launch, carries the light utility, and voices the archive.
- **Scar / transformation** — a *visible, permanent* change earned on a journey; the load-bearing attachment mechanic.
- **Stamp** — a collectible memory mark; fills archive gaps.
- **Myth** — the short generated story of what a Capsule is remembered for. Kept short by design.
- **World signal** — a game-language fact derived from real-world data ("rain polish," "dawn luck"), applied as flavor/bonus.
- **The return** — the moment of opening a changed Capsule; the designed emotional centerpiece.
- **The archive** — the active, gap-structured collection of object biographies; the long-term retention spine.
- **Tier 0 / Tier 1 social** — anonymized-presence (no contact) / friends-only-constrained-vocabulary (optional, later).
- **Collective world-memory** — the shared fictional world's accumulated history; the one genuine (collective) scale-effect defensibility.
- **Compute-on-read simulation** — journeys computed lazily from a deterministic seed when the player opens the app; near-zero idle cost.

---

## 26. Maintenance plan

Treat this file as the source of truth; version it (v0.2, v0.3, …). Update when a decision changes the product promise, the load-bearing mechanics, the privacy/age posture, or the monetization model. Before any public surface, split into a build-facing PRD and a technical spec that reference this bible rather than duplicating it, and get counsel sign-off on §17.

---

## Final project definition

Idop is a small thing you make and let go.

You build it. You send it into a world half-authored by your own — tonight's real storm, this morning's light, the moon over your city. It lives a few hours you don't control. It comes back marked by what happened: a scar you can see, a story you can read, a memory you keep. Your home remembers too, and grows, and sends the next one out a little luckier.

Nothing is lost if you look away. No stranger can reach you. The world is alive even when you're alone in it.

You made a little thing, sent it out, and it became something — and you get to keep what it became.
