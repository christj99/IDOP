export type MemoryEventType =
  | "scar"
  | "transform"
  | "stamp"
  | "cargo"
  | "trace"
  | "place_time"
  | "myth";

export type CapsuleStatus = "active" | "home" | "retired";
export type JourneyStatus = "travelling" | "returned";

export interface CapsuleCurrentState {
  visibleMarks: string[];
  stamps: string[];
  transformations: string[];
  cargoHistory: string[];
  myths: string[];
  durability: number;
  mood: Record<string, number>;
}

export interface CapsuleRecord {
  id: string;
  ownerId: string;
  name: string;
  shell: string;
  core: string;
  cargo?: string;
  intentDefault: string;
  currentState: CapsuleCurrentState;
  status: CapsuleStatus;
  createdAt: string;
}

export interface MemoryEventInput {
  id: string;
  capsuleId: string;
  journeyId?: string;
  type: MemoryEventType;
  timestamp: string;
  coarseRegionId?: string;
  payload: Record<string, unknown>;
  causes: string[];
  source: string;
}

export interface MemoryEventRecord extends MemoryEventInput {
  createdAt: string;
}

export interface WorldSnapshotRecord {
  coarseRegionId: string;
  timeWindowUtc: string;
  canonical: Record<string, unknown>;
  signals: string[];
  sourceVersion: string;
  confidence?: number;
}

export interface ObjectProfile {
  capsule: CapsuleRecord;
  currentState: CapsuleCurrentState;
  recentMemoryEvents: MemoryEventRecord[];
  rareStamps: string[];
}

export interface JourneyRecapEvent extends MemoryEventRecord {
  explain?: string;
}

export interface CollectionAxis {
  catalog: string[];
  earned: string[];
  gaps: string[];
}

export interface CollectionView {
  capsules: CapsuleRecord[];
  scars: CollectionAxis;
  stamps: CollectionAxis;
  transformations: CollectionAxis;
}

export interface ThresholdProgress {
  id: string;
  label: string;
  current: number;
  target: number;
}

export interface RepositorySeed {
  capsules?: CapsuleRecord[];
  memoryEvents?: MemoryEventInput[];
  worldSnapshots?: WorldSnapshotRecord[];
}

export const MEMORY_CATALOG = {
  visibleMarks: [
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
  ],
  scars: [
    "water_stain",
    "rain_crack",
    "sun_bleach",
    "frost_bite",
    "wind_worn_edge",
    "salt_crust",
    "dent",
    "rust_bloom",
    "signal_burn",
  ],
  transformations: ["moss_thread", "dimmed_beacon", "brightened"],
  stamps: ["first_rain", "bridge_echo", "midnight_drift", "full_moon_drift", "first_frost"],
  rareStamps: ["full_moon_drift", "first_frost"],
} as const;

export class AppendOnlyLedgerError extends Error {
  constructor(operation: "update" | "delete") {
    super(`MemoryEvent ledger is append-only; ${operation} is not allowed through the app layer.`);
    this.name = "AppendOnlyLedgerError";
  }
}

export function createInMemoryIdopRepository(seed: RepositorySeed = {}) {
  return new InMemoryIdopRepository(seed);
}

export function projectCurrentState(
  capsule: CapsuleRecord,
  memoryEvents: MemoryEventInput[],
): CapsuleCurrentState {
  const state: CapsuleCurrentState = {
    visibleMarks: [],
    stamps: [],
    transformations: [],
    cargoHistory: [],
    myths: [],
    durability: capsule.currentState.durability,
    mood: { ...capsule.currentState.mood },
  };

  for (const event of [...memoryEvents].sort(byTimestampAscending)) {
    applyMemoryEvent(state, event);
  }

  return state;
}

export class InMemoryIdopRepository {
  private readonly capsules = new Map<string, CapsuleRecord>();
  private readonly memoryEvents = new Map<string, MemoryEventRecord>();
  private readonly worldSnapshots: WorldSnapshotRecord[];

  constructor(seed: RepositorySeed) {
    for (const capsule of seed.capsules ?? []) {
      this.capsules.set(capsule.id, cloneCapsule(capsule));
    }
    for (const event of seed.memoryEvents ?? []) {
      this.insertMemoryEvent(event);
    }
    this.worldSnapshots = [...(seed.worldSnapshots ?? [])];
  }

