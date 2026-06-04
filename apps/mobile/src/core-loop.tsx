import type { Cargo, Core, InfluenceType, Intent, Shell } from "@idop/engine";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

export type HomeHearthState = "empty" | "active_journey" | "ready_return";
export type TendState = "available" | "done";
export type BuildScreenState = "empty" | "partial" | "ready";
export type LaunchScreenState = "confirming" | "launched";
export type JourneyScreenState =
  | "travelling"
  | "decision_point"
  | "nearing_return"
  | "ready_to_open";
export type ReturnScreenState = "revealing" | "revealed";

export interface ActiveJourneySummary {
  capsuleName: string;
  statusLabel: string;
  returnMomentLabel: string;
}

export interface BuildDraft {
  name?: string;
  shell?: Shell;
  core?: Core;
  cargo?: Cargo;
  intent?: Intent;
}

export interface VisibleChangeSummary {
  id: string;
  label: string;
  causeLabel: string;
}

export interface HomeHearthScreenProps {
  state: HomeHearthState;
  tendState: TendState;
  launchWindowRead: string;
  journey?: ActiveJourneySummary;
  onBuildPress?: () => void;
  onOpenReturnPress?: () => void;
  onTendPress?: () => void;
}

export interface BuildWorkshopScreenProps {
  draft: BuildDraft;
  onNameChange?: (name: string) => void;
  onSelectShell?: (shell: Shell) => void;
  onSelectCore?: (core: Core) => void;
  onSelectCargo?: (cargo: Cargo) => void;
  onSelectIntent?: (intent: Intent) => void;
  onLaunchPress?: () => void;
}

export interface LaunchScreenProps {
  state: LaunchScreenState;
  capsuleName: string;
  conditionsRead: string;
  riskRead: string;
  returnMomentLabel: string;
  onCancelPress?: () => void;
  onConfirmPress?: () => void;
}

export interface JourneyAwayScreenProps {
  state: JourneyScreenState;
  capsuleName: string;
  routeMood: string;
  dispatches: string[];
  availableInfluenceActions: InfluenceType[];
  returnMomentLabel: string;
  onInfluencePress?: (type: InfluenceType) => void;
  onOpenReturnPress?: () => void;
}

export interface ReturnScreenProps {
  state: ReturnScreenState;
  capsuleName: string;
  visibleChanges: VisibleChangeSummary[];
  myth: string;
  stamps: string[];
  hearthReaction: string;
  onRelaunchPress?: () => void;
}

const shellOptions: Shell[] = ["paper", "glass", "cloth", "moss", "tin"];
const coreOptions: Core[] = ["shy", "brave", "curious", "sleepy", "stubborn"];
const cargoOptions: Cargo[] = ["charm", "note_wish", "seed", "empty_pocket"];
const intentOptions: Intent[] = ["wander", "scout", "deliver"];

export function HomeHearthScreen({
  state,
  tendState,
  launchWindowRead,
  journey,
  onBuildPress,
  onOpenReturnPress,
  onTendPress,
}: HomeHearthScreenProps) {
  return (
    <Screen testID="home-screen">
      <View style={styles.hearthHalo} testID="home-hearth-visual">
        <View style={styles.hearthCore} />
      </View>
      <Text style={styles.eyebrow}>Hearth</Text>
      <Text style={styles.title}>A warm place to return to.</Text>
      <Text style={styles.readLine} testID="home-launch-window-read">
        {launchWindowRead}
      </Text>

      {state === "empty" ? (
        <View style={styles.panel} testID="home-state-empty">
          <Text style={styles.panelTitle}>No Capsule is away.</Text>
          <Text style={styles.bodyText}>Build one small thing and send it into the window.</Text>
          <ActionButton label="Build a Capsule" onPress={onBuildPress} testID="home-build-button" />
        </View>
      ) : null}

      {state === "active_journey" && journey !== undefined ? (
        <View style={styles.panel} testID="home-state-active">
          <Text style={styles.panelTitle}>{journey.capsuleName} is away.</Text>
          <Text style={styles.bodyText}>{journey.statusLabel}</Text>
          <Text style={styles.momentText}>{journey.returnMomentLabel}</Text>
        </View>
      ) : null}

      {state === "ready_return" && journey !== undefined ? (
        <View style={[styles.panel, styles.primaryPanel]} testID="home-state-ready-return">
          <Text style={styles.panelTitle}>{journey.capsuleName} is back.</Text>
          <Text style={styles.bodyText}>The return is waiting to be opened.</Text>
          <ActionButton
            label="Open the return"
            onPress={onOpenReturnPress}
            testID="home-open-return-button"
          />
        </View>
      ) : null}

      <Pressable
        accessibilityRole="button"
        disabled={tendState === "done"}
        onPress={onTendPress}
        style={[styles.secondaryButton, tendState === "done" ? styles.disabledButton : undefined]}
        testID={tendState === "available" ? "home-tend-available" : "home-tend-done"}
      >
        <Text style={styles.secondaryButtonText}>
          {tendState === "available" ? "Tend the Hearth" : "Hearth tended today"}
        </Text>
      </Pressable>
    </Screen>
  );
}

