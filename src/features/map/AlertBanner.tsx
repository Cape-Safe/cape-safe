// AlertBanner.tsx
// Shows the most serious active safety alert (from Firestore) at the top of the map.

import { StyleSheet, View } from "react-native";

import { Spacing } from "@/constants/theme";
import { ScaledText } from "@/features/settings/ScaledText";
import { useTheme } from "@/hooks/use-theme";
import type { SafetyAlert } from "@/types";

import { ALERT_COLORS, CARD_SHADOW } from "./mapTheme";

const SEVERITY_LABEL: Record<SafetyAlert["severity"], string> = {
  urgent: "Urgent alert",
  warning: "Warning",
  info: "Notice",
};

export function AlertBanner({ alert }: { alert: SafetyAlert }) {
  const theme = useTheme();
  const color = ALERT_COLORS[alert.severity];

  return (
    <View
      accessible
      accessibilityRole="alert"
      accessibilityLabel={`${SEVERITY_LABEL[alert.severity]}. ${alert.title}. ${alert.body}`}
      style={[
        styles.banner,
        { backgroundColor: theme.background, borderLeftColor: color },
      ]}
    >
      <ScaledText type="smallBold" style={{ color }}>
        {SEVERITY_LABEL[alert.severity]}
      </ScaledText>
      <ScaledText type="smallBold">{alert.title}</ScaledText>
      <ScaledText type="small" themeColor="textSecondary" numberOfLines={2}>
        {alert.body}
      </ScaledText>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderLeftWidth: 6,
    borderRadius: 12,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    gap: Spacing.half,
    boxShadow: CARD_SHADOW,
  },
});
