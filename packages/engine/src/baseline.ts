import {
  BASELINE_SIGNALS,
  CARGO_OUTCOMES,
  DEFAULT_RULES,
  STAMP_OUTCOMES,
  syntheticOutcome,
} from "./content.js";
import { evaluateRulesForTick } from "./rules.js";
import { roll } from "./roll.js";
import type {
  DeterministicBaselineInput,
  DeterministicBaselineResult,
  OutcomeEvent,
  RealWorldModifierSet,
  WorldSnapshot,
} from "./types.js";

export function deterministicBaseline(
  input: DeterministicBaselineInput,
): DeterministicBaselineResult {
  const outcomes: OutcomeEvent[] = [];

  for (let tickIndex = 1; tickIndex <= input.tickCount; tickIndex += 1) {
    const worldSignals = baselineSignals(input.journeySeed, tickIndex, input.realWorld);
    const evaluation = evaluateRulesForTick({
      journeySeed: input.journeySeed,
      tickIndex,
      capsule: input.capsuleSnapshot,
      intent: input.intent,
      worldSignals,
      activeInfluences: [],
      rules: DEFAULT_RULES,
      realWorld: input.realWorld,
    });

    outcomes.push(...withoutDuplicates(outcomes, evaluation.candidateOutcomes));

    const stamp =
      STAMP_OUTCOMES[
        Math.floor(roll(input.journeySeed, "stamp", tickIndex, "stamp") * STAMP_OUTCOMES.length)
      ];
    if (stamp !== undefined) {
      outcomes.push(
        ...withoutDuplicates(outcomes, [
          syntheticOutcome(
            stamp.id,
            stamp.label,
            "stamp",
            tickIndex,
            `${input.capsuleSnapshot.name} earned ${stamp.label}.`,
          ),
        ]),
      );
    }

    if (input.intent === "deliver" || input.capsuleSnapshot.cargo !== undefined) {
      const cargo =
        CARGO_OUTCOMES[
          Math.floor(roll(input.journeySeed, "cargo", tickIndex, "cargo") * CARGO_OUTCOMES.length)
        ];
      if (cargo !== undefined) {
        outcomes.push(
          ...withoutDuplicates(outcomes, [
            syntheticOutcome(
              cargo.id,
              cargo.label,
              "cargo",
              tickIndex,
              `${input.capsuleSnapshot.name}'s cargo changed: ${cargo.label}.`,
            ),
          ]),
        );
      }
    }
  }

  return { outcomes };
}

export function realWorldModifiers(worldSnapshots: WorldSnapshot[]): RealWorldModifierSet {
  const signals = [...new Set(worldSnapshots.flatMap((snapshot) => snapshot.signals))];
  const chanceDeltas: Record<string, number> = {};
  const additiveRuleIds: string[] = [];

  for (const rule of DEFAULT_RULES) {
    const matchingSignalCount =
      rule.when.worldSignalsAny?.filter((signal) => signals.includes(signal)).length ?? 0;
    if (matchingSignalCount > 0) {
      chanceDeltas[rule.id] = Math.min(0.2, matchingSignalCount * 0.08);
      additiveRuleIds.push(rule.id);
    }
  }

  return {
    signals,
    chanceDeltas,
    additiveRuleIds,
  };
}

export function baselineSignals(
  journeySeed: string,
  tickIndex: number,
  realWorld?: RealWorldModifierSet,
): string[] {
  const firstIndex = Math.floor(
    roll(journeySeed, "baseline-signal-a", tickIndex, "signal") * BASELINE_SIGNALS.length,
  );
  const secondIndex = Math.floor(
    roll(journeySeed, "baseline-signal-b", tickIndex, "signal") * BASELINE_SIGNALS.length,
  );
  const firstSignal = BASELINE_SIGNALS[firstIndex] ?? "high_wind";
  const secondSignal = BASELINE_SIGNALS[secondIndex] ?? "survival";

  return [...new Set([firstSignal, secondSignal, ...(realWorld?.signals ?? [])])];
}

function withoutDuplicates(existing: OutcomeEvent[], candidates: OutcomeEvent[]): OutcomeEvent[] {
  const existingIds = new Set(existing.map((outcome) => outcome.id));
  return candidates.filter((candidate) => !existingIds.has(candidate.id));
}