export function BuildWorkshopScreen({
  draft,
  onNameChange,
  onSelectShell,
  onSelectCore,
  onSelectCargo,
  onSelectIntent,
  onLaunchPress,
}: BuildWorkshopScreenProps) {
  const state = buildStateFor(draft);
  const launchReady = canLaunchDraft(draft);

  return (
    <Screen testID="build-screen">
      <Text style={styles.eyebrow}>Workshop</Text>
      <Text style={styles.title}>Make the Capsule specific.</Text>
      <Text style={styles.bodyText}>
        Four small choices shape the route. The server will decide what happens after launch.
      </Text>

      <View style={styles.panel} testID={`build-state-${state}`}>
        <Text style={styles.panelTitle}>Name</Text>
        <TextInput
          onChangeText={onNameChange}
          placeholder="Capsule name"
          style={styles.input}
          testID="build-name-input"
          value={draft.name ?? ""}
        />
      </View>

      <ChoiceRow
        label="Shell"
        options={shellOptions}
        selected={draft.shell}
        testIDPrefix="build-shell"
        onSelect={onSelectShell}
      />
      <ChoiceRow
        label="Core"
        options={coreOptions}
        selected={draft.core}
        testIDPrefix="build-core"
        onSelect={onSelectCore}
      />
      <ChoiceRow
        label="Cargo"
        options={cargoOptions}
        selected={draft.cargo}
        testIDPrefix="build-cargo"
        onSelect={onSelectCargo}
      />
      <ChoiceRow
        label="Intent"
        options={intentOptions}
        selected={draft.intent}
        testIDPrefix="build-intent"
        onSelect={onSelectIntent}
      />

      <View style={styles.previewPanel} testID="build-risk-preview">
        <Text style={styles.previewLabel}>Risk read</Text>
        <Text style={styles.previewText}>{createRiskPreview(draft)}</Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: !launchReady }}
        disabled={!launchReady}
        onPress={launchReady ? onLaunchPress : undefined}
        style={[styles.primaryButton, !launchReady ? styles.disabledButton : undefined]}
        testID="build-launch-button"
      >
        <Text style={styles.primaryButtonText}>Continue to launch</Text>
      </Pressable>
    </Screen>
  );
}

