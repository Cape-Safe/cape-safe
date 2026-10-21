import { Image } from "expo-image";
import * as Linking from "expo-linking";
import { SymbolView } from "expo-symbols";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Spacing } from "@/constants/theme";
import { ScaledText } from "@/features/settings/ScaledText";
import { useTheme } from "@/hooks/use-theme";

import { EmergencyInfoCard } from "./EmergencyInfoCard";
import { LOGO_IMAGE } from "./emergencyAssets";
import { emergencyServices, type EmergencyService } from "./emergencyServices";

export default function EmergencyScreen() {
  const theme = useTheme();
  const isDark = useColorScheme() === "dark";
  const insets = useSafeAreaInsets();
  const [failed, setFailed] = useState<EmergencyService | null>(null);

  const callService = async (service: EmergencyService) => {
    setFailed(null);
    try {
      await Linking.openURL(`tel:${service.dial}`);
    } catch {
      setFailed(service);
    }
  };

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: Spacing.six + insets.bottom },
      ]}
      contentInsetAdjustmentBehavior="never"
    >
      <View style={[styles.hero, { paddingTop: insets.top + Spacing.three }]}>
        <View style={styles.topRow}>
          <View
            style={styles.logoRow}
            accessible
            accessibilityRole="image"
            accessibilityLabel="Cape Safe"
          >
            {LOGO_IMAGE ? (
              <Image
                source={LOGO_IMAGE}
                style={styles.logoImage}
                contentFit="contain"
              />
            ) : (
              <SymbolView
                name={{
                  ios: "shield.lefthalf.filled",
                  android: "health_and_safety",
                  web: "health_and_safety",
                }}
                size={24}
                tintColor={theme.text}
              />
            )}
            <View>
              <ScaledText
                type="smallBold"
                style={[styles.logoText, { color: theme.text }]}
              >
                CAPE SAFE
              </ScaledText>
              <ScaledText
                type="small"
                style={[styles.logoSub, { color: theme.textSecondary }]}
              >
                CAPE TOWN
              </ScaledText>
            </View>
          </View>
          <View
            style={[styles.pill, { backgroundColor: theme.backgroundElement }]}
          >
            <SymbolView
              name={{
                ios: "location.fill",
                android: "location_on",
                web: "location_on",
              }}
              size={14}
              tintColor={theme.text}
            />
            <ScaledText type="small" style={{ color: theme.text }}>
              Cape Town
            </ScaledText>
          </View>
        </View>

        <View style={styles.heroText}>
          <ScaledText
            type="subtitle"
            accessibilityRole="header"
            style={[styles.heroHeading, { color: theme.text }]}
          >
            Hi there,
          </ScaledText>
          <ScaledText
            type="default"
            themeColor="textSecondary"
            style={styles.heroSubtitle}
          >
            In an emergency, help is just a call away.
          </ScaledText>
        </View>
      </View>

      <View
        style={[
          styles.card,
          { backgroundColor: isDark ? theme.backgroundElement : "#FFFFFF" },
          isDark ? styles.cardBorderDark : styles.cardShadow,
        ]}
      >
        <ScaledText
          type="default"
          accessibilityRole="header"
          style={styles.cardTitle}
        >
          Emergency Responders
        </ScaledText>

        {emergencyServices.map((service, index) => (
          <Pressable
            key={service.id}
            onPress={() => callService(service)}
            accessibilityRole="button"
            accessibilityLabel={`Call ${service.a11yName}, ${service.display}`}
            style={({ pressed }) => [
              styles.row,
              index > 0 && {
                borderTopWidth: StyleSheet.hairlineWidth,
                borderTopColor: theme.backgroundSelected,
              },
              pressed && { backgroundColor: theme.backgroundSelected },
            ]}
          >
            <View style={[styles.icon, { backgroundColor: service.color }]}>
              <SymbolView name={service.icon} size={22} tintColor="#FFFFFF" />
            </View>
            <View style={styles.rowText}>
              <ScaledText type="default" style={styles.serviceName}>
                {service.name}
              </ScaledText>
              <ScaledText type="small" themeColor="textSecondary">
                {service.display}
              </ScaledText>
            </View>
            <View
              style={[styles.callButton, { backgroundColor: theme.primary }]}
            >
              <SymbolView
                name={{ ios: "phone.fill", android: "call", web: "call" }}
                size={18}
                tintColor={theme.onPrimary}
              />
            </View>
          </Pressable>
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

      <EmergencyInfoCard />

      <View
        style={[
          styles.location,
          isDark ? styles.locationDark : styles.locationLight,
        ]}
      >
        <SymbolView
          name={{
            ios: "location.fill",
            android: "location_on",
            web: "location_on",
          }}
          size={20}
          tintColor={theme.text}
        />
        <View>
          <ScaledText type="default" style={styles.serviceName}>
            Cape Town
          </ScaledText>
          <ScaledText type="small" themeColor="textSecondary">
            Western Cape
          </ScaledText>
        </View>
      </View>

      <ScaledText
        type="smallBold"
        themeColor="textSecondary"
        style={styles.tagline}
      >
        Be prepared · Be informed · Be safer
      </ScaledText>
      <ScaledText
        type="small"
        themeColor="textSecondary"
        style={styles.disclaimer}
      >
        Cape Safe does not replace emergency services. Always call 10111 or 112
        in an emergency.
      </ScaledText>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1 },
  hero: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
    gap: Spacing.five,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logoRow: { flexDirection: "row", alignItems: "center", gap: Spacing.two },
  logoImage: { width: 28, height: 28 },
  logoText: { fontWeight: "800", letterSpacing: 1.2, lineHeight: 18 },
  logoSub: { fontSize: 9, lineHeight: 11, letterSpacing: 1.5 },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 999,
  },
  heroText: { gap: Spacing.one },
  heroHeading: { fontWeight: "400" },
  heroSubtitle: { fontSize: 15, maxWidth: 280 },
  card: {
    marginHorizontal: Spacing.three,
    borderRadius: 28,
    padding: Spacing.three,
    maxWidth: 800,
    alignSelf: "stretch",
  },
  cardShadow: {
    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
  },
  cardBorderDark: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.12)",
  },
  cardTitle: {
    fontWeight: "800",
    fontSize: 20,
    marginBottom: Spacing.two,
    paddingHorizontal: Spacing.one,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
    minHeight: 64,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.one,
    borderRadius: 12,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  rowText: { flex: 1 },
  serviceName: { fontWeight: "700" },
  callButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  failure: {
    marginTop: Spacing.two,
    padding: Spacing.three,
    borderRadius: 12,
    backgroundColor: "rgba(220,38,38,0.12)",
  },
  failureText: { color: "#DC2626" },
  location: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
    marginHorizontal: Spacing.three,
    marginTop: Spacing.three,
    padding: Spacing.three,
    borderRadius: 20,
    borderWidth: 1,
  },
  locationLight: {
    backgroundColor: "rgba(255,255,255,0.7)",
    borderColor: "rgba(0,0,0,0.06)",
  },
  locationDark: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderColor: "rgba(255,255,255,0.14)",
  },
  tagline: { textAlign: "center", marginTop: Spacing.four },
  disclaimer: {
    textAlign: "center",
    marginTop: Spacing.two,
    marginHorizontal: Spacing.four,
  },
});
