// PlaceSheet.tsx
// Bottom card for a searched place: name, address, distance, the safety score
// of the surrounding area, and directions (in the app, or in Maps).

import { Linking, Platform, Pressable, StyleSheet, View } from "react-native";

import { Spacing } from "@/constants/theme";
import { ScaledText } from "@/features/settings/ScaledText";
import { useTheme } from "@/hooks/use-theme";
import type { PlaceDetails, RouteSummary, TravelMode } from "@/types";

import { riskLabel, type RiskLevel } from "./mapRisk";
import { CARD_SHADOW, NAVY, RISK_COLORS } from "./mapTheme";
import {
  externalDirectionsUrl,
  formatDistance,
  formatDuration,
} from "./routeUtils";

export type RouteState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; route: RouteSummary }
  | { status: "fallback"; route: RouteSummary; message: string };

type Props = {
  place: PlaceDetails;
  distanceKmFromUser: number;
  usingDefaultLocation: boolean;
  risk: { level: RiskLevel; score: number } | null;
  mode: TravelMode;
  routeState: RouteState;
  onModeChange: (mode: TravelMode) => void;
  onGetDirections: () => void;
  onClose: () => void;
};

export function PlaceSheet({
  place,
  distanceKmFromUser,
  usingDefaultLocation,
  risk,
  mode,
  routeState,
  onModeChange,
  onGetDirections,
  onClose,
}: Props) {
  const theme = useTheme();
  const colors = risk ? RISK_COLORS[risk.level] : null;
  const route = "route" in routeState ? routeState.route : null;

  return (
    <View style={[styles.sheet, { backgroundColor: theme.background }]}>
      <View style={styles.headerRow}>
        <View style={styles.flex}>
          <ScaledText type="heading" numberOfLines={2}>
            {place.name}
          </ScaledText>
          {place.address ? (
            <ScaledText type="small" themeColor="textSecondary" numberOfLines={2}>
              {place.address}
            </ScaledText>
          ) : null}
        </View>
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close place details"
          style={[styles.closeButton, { backgroundColor: theme.backgroundElement }]}
        >
          <ScaledText type="smallBold">Close</ScaledText>
        </Pressable>
      </View>

      <ScaledText type="small" themeColor="textSecondary">
        {formatDistance(distanceKmFromUser * 1000)} in a straight line from{" "}
        {usingDefaultLocation ? "central Cape Town" : "you"}
      </ScaledText>
      {usingDefaultLocation && (
        <ScaledText type="small" themeColor="textSecondary">
          Your location isn&apos;t available, so directions start from central Cape Town.
        </ScaledText>
      )}

      {risk && colors && (
        <View
          accessible
          accessibilityLabel={`Area safety: ${riskLabel(risk.level)}, score ${risk.score} out of 100`}
          style={styles.riskRow}
        >
          <View style={[styles.badge, { backgroundColor: colors.bg }]}>
            <ScaledText type="smallBold" style={{ color: colors.fg }}>
              {riskLabel(risk.level)}
            </ScaledText>
          </View>
          <ScaledText type="smallBold">{risk.score} / 100</ScaledText>
        </View>
      )}
      {risk?.level === "high" && (
        <ScaledText type="small" accessibilityRole="alert">
          This area has a higher reported crime level. If you go, consider
          travelling by car or a ride service, and avoid walking there at night.
        </ScaledText>
      )}

      <View style={styles.modeRow} accessibilityRole="radiogroup">
        {(["drive", "walk"] as const).map((m) => (
          <Pressable
            key={m}
            onPress={() => onModeChange(m)}
            accessibilityRole="radio"
            accessibilityState={{ selected: mode === m }}
            accessibilityLabel={m === "drive" ? "Driving" : "Walking"}
            style={[
              styles.modeButton,
              { backgroundColor: mode === m ? NAVY : theme.backgroundElement },
            ]}
          >
            <ScaledText
              type="smallBold"
              style={{ color: mode === m ? "#FFFFFF" : theme.text }}
            >
              {m === "drive" ? "Drive" : "Walk"}
            </ScaledText>
          </Pressable>
        ))}
      </View>

      {routeState.status === "loading" && (
        <ScaledText type="small" themeColor="textSecondary" accessibilityLiveRegion="polite">
          Finding the best route…
        </ScaledText>
      )}
      {route && (
        <View accessibilityLiveRegion="polite">
          <ScaledText type="smallBold">
            {route.estimated ? "About " : ""}
            {formatDuration(route.durationSeconds)} · {formatDistance(route.distanceMeters)}
            {route.estimated ? " (straight line)" : ""}
          </ScaledText>
          {routeState.status === "fallback" && (
            <ScaledText type="small" themeColor="textSecondary">
              {routeState.message}
            </ScaledText>
          )}
        </View>
      )}

      <View style={styles.actions}>
        <Pressable
          onPress={onGetDirections}
          disabled={routeState.status === "loading"}
          accessibilityRole="button"
          accessibilityLabel={`Show ${mode === "drive" ? "driving" : "walking"} directions`}
          style={[styles.action, { backgroundColor: NAVY }, routeState.status === "loading" && styles.dimmed]}
        >
          <ScaledText type="smallBold" style={styles.whiteText}>
            Directions
          </ScaledText>
        </Pressable>
        <Pressable
          onPress={() =>
            Linking.openURL(
              externalDirectionsUrl(place.coordinates, mode, Platform.OS),
            ).catch(() => {})
          }
          accessibilityRole="button"
          accessibilityLabel={`Start in ${Platform.OS === "ios" ? "Apple" : "Google"} Maps`}
          style={[styles.action, { backgroundColor: theme.backgroundElement }]}
        >
          <ScaledText type="smallBold">
            Open in {Platform.OS === "ios" ? "Apple" : "Google"} Maps
          </ScaledText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    borderRadius: 20,
    padding: Spacing.three,
    gap: Spacing.two,
    boxShadow: CARD_SHADOW,
  },
  flex: { flex: 1 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: Spacing.two },
  closeButton: {
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: Spacing.three,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  riskRow: { flexDirection: "row", alignItems: "center", gap: Spacing.two },
  badge: { paddingHorizontal: Spacing.two, paddingVertical: Spacing.one, borderRadius: 12 },
  modeRow: { flexDirection: "row", gap: Spacing.two },
  modeButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  actions: { flexDirection: "row", gap: Spacing.two },
  action: {
    flex: 1,
    minHeight: 48,
    borderRadius: 24,
    paddingHorizontal: Spacing.two,
    alignItems: "center",
    justifyContent: "center",
  },
  dimmed: { opacity: 0.6 },
  whiteText: { color: "#FFFFFF" },
});
