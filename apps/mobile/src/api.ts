import type { Cargo, Core, InfluenceType, Intent, Shell } from "@idop/engine";

import type { BuildDraft, JourneyScreenState, VisibleChangeSummary } from "./core-loop.tsx";

export interface ApiCapsule {
  id: string;
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
  status: string;
}

export interface ApiJourney {
  id: string;
  capsuleId: string;
  intent: Intent;
  launchTimeUtc: string;
  durationHours: number;
  status: "travelling" | "returned";
}

export interface LaunchResult {
  journey: ApiJourney;
  launchWindowRead: string;
}

export interface JourneyReadResult {
  journey: ApiJourney;
  resolutionStatus: JourneyScreenState;
  routeMood: string;
  dispatches: string[];
  availableInfluenceActions: InfluenceType[];
  returnEstimateUtc: string;
  completedReturn?: {
    visibleChanges: VisibleChangeSummary[];
    stamps: string[];
    myth: string;
    causes: string[];
  };
}

export interface JourneyApiClient {
  createCapsule(draft: BuildDraft): Promise<ApiCapsule>;
  launchJourney(input: LaunchJourneyInput): Promise<LaunchResult>;
  getJourney(journeyId: string): Promise<JourneyReadResult>;
  sendInfluence(journeyId: string, type: InfluenceType): Promise<void>;
}

export interface LaunchJourneyInput {
  capsuleId: string;
  intent: Intent;
  preciseLocation: {
    latitude: number;
    longitude: number;
  };
}

export type JourneyApiFetch = (
  url: string,
  init?: RequestInit,
) => Promise<{
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
}>;

export function createHttpJourneyApiClient({
  baseUrl,
  fetcher = fetch,
}: {
  baseUrl: string;
  fetcher?: JourneyApiFetch;
}): JourneyApiClient {
  const apiRoot = baseUrl.replace(/\/$/, "");

  return {
    async createCapsule(draft) {
      const response = await request<CreateCapsuleResponse>(fetcher, `${apiRoot}/capsules`, {
        method: "POST",
        body: JSON.stringify({
          name: draft.name?.trim() ?? "",
          shell: draft.shell,
          core: draft.core,
          ...(draft.cargo === undefined ? {} : { cargo: draft.cargo }),
          intent_default: draft.intent ?? "wander",
        }),
      });

      return capsuleFromResponse(response.capsule);
    },
    async launchJourney(input) {
      const response = await request<LaunchJourneyResponse>(fetcher, `${apiRoot}/journeys`, {
        method: "POST",
        body: JSON.stringify({
          capsule_id: input.capsuleId,
          intent: input.intent,
          precise_location: input.preciseLocation,
        }),
      });

      return {
        journey: journeyFromResponse(response.journey),
        launchWindowRead: response.launch_window.summary,
      };
    },
    async getJourney(journeyId) {
      const response = await request<GetJourneyResponse>(
        fetcher,
        `${apiRoot}/journeys/${encodeURIComponent(journeyId)}`,
      );

      return {
        journey: journeyFromResponse(response.journey),
        resolutionStatus: journeyStateFromResolution(response.resolution.status),
        routeMood: response.route_mood,
        dispatches: response.dispatches_so_far,
        availableInfluenceActions: response.available_influence_actions,
        returnEstimateUtc: response.return_estimate_utc,
        ...(response.completed_return === undefined
          ? {}
          : { completedReturn: completionFromResponse(response.completed_return) }),
      };
    },
    async sendInfluence(journeyId, type) {
      await request<unknown>(
        fetcher,
        `${apiRoot}/journeys/${encodeURIComponent(journeyId)}/influence`,
        {
          method: "POST",
          body: JSON.stringify({ type }),
        },
      );
    },
  };
}

async function request<T>(
  fetcher: JourneyApiFetch,
  url: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetcher(url, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Idop API request failed with status ${response.status}.`);
  }

  return (await response.json()) as T;
}

function capsuleFromResponse(capsule: ApiCapsuleResponse): ApiCapsule {
  return {
    id: capsule.id,
    name: capsule.name,
    shell: capsule.shell,
    core: capsule.core,
    ...(capsule.cargo === undefined ? {} : { cargo: capsule.cargo }),
    intentDefault: capsule.intent_default,
    currentState: {
      visibleMarks: [...capsule.current_state.visibleMarks],
      durability: capsule.current_state.durability,
      mood: { ...capsule.current_state.mood },
    },
    status: capsule.status,
  };
}

function journeyFromResponse(journey: ApiJourneyResponse): ApiJourney {
  return {
    id: journey.id,
    capsuleId: journey.capsule_id,
    intent: journey.intent,
    launchTimeUtc: journey.launch_time_utc,
    durationHours: journey.duration_hours,
    status: journey.status,
  };
}

function completionFromResponse(completion: ApiCompletionResponse) {
  return {
    visibleChanges: completion.visibleChanges.map((change) => ({
      id: change.id,
      label: change.label,
      causeLabel: change.causes.slice(0, 3).join(", "),
    })),
    stamps: completion.stamps.map((stamp) => stamp.label),
    myth: completion.myth,
    causes: completion.causes,
  };
}

function journeyStateFromResolution(status: ApiResolutionStatus): JourneyScreenState {
  switch (status) {
    case "travelling":
      return "travelling";
    case "decision_point":
      return "decision_point";
    case "nearing_return":
      return "nearing_return";
    case "returned":
      return "ready_to_open";
  }
}

interface CreateCapsuleResponse {
  capsule: ApiCapsuleResponse;
}

interface LaunchJourneyResponse {
  journey: ApiJourneyResponse;
  launch_window: {
    summary: string;
  };
}

interface GetJourneyResponse {
  journey: ApiJourneyResponse;
  resolution: {
    status: ApiResolutionStatus;
  };
  route_mood: string;
  dispatches_so_far: string[];
  available_influence_actions: InfluenceType[];
  return_estimate_utc: string;
  completed_return?: ApiCompletionResponse;
}

type ApiResolutionStatus = "travelling" | "decision_point" | "nearing_return" | "returned";

interface ApiCapsuleResponse {
  id: string;
  name: string;
  shell: Shell;
  core: Core;
  cargo?: Cargo;
  intent_default: Intent;
  current_state: {
    visibleMarks: string[];
    durability: number;
    mood: Record<string, number>;
  };
  status: string;
}

interface ApiJourneyResponse {
  id: string;
  capsule_id: string;
  intent: Intent;
  launch_time_utc: string;
  duration_hours: number;
  status: "travelling" | "returned";
}

interface ApiCompletionResponse {
  visibleChanges: Array<{
    id: string;
    label: string;
    causes: string[];
  }>;
  stamps: Array<{
    label: string;
  }>;
  myth: string;
  causes: string[];
}
