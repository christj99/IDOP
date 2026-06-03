import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import {
  AppendOnlyLedgerError,
  MEMORY_CATALOG,
  createInMemoryIdopRepository,
  projectCurrentState,
  type CapsuleRecord,
  type MemoryEventInput,
  type WorldSnapshotRecord,
} from "./memory-ledger.js";

const forbiddenWorldSnapshotKeys = [
  "userId",
  "ownerId",
  "capsuleId",
  "journeyId",
  "lat",
  "lng",
  "latitude",
  "longitude",
] as const;

// TODO(M6): validate WorldSnapshot.canonical and MemoryEvent.payload at the write boundary (Zod) to reject coordinate-shaped fields.

const baseCapsule: CapsuleRecord = {
  id: "capsule-1",
  ownerId: "user-1",
  name: "Moss Baby",
  shell: "paper",
  core: "shy",
  cargo: "charm",
  intentDefault: "wander",
  currentState: {
    visibleMarks: [],
    stamps: [],
    transformations: [],
    cargoHistory: [],
    myths: [],
    durability: 80,
    mood: {},
  },
  status: "home",
  createdAt: "2026-06-03T12:00:00.000Z",
};

function memoryEvent(overrides: Partial<MemoryEventInput>): MemoryEventInput {
  return {
    id: overrides.id ?? `event-${Math.random()}`,
    capsuleId: "capsule-1",
    journeyId: "journey-1",
    type: "scar",
    timestamp: overrides.timestamp ?? "2026-06-03T13:00:00.000Z",
    coarseRegionId: "h3-892a100d2dbffff",
    payload: { visibleMarkId: "water_stain" },
    causes: ["shell", "world_signal:rain", "roll"],
    source: "engine",
    ...overrides,
  };
}

describe("memory ledger append-only behavior", () => {
  it("allows memory event inserts but rejects app-layer updates and deletes", () => {
    const repo = createInMemoryIdopRepository({ capsules: [baseCapsule] });
    const inserted = repo.insertMemoryEvent(memoryEvent({ id: "event-append-only" }));

    expect(inserted.id).toBe("event-append-only");
    expect(() =>
      repo.updateMemoryEvent("event-append-only", { payload: { visibleMarkId: "rain_crack" } }),
    ).toThrow(AppendOnlyLedgerError);
    expect(() => repo.deleteMemoryEvent("event-append-only")).toThrow(AppendOnlyLedgerError);
    expect(repo.listMemoryEventsForCapsule("capsule-1")).toHaveLength(1);
  });
});

describe("projectCurrentState", () => {
  it("rebuilds the capsule current-state cache from the append-only event log", () => {
    const events = [
      memoryEvent({
        id: "event-scar",
        type: "scar",
        payload: { visibleMarkId: "water_stain", durabilityDelta: -4 },
      }),
      memoryEvent({
        id: "event-transform",
        type: "transform",
        timestamp: "2026-06-03T14:00:00.000Z",
        payload: { visibleMarkId: "dimmed_beacon", transformationId: "dimmed_beacon" },
      }),
      memoryEvent({
        id: "event-stamp",
        type: "stamp",
        timestamp: "2026-06-03T15:00:00.000Z",
        payload: { stampId: "first_rain" },
      }),
      memoryEvent({
        id: "event-cargo",
        type: "cargo",
        timestamp: "2026-06-03T16:00:00.000Z",
        payload: { cargoResultId: "fog_fragment" },
      }),
      memoryEvent({
        id: "event-myth",
        type: "myth",
        timestamp: "2026-06-03T17:00:00.000Z",
        payload: { text: "Moss Baby came home rain-marked." },
      }),
    ];
    const repo = createInMemoryIdopRepository({ capsules: [baseCapsule], memoryEvents: events });

    const projected = projectCurrentState(baseCapsule, events);
    const cached = repo.refreshCapsuleCurrentState("capsule-1");

    expect(projected).toEqual(cached);
    expect(repo.getCapsule("capsule-1")?.currentState).toEqual(projected);
    expect(projected.visibleMarks).toEqual(["water_stain", "dimmed_beacon"]);
    expect(projected.stamps).toEqual(["first_rain"]);
    expect(projected.cargoHistory).toEqual(["fog_fragment"]);
    expect(projected.myths).toEqual(["Moss Baby came home rain-marked."]);
    expect(projected.durability).toBe(76);
  });
});