export function LaunchScreen({
  state,
  capsuleName,
  conditionsRead,
  riskRead,
  returnMomentLabel,
  onCancelPress,
  onConfirmPress,
}: LaunchScreenProps) {
  return (
    <Screen testID="launch-screen">
      <View style={styles.launchRing} testID="launch-capsule-visual">
        <CapsuleFigure shell="paper" marks={[]} />
      </View>
      <Text style={styles.eyebrow}>Launch</Text>
      <Text style={styles.title}>{capsuleName} is at the threshold.</Text>
      <View style={styles.panel} testID={`launch-state-${state}`}>
        <Text style={styles.panelTitle}>
          {state === "confirming" ? "Confirm the send-off" : "Launched"}
        </Text>
        <Text style={styles.bodyText}>{conditionsRead}</Text>
        <Text style={styles.readLine}>{riskRead}</Text>
        <Text style={styles.momentText} testID="launch-return-moment">
          {returnMomentLabel}
        </Text>
      </View>
      {state === "confirming" ? (
        <View style={styles.actionRow}>
          <ActionButton label="Back" onPress={onCancelPress} testID="launch-cancel-button" />
          <ActionButton label="Send" onPress={onConfirmPress} testID="launch-confirm-button" />
        </View>
      ) : null}
    </Screen>
  );
}

export function JourneyAwayScreen({
  state,
  capsuleName,
  routeMood,
  dispatches,
  availableInfluenceActions,
  returnMomentLabel,
  onInfluencePress,
  onOpenReturnPress,
}: JourneyAwayScreenProps) {
  return (
    <Screen testID="journey-screen">
      <Text style={styles.eyebrow}>Away</Text>
      <Text style={styles.title}>
        {capsuleName} is moving through {routeMood} air.
      </Text>
      <View style={styles.panel} testID={`journey-state-${state.replaceAll("_", "-")}`}>
        <Text style={styles.panelTitle}>{journeyStateLabel(state)}</Text>
        <Text style={styles.momentText} testID="journey-return-moment">
          {returnMomentLabel}
        </Text>
      </View>

      <View style={styles.panel} testID="journey-dispatch-feed">
        <Text style={styles.panelTitle}>Dispatches</Text>
        {(dispatches.length > 0 ? dispatches : [`${capsuleName} has just left the Hearth.`]).map(
          (dispatch) => (
            <Text key={dispatch} style={styles.bodyText}>
              {dispatch}
            </Text>
          ),
        )}
      </View>

      {state === "ready_to_open" ? (
        <ActionButton
          label="Open return"
          onPress={onOpenReturnPress}
          testID="journey-open-return-button"
        />
      ) : (
        <View style={styles.actionRow}>
          {availableInfluenceActions.map((type) => (
            <ActionButton
              key={type}
              label={type === "boost" ? "Boost drift" : "Offer shelter"}
              onPress={() => onInfluencePress?.(type)}
              testID={`journey-influence-${type}`}
            />
          ))}
        </View>
      )}
    </Screen>
  );
}

export function ReturnScreen({
  state,
  capsuleName,
  visibleChanges,
  myth,
  stamps,
  hearthReaction,
  onRelaunchPress,
}: ReturnScreenProps) {
  const marks = visibleChanges.length > 0 ? visibleChanges : [fallbackVisibleChange];
  const primaryMark = marks[0] ?? fallbackVisibleChange;

  return (
    <Screen testID="return-screen">
      <Text style={styles.eyebrow}>Return</Text>
      <Text style={styles.title}>{capsuleName} came home changed.</Text>
      <View style={styles.returnReveal} testID={`return-state-${state}`}>
        <CapsuleFigure shell="paper" marks={marks.map((mark) => mark.id)} />
        <View style={styles.markBadge} testID="return-visible-mark">
          <Text style={styles.markText}>{primaryMark.label}</Text>
          <Text style={styles.bodyText}>{primaryMark.causeLabel}</Text>
        </View>
      </View>

      <View style={styles.panel} testID="return-myth">
        <Text style={styles.panelTitle}>Myth</Text>
        <Text style={styles.bodyText}>{myth}</Text>
      </View>

      <View style={styles.panel} testID="return-stamps">
        <Text style={styles.panelTitle}>Stamps</Text>
        <Text style={styles.bodyText}>
          {stamps.length > 0 ? stamps.join(", ") : "No stamp this time."}
        </Text>
      </View>

      <View style={styles.panel} testID="return-memory-commit">
        <Text style={styles.panelTitle}>Committed to memory</Text>
        <Text style={styles.bodyText} testID="return-hearth-reaction">
          {hearthReaction}
        </Text>
      </View>

      <ActionButton label="Relaunch" onPress={onRelaunchPress} testID="return-next-action" />
    </Screen>
  );
}

