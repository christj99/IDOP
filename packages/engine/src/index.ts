export { DEFAULT_RULES } from "./content.js";
export { createJourneySeed } from "./seed.js";
export { roll } from "./roll.js";
export { deterministicBaseline, realWorldModifiers } from "./baseline.js";
export { evaluateRulesForTick, matchesWhen } from "./rules.js";
export { resolveJourney } from "./resolver.js";
export type {
  CapsuleSnapshot,
  Cargo,
  Core,
  DeterministicBaselineInput,
  DeterministicBaselineResult,
  EvaluateRulesForTickInput,
  InfluenceEvent,
  InfluenceType,
  Intent,
  JourneyCompletion,
  JourneyRule,
  JourneySeedMaterial,
  JourneySeedResult,
  OutcomeCategory,
  OutcomeEvent,
  RealWorldModifierSet,
  ResolvedCapsuleState,
  ResolvedJourney,
  ResolveJourneyInput,
  Shell,
  TickEvaluation,
  WorldSnapshot,
} from "./types.js";

export function enginePackageName() {
  return "@idop/engine";
}
