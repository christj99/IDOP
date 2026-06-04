import { createJourneySeed, resolveJourney } from "@idop/engine";
import { afterEach, describe, expect, it } from "vitest";

import { buildServer } from "../index.js";
import {
  createInMemoryJourneyLock,
  createInMemoryJourneyRepository,
  type JourneyRecord,
} from "./journey-api.js";

const serverTime = "2026-06-04T12:00:00.000Z";
const completedTime = "2026-06-04T18:00:00.000Z";
const serverSecret = "m3-test-secret";

interface ApiCapsule {
  id: string;
  name: string;
  shell: string;
  core: string;
  cargo?: string;
  intent_default: string;
  current_state: {
    visibleMarks: string[];
    durability: number;
    mood: Record<string, number>;
  };
}

interface ApiJourney {
  id: string;
  capsule_id: string;
  intent: "wander" | "scout" | "deliver";
  launch_time_utc: string;
  duration_hours: number;
  coarse_region_id: string;
  seed_hash: string;
  secret_version: string;
  journey_nonce: string;
  status: "travelling" | "returned";
}

interface JourneyLaunchResponse {
  journey: ApiJourney;
  launch_window: {
    coarse_region_id: string;
    time_window_utc: string;
    summary: string;
  };
}

interface JourneyReadResponse {
  journey: ApiJourney;
  resolution: ReturnType<typeof resolveJourney>;
  return_estimate_utc: string;
}

function createHarness(options: Parameters<typeof buildServer>[0] = {}) {
  const repository = createInMemoryJourneyRepository();
  const lock = createInMemoryJourneyLock();
  const ids = new Map<string, number>();
  let nowUtc = serverTime;
  const server = buildServer({
    logger: false,
    journeyApi: {
      repository,
      lock,
      nowUtc: () => nowUtc,
      newId: (prefix) => {
        const next = (ids.get(prefix) ?? 0) + 1;
        ids.set(prefix, next);
        return `${prefix}-${next}`;
      },
      newNonce: () => "nonce-fixed",
      secrets: {
        currentVersion: "v1",
        getSecret: (version) => (version === "v1" ? serverSecret : undefined),
      },
    },
    ...options,
  });

  return {
    repository,
    setNowUtc: (value: string) => {
      nowUtc = value;
    },
    server,
  };
}

async function createCapsule(server: ReturnType<typeof buildServer>): Promise<ApiCapsule> {
  const response = await server.inject({
    method: "POST",
    url: "/capsules",
    payload: {
      name: "Moss Baby",
      shell: "paper",
      core: "shy",
      cargo: "charm",
      intent_default: "wander",
    },
  });

  expect(response.statusCode).toBe(201);
  return json<{ capsule: ApiCapsule }>(response).capsule;
}

async function launchJourney(
  server: ReturnType<typeof buildServer>,
  capsuleId: string,
  clientNow = "1999-01-01T00:00:00.000Z",
): Promise<JourneyLaunchResponse> {
  const response = await server.inject({
    method: "POST",
    url: "/journeys",
    payload: {
      capsule_id: capsuleId,
      intent: "wander",
      client_now: clientNow,
      precise_location: {
        latitude: 47.620548,
        longitude: -122.349174,
      },
    },
  });

  expect(response.statusCode).toBe(201);
  return json<JourneyLaunchResponse>(response);
}

function json<T>(response: { payload: string }): T {
  return JSON.parse(response.payload) as T;
}

