import { randomUUID } from "node:crypto";

import {
  createJourneySeed,
  resolveJourney,
  type CapsuleSnapshot,
  type Cargo,
  type Core,
  type InfluenceEvent,
  type InfluenceType,
  type Intent,
  type Shell,
  type WorldSnapshot,
} from "@idop/engine";
import type { FastifyInstance } from "fastify";
import { z } from "zod";

type JourneyStatus = "travelling" | "returned";
type NewIdPrefix = "capsule" | "journey" | "memory" | "influence";

export interface ApiCapsuleRecord {
  id: string;
  ownerId: string;
  name: string;
  shell: Shell;
  core: Core;
  cargo?: Cargo;
  intentDefault: Intent;
  currentState: {
    visibleMarks: string[];
    durability: number;
    mood: Record<string, number>;
  };
  status: "active" | "home" | "retired";
  createdAtUtc: string;
}

export interface JourneyRecord {
  id: string;
  ownerId: string;
  capsuleId: string;
  intent: Intent;
  launchTimeUtc: string;
  durationHours: number;
  coarseRegionId: string;
  seedHash: string;
  secretVersion: string;
  journeyNonce: string;
  capsuleSnapshotAtLaunch: CapsuleSnapshot;
  worldSnapshots: WorldSnapshot[];
  influenceEvents: InfluenceEvent[];
  status: JourneyStatus;
  committedMemoryEventId?: string;
  createdAtUtc: string;
}

export interface JourneyMemoryEventRecord {
  id: string;
  capsuleId: string;
  journeyId: string;
  type: "scar" | "transform" | "stamp";
  timestampUtc: string;
  payload: Record<string, unknown>;
  causes: string[];
  source: "journey_resolution";
}

export interface JourneyRepository {
  createCapsule(capsule: ApiCapsuleRecord): ApiCapsuleRecord;
  getCapsule(capsuleId: string): ApiCapsuleRecord | undefined;
  getCapsuleForOwner(capsuleId: string, ownerId: string): ApiCapsuleRecord | undefined;
  updateCapsuleCurrentState(
    capsuleId: string,
    currentState: ApiCapsuleRecord["currentState"],
  ): void;
  createJourney(journey: JourneyRecord): JourneyRecord;
  getJourney(journeyId: string): JourneyRecord | undefined;
  addInfluenceEvent(journeyId: string, influenceEvent: InfluenceEvent): JourneyRecord;
  hasInfluenceType(journeyId: string, type: InfluenceType): boolean;
  markJourneyReturned(journeyId: string, memoryEventId: string): void;
  hasCommittedJourney(journeyId: string): boolean;
  addMemoryEvent(memoryEvent: JourneyMemoryEventRecord): JourneyMemoryEventRecord;
  listMemoryEventsForJourney(journeyId: string): JourneyMemoryEventRecord[];
  dumpState(): unknown;
}

export interface JourneyLock {
  runExclusive<T>(journeyId: string, task: () => Promise<T> | T): Promise<T>;
}

export interface JourneyApiDependencies {
  repository: JourneyRepository;
  lock: JourneyLock;
  nowUtc: () => string;
  newId: (prefix: NewIdPrefix) => string;
  newNonce: () => string;
  secrets: {
    currentVersion: string;
    getSecret: (version: string) => string | undefined;
  };
}

const devUserId = "dev-user";
const journeyDurationHours = 6;
const intentSchema = z.enum(["wander", "scout", "deliver"]);
const shellSchema = z.enum(["paper", "glass", "cloth", "moss", "tin"]);
const coreSchema = z.enum(["shy", "brave", "curious", "sleepy", "stubborn"]);
const cargoSchema = z.enum(["charm", "note_wish", "seed", "empty_pocket"]);
const influenceSchema = z.enum(["boost", "shelter"]);

const createCapsuleSchema = z
  .object({
    name: z.string().min(1).max(40),
    shell: shellSchema,
    core: coreSchema,
    cargo: cargoSchema.optional(),
    intent_default: intentSchema.default("wander"),
  })
  .strict();

const journeyLaunchSchema = z
  .object({
    capsule_id: z.string().min(1),
    intent: intentSchema,
    client_now: z.string().optional(),
    precise_location: z
      .object({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
      })
      .strict(),
  })
  .strict();