  insertMemoryEvent(input: MemoryEventInput): MemoryEventRecord {
    if (this.memoryEvents.has(input.id)) {
      throw new Error(`MemoryEvent ${input.id} already exists.`);
    }

    const record: MemoryEventRecord = {
      ...input,
      causes: [...input.causes],
      payload: { ...input.payload },
      createdAt: input.timestamp,
    };

    this.memoryEvents.set(record.id, record);
    return cloneMemoryEvent(record);
  }

  updateMemoryEvent(id: string, patch: Partial<MemoryEventInput>): never {
    void id;
    void patch;
    throw new AppendOnlyLedgerError("update");
  }

  deleteMemoryEvent(id: string): never {
    void id;
    throw new AppendOnlyLedgerError("delete");
  }

  listMemoryEventsForCapsule(capsuleId: string): MemoryEventRecord[] {
    return [...this.memoryEvents.values()]
      .filter((event) => event.capsuleId === capsuleId)
      .sort(byTimestampAscending)
      .map(cloneMemoryEvent);
  }

  getCapsule(capsuleId: string): CapsuleRecord | undefined {
    const capsule = this.capsules.get(capsuleId);
    return capsule === undefined ? undefined : cloneCapsule(capsule);
  }

  refreshCapsuleCurrentState(capsuleId: string): CapsuleCurrentState {
    const capsule = this.requireCapsule(capsuleId);
    const projected = projectCurrentState(capsule, this.listMemoryEventsForCapsule(capsuleId));

    this.capsules.set(capsuleId, {
      ...capsule,
      currentState: projected,
    });

    return cloneCurrentState(projected);
  }

  projectCurrentState(capsuleId: string): CapsuleCurrentState {
    const capsule = this.requireCapsule(capsuleId);
    return projectCurrentState(capsule, this.listMemoryEventsForCapsule(capsuleId));
  }

  getObjectProfile(capsuleId: string, options: { recentLimit?: number } = {}): ObjectProfile {
    const capsule = this.requireCapsule(capsuleId);
    const currentState = this.projectCurrentState(capsuleId);
    const eventsDescending = this.listMemoryEventsForCapsule(capsuleId).reverse();
    const recentLimit = options.recentLimit ?? 10;

    return {
      capsule: cloneCapsule(capsule),
      currentState,
      recentMemoryEvents: eventsDescending.slice(0, recentLimit),
      rareStamps: currentState.stamps.filter((stamp) =>
        MEMORY_CATALOG.rareStamps.includes(stamp as (typeof MEMORY_CATALOG.rareStamps)[number]),
      ),
    };
  }

  getJourneyRecap(journeyId: string): JourneyRecapEvent[] {
    return [...this.memoryEvents.values()]
      .filter((event) => event.journeyId === journeyId)
      .sort(byTimestampAscending)
      .map((event) => ({
        ...cloneMemoryEvent(event),
        ...(typeof event.payload["explain"] === "string"
          ? { explain: event.payload["explain"] }
          : {}),
      }));
  }

  getCollectionView(ownerId: string): CollectionView {
    const capsules = [...this.capsules.values()].filter((capsule) => capsule.ownerId === ownerId);
    const events = capsules.flatMap((capsule) => this.listMemoryEventsForCapsule(capsule.id));
    const earnedScars = idsFromPayload(events, "visibleMarkId", (event) => event.type === "scar");
    const earnedTransformations = idsFromPayload(
      events,
      "transformationId",
      (event) => event.type === "transform",
    );
    const earnedStamps = idsFromPayload(events, "stampId", (event) => event.type === "stamp");

    return {
      capsules: capsules.map(cloneCapsule),
      scars: collectionAxis([...MEMORY_CATALOG.scars], earnedScars),
      transformations: collectionAxis([...MEMORY_CATALOG.transformations], earnedTransformations),
      stamps: collectionAxis([...MEMORY_CATALOG.stamps], earnedStamps),
    };
  }

