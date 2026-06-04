import { describe, expect, it } from "vitest";

import { createHttpJourneyApiClient } from "./api.ts";

describe("M4 mobile API client", () => {
  it("uses the M3 capsule, journey, read, and influence route shapes", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const fetcher = async (url: string, init?: RequestInit) => {
      calls.push({ url, init });

      return {
        ok: true,
        status: 200,
        json: async () => responseFor(url),
      };
    };
    const client = createHttpJourneyApiClient({
      baseUrl: "https://api.example.test",
      fetcher,
    });

    await client.createCapsule({
      name: "Mica",
      shell: "paper",
      core: "curious",
      cargo: "seed",
      intent: "wander",
    });
    await client.launchJourney({
      capsuleId: "capsule-1",
      intent: "wander",
      preciseLocation: { latitude: 47.6205, longitude: -122.3491 },
    });
    await client.getJourney("journey-1");
    await client.sendInfluence("journey-1", "boost");

    expect(calls.map((call) => `${call.init?.method ?? "GET"} ${call.url}`)).toEqual([
      "POST https://api.example.test/capsules",
      "POST https://api.example.test/journeys",
      "GET https://api.example.test/journeys/journey-1",
      "POST https://api.example.test/journeys/journey-1/influence",
    ]);
    expect(JSON.parse(String(calls[0]?.init?.body))).toEqual({
      name: "Mica",
      shell: "paper",
      core: "curious",
      cargo: "seed",
      intent_default: "wander",
    });
    expect(JSON.parse(String(calls[1]?.init?.body))).toEqual({
      capsule_id: "capsule-1",
      intent: "wander",
      precise_location: { latitude: 47.6205, longitude: -122.3491 },
    });
    expect(JSON.parse(String(calls[3]?.init?.body))).toEqual({ type: "boost" });
  });
});

function responseFor(url: string): unknown {
  if (url.endsWith("/capsules")) {
    return {
      capsule: {
        id: "capsule-1",
        name: "Mica",
        shell: "paper",
        core: "curious",
        cargo: "seed",
        intent_default: "wander",
        current_state: { visibleMarks: [], durability: 80, mood: {} },
        status: "home",
        created_at_utc: "2026-06-04T12:00:00.000Z",
      },
    };
  }

  if (url.endsWith("/journeys")) {
    return {
      journey: {
        id: "journey-1",
        capsule_id: "capsule-1",
        intent: "wander",
        launch_time_utc: "2026-06-04T12:00:00.000Z",
        duration_hours: 6,
        coarse_region_id: "coarse-275-115",
        seed_hash: "seed-hash",
        secret_version: "dev-v1",
        journey_nonce: "nonce",
        status: "travelling",
      },
      launch_window: {
        coarse_region_id: "coarse-275-115",
        time_window_utc: "2026-06-04T12:00:00.000Z",
        summary: "A quiet launch window is open.",
      },
    };
  }

  if (url.endsWith("/influence")) {
    return {
      influence_event: {
        id: "influence-1",
        type: "boost",
        createdAtUtc: "2026-06-04T13:00:00.000Z",
      },
      journey: { id: "journey-1", status: "travelling" },
    };
  }

  return {
    journey: { id: "journey-1", status: "travelling" },
    resolution: {
      status: "travelling",
      dispatches: ["Mica drifted quietly."],
      availableInfluenceActions: ["boost", "shelter"],
    },
    route_mood: "setting_out",
    dispatches_so_far: ["Mica drifted quietly."],
    available_influence_actions: ["boost", "shelter"],
    return_estimate_utc: "2026-06-04T18:00:00.000Z",
  };
}
