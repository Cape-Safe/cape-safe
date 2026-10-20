// AreaSheet.tsx
// Bottom card that opens when a police station marker is tapped. Shows the
// area's risk level (never by colour alone), score, top crime factors, and
// quick actions to call SAPS or get directions.

import { useState } from "react";
import { Linking, Platform, Pressable, StyleSheet, View } from "react-native";

import { Spacing } from "@/constants/theme";
import { ScaledText } from "@/features/settings/ScaledText";
import { useTheme } from "@/hooks/use-theme";

import {
  riskLabel,
  riskLevel,
  type Station,
} from "./mapRisk";
import { CARD_SHADOW, NAVY, RISK_COLORS } from "./mapTheme";

const SEGMENTS = 5;

function openDirections(station: Station) {
  const { latitude, longitude } = station;
  const url =
    Platform.OS === "ios"
      ? `http://maps.apple.com/?daddr=${latitude},${longitude}&dirflg=d`
      : `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
  Linking.openURL(url).catch(() => {});
}

function callPolice() {
  Linking.openURL("tel:10111").catch(() => {});
}

type Props = {
  station: Station;
  onClose: () => void;
};

export function AreaSheet({ station, onClose }: Props) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(true);
  const level = riskLevel(station.risk);
  const colors = RISK_COLORS[level];
  const score = Math.round(station.risk * 100);
  const filled = Math.max(1, Math.ceil(station.risk * SEGMENTS));

  return (
    <View style={[styles.sheet, { backgroundColor: theme.background }]}>
      <Pressable
        onPress={() => setExpanded((v) => !v)}
        accessibilityRole="button"
        accessibilityLabel={expanded ? "Hide details" : "Show details"}
        style={styles.handleArea}
      >
        <View style={[styles.handle, { backgroundColor: theme.backgroundSelected }]} />
      </Pressable>

      <View style={styles.headerRow}>
        <View style={styles.flex}>
          <ScaledText type="heading">{station.name}</ScaledText>
          <ScaledText type="small" themeColor="textSecondary">
            {station.locality}
          </ScaledText>
        </View>
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close area details"
          style={[styles.closeButton, { backgroundColor: theme.backgroundElement }]}
        >
          <ScaledText type="smallBold">Close</ScaledText>
        </Pressable>
      </View>

      <View
        accessible
        accessibilityLabel={`${riskLabel(level)}, score ${score} out of 100`}
        style={styles.riskRow}
      >
        <View style={[styles.badge, { backgroundColor: colors.bg }]}>
          <ScaledText type="smallBold" style={{ color: colors.fg }}>
            {riskLabel(level)}
          </ScaledText>
        </View>
        <ScaledText type="smallBold">{score} / 100</ScaledText>
        <View style={styles.meter} importantForAccessibility="no-hide-descendants">
          {Array.from({ length: SEGMENTS }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.segment,
                { backgroundColor: i < filled ? colors.fg : theme.backgroundSelected },
              ]}
            />
          ))}
        </View>
      </View>

      {expanded && station.topFactors.length > 0 && (
        <View style={styles.factors}>
          <ScaledText type="smallBold" themeColor="textSecondary">
            Biggest factors (SAPS 2024/25)
          </ScaledText>
          {station.topFactors.map((factor) => (
            <View key={factor.field} style={styles.factorRow}>
              <ScaledText type="small" style={styles.flex}>
                {factor.label}
              </ScaledText>
              <ScaledText type="smallBold">{factor.count}</ScaledText>
            </View>
          ))}
        </View>
      )}

      <View style={styles.actions}>
        <Pressable
          onPress={callPolice}
          accessibilityRole="button"
          accessibilityLabel="Call police on 10111"
          style={[styles.action, styles.callButton]}
        >
          <ScaledText type="smallBold" style={styles.whiteText}>
            Call 10111
          </ScaledText>
        </Pressable>
        <Pressable
          onPress={() => openDirections(station)}
          accessibilityRole="button"
          accessibilityLabel={`Get directions to ${station.name} police station`}
          style={[styles.action, { backgroundColor: NAVY }]}
        >
          <ScaledText type="smallBold" style={styles.whiteText}>
            Directions
          </ScaledText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    borderRadius: 20,
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.three,
    gap: Spacing.two,
    boxShadow: CARD_SHADOW,
  },
  flex: { flex: 1 },
  handleArea: { minHeight: 28, alignItems: "center", justifyContent: "center" },
  handle: { width: 40, height: 4, borderRadius: 2 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: Spacing.two },
  closeButton: {
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: Spacing.three,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  riskRow: { flexDirection: "row", alignItems: "center", gap: Spacing.two, flexWrap: "wrap" },
  badge: { paddingHorizontal: Spacing.two, paddingVertical: Spacing.one, borderRadius: 12 },
  meter: { flexDirection: "row", gap: Spacing.one, flex: 1, minWidth: 80 },
  segment: { flex: 1, height: 8, borderRadius: 4 },
  factors: { gap: Spacing.one },
  factorRow: { flexDirection: "row", alignItems: "center", gap: Spacing.two },
  actions: { flexDirection: "row", gap: Spacing.two },
  action: {
    flex: 1,
    minHeight: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  callButton: { backgroundColor: "#C0392B" },
  whiteText: { color: "#FFFFFF" },
});
