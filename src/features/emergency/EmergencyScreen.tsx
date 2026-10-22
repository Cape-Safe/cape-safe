import * as Linking from "expo-linking";
import { SymbolView } from "expo-symbols";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { PressableScale } from "@/components/design/PressableScale";
import { ScreenScaffold } from "@/components/design/ScreenScaffold";
import { CardShadow, usePalette } from "@/constants/design";
import { Spacing } from "@/constants/theme";
import { ScaledText } from "@/features/settings/ScaledText";

import { emergencyServices, type EmergencyService } from "./emergencyServices";

// The two calls that matter most are shown as large buttons.
const FEATURED_IDS = ["saps", "ambulance"];

export default function EmergencyScreen() {
  const palette = usePalette();
  const [failed, setFailed] = useState<EmergencyService | null>(null);

  const callService = async (service: EmergencyService) => {
    setFailed(null);
    try {
      await Linking.openURL(`tel:${service.dial}`);
    } catch {
      setFailed(service);
    }
  };

  const featured = FEATURED_IDS.map((id) =>
    emergencyServices.find((service) => service.id === id),
  ).filter((service): service is EmergencyService => !!service);
  const others = emergencyServices.filter(
    (service) => !FEATURED_IDS.includes(service.id),
  );

  return (
    <ScreenScaffold
      eyebrow="Emergency"
      title="Get help now"
      meta={
        <View style={styles.metaRow}>
          <View style={[styles.liveDot, { backgroundColor: palette.live }]} />
          <ScaledText type="small" style={{ color: palette.onDarkMuted }}>
            Cape Town, Western Cape
          </ScaledText>
        </View>
      }
      lede="In an emergency, help is just a call away."
    >
      <View style={styles.featuredRow}>
        {featured.map((service) => (
          <PressableScale
            key={service.id}
            haptic
            onPress={() => callService(service)}
            accessibilityRole="button"
            accessibilityLabel={`Call ${service.a11yName}, ${service.display}`}
            style={[
              styles.featured,
              {
                backgroundColor:
                  service.id === "saps" ? palette.danger : palette.medical,
              },
            ]}
          >
            <View style={styles.ring}>
              <SymbolView
                name={{ ios: "phone.fill", android: "call", web: "call" }}
                size={20}
                tintColor="#FFFFFF"
              />
            </View>
            <View>
              <ScaledText type="smallBold" style={styles.featuredName}>
                {service.id === "saps" ? "Police (SAPS)" : service.name}
              </ScaledText>
              <ScaledText type="subtitle" style={styles.featuredNumber}>
                {service.display}
              </ScaledText>
            </View>
          </PressableScale>
        ))}
      </View>

      <ScaledText
        type="smallBold"
        accessibilityRole="header"
        style={[styles.sectionLabel, { color: palette.muted }]}
      >
        OTHER RESPONDERS
      </ScaledText>

      <View
        style={[
          styles.card,
          { backgroundColor: palette.card, borderColor: palette.line },
        ]}
      >
        {others.map((service, index) => (
          <PressableScale
            key={service.id}
            haptic
            onPress={() => callService(service)}
            accessibilityRole="button"
            accessibilityLabel={`Call ${service.a11yName}, ${service.display}`}
            style={[
              styles.row,
              index > 0 && {
                borderTopWidth: StyleSheet.hairlineWidth,
                borderTopColor: palette.line,
              },
            ]}
          >
            <View style={[styles.icon, { backgroundColor: palette.accentSoft }]}>
              <SymbolView name={service.icon} size={20} tintColor={palette.accent} />
            </View>
            <View style={styles.rowText}>
              <ScaledText type="smallBold" style={{ color: palette.ink }}>
                {service.name}
              </ScaledText>
              <ScaledText type="small" style={{ color: palette.muted }}>
                {service.display}
              </ScaledText>
            </View>
            <SymbolView
              name={{ ios: "phone", android: "call", web: "call" }}
              size={18}
              tintColor={palette.muted}
            />
          </PressableScale>
        ))}

        {failed && (
          <View style={styles.failure} accessibilityLiveRegion="polite">
            <ScaledText type="smallBold" style={styles.failureText}>
              Couldn&apos;t open the dialer. Please dial {failed.display}{" "}
              manually.
            </ScaledText>
          </View>
        )}
      </View>

      <ScaledText
        type="smallBold"
        style={[styles.tagline, { color: palette.muted }]}
      >
        Be prepared · Be informed · Be safer
      </ScaledText>
      <ScaledText type="small" style={[styles.disclaimer, { color: palette.muted }]}>
        Cape Safe does not replace emergency services. Always call 10111 or 112
        in an emergency.
      </ScaledText>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  metaRow: { flexDirection: "row", alignItems: "center", gap: Spacing.two },
  liveDot: { width: 7, height: 7, borderRadius: 4 },
  featuredRow: { flexDirection: "row", gap: Spacing.two },
  featured: {
    flex: 1,
    minHeight: 124,
    borderRadius: 16,
    padding: Spacing.three,
    justifyContent: "space-between",
    boxShadow: CardShadow,
  },
  ring: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  featuredName: { color: "rgba(255,255,255,0.92)" },
  featuredNumber: {
    color: "#FFFFFF",
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "700",
  },
  sectionLabel: { letterSpacing: 1.6, fontSize: 11, marginTop: Spacing.two },
  card: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.three,
    boxShadow: CardShadow,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
    minHeight: 64,
    paddingVertical: Spacing.two,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  rowText: { flex: 1 },
  failure: {
    marginBottom: Spacing.two,
    padding: Spacing.three,
    borderRadius: 12,
    backgroundColor: "rgba(220,38,38,0.12)",
  },
  failureText: { color: "#DC2626" },
  tagline: { textAlign: "center", marginTop: Spacing.three },
  disclaimer: {
    textAlign: "center",
    marginHorizontal: Spacing.three,
  },
});
