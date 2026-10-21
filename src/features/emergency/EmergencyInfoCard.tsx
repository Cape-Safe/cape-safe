// EmergencyInfoCard.tsx
// "My emergency info" summary on the SOS screen: blood type, allergies,
// medical aid number and next of kin with tap-to-call. Shows a sign-in prompt
// for guests and an empty state until the profile is filled in.

import { router } from "expo-router";
import * as Linking from "expo-linking";
import { Pressable, StyleSheet, View } from "react-native";

import { Spacing } from "@/constants/theme";
import { ScaledText } from "@/features/settings/ScaledText";
import { useAuth } from "@/hooks/use-auth";
import { useEmergencyProfile } from "@/hooks/use-emergency-data";
import { useTheme } from "@/hooks/use-theme";

function Line({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.line} accessible accessibilityLabel={`${label}: ${value}`}>
      <ScaledText type="small" themeColor="textSecondary">{label}</ScaledText>
      <ScaledText type="smallBold">{value}</ScaledText>
    </View>
  );
}

export function EmergencyInfoCard() {
  const theme = useTheme();
  const { user, isLoggedIn } = useAuth();
  const { profile, loading, error } = useEmergencyProfile(isLoggedIn ? user?.uid : undefined);

  const goToProfile = () => router.push("/settings/emergency-profile");

  let body: React.ReactNode;
  if (!isLoggedIn) {
    body = (
      <>
        <ScaledText type="small" themeColor="textSecondary">
          Sign in to keep your medical details and next of kin here for emergencies.
        </ScaledText>
        <Link label="Sign in or register" onPress={() => router.push("/settings/login")} />
      </>
    );
  } else if (loading) {
    body = <ScaledText type="small" themeColor="textSecondary">Loading…</ScaledText>;
  } else if (error) {
    body = <ScaledText type="small" style={styles.error}>Couldn&apos;t load your details. Check your connection.</ScaledText>;
  } else {
    const kin = profile?.nextOfKin ?? [];
    const aid = profile?.medicalAid;
    const hasAny = !!(profile?.bloodType || profile?.allergies || aid?.memberNumber || kin.length);
    body = hasAny ? (
      <>
        {profile?.bloodType ? <Line label="Blood type" value={profile.bloodType} /> : null}
        {profile?.allergies ? <Line label="Allergies" value={profile.allergies} /> : null}
        {aid?.memberNumber ? (
          <Line label={aid.provider ?? "Medical aid"} value={aid.memberNumber} />
        ) : null}
        {kin.map((k, i) => (
          <Pressable
            key={i}
            onPress={() => Linking.openURL(`tel:${k.phone.replace(/[^+\d]/g, "")}`).catch(() => {})}
            accessibilityRole="button"
            accessibilityLabel={`Call ${k.name}${k.relationship ? `, ${k.relationship}` : ""}`}
            style={[styles.call, { backgroundColor: theme.background }]}
          >
            <View style={styles.flex}>
              <ScaledText type="smallBold">{k.name}</ScaledText>
              <ScaledText type="small" themeColor="textSecondary">
                {k.relationship ? `${k.relationship} · ` : ""}{k.phone}
              </ScaledText>
            </View>
            <ScaledText type="smallBold">Call</ScaledText>
          </Pressable>
        ))}
        <Link label="Edit emergency info" onPress={goToProfile} />
      </>
    ) : (
      <>
        <ScaledText type="small" themeColor="textSecondary">
          Nothing saved yet. Add your blood type, medical aid and next of kin so help can reach the right people.
        </ScaledText>
        <Link label="Set up emergency info" onPress={goToProfile} />
      </>
    );
  }

  return (
    <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
      <ScaledText type="heading" accessibilityRole="header">My emergency info</ScaledText>
      {body}
    </View>
  );
}

function Link({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={styles.link}>
      <ScaledText type="smallBold" style={styles.linkText}>{label}</ScaledText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: Spacing.three,
    marginTop: Spacing.three,
    padding: Spacing.three,
    borderRadius: 20,
    gap: Spacing.two,
  },
  flex: { flex: 1 },
  line: { gap: 2 },
  call: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: 14,
  },
  link: { minHeight: 44, justifyContent: "center" },
  linkText: { color: "#1D6FB8" },
  error: { color: "#B91C1C" },
});
