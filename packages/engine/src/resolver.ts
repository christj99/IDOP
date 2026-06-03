import { DEFAULT_RULES } from "./content.js";
import { baselineSignals, realWorldModifiers } from "./baseline.js";
import { activeInfluencesForTick, evaluateRulesForTick } from "./rules.js";
import type {
  InfluenceType,
  OutcomeEvent,
  ResolvedCapsuleState,
  ResolvedJourney,
  ResolveJourneyInput,
} from "./types.js";

const MS_PER_HOUR = 60 * 60 * 1_000;

export function resolveJourney(input: ResolveJourneyInput, atTimeUtc: string): ResolvedJourney {
  const launchTime = Date.parse(input.launchTimeUtc);
  const atTime = Date.parse(atTimeUtc);
  const endTime = launchTime + input.durationHours * MS_PER_HOUR;
  const evaluationTime = Math.min(atTime, endTime);
  const elapsedTicks = Math.max(
    0,
    Math.min(input.durationHours, Math.floor((evaluationTime - launchTime) / MS_PER_HOUR)),
  );
  const realWorld = realWorldModifiers(input.worldSnapshots);
  const timeline: OutcomeEvent[] = [];
  const dispatches: string[] = [];
  const visibleMarks = new Set(input.capsuleSnapshot.visibleMarks);

  for (let tickIndex = 1; tickIndex <= elapsedTicks; tickIndex += 1) {
    const tickTimeUtc = new Date(launchTime + tickIndex * MS_PER_HOUR).toISOString();
    const activeInfluences = activeInfluencesForTick(input.influenceEvents, tickTimeUtc);
    const influenceMarkers = influenceMarkersForTick(
      input,
      launchTime,
      tickIndex,
      input.capsuleSnapshot.name,
    );
    const worldSignals = [
      ...baselineSignals(input.journeySeed, tickIndex, realWorld),
      ...signalsForTick(input, tickTimeUtc),
    ];
    const evaluation = evaluateRulesForTick({
      journeySeed: input.journeySeed,
      tickIndex,
      capsule: input.capsuleSnapshot,
      intent: input.intent,
      worldSignals,
      activeInfluences,
      rules: DEFAULT_RULES,
      realWorld,
    });
    const accepted = firstNewOutcome(
      [...influenceMarkers, ...evaluation.candidateOutcomes],
      timeline,
    );

    if (accepted !== undefined) {
      timeline.push(accepted);
      if (accepted.visible) {
        visibleMarks.add(accepted.id);
      }
      dispatches.push(dispatchFor(input.capsuleSnapshot.name, accepted, activeInfluences));
    } else {
      dispatches.push(`${input.capsuleSnapshot.name} drifted quietly through tick ${tickIndex}.`);
    }
  }

  const currentState: ResolvedCapsuleState = {
    visibleMarks: [...visibleMarks],
    durability: Math.max(1, input.capsuleSnapshot.durability - timeline.length * 2),
    mood: { ...input.capsuleSnapshot.mood },
  };
  const status = statusFor(atTime, endTime, elapsedTicks, input.durationHours);
  const availableInfluenceActions =
    status === "returned" ? [] : availableInfluences(input, evaluationTime);
  const completion = status === "returned" ? completionFor(input, timeline) : undefined;

  return {
    status,
    elapsedTicks,
    dispatches,
    timeline,
    currentState,
    availableInfluenceActions,
    ...(completion === undefined ? {} : { completion }),
  };
}

function signalsForTick(input: ResolveJourneyInput, tickTimeUtc: string): string[] {
  const tickTime = Date.parse(tickTimeUtc);
  return input.worldSnapshots
    .filter((snapshot) => Date.parse(snapshot.timeWindowUtc) <= tickTime)
    .flatMap((snapshot) => snapshot.signals);
}

function firstNewOutcome(
  candidateOutcomes: OutcomeEvent[],
  existingOutcomes: OutcomeEvent[],
): OutcomeEvent | undefined {
  const existingIds = new Set(existingOutcomes.map((outcome) => outcome.id));
  return candidateOutcomes.find((outcome) => !existingIds.has(outcome.id));
}

function statusFor(
  atTime: number,
  endTime: number,
  elapsedTicks: number,
  durationHours: number,
): ResolvedJourney["status"] {
  if (atTime >= endTime) {
    return "returned";
  }
  if (elapsedTicks >= Math.max(1, durationHours - 1)) {
    return "nearing_return";
  }
  if (elapsedTicks >= 1) {
    return "decision_point";
  }
  return "travelling";
}

function availableInfluences(input: ResolveJourneyInput, evaluationTime: number): InfluenceType[] {
  const usedTypes = new Set(
    input.influenceEvents
      .filter((event) => Date.parse(event.createdAtUtc) <= evaluationTime)
      .map((event) => event.type),
  );
  return (["boost", "shelter"] as const).filter((type) => !usedTypes.has(type));
}

function completionFor(input: ResolveJourneyInput, timeline: OutcomeEvent[]) {
  const visibleChanges = timeline.filter((outcome) => outcome.visible);
  const fallback =
    visibleChanges.length > 0
      ? visibleChanges
      : [
          {
            id: "wind_worn_edge",
            label: "Wind-worn edge",
            category: "scar" as const,
            visible: true,
            ruleId: "completion:fallback_visible_change",
            tickIndex: input.durationHours,
            explain: `Because ${input.capsuleSnapshot.name} completed the journey, one edge came back wind-worn.`,
            causes: ["journey", "seed", "return"],
          },
        ];
  const primary = fallback[0] ?? fallbackVisibleChange(input);
  const stamps = timeline.filter((outcome) => outcome.category === "stamp");

  return {
    visibleChanges: fallback,
    stamps,
    causes: primary.causes.slice(0, 3),
    myth: `${input.capsuleSnapshot.name} went out, crossed ${primary.causes[0] ?? "the route"}, and came back with ${primary.label}.`,
  };
}

function fallbackVisibleChange(input: ResolveJourneyInput): OutcomeEvent {
  return {
    id: "wind_worn_edge",
    label: "Wind-worn edge",
    category: "scar",
    visible: true,
    ruleId: "completion:fallback_visible_change",
    tickIndex: input.durationHours,
    explain: `Because ${input.capsuleSnapshot.name} completed the journey, one edge came back wind-worn.`,
    causes: ["journey", "seed", "return"],
  };
}

function dispatchFor(
  capsuleName: string,
  outcome: OutcomeEvent,
  activeInfluences: { type: InfluenceType }[],
): string {
  const influenceText =
    activeInfluences.length > 0
      ? ` after ${activeInfluences.map((event) => event.type).join("+")}`
      : "";
  return `${capsuleName} found ${outcome.label}${influenceText}.`;
}

function influenceMarkersForTick(
  input: ResolveJourneyInput,
  launchTime: number,
  tickIndex: number,
  capsuleName: string,
): OutcomeEvent[] {
  const tickStart = launchTime + (tickIndex - 1) * MS_PER_HOUR;
  const tickEnd = launchTime + tickIndex * MS_PER_HOUR;

  return input.influenceEvents
    .filter((event) => {
      const eventTime = Date.parse(event.createdAtUtc);
      return eventTime > tickStart && eventTime <= tickEnd;
    })
    .map((event) => ({
      id: `influence_${event.type}_${event.id}`,
      label: event.type === "boost" ? "Boosted drift" : "Sheltered drift",
      category: "stamp",
      visible: false,
      ruleId: `influence:${event.type}`,
      tickIndex,
      explain: `${capsuleName} changed course after a ${event.type} influence.`,
      causes: ["influence", event.type, "server_time"],
    }));
}