describe("archive read patterns", () => {
  it("returns object profiles with current state, recent memory, and rare stamps", () => {
    const repo = createInMemoryIdopRepository({
      capsules: [baseCapsule],
      memoryEvents: [
        memoryEvent({ id: "event-old", type: "stamp", payload: { stampId: "first_rain" } }),
        memoryEvent({
          id: "event-rare",
          type: "stamp",
          timestamp: "2026-06-03T14:00:00.000Z",
          payload: { stampId: "full_moon_drift" },
        }),
        memoryEvent({
          id: "event-new",
          type: "scar",
          timestamp: "2026-06-03T15:00:00.000Z",
          payload: { visibleMarkId: "water_stain" },
        }),
      ],
    });

    const profile = repo.getObjectProfile("capsule-1", { recentLimit: 2 });

    expect(profile.capsule.id).toBe("capsule-1");
    expect(profile.currentState.visibleMarks).toEqual(["water_stain"]);
    expect(profile.recentMemoryEvents.map((event) => event.id)).toEqual([
      "event-new",
      "event-rare",
    ]);
    expect(profile.rareStamps).toEqual(["full_moon_drift"]);
  });

  it("returns journey recaps sorted by event timestamp with causes and explain text", () => {
    const repo = createInMemoryIdopRepository({
      capsules: [baseCapsule],
      memoryEvents: [
        memoryEvent({
          id: "event-late",
          journeyId: "journey-1",
          timestamp: "2026-06-03T15:00:00.000Z",
          payload: { text: "A later myth.", explain: "Later explain." },
          causes: ["later"],
          type: "myth",
        }),
        memoryEvent({
          id: "event-early",
          journeyId: "journey-1",
          timestamp: "2026-06-03T13:00:00.000Z",
          payload: { visibleMarkId: "water_stain", explain: "Rain marked it." },
          causes: ["rain"],
        }),
      ],
    });

    const recap = repo.getJourneyRecap("journey-1");

    expect(recap.map((event) => event.id)).toEqual(["event-early", "event-late"]);
    expect(recap[0]?.causes).toEqual(["rain"]);
    expect(recap[0]?.explain).toBe("Rain marked it.");
  });

  it("returns earned-vs-catalog collection gaps and threshold progress", () => {
    const repo = createInMemoryIdopRepository({
      capsules: [baseCapsule],
      memoryEvents: [
        memoryEvent({ id: "event-scar", type: "scar", payload: { visibleMarkId: "water_stain" } }),
        memoryEvent({
          id: "event-transform",
          type: "transform",
          journeyId: "journey-2",
          timestamp: "2026-06-03T14:00:00.000Z",
          payload: { visibleMarkId: "dimmed_beacon", transformationId: "dimmed_beacon" },
        }),
        memoryEvent({
          id: "event-stamp",
          type: "stamp",
          journeyId: "journey-2",
          timestamp: "2026-06-03T15:00:00.000Z",
          payload: { stampId: "first_rain" },
        }),
      ],
    });

    const collection = repo.getCollectionView("user-1");
    const thresholds = repo.getThresholdProgress("user-1");

    expect(collection.scars.earned).toContain("water_stain");
    expect(collection.scars.gaps).toContain("rain_crack");
    expect(collection.stamps.earned).toContain("first_rain");
    expect(collection.stamps.gaps).toContain("bridge_echo");
    expect(collection.capsules).toHaveLength(1);
    expect(thresholds).toEqual([
      { id: "first_5_returns", label: "First 5 returns", current: 2, target: 5 },
      { id: "first_10_stamps", label: "First 10 stamps", current: 1, target: 10 },
      {
        id: "first_archive_shelf",
        label: "First archive shelf",
        current: 2,
        target: MEMORY_CATALOG.visibleMarks.length,
      },
    ]);
  });
});

describe("world snapshots", () => {
  it("stores no user, capsule, or journey identity in app-layer world snapshots", () => {
    const snapshot: WorldSnapshotRecord = {
      coarseRegionId: "h3-892a100d2dbffff",
      timeWindowUtc: "2026-06-03T13:00:00.000Z",
      canonical: { rain: "moderate" },
      signals: ["rain_light"],
      sourceVersion: "open-meteo-dev-v1",
      confidence: 0.95,
    };
    const repo = createInMemoryIdopRepository({ worldSnapshots: [snapshot] });

    expect(repo.listWorldSnapshots()).toEqual([snapshot]);
    for (const forbiddenKey of forbiddenWorldSnapshotKeys) {
      expect(Object.hasOwn(snapshot, forbiddenKey)).toBe(false);
    }
  });

  it("defines Prisma WorldSnapshot without user-identifying relation fields", () => {
    const schema = readFileSync(resolve(__dirname, "../../prisma/schema.prisma"), "utf8");
    const worldSnapshotModel = schema.match(/model WorldSnapshot \{[\s\S]*?\n\}/)?.[0] ?? "";

    expect(worldSnapshotModel).toContain("coarseRegionId");
    expect(worldSnapshotModel).toContain("timeWindow");
    expect(worldSnapshotModel).not.toMatch(
      /userId|ownerId|capsuleId|journeyId|lat|lng|latitude|longitude/,
    );
  });
});