const influencePayloadSchema = z
  .object({
    type: influenceSchema,
  })
  .strict();

const idParamsSchema = z.object({
  id: z.string().min(1),
});

export function createDefaultJourneyApiDependencies(): JourneyApiDependencies {
  const repository = createInMemoryJourneyRepository();

  return {
    repository,
    lock: createInMemoryJourneyLock(),
    nowUtc: () => new Date().toISOString(),
    newId: (prefix) => `${prefix}-${randomUUID()}`,
    newNonce: () => randomUUID(),
    secrets: {
      currentVersion: process.env.IDOP_SEED_SECRET_VERSION ?? "dev-v1",
      getSecret: (version) => {
        const currentVersion = process.env.IDOP_SEED_SECRET_VERSION ?? "dev-v1";
        if (version !== currentVersion) {
          return undefined;
        }
        return process.env.IDOP_SEED_SECRET ?? "idop-dev-seed-secret";
      },
    },
  };
}

export function createInMemoryJourneyRepository(): JourneyRepository {
  const capsules = new Map<string, ApiCapsuleRecord>();
  const journeys = new Map<string, JourneyRecord>();
  const memoryEvents = new Map<string, JourneyMemoryEventRecord>();
  const committedJourneyIds = new Set<string>();

  return {
    createCapsule(capsule) {
      capsules.set(capsule.id, cloneCapsule(capsule));
      return cloneCapsule(capsule);
    },
    getCapsule(capsuleId) {
      const capsule = capsules.get(capsuleId);
      return capsule === undefined ? undefined : cloneCapsule(capsule);
    },
    getCapsuleForOwner(capsuleId, ownerId) {
      const capsule = capsules.get(capsuleId);
      if (capsule === undefined || capsule.ownerId !== ownerId) {
        return undefined;
      }
      return cloneCapsule(capsule);
    },
    updateCapsuleCurrentState(capsuleId, currentState) {
      const capsule = capsules.get(capsuleId);
      if (capsule !== undefined) {
        capsules.set(capsuleId, {
          ...capsule,
          currentState: cloneCurrentState(currentState),
        });
      }
    },
    createJourney(journey) {
      journeys.set(journey.id, cloneJourney(journey));
      return cloneJourney(journey);
    },
    getJourney(journeyId) {
      const journey = journeys.get(journeyId);
      return journey === undefined ? undefined : cloneJourney(journey);
    },
    addInfluenceEvent(journeyId, influenceEvent) {
      const journey = requireJourney(journeys, journeyId);
      const updated = {
        ...journey,
        influenceEvents: [...journey.influenceEvents, { ...influenceEvent }],
      };
      journeys.set(journeyId, cloneJourney(updated));
      return cloneJourney(updated);
    },
    hasInfluenceType(journeyId, type) {
      const journey = journeys.get(journeyId);
      return journey?.influenceEvents.some((event) => event.type === type) ?? false;
    },
    markJourneyReturned(journeyId, memoryEventId) {
      const journey = requireJourney(journeys, journeyId);
      committedJourneyIds.add(journeyId);
      journeys.set(journeyId, {
        ...journey,
        status: "returned",
        committedMemoryEventId: memoryEventId,
      });
    },
    hasCommittedJourney(journeyId) {
      return committedJourneyIds.has(journeyId);
    },
    addMemoryEvent(memoryEvent) {
      memoryEvents.set(memoryEvent.id, cloneMemoryEvent(memoryEvent));
      return cloneMemoryEvent(memoryEvent);
    },
    listMemoryEventsForJourney(journeyId) {
      return [...memoryEvents.values()]
        .filter((event) => event.journeyId === journeyId)
        .map(cloneMemoryEvent);
    },
    dumpState() {
      return {
        capsules: [...capsules.values()].map(cloneCapsule),
        journeys: [...journeys.values()].map(cloneJourney),
        memoryEvents: [...memoryEvents.values()].map(cloneMemoryEvent),
        committedJourneyIds: [...committedJourneyIds],
      };
    },
  };
}

