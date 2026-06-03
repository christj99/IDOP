import type { JourneyRule, OutcomeEvent } from "./types.js";

export const DEFAULT_RULES: JourneyRule[] = [
  {
    id: "rain_paper_water_stain",
    phase: "tick",
    when: { worldSignalsAny: ["rain_light", "rain_moderate"], shellIn: ["paper", "cloth"] },
    chance: {
      base: 0.95,
      modifiers: [{ if: { influenceActive: "shelter" }, delta: -0.18 }],
    },
    outcome: { id: "water_stain", label: "Water stain", category: "scar", visible: true },
    explain: "Because {name} crossed rain with a {shell} shell, it gained a water stain.",
    causes: ["shell", "world_signal:rain", "roll"],
  },
  {
    id: "heavy_rain_glass_rain_crack",
    phase: "tick",
    when: { worldSignalsAny: ["rain_heavy"], shellIn: ["glass"] },
    chance: { base: 0.38 },
    outcome: { id: "rain_crack", label: "Rain-crack", category: "scar", visible: true },
    explain: "Because {name}'s glass shell crossed heavy rain, a rain-crack caught the light.",
    causes: ["shell", "world_signal:heavy_rain", "roll"],
  },
  {
    id: "daylight_paper_cloth_sun_bleach",
    phase: "tick",
    when: { worldSignalsAny: ["strong_daylight"], shellIn: ["paper", "cloth"] },
    chance: { base: 0.36 },
    outcome: { id: "sun_bleach", label: "Sun-bleach", category: "scar", visible: true },
    explain: "Because {name} drifted through strong daylight, its {shell} shell sun-bleached.",
    causes: ["shell", "world_signal:daylight", "roll"],
  },
  {
    id: "freeze_glass_moss_frost_bite",
    phase: "tick",
    when: { worldSignalsAny: ["freeze"], shellIn: ["glass", "moss"] },
    chance: { base: 0.35 },
    outcome: { id: "frost_bite", label: "Frost-bite", category: "scar", visible: true },
    explain: "Because {name} crossed a freezing window, frost-bite marked its {shell} shell.",
    causes: ["shell", "world_signal:freeze", "roll"],
  },
  {
    id: "high_wind_wind_worn_edge",
    phase: "tick",
    when: { worldSignalsAny: ["high_wind"] },
    chance: { base: 0.32 },
    outcome: { id: "wind_worn_edge", label: "Wind-worn edge", category: "scar", visible: true },
    explain: "Because {name} rode through high wind, one edge came back wind-worn.",
    causes: ["world_signal:wind", "roll"],
  },
  {
    id: "near_water_moss_cloth_salt_crust",
    phase: "tick",
    when: { worldSignalsAny: ["near_water"], shellIn: ["moss", "cloth"] },
    chance: { base: 0.34 },
    outcome: { id: "salt_crust", label: "Salt-crust", category: "scar", visible: true },
    explain: "Because {name} drifted near water, salt-crust gathered on its {shell} shell.",
    causes: ["shell", "world_signal:near_water", "roll"],
  },
  {
    id: "impact_tin_dent",
    phase: "tick",
    when: { worldSignalsAny: ["impact"], shellIn: ["tin"] },
    chance: { base: 0.4 },
    outcome: { id: "dent", label: "Dent", category: "scar", visible: true },
    explain: "Because {name}'s tin shell met an impact, it came home with a dent.",
    causes: ["shell", "event:impact", "roll"],
  },
  {
    id: "rain_time_tin_rust_bloom",
    phase: "tick",
    when: { worldSignalsAny: ["rain_light", "rain_moderate", "rain_heavy"], shellIn: ["tin"] },
    chance: { base: 0.31 },
    outcome: { id: "rust_bloom", label: "Rust-bloom", category: "scar", visible: true },
    explain: "Because {name}'s tin shell spent time in rain, rust-bloom appeared.",
    causes: ["shell", "world_signal:rain", "time"],
  },
  {
    id: "storm_charge_signal_burn",
    phase: "tick",
    when: { worldSignalsAny: ["storm_charge"] },
    chance: {
      base: 0.28,
      modifiers: [{ if: { core: "brave" }, delta: 0.08 }],
    },
    outcome: { id: "signal_burn", label: "Signal-burn", category: "scar", visible: true },
    explain: "Because {name} brushed a storm charge, signal-burn stayed behind.",
    causes: ["world_signal:storm", "core", "roll"],
  },
  {
    id: "survival_moss_thread",
    phase: "tick",
    when: { worldSignalsAny: ["survival"], shellIn: ["moss"] },
    chance: { base: 0.37 },
    outcome: { id: "moss_thread", label: "Moss-thread", category: "transformation", visible: true },
    explain: "Because {name} survived a rough crossing, moss-thread regrew along its body.",
    causes: ["shell", "event:survival", "roll"],
  },
  {
    id: "loud_zone_shy_dimmed_beacon",
    phase: "tick",
    when: { worldSignalsAny: ["loud_zone"], coreIn: ["shy"] },
    chance: { base: 0.44 },
    outcome: {
      id: "dimmed_beacon",
      label: "Dimmed beacon",
      category: "transformation",
      visible: true,
    },
    explain: "Because shy {name} crossed a loud zone, its beacon dimmed.",
    causes: ["core", "world_signal:loud", "roll"],
  },
  {
    id: "clear_window_brave_brightened",
    phase: "tick",
    when: { worldSignalsAny: ["rare_clear_window"], coreIn: ["brave"] },
    chance: { base: 0.4 },
    outcome: { id: "brightened", label: "Brightened", category: "transformation", visible: true },
    explain: "Because brave {name} survived a rare clear window, it brightened.",
    causes: ["core", "world_signal:clear", "roll"],
  },
];

export const STAMP_OUTCOMES = [
  { id: "first_rain", label: "First Rain" },
  { id: "bridge_echo", label: "Bridge Echo" },
  { id: "midnight_drift", label: "Midnight Drift" },
  { id: "full_moon_drift", label: "Full-Moon Drift" },
  { id: "first_frost", label: "First Frost" },
] as const;

export const CARGO_OUTCOMES = [
  { id: "lost_charm", label: "Lost charm" },
  { id: "fog_fragment", label: "Fog-Fragment" },
  { id: "seed_polished", label: "Polished seed" },
  { id: "wish_smudged", label: "Smudged wish" },
] as const;

export const BASELINE_SIGNALS = [
  "rain_light",
  "rain_heavy",
  "strong_daylight",
  "freeze",
  "high_wind",
  "near_water",
  "impact",
  "storm_charge",
  "survival",
  "loud_zone",
  "rare_clear_window",
] as const;

export function syntheticOutcome(
  id: string,
  label: string,
  category: "stamp" | "cargo",
  tickIndex: number,
  explain: string,
): OutcomeEvent {
  return {
    id,
    label,
    category,
    visible: false,
    ruleId: `${category}:${id}`,
    tickIndex,
    explain,
    causes: [category, "seed"],
  };
}
