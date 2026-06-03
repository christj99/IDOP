import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  DEFAULT_RULES,
  createJourneySeed,
  deterministicBaseline,
  evaluateRulesForTick,
  matchesWhen,
  realWorldModifiers,
  resolveJourney,
  roll,
  type CapsuleSnapshot,
  type InfluenceEvent,
  type JourneySeedMaterial,
  type ResolveJourneyInput,
  type WorldSnapshot,
} from "./index.js";

const seedMaterial: JourneySeedMaterial = {
  capsuleId: "capsule-moss-baby",
  launchTimeUtc: "2026-06-03T12:00:00.000Z",
  coarseRegionId: "h3-892a100d2dbffff",
  intentId: "wander",
  journeyNonce: "nonce-001",
  secretVersion: "v1",
  serverSecret: "test-secret",
};

const capsule: CapsuleSnapshot = {
  id: "capsule-moss-baby",
  name: "Moss Baby",
  shell: "paper",
  core: "shy",
  cargo: "charm",
  visibleMarks: [],
  durability: 80,
  mood: {},
};

function baseInput(overrides: Partial<ResolveJourneyInput> = {}): ResolveJourneyInput {
  const { journeySeed } = createJourneySeed(seedMaterial);

  return {
    journeySeed,
    launchTimeUtc: "2026-06-03T12:00:00.000Z",
    durationHours: 6,
    intent: "wander",
    capsuleSnapshot: capsule,
    worldSnapshots: [],
    influenceEvents: [],
    ...overrides,
  };
}

describe("createJourneySeed", () => {
  it("creates a reproducible HMAC seed and exposes only its hash plus secret version for storage", () => {
    const first = createJourneySeed(seedMaterial);
    const second = createJourneySeed(seedMaterial);
    const differentNonce = createJourneySeed({ ...seedMaterial, journeyNonce: "nonce-002" });

    expect(first).toEqual(second);
    expect(first.secretVersion).toBe("v1");
    expect(first.journeySeed).toMatch(/^[a-f0-9]{64}$/);
    expect(first.seedHash).toMatch(/^[a-f0-9]{64}$/);
    expect(first.seedHash).not.toBe(first.journeySeed);
    expect(differentNonce.journeySeed).not.toBe(first.journeySeed);
  });
});

describe("roll", () => {
  it("is stable for identical coordinates and changes when any coordinate changes", () => {
    const { journeySeed } = createJourneySeed(seedMaterial);

    const first = roll(journeySeed, "tick", 3, "rain_paper_water_stain");
    const second = roll(journeySeed, "tick", 3, "rain_paper_water_stain");
    const differentTick = roll(journeySeed, "tick", 4, "rain_paper_water_stain");
    const differentRule = roll(journeySeed, "tick", 3, "wind_worn_edge");

    expect(first).toBe(second);
    expect(first).toBeGreaterThanOrEqual(0);
    expect(first).toBeLessThan(1);
    expect(differentTick).not.toBe(first);
    expect(differentRule).not.toBe(first);
  });

  it("is roughly uniform over many deterministic samples", () => {
    const { journeySeed } = createJourneySeed(seedMaterial);
    const values = Array.from({ length: 1_000 }, (_, index) =>
      roll(journeySeed, "uniformity", index, "sample"),
    );
    const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);

    expect(mean).toBeGreaterThan(0.47);
    expect(mean).toBeLessThan(0.53);
    expect(min).toBeLessThan(0.01);
    expect(max).toBeGreaterThan(0.99);
  });
});