export function createInMemoryJourneyLock(): JourneyLock {
  const tails = new Map<string, Promise<void>>();

  return {
    async runExclusive(journeyId, task) {
      const previous = tails.get(journeyId) ?? Promise.resolve();
      let release!: () => void;
      const current = new Promise<void>((resolve) => {
        release = resolve;
      });
      const next = previous.then(
        () => current,
        () => current,
      );

      tails.set(journeyId, next);
      await previous.catch(() => undefined);

      try {
        return await task();
      } finally {
        release();
        if (tails.get(journeyId) === next) {
          tails.delete(journeyId);
        }
      }
    },
  };
}

export function registerJourneyApi(server: FastifyInstance, deps: JourneyApiDependencies): void {
  server.post("/capsules", async (request, reply) => {
    const body = parseRequest(createCapsuleSchema, request.body);
    const nowUtc = deps.nowUtc();
    const capsule = deps.repository.createCapsule({
      id: deps.newId("capsule"),
      ownerId: devUserId,
      name: body.name,
      shell: body.shell,
      core: body.core,
      ...(body.cargo === undefined ? {} : { cargo: body.cargo }),
      intentDefault: body.intent_default,
      currentState: {
        visibleMarks: [],
        durability: 80,
        mood: {},
      },
      status: "home",
      createdAtUtc: nowUtc,
    });

    return reply.code(201).send({ capsule: capsuleResponse(capsule) });
  });

  server.get("/capsules/:id", async (request, reply) => {
    const params = parseRequest(idParamsSchema, request.params);
    const capsule = deps.repository.getCapsuleForOwner(params.id, devUserId);

    if (capsule === undefined) {
      return reply.code(404).send({ error: "capsule_not_found" });
    }

    return { capsule: capsuleResponse(capsule) };
  });

  server.post("/journeys", async (request, reply) => {
    const body = parseRequest(journeyLaunchSchema, request.body);
    const capsule = deps.repository.getCapsuleForOwner(body.capsule_id, devUserId);

    if (capsule === undefined) {
      return reply.code(404).send({ error: "capsule_not_found" });
    }

    const launchTimeUtc = deps.nowUtc();
    const secretVersion = deps.secrets.currentVersion;
    const serverSecret = deps.secrets.getSecret(secretVersion);

    if (serverSecret === undefined) {
      return reply.code(500).send({ error: "seed_secret_unavailable" });
    }

    const coarseRegionId = deriveCoarseRegionId(body.precise_location);
    const journeyNonce = deps.newNonce();
    const seed = createJourneySeed({
      capsuleId: capsule.id,
      launchTimeUtc,
      coarseRegionId,
      intentId: body.intent,
      journeyNonce,
      secretVersion,
      serverSecret,
    });
    const worldSnapshots = [launchWindowSnapshot(coarseRegionId, launchTimeUtc)];
    const journey = deps.repository.createJourney({
      id: deps.newId("journey"),
      ownerId: devUserId,
      capsuleId: capsule.id,
      intent: body.intent,
      launchTimeUtc,
      durationHours: journeyDurationHours,
      coarseRegionId,
      seedHash: seed.seedHash,
      secretVersion: seed.secretVersion,
      journeyNonce,
      capsuleSnapshotAtLaunch: capsuleSnapshot(capsule),
      worldSnapshots,
      influenceEvents: [],
      status: "travelling",
      createdAtUtc: launchTimeUtc,
    });

    return reply.code(201).send({
      journey: journeyResponse(journey),
      launch_window: launchWindowResponse(coarseRegionId, worldSnapshots[0]),
    });
  });

  server.get("/journeys/:id", async (request, reply) => {
    const params = parseRequest(idParamsSchema, request.params);
    const journey = deps.repository.getJourney(params.id);

    if (journey === undefined || journey.ownerId !== devUserId) {
      return reply.code(404).send({ error: "journey_not_found" });
    }

    const resolved = resolveStoredJourney(deps, journey, deps.nowUtc());

    if (resolved.status === "returned") {
      await deps.lock.runExclusive(journey.id, () => {
        commitJourneyMemoryOnce(deps, journey, resolved);
      });
    }

    const updatedJourney = deps.repository.getJourney(journey.id) ?? journey;

    return {
      journey: journeyResponse(updatedJourney),
      resolution: resolved,
      route_mood: routeMoodFor(resolved.status),
      dispatches_so_far: resolved.dispatches,
      available_influence_actions: resolved.availableInfluenceActions,
      return_estimate_utc: returnEstimateUtc(journey),
      ...(resolved.completion === undefined ? {} : { completed_return: resolved.completion }),
    };
  });

  server.post("/journeys/:id/influence", async (request, reply) => {
    const params = parseRequest(idParamsSchema, request.params);
    const body = parseRequest(influencePayloadSchema, request.body);
    const journey = deps.repository.getJourney(params.id);

    if (journey === undefined || journey.ownerId !== devUserId) {
      return reply.code(404).send({ error: "journey_not_found" });
    }
    if (
      journey.status === "returned" ||
      Date.parse(deps.nowUtc()) >= Date.parse(returnEstimateUtc(journey))
    ) {
      return reply.code(409).send({ error: "journey_already_returned" });
    }
    if (deps.repository.hasInfluenceType(journey.id, body.type)) {
      return reply.code(429).send({ error: "influence_limit_reached", type: body.type });
    }

    const influenceEvent = {
      id: deps.newId("influence"),
      type: body.type,
      createdAtUtc: deps.nowUtc(),
    };
    const updatedJourney = deps.repository.addInfluenceEvent(journey.id, influenceEvent);

    return reply.code(201).send({
      influence_event: influenceEvent,
      journey: journeyResponse(updatedJourney),
    });
  });
}