  getThresholdProgress(ownerId: string): ThresholdProgress[] {
    const capsules = [...this.capsules.values()].filter((capsule) => capsule.ownerId === ownerId);
    const events = capsules.flatMap((capsule) => this.listMemoryEventsForCapsule(capsule.id));
    const journeyIds = uniqueStrings(events.map((event) => event.journeyId).filter(isString));
    const stamps = idsFromPayload(events, "stampId", (event) => event.type === "stamp");
    const visibleMarks = idsFromPayload(
      events,
      "visibleMarkId",
      (event) => event.type === "scar" || event.type === "transform",
    );

    return [
      { id: "first_5_returns", label: "First 5 returns", current: journeyIds.length, target: 5 },
      { id: "first_10_stamps", label: "First 10 stamps", current: stamps.length, target: 10 },
      {
        id: "first_archive_shelf",
        label: "First archive shelf",
        current: visibleMarks.length,
        target: MEMORY_CATALOG.visibleMarks.length,
      },
    ];
  }

  listWorldSnapshots(): WorldSnapshotRecord[] {
    return this.worldSnapshots.map((snapshot) => ({
      ...snapshot,
      canonical: { ...snapshot.canonical },
      signals: [...snapshot.signals],
    }));
  }

  private requireCapsule(capsuleId: string): CapsuleRecord {
    const capsule = this.capsules.get(capsuleId);
    if (capsule === undefined) {
      throw new Error(`Capsule ${capsuleId} not found.`);
    }
    return capsule;
  }
}

function applyMemoryEvent(state: CapsuleCurrentState, event: MemoryEventInput): void {
  const visibleMarkId = stringPayload(event, "visibleMarkId");
  const stampId = stringPayload(event, "stampId");
  const transformationId = stringPayload(event, "transformationId");
  const cargoResultId = stringPayload(event, "cargoResultId");
  const mythText = stringPayload(event, "text");
  const durabilityDelta = numberPayload(event, "durabilityDelta");

  if ((event.type === "scar" || event.type === "transform") && visibleMarkId !== undefined) {
    pushUnique(state.visibleMarks, visibleMarkId);
  }
  if (event.type === "transform" && transformationId !== undefined) {
    pushUnique(state.transformations, transformationId);
  }
  if (event.type === "stamp" && stampId !== undefined) {
    pushUnique(state.stamps, stampId);
  }
  if (event.type === "cargo" && cargoResultId !== undefined) {
    state.cargoHistory.push(cargoResultId);
  }
  if (event.type === "myth" && mythText !== undefined) {
    state.myths.push(mythText);
  }
  if (durabilityDelta !== undefined) {
    state.durability = Math.max(0, state.durability + durabilityDelta);
  }
}

function idsFromPayload(
  events: MemoryEventRecord[],
  key: string,
  predicate: (event: MemoryEventRecord) => boolean,
): string[] {
  return uniqueStrings(
    events
      .filter(predicate)
      .map((event) => stringPayload(event, key))
      .filter(isString),
  );
}

function collectionAxis(catalog: string[], earned: string[]): CollectionAxis {
  return {
    catalog,
    earned,
    gaps: catalog.filter((item) => !earned.includes(item)),
  };
}

function stringPayload(event: MemoryEventInput, key: string): string | undefined {
  const value = event.payload[key];
  return typeof value === "string" ? value : undefined;
}

function numberPayload(event: MemoryEventInput, key: string): number | undefined {
  const value = event.payload[key];
  return typeof value === "number" ? value : undefined;
}

function pushUnique(items: string[], item: string): void {
  if (!items.includes(item)) {
    items.push(item);
  }
}

function uniqueStrings(items: string[]): string[] {
  return [...new Set(items)];
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function byTimestampAscending(left: { timestamp: string }, right: { timestamp: string }): number {
  return left.timestamp.localeCompare(right.timestamp);
}

function cloneCapsule(capsule: CapsuleRecord): CapsuleRecord {
  return {
    ...capsule,
    currentState: cloneCurrentState(capsule.currentState),
  };
}

function cloneCurrentState(state: CapsuleCurrentState): CapsuleCurrentState {
  return {
    visibleMarks: [...state.visibleMarks],
    stamps: [...state.stamps],
    transformations: [...state.transformations],
    cargoHistory: [...state.cargoHistory],
    myths: [...state.myths],
    durability: state.durability,
    mood: { ...state.mood },
  };
}

function cloneMemoryEvent(event: MemoryEventRecord): MemoryEventRecord {
  return {
    ...event,
    payload: { ...event.payload },
    causes: [...event.causes],
  };
}