describe("rule content and evaluator", () => {
  it("seeds the first-build scar and transformation library from the PRD table", () => {
    const outcomeIds = new Set(DEFAULT_RULES.map((rule) => rule.outcome.id));

    expect(outcomeIds).toEqual(
      new Set([
        "water_stain",
        "rain_crack",
        "sun_bleach",
        "frost_bite",
        "wind_worn_edge",
        "salt_crust",
        "dent",
        "rust_bloom",
        "signal_burn",
        "moss_thread",
        "dimmed_beacon",
        "brightened",
      ]),
    );
    expect(DEFAULT_RULES.every((rule) => rule.outcome.visible)).toBe(true);
  });

  it("evaluates data-driven rules with explanations and bounded real-world modifier deltas", () => {
    const { journeySeed } = createJourneySeed(seedMaterial);
    const rainySnapshot: WorldSnapshot = {
      timeWindowUtc: "2026-06-03T13:00:00.000Z",
      signals: ["rain_light"],
    };

    const tick = evaluateRulesForTick({
      journeySeed,
      tickIndex: 1,
      capsule,
      intent: "wander",
      worldSignals: rainySnapshot.signals,
      activeInfluences: [],
      rules: DEFAULT_RULES,
      realWorld: realWorldModifiers([rainySnapshot]),
    });

    expect(tick.candidateOutcomes.length).toBeGreaterThan(0);
    expect(tick.candidateOutcomes[0]?.causes.length).toBeLessThanOrEqual(3);
    expect(tick.candidateOutcomes[0]?.explain).toContain("Moss Baby");
    expect(tick.appliedOutcomeCategories).toContain("scar");
  });

  it("checks every supported when-clause gate", () => {
    expect(
      matchesWhen(
        {
          minTick: 2,
          maxTick: 4,
          shellIn: ["paper"],
          coreIn: ["shy"],
          intentIn: ["wander"],
          worldSignalsAny: ["rain_light"],
        },
        capsule,
        "wander",
        ["rain_light"],
        3,
      ),
    ).toBe(true);
    expect(matchesWhen({ minTick: 2 }, capsule, "wander", ["rain_light"], 1)).toBe(false);
    expect(matchesWhen({ maxTick: 2 }, capsule, "wander", ["rain_light"], 3)).toBe(false);
    expect(matchesWhen({ shellIn: ["tin"] }, capsule, "wander", ["rain_light"], 3)).toBe(false);
    expect(matchesWhen({ coreIn: ["brave"] }, capsule, "wander", ["rain_light"], 3)).toBe(false);
    expect(matchesWhen({ intentIn: ["scout"] }, capsule, "wander", ["rain_light"], 3)).toBe(false);
    expect(matchesWhen({ worldSignalsAny: ["freeze"] }, capsule, "wander", ["rain_light"], 3)).toBe(
      false,
    );
  });
});

describe("resolveJourney", () => {
  it("is reproducible for identical inputs and logical time", () => {
    const input = baseInput();
    const atTimeUtc = "2026-06-03T18:00:00.000Z";

    expect(resolveJourney(input, atTimeUtc)).toEqual(resolveJourney(input, atTimeUtc));
  });

  it("is monotonic: later resolution continues the earlier dispatch and state prefix", () => {
    const input = baseInput();

    const early = resolveJourney(input, "2026-06-03T14:00:00.000Z");
    const later = resolveJourney(input, "2026-06-03T16:00:00.000Z");

    expect(later.elapsedTicks).toBeGreaterThan(early.elapsedTicks);
    expect(later.dispatches.slice(0, early.dispatches.length)).toEqual(early.dispatches);
    expect(later.timeline.slice(0, early.timeline.length)).toEqual(early.timeline);
  });

  it("applies influence events only from their server timestamp onward", () => {
    const influence: InfluenceEvent = {
      id: "shelter-1",
      type: "shelter",
      createdAtUtc: "2026-06-03T14:00:00.000Z",
    };

    const withoutInfluence = baseInput();
    const withInfluence = baseInput({ influenceEvents: [influence] });

    const before = "2026-06-03T13:00:00.000Z";
    const after = "2026-06-03T17:00:00.000Z";

    expect(resolveJourney(withoutInfluence, before)).toEqual(resolveJourney(withInfluence, before));
    expect(resolveJourney(withoutInfluence, after).timeline).not.toEqual(
      resolveJourney(withInfluence, after).timeline,
    );
  });

  it("always completes with at least one visible change and no more than three surfaced causes", () => {
    const completed = resolveJourney(baseInput(), "2026-06-03T18:00:00.000Z");

    expect(completed.status).toBe("returned");
    expect(completed.completion?.visibleChanges.length).toBeGreaterThanOrEqual(1);
    expect(completed.completion?.visibleChanges.every((change) => change.visible)).toBe(true);
    expect(completed.completion?.causes.length).toBeLessThanOrEqual(3);
    expect(completed.completion?.myth).toMatch(/Moss Baby/);
  });
});

