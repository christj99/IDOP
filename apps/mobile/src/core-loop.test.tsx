import type { ReactElement, ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("react-native", () => ({
  Pressable: "Pressable",
  ScrollView: "ScrollView",
  StyleSheet: {
    create: <T extends Record<string, unknown>>(styles: T) => styles,
  },
  Text: "Text",
  TextInput: "TextInput",
  View: "View",
}));

import {
  BuildWorkshopScreen,
  HomeHearthScreen,
  JourneyAwayScreen,
  LaunchScreen,
  ReturnScreen,
  canLaunchDraft,
  createRiskPreview,
  type BuildDraft,
  type JourneyScreenState,
} from "./core-loop.tsx";

interface RenderedNode {
  testID?: string;
  text: string;
  props: Record<string, unknown>;
}

const readyDraft: Required<Pick<BuildDraft, "name" | "shell" | "core" | "intent">> &
  Pick<BuildDraft, "cargo"> = {
  name: "Mica",
  shell: "paper",
  core: "curious",
  cargo: "seed",
  intent: "wander",
};

describe("M4 client core screens", () => {
  it("renders every Home/Hearth state from PRD section 5.1", () => {
    const cases = [
      {
        expectedId: "home-state-empty",
        element: (
          <HomeHearthScreen
            state="empty"
            tendState="available"
            launchWindowRead="clear, calm - good drifting"
          />
        ),
      },
      {
        expectedId: "home-state-active",
        element: (
          <HomeHearthScreen
            state="active_journey"
            tendState="available"
            launchWindowRead="clear, calm - good drifting"
            journey={{
              capsuleName: "Mica",
              returnMomentLabel: "back by golden hour",
              statusLabel: "travelling",
            }}
          />
        ),
      },
      {
        expectedId: "home-state-ready-return",
        element: (
          <HomeHearthScreen
            state="ready_return"
            tendState="done"
            launchWindowRead="clear, calm - good drifting"
            journey={{
              capsuleName: "Mica",
              returnMomentLabel: "waiting at the threshold",
              statusLabel: "ready to open",
            }}
          />
        ),
      },
    ];

    for (const testCase of cases) {
      const tree = renderTree(testCase.element);
      expect(hasTestId(tree, "home-screen")).toBe(true);
      expect(hasTestId(tree, testCase.expectedId)).toBe(true);
      expect(hasTestId(tree, "home-launch-window-read")).toBe(true);
    }

    expect(
      hasTestId(
        renderTree(
          <HomeHearthScreen
            state="empty"
            tendState="available"
            launchWindowRead="clear, calm - good drifting"
          />,
        ),
        "home-tend-available",
      ),
    ).toBe(true);
    expect(
      hasTestId(
        renderTree(
          <HomeHearthScreen
            state="empty"
            tendState="done"
            launchWindowRead="clear, calm - good drifting"
          />,
        ),
        "home-tend-done",
      ),
    ).toBe(true);
  });

  it("renders every Build/Workshop state and blocks launch until named", () => {
    const cases = [
      { expectedId: "build-state-empty", draft: {} },
      { expectedId: "build-state-partial", draft: { shell: "cloth", core: "shy" } },
      { expectedId: "build-state-ready", draft: readyDraft },
    ] as const;

    for (const testCase of cases) {
      const tree = renderTree(<BuildWorkshopScreen draft={testCase.draft} />);
      expect(hasTestId(tree, "build-screen")).toBe(true);
      expect(hasTestId(tree, testCase.expectedId)).toBe(true);
      expect(hasTestId(tree, "build-risk-preview")).toBe(true);
    }

    expect(canLaunchDraft({ ...readyDraft, name: "" })).toBe(false);
    expect(canLaunchDraft({ ...readyDraft, name: "   " })).toBe(false);
    expect(canLaunchDraft(readyDraft)).toBe(true);

    const unnamedButton = nodeByTestId(
      renderTree(<BuildWorkshopScreen draft={{ ...readyDraft, name: "" }} />),
      "build-launch-button",
    );
    expect(unnamedButton?.props.accessibilityState).toEqual({ disabled: true });

    const namedButton = nodeByTestId(
      renderTree(<BuildWorkshopScreen draft={readyDraft} />),
      "build-launch-button",
    );
    expect(namedButton?.props.accessibilityState).toEqual({ disabled: false });
  });

  it("updates the Build/Workshop risk preview when choices change", () => {
    const paperPreview = createRiskPreview({
      ...readyDraft,
      shell: "paper",
      cargo: "seed",
    });
    const glassPreview = createRiskPreview({
      ...readyDraft,
      shell: "glass",
      cargo: "charm",
    });

    expect(paperPreview).not.toEqual(glassPreview);
    expect(paperPreview).toContain("paper");
    expect(paperPreview).toContain("->");
  });

  it("renders every Launch state from PRD section 5.3", () => {
    const confirming = renderTree(
      <LaunchScreen
        state="confirming"
        capsuleName="Mica"
        conditionsRead="clear, calm - good drifting"
        riskRead="paper + clear window -> likely to come back sun-softened"
        returnMomentLabel="back by golden hour"
      />,
    );
    const launched = renderTree(
      <LaunchScreen
        state="launched"
        capsuleName="Mica"
        conditionsRead="clear, calm - good drifting"
        riskRead="paper + clear window -> likely to come back sun-softened"
        returnMomentLabel="back by golden hour"
      />,
    );

    expect(hasTestId(confirming, "launch-screen")).toBe(true);
    expect(hasTestId(confirming, "launch-state-confirming")).toBe(true);
    expect(hasTestId(confirming, "launch-return-moment")).toBe(true);
    expect(hasTestId(launched, "launch-state-launched")).toBe(true);
  });

  it("renders every Journey/Away state from PRD section 5.4", () => {
    const states: JourneyScreenState[] = [
      "travelling",
      "decision_point",
      "nearing_return",
      "ready_to_open",
    ];

    for (const state of states) {
      const tree = renderTree(
        <JourneyAwayScreen
          state={state}
          capsuleName="Mica"
          routeMood="changeable"
          dispatches={["Mica found a bright stitch."]}
          availableInfluenceActions={state === "decision_point" ? ["boost", "shelter"] : []}
          returnMomentLabel="back by golden hour"
        />,
      );

      expect(hasTestId(tree, "journey-screen")).toBe(true);
      expect(hasTestId(tree, `journey-state-${state.replaceAll("_", "-")}`)).toBe(true);
      expect(hasTestId(tree, "journey-return-moment")).toBe(true);
      expect(hasTestId(tree, "journey-dispatch-feed")).toBe(true);
    }
  });

  it("renders every Return state and always includes a visible mark element", () => {
    const revealing = renderTree(
      <ReturnScreen
        state="revealing"
        capsuleName="Mica"
        visibleChanges={[
          {
            id: "sun_bleach",
            label: "Sun-bleach",
            causeLabel: "clear daylight",
          },
        ]}
        myth="Mica crossed clear daylight and came home sun-softened."
        stamps={["First Light"]}
        hearthReaction="The Hearth leans close and remembers the warmth."
      />,
    );
    const revealedWithSparsePayload = renderTree(
      <ReturnScreen
        state="revealed"
        capsuleName="Mica"
        visibleChanges={[]}
        myth="Mica came home changed."
        stamps={[]}
        hearthReaction="The Hearth hums once for the new mark."
      />,
    );

    expect(hasTestId(revealing, "return-screen")).toBe(true);
    expect(hasTestId(revealing, "return-state-revealing")).toBe(true);
    expect(hasTestId(revealing, "return-visible-mark")).toBe(true);
    expect(treeTextContent(revealing)).toContain("Sun-bleach");

    expect(hasTestId(revealedWithSparsePayload, "return-state-revealed")).toBe(true);
    expect(hasTestId(revealedWithSparsePayload, "return-visible-mark")).toBe(true);
    expect(treeTextContent(revealedWithSparsePayload)).toContain("Wind-worn edge");
  });
});

function renderTree(root: ReactElement): RenderedNode[] {
  return collectNodes(expandElement(root));
}

function expandElement(element: ReactElement): ReactNode {
  if (typeof element.type === "function") {
    const Component = element.type as (props: unknown) => ReactNode;
    return Component(element.props);
  }

  return element;
}

function collectNodes(node: ReactNode): RenderedNode[] {
  if (node === null || node === undefined || typeof node === "boolean") {
    return [];
  }

  if (typeof node === "string" || typeof node === "number") {
    return [{ text: String(node), props: {} }];
  }

  if (Array.isArray(node)) {
    return node.flatMap(collectNodes);
  }

  if (typeof node !== "object" || !("props" in node)) {
    return [];
  }

  const element = node as ReactElement<{ children?: ReactNode; testID?: string }>;
  const expanded = expandElement(element);

  if (expanded !== element) {
    return collectNodes(expanded);
  }

  const props = element.props as Record<string, unknown>;
  return [
    {
      testID: element.props.testID,
      text: textContent(element.props.children),
      props,
    },
    ...collectNodes(element.props.children),
  ];
}

function hasTestId(nodes: RenderedNode[], testID: string): boolean {
  return nodes.some((node) => node.testID === testID);
}

function nodeByTestId(nodes: RenderedNode[], testID: string): RenderedNode | undefined {
  return nodes.find((node) => node.testID === testID);
}

function treeTextContent(nodes: RenderedNode[]): string {
  return nodes.map((node) => node.text).join("");
}

function textContent(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") {
    return "";
  }

  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map(textContent).join("");
  }

  if (typeof node !== "object" || !("props" in node)) {
    return "";
  }

  const element = node as ReactElement<{ children?: ReactNode }>;
  const expanded = expandElement(element);

  if (expanded !== element) {
    return textContent(expanded);
  }

  return textContent(element.props.children);
}
