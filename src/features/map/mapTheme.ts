// mapTheme.ts
// Colours and sizes used by the map overlay (chips, alert banner, area sheet).
// TODO: move these into src/constants/theme.ts once the team agrees a palette.

import { Platform } from "react-native";

import { BottomTabInset } from "@/constants/theme";

export const NAVY = "#062231";
export const ACCENT = "#1DB2F5";
export const ROUTE_COLOR = "#1D4ED8";
export const STATION_COLOR = "#062231";

// Text-safe versions of the heatmap greens, ambers and reds.
export const RISK_COLORS = {
  lower: { fg: "#15803D", bg: "#DCFCE7" },
  moderate: { fg: "#A16207", bg: "#FEF3C7" },
  high: { fg: "#B91C1C", bg: "#FEE2E2" },
} as const;

export const ALERT_COLORS = {
  urgent: "#C0392B",
  warning: "#A16207",
  info: "#1D4ED8",
} as const;

export const CARD_SHADOW = "0 4px 14px rgba(6, 34, 49, 0.16)";

// Space kept free at the bottom for the tab bar. On iOS the native tab bar
// floats over the screen. On Android the screen already ends above it.
export const MAP_BOTTOM_INSET = Platform.select({ ios: BottomTabInset, default: 0 });