export function canLaunchDraft(draft: BuildDraft): boolean {
  return (
    (draft.name?.trim().length ?? 0) > 0 &&
    draft.shell !== undefined &&
    draft.core !== undefined &&
    draft.intent !== undefined
  );
}

export function createRiskPreview(draft: BuildDraft): string {
  const shell = draft.shell ?? "unpicked shell";
  const core = draft.core ?? "unknown core";
  const intent = draft.intent ?? "wandering";
  const shellEffect = shellRiskEffect(shell);
  const intentEffect = intent === "scout" ? "finds sharper signals" : "returns with a softer mark";

  return `${shell} + ${core} ${intent} -> ${shellEffect}; ${intentEffect}.`;
}

function Screen({ children, testID }: { children: React.ReactNode; testID: string }) {
  return (
    <ScrollView contentContainerStyle={styles.screen} testID={testID}>
      {children}
    </ScrollView>
  );
}

function ChoiceRow<TChoice extends string>({
  label,
  options,
  selected,
  testIDPrefix,
  onSelect,
}: {
  label: string;
  options: TChoice[];
  selected?: TChoice;
  testIDPrefix: string;
  onSelect?: (choice: TChoice) => void;
}) {
  return (
    <View style={styles.panel} testID={`${testIDPrefix}-row`}>
      <Text style={styles.panelTitle}>{label}</Text>
      <View style={styles.choiceRow}>
        {options.map((option) => (
          <Pressable
            accessibilityRole="button"
            key={option}
            onPress={() => onSelect?.(option)}
            style={[styles.choicePill, selected === option ? styles.choicePillSelected : undefined]}
            testID={`${testIDPrefix}-${option}`}
          >
            <Text
              style={[
                styles.choiceText,
                selected === option ? styles.choiceTextSelected : undefined,
              ]}
            >
              {labelFor(option)}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function ActionButton({
  label,
  onPress,
  testID,
}: {
  label: string;
  onPress?: () => void;
  testID: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={styles.primaryButton}
      testID={testID}
    >
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );
}

function CapsuleFigure({ shell, marks }: { shell: Shell; marks: string[] }) {
  return (
    <View style={[styles.capsule, shellStyle(shell)]} testID="capsule-figure">
      <View style={styles.capsuleCore} />
      {marks.slice(0, 3).map((mark, index) => (
        <View
          key={`${mark}-${index}`}
          style={[styles.visibleMark, { top: 18 + index * 18 }]}
          testID={`capsule-mark-${mark}`}
        />
      ))}
    </View>
  );
}

function buildStateFor(draft: BuildDraft): BuildScreenState {
  const hasAnyChoice =
    draft.name !== undefined ||
    draft.shell !== undefined ||
    draft.core !== undefined ||
    draft.cargo !== undefined ||
    draft.intent !== undefined;

  if (!hasAnyChoice) {
    return "empty";
  }

  return canLaunchDraft(draft) ? "ready" : "partial";
}

function shellRiskEffect(shell: string): string {
  switch (shell) {
    case "paper":
      return "likely to show stains or sun-soft edges";
    case "glass":
      return "may catch bright cracks";
    case "cloth":
      return "can carry weather in its weave";
    case "moss":
      return "may regrow along rough crossings";
    case "tin":
      return "can dent or bloom with rust";
    default:
      return "the route will choose the first mark";
  }
}

function journeyStateLabel(state: JourneyScreenState): string {
  switch (state) {
    case "travelling":
      return "Travelling";
    case "decision_point":
      return "A small choice is open";
    case "nearing_return":
      return "Nearing return";
    case "ready_to_open":
      return "Ready to open";
  }
}

function labelFor(value: string): string {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function shellStyle(shell: Shell) {
  switch (shell) {
    case "paper":
      return styles.shellPaper;
    case "glass":
      return styles.shellGlass;
    case "cloth":
      return styles.shellCloth;
    case "moss":
      return styles.shellMoss;
    case "tin":
      return styles.shellTin;
  }
}

const fallbackVisibleChange: VisibleChangeSummary = {
  id: "wind_worn_edge",
  label: "Wind-worn edge",
  causeLabel: "the completed journey",
};

const styles = StyleSheet.create({
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  bodyText: {
    color: "#3f4750",
    fontSize: 15,
    lineHeight: 22,
  },
  capsule: {
    alignItems: "center",
    borderColor: "#1f2933",
    borderRadius: 8,
    borderWidth: 2,
    height: 132,
    justifyContent: "center",
    width: 82,
  },
  capsuleCore: {
    backgroundColor: "#c4913f",
    borderRadius: 14,
    height: 28,
    width: 28,
  },
  choicePill: {
    borderColor: "#82908f",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  choicePillSelected: {
    backgroundColor: "#236968",
    borderColor: "#236968",
  },
  choiceRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  choiceText: {
    color: "#263238",
    fontSize: 14,
    fontWeight: "600",
  },
  choiceTextSelected: {
    color: "#ffffff",
  },
  disabledButton: {
    opacity: 0.45,
  },
  eyebrow: {
    color: "#236968",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0,
    textTransform: "uppercase",
  },
  hearthCore: {
    backgroundColor: "#a34d2f",
    borderRadius: 28,
    height: 56,
    width: 56,
  },
  hearthHalo: {
    alignItems: "center",
    backgroundColor: "#d9e5dc",
    borderRadius: 8,
    height: 92,
    justifyContent: "center",
    width: 92,
  },
  input: {
    borderColor: "#82908f",
    borderRadius: 8,
    borderWidth: 1,
    color: "#1f2933",
    fontSize: 18,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  launchRing: {
    alignItems: "center",
    borderColor: "#c4913f",
    borderRadius: 8,
    borderWidth: 2,
    padding: 16,
  },
  markBadge: {
    backgroundColor: "#ffffff",
    borderColor: "#a34d2f",
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
    padding: 12,
  },
  markText: {
    color: "#a34d2f",
    fontSize: 18,
    fontWeight: "700",
  },
  momentText: {
    color: "#236968",
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 22,
  },
  panel: {
    backgroundColor: "#ffffff",
    borderColor: "#d8dedc",
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    padding: 14,
    width: "100%",
  },
  panelTitle: {
    color: "#1f2933",
    fontSize: 17,
    fontWeight: "700",
  },
  previewLabel: {
    color: "#546a3d",
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  previewPanel: {
    backgroundColor: "#eef4ef",
    borderColor: "#546a3d",
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
    padding: 14,
    width: "100%",
  },
  previewText: {
    color: "#24362f",
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 23,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#236968",
    borderRadius: 8,
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
  primaryPanel: {
    borderColor: "#a34d2f",
    borderWidth: 2,
  },
  readLine: {
    color: "#263238",
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 23,
  },
  returnReveal: {
    alignItems: "center",
    gap: 14,
    width: "100%",
  },
  screen: {
    backgroundColor: "#f7f8f5",
    flexGrow: 1,
    gap: 16,
    padding: 20,
  },
  secondaryButton: {
    alignItems: "center",
    borderColor: "#236968",
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  secondaryButtonText: {
    color: "#236968",
    fontSize: 15,
    fontWeight: "700",
  },
  shellCloth: {
    backgroundColor: "#d8dedc",
  },
  shellGlass: {
    backgroundColor: "#cfe4e6",
  },
  shellMoss: {
    backgroundColor: "#c7d3b5",
  },
  shellPaper: {
    backgroundColor: "#f5f1e8",
  },
  shellTin: {
    backgroundColor: "#c9ced2",
  },
  title: {
    color: "#1f2933",
    fontSize: 29,
    fontWeight: "800",
    lineHeight: 34,
  },
  visibleMark: {
    backgroundColor: "#a34d2f",
    borderRadius: 8,
    height: 8,
    position: "absolute",
    width: 42,
  },
});