describe("M3 Journey API", () => {
  const servers: Array<ReturnType<typeof buildServer>> = [];

  afterEach(async () => {
    await Promise.all(servers.splice(0).map((server) => server.close()));
  });

  it("creates and reads capsules for the dev user", async () => {
    const { server } = createHarness();
    servers.push(server);

    const capsule = await createCapsule(server);
    const response = await server.inject({
      method: "GET",
      url: `/capsules/${capsule.id}`,
    });

    expect(response.statusCode).toBe(200);
    expect(json<{ capsule: ApiCapsule }>(response).capsule).toEqual(capsule);
  });

  it("launches with precise location only transiently and persists only coarse region plus seed metadata", async () => {
    const { repository, server } = createHarness();
    servers.push(server);
    const capsule = await createCapsule(server);

    const launch = await launchJourney(server, capsule.id);
    const stored = repository.getJourney(launch.journey.id);
    const persistedJson = JSON.stringify(repository.dumpState());
    const responseJson = JSON.stringify(launch);

    expect(stored?.coarseRegionId).toBe(launch.journey.coarse_region_id);
    expect(stored?.seedHash).toMatch(/^[a-f0-9]{64}$/);
    expect(stored?.secretVersion).toBe("v1");
    expect(stored?.journeyNonce).toBe("nonce-fixed");
    expect(persistedJson).not.toMatch(
      /47\.620548|-122\.349174|latitude|longitude|lat|lng|precise_location|journeySeed|m3-test-secret/,
    );
    expect(responseJson).not.toMatch(
      /47\.620548|-122\.349174|latitude|longitude|lat|lng|precise_location|journeySeed|m3-test-secret/,
    );
  });

  it("does not write precise launch coordinates into request logs", async () => {
    const logLines: string[] = [];
    const { server } = createHarness({
      logger: {
        level: "info",
        stream: {
          write: (line: string) => {
            logLines.push(line);
          },
        },
      },
    });
    servers.push(server);
    const capsule = await createCapsule(server);

    await launchJourney(server, capsule.id);

    expect(logLines.join("\n")).not.toMatch(
      /47\.620548|-122\.349174|latitude|longitude|lat|lng|precise_location/,
    );
  });

  it("uses server time rather than spoofed client time for launch timing and seed material", async () => {
    const { server } = createHarness();
    servers.push(server);
    const capsule = await createCapsule(server);

    const first = await launchJourney(server, capsule.id, "1980-01-01T00:00:00.000Z");
    const second = await launchJourney(server, capsule.id, "2099-01-01T00:00:00.000Z");

    expect(first.journey.launch_time_utc).toBe(serverTime);
    expect(second.journey.launch_time_utc).toBe(serverTime);
    expect(second.journey.seed_hash).toBe(first.journey.seed_hash);
    expect(second.journey.coarse_region_id).toBe(first.journey.coarse_region_id);
  });

  it("commits completed journey memory exactly once for concurrent resolve-on-read requests", async () => {
    const { repository, server, setNowUtc } = createHarness();
    servers.push(server);
    const capsule = await createCapsule(server);
    const launch = await launchJourney(server, capsule.id);
    setNowUtc(completedTime);

    const [first, second] = await Promise.all([
      server.inject({ method: "GET", url: `/journeys/${launch.journey.id}` }),
      server.inject({ method: "GET", url: `/journeys/${launch.journey.id}` }),
    ]);

    expect(first.statusCode).toBe(200);
    expect(second.statusCode).toBe(200);
    expect(json<JourneyReadResponse>(first).resolution.status).toBe("returned");
    expect(json<JourneyReadResponse>(second).resolution.status).toBe("returned");
    expect(repository.listMemoryEventsForJourney(launch.journey.id)).toHaveLength(1);
  });

  it("enforces one influence per type per journey", async () => {
    const { server } = createHarness();
    servers.push(server);
    const capsule = await createCapsule(server);
    const launch = await launchJourney(server, capsule.id);

    const firstBoost = await server.inject({
      method: "POST",
      url: `/journeys/${launch.journey.id}/influence`,
      payload: { type: "boost" },
    });
    const secondBoost = await server.inject({
      method: "POST",
      url: `/journeys/${launch.journey.id}/influence`,
      payload: { type: "boost" },
    });
    const shelter = await server.inject({
      method: "POST",
      url: `/journeys/${launch.journey.id}/influence`,
      payload: { type: "shelter" },
    });

    expect(firstBoost.statusCode).toBe(201);
    expect(secondBoost.statusCode).toBe(429);
    expect(shelter.statusCode).toBe(201);
  });

  it("returns the same completed outcome as the pure engine for the stored journey inputs", async () => {
    const { repository, server, setNowUtc } = createHarness();
    servers.push(server);
    const capsule = await createCapsule(server);
    const launch = await launchJourney(server, capsule.id);
    setNowUtc(completedTime);

    const response = await server.inject({
      method: "GET",
      url: `/journeys/${launch.journey.id}`,
    });

    expect(response.statusCode).toBe(200);
    const stored = repository.getJourney(launch.journey.id) as JourneyRecord;
    const { journeySeed } = createJourneySeed({
      capsuleId: stored.capsuleId,
      launchTimeUtc: stored.launchTimeUtc,
      coarseRegionId: stored.coarseRegionId,
      intentId: stored.intent,
      journeyNonce: stored.journeyNonce,
      secretVersion: stored.secretVersion,
      serverSecret,
    });
    const expected = resolveJourney(
      {
        journeySeed,
        launchTimeUtc: stored.launchTimeUtc,
        durationHours: stored.durationHours,
        intent: stored.intent,
        capsuleSnapshot: stored.capsuleSnapshotAtLaunch,
        worldSnapshots: stored.worldSnapshots,
        influenceEvents: stored.influenceEvents,
      },
      completedTime,
    );

    expect(json<JourneyReadResponse>(response).resolution).toEqual(expected);
  });
});