function resolveStoredJourney(
  deps: JourneyApiDependencies,
  journey: JourneyRecord,
  atTimeUtc: string,
) {
  const serverSecret = deps.secrets.getSecret(journey.secretVersion);

  if (serverSecret === undefined) {
    throw new Error(`Seed secret ${journey.secretVersion} is unavailable.`);
  }

  const { journeySeed } = createJourneySeed({
    capsuleId: journey.capsuleId,
    launchTimeUtc: journey.launchTimeUtc,
    coarseRegionId: journey.coarseRegionId,
    intentId: journey.intent,
    journeyNonce: journey.journeyNonce,
    secretVersion: journey.secretVersion,
    serverSecret,
  });

  return resolveJourney(
    {
      journeySeed,
      launchTimeUtc: journey.launchTimeUtc,
      durationHours: journey.durationHours,
      intent: journey.intent,
      capsuleSnapshot: journey.capsuleSnapshotAtLaunch,
      worldSnapshots: journey.worldSnapshots,
      influenceEvents: journey.influenceEvents,
    },
    atTimeUtc,
  );
}

function commitJourneyMemoryOnce(
  deps: JourneyApiDependencies,
  journey: JourneyRecord,
  resolved: ReturnType<typeof resolveJourney>,
): void {
  if (deps.repository.hasCommittedJourney(journey.id)) {
    return;
  }

  const primaryVisibleChange = resolved.completion?.visibleChanges[0];
  const memoryEventId = deps.newId("memory");

  deps.repository.addMemoryEvent({
    id: memoryEventId,
    capsuleId: journey.capsuleId,
    journeyId: journey.id,
    type: primaryVisibleChange?.category === "transformation" ? "transform" : "scar",
    timestampUtc: returnEstimateUtc(journey),
    payload: {
      visibleMarkId: primaryVisibleChange?.id ?? "wind_worn_edge",
      visibleChanges: resolved.completion?.visibleChanges ?? [],
      myth: resolved.completion?.myth ?? "",
    },
    causes: resolved.completion?.causes ?? ["journey", "seed", "return"],
    source: "journey_resolution",
  });
  deps.repository.updateCapsuleCurrentState(journey.capsuleId, {
    visibleMarks: resolved.currentState.visibleMarks,
    durability: resolved.currentState.durability,
    mood: resolved.currentState.mood,
  });
  deps.repository.markJourneyReturned(journey.id, memoryEventId);
}

function parseRequest<T extends z.ZodTypeAny>(schema: T, input: unknown): z.infer<T> {
  return schema.parse(input);
}

function deriveCoarseRegionId(location: { latitude: number; longitude: number }): string {
  const latitudeBucket = Math.floor((location.latitude + 90) * 2);
  const longitudeBucket = Math.floor((location.longitude + 180) * 2);
  return `coarse-${latitudeBucket}-${longitudeBucket}`;
}

