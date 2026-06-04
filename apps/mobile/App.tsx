import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { type ApiCapsule, type JourneyReadResult, createHttpJourneyApiClient } from "./src/api.ts";
import {
  BuildWorkshopScreen,
  HomeHearthScreen,
  JourneyAwayScreen,
  LaunchScreen,
  ReturnScreen,
  canLaunchDraft,
  createRiskPreview,
  type BuildDraft,
} from "./src/core-loop.tsx";

type FlowStep = "home" | "build" | "launch" | "away" | "return";

const defaultApiBaseUrl = "http://localhost:3000";
const defaultLaunchWindowRead = "deterministic baseline - good drifting";
const defaultPreciseLocation = { latitude: 0, longitude: 0 };

export default function App() {
  const apiClient = useMemo(() => createHttpJourneyApiClient({ baseUrl: defaultApiBaseUrl }), []);
  const [step, setStep] = useState<FlowStep>("home");
  const [draft, setDraft] = useState<BuildDraft>({
    shell: "paper",
    core: "curious",
    cargo: "seed",
    intent: "wander",
  });
  const [capsule, setCapsule] = useState<ApiCapsule | undefined>();
  const [journeyRead, setJourneyRead] = useState<JourneyReadResult | undefined>();
  const [launchWindowRead, setLaunchWindowRead] = useState(defaultLaunchWindowRead);
  const [isWorking, setIsWorking] = useState(false);
  const [message, setMessage] = useState<string | undefined>();
  const capsuleName = capsule?.name ?? draft.name?.trim() ?? "Capsule";
  const returnMomentLabel = journeyRead?.returnEstimateUtc
    ? realMomentLabel(journeyRead.returnEstimateUtc)
    : "back by golden hour";

  async function confirmLaunch() {
    if (!canLaunchDraft(draft) || isWorking) {
      return;
    }

    setIsWorking(true);
    setMessage(undefined);

    try {
      const createdCapsule = await apiClient.createCapsule(draft);
      const launched = await apiClient.launchJourney({
        capsuleId: createdCapsule.id,
        intent: draft.intent ?? createdCapsule.intentDefault,
        preciseLocation: defaultPreciseLocation,
      });
      const read = await apiClient.getJourney(launched.journey.id);

      setCapsule(createdCapsule);
      setLaunchWindowRead(launched.launchWindowRead);
      setJourneyRead(read);
      setStep(read.completedReturn === undefined ? "away" : "return");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The launch could not reach the server.");
    } finally {
      setIsWorking(false);
    }
  }

  async function refreshJourney() {
    if (journeyRead === undefined || isWorking) {
      return;
    }

    setIsWorking(true);
    setMessage(undefined);

    try {
      const read = await apiClient.getJourney(journeyRead.journey.id);
      setJourneyRead(read);
      setStep(read.completedReturn === undefined ? "away" : "return");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The journey could not be read.");
    } finally {
      setIsWorking(false);
    }
  }

  async function sendInfluence(type: "boost" | "shelter") {
    if (journeyRead === undefined || isWorking) {
      return;
    }

    setIsWorking(true);
    setMessage(undefined);

    try {
      await apiClient.sendInfluence(journeyRead.journey.id, type);
      const read = await apiClient.getJourney(journeyRead.journey.id);
      setJourneyRead(read);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "The influence did not reach the server.",
      );
    } finally {
      setIsWorking(false);
    }
  }

  const screen = (() => {
    if (step === "build") {
      return (
        <BuildWorkshopScreen
          draft={draft}
          onLaunchPress={() => setStep("launch")}
          onNameChange={(name) => setDraft((current) => ({ ...current, name }))}
          onSelectCargo={(cargo) => setDraft((current) => ({ ...current, cargo }))}
          onSelectCore={(core) => setDraft((current) => ({ ...current, core }))}
          onSelectIntent={(intent) => setDraft((current) => ({ ...current, intent }))}
          onSelectShell={(shell) => setDraft((current) => ({ ...current, shell }))}
        />
      );
    }

    if (step === "launch") {
      return (
        <LaunchScreen
          capsuleName={capsuleName}
          conditionsRead={launchWindowRead}
          returnMomentLabel={returnMomentLabel}
          riskRead={createRiskPreview(draft)}
          state={isWorking ? "launched" : "confirming"}
          onCancelPress={() => setStep("build")}
          onConfirmPress={confirmLaunch}
        />
      );
    }

    if (step === "away" && journeyRead !== undefined) {
      return (
        <JourneyAwayScreen
          availableInfluenceActions={journeyRead.availableInfluenceActions}
          capsuleName={capsuleName}
          dispatches={journeyRead.dispatches}
          returnMomentLabel={returnMomentLabel}
          routeMood={journeyRead.routeMood}
          state={journeyRead.resolutionStatus}
          onInfluencePress={sendInfluence}
          onOpenReturnPress={refreshJourney}
        />
      );
    }

    if (step === "return" && journeyRead?.completedReturn !== undefined) {
      return (
        <ReturnScreen
          capsuleName={capsuleName}
          hearthReaction="The Hearth hums once, then settles the new memory into its glow."
          myth={journeyRead.completedReturn.myth}
          stamps={journeyRead.completedReturn.stamps}
          state="revealed"
          visibleChanges={journeyRead.completedReturn.visibleChanges}
          onRelaunchPress={() => {
            setJourneyRead(undefined);
            setStep("build");
          }}
        />
      );
    }

    return (
      <HomeHearthScreen
        journey={
          journeyRead === undefined
            ? undefined
            : {
                capsuleName,
                returnMomentLabel,
                statusLabel:
                  journeyRead.completedReturn === undefined ? "travelling" : "ready to open",
              }
        }
        launchWindowRead={launchWindowRead}
        state={
          journeyRead === undefined
            ? "empty"
            : journeyRead.completedReturn === undefined
              ? "active_journey"
              : "ready_return"
        }
        tendState="available"
        onBuildPress={() => setStep("build")}
        onOpenReturnPress={() => setStep("return")}
      />
    );
  })();

  return (
    <View style={styles.container}>
      {screen}
      {message !== undefined ? (
        <View style={styles.messageBar} testID="app-message">
          <Text style={styles.messageText}>{message}</Text>
        </View>
      ) : null}
      <StatusBar style="auto" />
    </View>
  );
}

function realMomentLabel(isoTimestamp: string): string {
  return `back around ${new Date(isoTimestamp).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  })}`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messageBar: {
    backgroundColor: "#a34d2f",
    bottom: 0,
    left: 0,
    padding: 12,
    position: "absolute",
    right: 0,
  },
  messageText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
});
