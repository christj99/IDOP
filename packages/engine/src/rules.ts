import type {
  CapsuleSnapshot,
  EvaluateRulesForTickInput,
  InfluenceEvent,
  JourneyRule,
  RuleWhen,
  TickEvaluation,
} from "./types.js";
import { roll } from "./roll.js";

export function evaluateRulesForTick(input: EvaluateRulesForTickInput): TickEvaluation {
  const allSignals = [...new Set([...input.worldSignals, ...(input.realWorld?.signals ?? [])])];
  const candidateOutcomes = input.rules
    .filter((rule) =>
      matchesWhen(rule.when, input.capsule, input.intent, allSignals, input.tickIndex),
    )
    .filter((rule) => {
      const chance = boundedChance(rule, input, allSignals);
      return roll(input.journeySeed, rule.phase, input.tickIndex, rule.id) < chance;
    })
    .map((rule) => ({
      id: rule.outcome.id,
      label: rule.outcome.label,
      category: rule.outcome.category,
      visible: rule.outcome.visible,
      ruleId: rule.id,
      tickIndex: input.tickIndex,
      explain: renderExplain(rule.explain, input.capsule),
      causes: rule.causes.slice(0, 3),
    }));

  return {
    candidateOutcomes,
    appliedOutcomeCategories: [...new Set(candidateOutcomes.map((outcome) => outcome.category))],
  };
}

export function matchesWhen(
  when: RuleWhen,
  capsule: CapsuleSnapshot,
  intent: string,
  signals: string[],
  tickIndex: number,
): boolean {
  if (when.minTick !== undefined && tickIndex < when.minTick) {
    return false;
  }
  if (when.maxTick !== undefined && tickIndex > when.maxTick) {
    return false;
  }
  if (when.shellIn !== undefined && !when.shellIn.includes(capsule.shell)) {
    return false;
  }
  if (when.coreIn !== undefined && !when.coreIn.includes(capsule.core)) {
    return false;
  }
  if (when.intentIn !== undefined && !when.intentIn.some((candidate) => candidate === intent)) {
    return false;
  }
  if (
    when.worldSignalsAny !== undefined &&
    !when.worldSignalsAny.some((signal) => signals.includes(signal))
  ) {
    return false;
  }

  return true;
}

function boundedChance(
  rule: JourneyRule,
  input: EvaluateRulesForTickInput,
  signals: string[],
): number {
  const ruleDelta = input.realWorld?.chanceDeltas[rule.id] ?? 0;
  const modifierDelta =
    rule.chance.modifiers?.reduce((sum, modifier) => {
      const condition = modifier.if;
      const matchesWorld =
        condition.worldSignalsAny === undefined ||
        condition.worldSignalsAny.some((signal) => signals.includes(signal));
      const matchesInfluence =
        condition.influenceActive === undefined ||
        input.activeInfluences.some((event) => event.type === condition.influenceActive);
      const matchesShell = condition.shell === undefined || condition.shell === input.capsule.shell;
      const matchesCore = condition.core === undefined || condition.core === input.capsule.core;
      const matchesIntent = condition.intent === undefined || condition.intent === input.intent;

      return matchesWorld && matchesInfluence && matchesShell && matchesCore && matchesIntent
        ? sum + modifier.delta
        : sum;
    }, 0) ?? 0;

  return Math.max(0, Math.min(0.95, rule.chance.base + ruleDelta + modifierDelta));
}

function renderExplain(template: string, capsule: CapsuleSnapshot): string {
  return template.replaceAll("{name}", capsule.name).replaceAll("{shell}", capsule.shell);
}

export function activeInfluencesForTick(
  influenceEvents: InfluenceEvent[],
  tickTimeUtc: string,
): InfluenceEvent[] {
  const tickTime = Date.parse(tickTimeUtc);

  return influenceEvents.filter((event) => Date.parse(event.createdAtUtc) <= tickTime);
}
