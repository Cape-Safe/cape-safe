// AreaSheet.tsx
// Bottom card that opens when a police station marker is tapped. Shows the
// area's risk level (never by colour alone) and score, plus quick actions to
// call SAPS or get directions. Raw crime counts are left out on purpose.

import { Linking, Platform, StyleSheet, View } from "react-native";

import { PressableScale } from "@/components/design/PressableScale";
import { usePalette } from "@/constants/design";
import { Spacing } from "@/constants/theme";
import { ScaledText } from "@/features/settings/ScaledText";
import { useTheme } from "@/hooks/use-theme";

import { riskLabel, riskLevel, type Station } from "./mapRisk";
import { CARD_SHADOW, RISK_COLORS } from "./mapTheme";

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
  const palette = usePalette();
  const level = riskLevel(station.risk);
  const colors = RISK_COLORS[level];
  const score = Math.round(station.risk * 100);
  const filled = Math.max(1, Math.ceil(station.risk * SEGMENTS));

  return (
    <View
      style={[
        styles.sheet,
        { backgroundColor: palette.card, borderColor: palette.line },
      ]}
    >
      <View style={styles.headerRow}>
        <View style={styles.flex}>
          <ScaledText type="heading" style={{ color: palette.ink }}>
            {station.name}
          </ScaledText>
          <ScaledText type="small" style={{ color: palette.muted }}>
            {station.locality}
          </ScaledText>
        </View>
        <PressableScale
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close area details"
          style={[styles.closeButton, { backgroundColor: palette.screen }]}
        >
          <ScaledText type="smallBold" style={{ color: palette.ink }}>
            Close
          </ScaledText>
        </PressableScale>
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
        <ScaledText type="smallBold" style={{ color: palette.ink }}>
          {score} / 100
        </ScaledText>
        <View
          style={styles.meter}
          importantForAccessibility="no-hide-descendants"
        >
          {Array.from({ length: SEGMENTS }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.segment,
                { backgroundColor: i < filled ? colors.fg : palette.line },
              ]}
            />
          ))}
        </View>
      </View>

      <View style={styles.actions}>
        <PressableScale
          haptic
          onPress={callPolice}
          accessibilityRole="button"
          accessibilityLabel="Call police on 10111"
          style={[styles.action, { backgroundColor: palette.danger }]}
        >
          <ScaledText type="smallBold" style={styles.whiteText}>
            Call 10111
          </ScaledText>
        </PressableScale>
        <PressableScale
          onPress={() => openDirections(station)}
          accessibilityRole="button"
          accessibilityLabel={`Get directions to ${station.name} police station`}
          style={[styles.action, { backgroundColor: theme.primary }]}
        >
          <ScaledText type="smallBold" style={{ color: theme.onPrimary }}>
            Directions
          </ScaledText>
        </PressableScale>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
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
  riskRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    flexWrap: "wrap",
  },
  badge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: 12,
  },
  meter: { flexDirection: "row", gap: Spacing.one, flex: 1, minWidth: 80 },
  segment: { flex: 1, height: 8, borderRadius: 4 },
  actions: { flexDirection: "row", gap: Spacing.two },
  action: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  whiteText: { color: "#FFFFFF" },
});