describe("fairness backstop", () => {
  it("produces every outcome category and healthy variety with weather disabled", () => {
    const outcomes = new Set<string>();
    const categories = new Set<string>();

    for (let index = 0; index < 240; index += 1) {
      const { journeySeed } = createJourneySeed({
        ...seedMaterial,
        capsuleId: `capsule-${index}`,
        journeyNonce: `nonce-${index}`,
      });
      const baseline = deterministicBaseline({
        journeySeed,
        intent: index % 3 === 0 ? "wander" : index % 3 === 1 ? "scout" : "deliver",
        capsuleSnapshot: {
          ...capsule,
          id: `capsule-${index}`,
          shell: ["paper", "glass", "cloth", "moss", "tin"][index % 5] as CapsuleSnapshot["shell"],
          core: ["shy", "brave", "curious", "sleepy", "stubborn"][
            index % 5
          ] as CapsuleSnapshot["core"],
        },
        tickCount: 6,
      });

      for (const outcome of baseline.outcomes) {
        outcomes.add(outcome.id);
        categories.add(outcome.category);
      }
    }

    expect(categories).toEqual(new Set(["scar", "transformation", "stamp", "cargo"]));
    expect(outcomes.size).toBeGreaterThanOrEqual(16);
  });

  it("real-world modifiers are additive and never remove deterministic outcome categories", () => {
    const { journeySeed } = createJourneySeed(seedMaterial);
    const deterministic = deterministicBaseline({
      journeySeed,
      intent: "wander",
      capsuleSnapshot: capsule,
      tickCount: 6,
    });
    const withWeather = deterministicBaseline({
      journeySeed,
      intent: "wander",
      capsuleSnapshot: capsule,
      tickCount: 6,
      realWorld: realWorldModifiers([
        { timeWindowUtc: "2026-06-03T13:00:00.000Z", signals: ["rain_light", "storm_charge"] },
      ]),
    });

    const deterministicCategories = new Set(
      deterministic.outcomes.map((outcome) => outcome.category),
    );
    const weatherCategories = new Set(withWeather.outcomes.map((outcome) => outcome.category));

    for (const category of deterministicCategories) {
      expect(weatherCategories.has(category)).toBe(true);
    }
    expect(withWeather.outcomes.length).toBeGreaterThanOrEqual(deterministic.outcomes.length);
  });
});

describe("engine purity guardrails", () => {
  it("does not use raw randomness, wall-clock seeding, or I/O imports in engine source", () => {
    const sourceRoot = join(__dirname);
    const sourceFiles = collectSourceFiles(sourceRoot).filter(
      (filePath) => !filePath.endsWith(".test.ts"),
    );
    const joinedSource = sourceFiles.map((filePath) => readFileSync(filePath, "utf8")).join("\n");

    expect(joinedSource).not.toMatch(/\bMath\.random\s*\(/);
    expect(joinedSource).not.toMatch(/\bDate\.now\s*\(/);
    expect(joinedSource).not.toMatch(
      /from ["']node:(fs|net|http|https|child_process|worker_threads)["']/,
    );
    expect(joinedSource).not.toMatch(
      /from ["'](fs|net|http|https|child_process|worker_threads)["']/,
    );
  });
});

function collectSourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const fullPath = join(directory, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      return collectSourceFiles(fullPath);
    }

    return fullPath.endsWith(".ts") ? [fullPath] : [];
  });
}