function launchWindowSnapshot(coarseRegionId: string, launchTimeUtc: string): WorldSnapshot {
  return {
    timeWindowUtc: launchTimeUtc,
    signals: signalForCoarseRegion(coarseRegionId),
  };
}

function signalForCoarseRegion(coarseRegionId: string): string[] {
  const bucket = Number(coarseRegionId.split("-").at(-1) ?? 0);
  return bucket % 2 === 0 ? ["clear_sky"] : ["wind_light"];
}

function launchWindowResponse(coarseRegionId: string, snapshot: WorldSnapshot | undefined) {
  return {
    coarse_region_id: coarseRegionId,
    time_window_utc: snapshot?.timeWindowUtc ?? "",
    summary: `A quiet launch window is open in ${coarseRegionId}.`,
  };
}

function returnEstimateUtc(journey: JourneyRecord): string {
  return new Date(
    Date.parse(journey.launchTimeUtc) + journey.durationHours * 60 * 60 * 1_000,
  ).toISOString();
}

function routeMoodFor(status: ReturnType<typeof resolveJourney>["status"]): string {
  switch (status) {
    case "travelling":
      return "setting_out";
    case "decision_point":
      return "changeable";
    case "nearing_return":
      return "almost_home";
    case "returned":
      return "home";
  }
}

function capsuleSnapshot(capsule: ApiCapsuleRecord): CapsuleSnapshot {
  return {
    id: capsule.id,
    name: capsule.name,
    shell: capsule.shell,
    core: capsule.core,
    ...(capsule.cargo === undefined ? {} : { cargo: capsule.cargo }),
    visibleMarks: [...capsule.currentState.visibleMarks],
    durability: capsule.currentState.durability,
    mood: { ...capsule.currentState.mood },
  };
}

function capsuleResponse(capsule: ApiCapsuleRecord) {
  return {
    id: capsule.id,
    name: capsule.name,
    shell: capsule.shell,
    core: capsule.core,
    ...(capsule.cargo === undefined ? {} : { cargo: capsule.cargo }),
    intent_default: capsule.intentDefault,
    current_state: cloneCurrentState(capsule.currentState),
    status: capsule.status,
    created_at_utc: capsule.createdAtUtc,
  };
}

function journeyResponse(journey: JourneyRecord) {
  return {
    id: journey.id,
    capsule_id: journey.capsuleId,
    intent: journey.intent,
    launch_time_utc: journey.launchTimeUtc,
    duration_hours: journey.durationHours,
    coarse_region_id: journey.coarseRegionId,
    seed_hash: journey.seedHash,
    secret_version: journey.secretVersion,
    journey_nonce: journey.journeyNonce,
    status: journey.status,
  };
}

function requireJourney(journeys: Map<string, JourneyRecord>, journeyId: string): JourneyRecord {
  const journey = journeys.get(journeyId);
  if (journey === undefined) {
    throw new Error(`Journey ${journeyId} not found.`);
  }
  return journey;
}

function cloneCapsule(capsule: ApiCapsuleRecord): ApiCapsuleRecord {
  return {
    ...capsule,
    currentState: cloneCurrentState(capsule.currentState),
  };
}

function cloneCurrentState(state: ApiCapsuleRecord["currentState"]) {
  return {
    visibleMarks: [...state.visibleMarks],
    durability: state.durability,
    mood: { ...state.mood },
  };
}

function cloneJourney(journey: JourneyRecord): JourneyRecord {
  return {
    ...journey,
    capsuleSnapshotAtLaunch: {
      ...journey.capsuleSnapshotAtLaunch,
      visibleMarks: [...journey.capsuleSnapshotAtLaunch.visibleMarks],
      mood: { ...journey.capsuleSnapshotAtLaunch.mood },
    },
    worldSnapshots: journey.worldSnapshots.map((snapshot) => ({
      ...snapshot,
      signals: [...snapshot.signals],
    })),
    influenceEvents: journey.influenceEvents.map((event) => ({ ...event })),
  };
}

function cloneMemoryEvent(memoryEvent: JourneyMemoryEventRecord): JourneyMemoryEventRecord {
  return {
    ...memoryEvent,
    payload: { ...memoryEvent.payload },
    causes: [...memoryEvent.causes],
  };
}
