export type Shell = "paper" | "glass" | "cloth" | "moss" | "tin";
export type Core = "shy" | "brave" | "curious" | "sleepy" | "stubborn";
export type Cargo = "charm" | "note_wish" | "seed" | "empty_pocket";
export type Intent = "wander" | "scout" | "deliver";
export type InfluenceType = "boost" | "shelter";
export type RulePhase = "tick" | "completion";
export type OutcomeCategory = "scar" | "transformation" | "stamp" | "cargo";

export interface JourneySeedMaterial {
  capsuleId: string;
  launchTimeUtc: string;
  coarseRegionId: string;
  intentId: Intent;
  journeyNonce: string;
  secretVersion: string;
  serverSecret: string;
}

export interface JourneySeedResult {
  journeySeed: string;
  seedHash: string;
  secretVersion: string;
}

export interface CapsuleSnapshot {
  id: string;
  name: string;
  shell: Shell;
  core: Core;
  cargo?: Cargo;
  visibleMarks: string[];
  durability: number;
  mood: Record<string, number>;
}

export interface WorldSnapshot {
  timeWindowUtc: string;
  signals: string[];
}

export interface InfluenceEvent {
  id: string;
  type: InfluenceType;
  createdAtUtc: string;
}

export interface RuleWhen {
  worldSignalsAny?: string[];
  shellIn?: Shell[];
  coreIn?: Core[];
  intentIn?: Intent[];
  minTick?: number;
  maxTick?: number;
}

export interface ChanceModifier {
  if: {
    worldSignalsAny?: string[];
    influenceActive?: InfluenceType;
    shell?: Shell;
    core?: Core;
    intent?: Intent;
  };
  delta: number;
}

export interface RuleChance {
  base: number;
  modifiers?: ChanceModifier[];
}

export interface RuleOutcome {
  id: string;
  label: string;
  category: Exclude<OutcomeCategory, "stamp" | "cargo">;
  visible: true;
}

export interface JourneyRule {
  id: string;
  phase: RulePhase;
  when: RuleWhen;
  chance: RuleChance;
  outcome: RuleOutcome;
  explain: string;
  causes: string[];
}

export interface RealWorldModifierSet {
  signals: string[];
  chanceDeltas: Record<string, number>;
  additiveRuleIds: string[];
}

export interface OutcomeEvent {
  id: string;
  label: string;
  category: OutcomeCategory;
  visible: boolean;
  ruleId: string;
  tickIndex: number;
  explain: string;
  causes: string[];
}

export interface EvaluateRulesForTickInput {
  journeySeed: string;
  tickIndex: number;
  capsule: CapsuleSnapshot;
  intent: Intent;
  worldSignals: string[];
  activeInfluences: InfluenceEvent[];
  rules: JourneyRule[];
  realWorld?: RealWorldModifierSet;
}

export interface TickEvaluation {
  candidateOutcomes: OutcomeEvent[];
  appliedOutcomeCategories: OutcomeCategory[];
}

export interface DeterministicBaselineInput {
  journeySeed: string;
  intent: Intent;
  capsuleSnapshot: CapsuleSnapshot;
  tickCount: number;
  realWorld?: RealWorldModifierSet;
}

export interface DeterministicBaselineResult {
  outcomes: OutcomeEvent[];
}

export interface ResolveJourneyInput {
  journeySeed: string;
  launchTimeUtc: string;
  durationHours: number;
  intent: Intent;
  capsuleSnapshot: CapsuleSnapshot;
  worldSnapshots: WorldSnapshot[];
  influenceEvents: InfluenceEvent[];
}

export interface ResolvedCapsuleState {
  visibleMarks: string[];
  durability: number;
  mood: Record<string, number>;
}

export interface JourneyCompletion {
  visibleChanges: OutcomeEvent[];
  stamps: OutcomeEvent[];
  causes: string[];
  myth: string;
}

export interface ResolvedJourney {
  status: "travelling" | "decision_point" | "nearing_return" | "returned";
  elapsedTicks: number;
  dispatches: string[];
  timeline: OutcomeEvent[];
  currentState: ResolvedCapsuleState;
  availableInfluenceActions: InfluenceType[];
  completion?: JourneyCompletion;
}
