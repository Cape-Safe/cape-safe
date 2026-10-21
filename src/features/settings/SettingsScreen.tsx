// SettingsScreen.tsx
// Settings screen for Cape Safe. The toggles are saved to the signed-in

import { useEffect, useState, type ReactNode } from "react";
import {
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedView } from "@/components/themed-view";
import { BottomTabInset, MaxContentWidth, Spacing } from "@/constants/theme";
import { useMyProfile } from "@/hooks/use-my-profile";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { updateProfile } from "@/services/users";
import type { UserSettings } from "@/types";

import { ScaledText } from "./ScaledText";
import { setLargeText, useAccessibility } from "./accessibility";

// Accent colours that are not in src/constants/theme.ts yet.
// TODO: move these into the theme once the team picks a palette.
const ACCENT = "#1DB2F5";
const DANGER = "#C0392B";

type CurrentUser = {
  name: string;
  email: string;
  avatarUrl?: string;
};

// Shown while the user is browsing as an anonymous guest.
const GUEST_USER: CurrentUser = {
  name: "Guest",
  email: "Sign in to use groups",
};

const DEFAULT_SETTINGS: UserSettings = {
  pushAlerts: true,
  shareLocationByDefault: false,
  largeText: false,
  colourBlindMode: false,
};

type SettingsRowProps = {
  label: string;
  description?: string;
  value?: boolean;
  onValueChange?: (next: boolean) => void;
  onPress?: () => void;
};

function SettingsRow({
  label,
  description,
  value,
  onValueChange,
  onPress,
}: SettingsRowProps) {
  const theme = useTheme();
  const isToggle = onValueChange !== undefined;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.row,
        { borderBottomColor: theme.backgroundSelected },
        pressed && !isToggle && styles.pressed,
      ]}
      onPress={onPress}
      disabled={isToggle && !onPress}
    >
      <View style={styles.rowTextWrap}>
        <ScaledText>{label}</ScaledText>
        {description ? (
          <ScaledText type="small" themeColor="textSecondary">
            {description}
          </ScaledText>
        ) : null}
      </View>

      {isToggle ? (
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: theme.backgroundSelected, true: ACCENT }}
          thumbColor="#FFFFFF"
        />
      ) : onPress ? (
        <ScaledText themeColor="textSecondary" style={styles.chevron}>
          {"›"}
        </ScaledText>
      ) : null}
    </Pressable>
  );
}

function SettingsSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.section}>
      <ScaledText
        type="smallBold"
        themeColor="textSecondary"
        style={styles.sectionTitle}
      >
        {title}
      </ScaledText>
      <ThemedView type="backgroundElement" style={styles.sectionCard}>
        {children}
      </ThemedView>
    </View>
  );
}

// Temporary message for features that need a backend or another screen first.
function showComingSoon(feature: string) {
  Alert.alert(
    "Coming soon",
    `${feature} will be available in a future update.`,
  );
}

type SettingsScreenProps = {
  user?: CurrentUser;
  onEditProfile?: () => void;
  onChangePassword?: () => void;
  onPrivacyPolicy?: () => void;
  onTermsOfUse?: () => void;
  onLogOut?: () => void;
  onSignIn?: () => void;
};

export default function SettingsScreen({
  user: userOverride,
  onEditProfile = () => showComingSoon("Editing your profile"),
  onChangePassword = () => showComingSoon("Changing your password"),
  onPrivacyPolicy,
  onTermsOfUse,
  onLogOut,
  onSignIn,
}: SettingsScreenProps) {
  const theme = useTheme();
  const safeAreaInsets = useSafeAreaInsets();
  const insets = {
    ...safeAreaInsets,
    bottom: safeAreaInsets.bottom + BottomTabInset + Spacing.three,
  };

  const contentPlatformStyle = Platform.select({
    android: {
      paddingTop: insets.top,
      paddingLeft: insets.left,
      paddingRight: insets.right,
      paddingBottom: insets.bottom,
    },
    web: {
      paddingTop: Spacing.six,
      paddingBottom: Spacing.four,
    },
  });

  const { isLoggedIn } = useAuth();
  const { uid, profile } = useMyProfile();
  const { largeText } = useAccessibility();

  // Saved settings win. Changes made before sign-in finishes are kept locally
  // and saved with the next change.
  const [local, setLocal] = useState<Partial<UserSettings>>({});
  const settings: UserSettings = {
    ...DEFAULT_SETTINGS,
    ...local,
    ...profile?.settings,
  };

  function saveSetting<K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K],
  ) {
    setLocal((current) => ({ ...current, [key]: value }));
    if (!uid) return;
    updateProfile(uid, { settings: { ...settings, [key]: value } }).catch(
      () => {
        Alert.alert("Could not save", "Check your connection and try again.");
      },
    );
  }

  // Apply the saved Larger text choice when the profile loads.
  const savedLargeText = profile?.settings?.largeText;
  useEffect(() => {
    if (savedLargeText !== undefined) setLargeText(savedLargeText);
  }, [savedLargeText]);

  const user: CurrentUser =
    userOverride ??
    (isLoggedIn
      ? {
          name: profile?.displayName ?? "",
          email: profile?.email ?? "",
          avatarUrl: profile?.avatarUrl,
        }
      : GUEST_USER);

  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: theme.background }]}
      contentInset={insets}
      contentContainerStyle={[styles.contentContainer, contentPlatformStyle]}
      showsVerticalScrollIndicator={false}
    >
      <ThemedView style={styles.container}>
        <ScaledText type="subtitle" style={styles.screenTitle}>
          Settings
        </ScaledText>

        <ThemedView type="backgroundElement" style={styles.accountCard}>
          {user.avatarUrl ? (
            <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <ScaledText type="smallBold" style={styles.avatarFallbackText}>
                {initials}
              </ScaledText>
            </View>
          )}
          <View style={styles.accountTextWrap}>
            <ScaledText type="smallBold">{user.name}</ScaledText>
            <ScaledText type="small" themeColor="textSecondary">
              {user.email}
            </ScaledText>
          </View>
        </ThemedView>

        <SettingsSection title="Account">
          {isLoggedIn ? (
            <>
              <SettingsRow
                label="Edit profile"
                description="Name, email and phone number"
                // TODO: replace the "coming soon" message with the Profile edit
                // screen once it exists.
                onPress={onEditProfile}
              />
              <SettingsRow
                label="Change password"
                description="We'll email you a reset link"
                onPress={onChangePassword}
              />
            </>
          ) : (
            <SettingsRow
              label="Sign in or register"
              description="Needed for groups and location sharing"
              onPress={onSignIn}
            />
          )}
        </SettingsSection>

        <SettingsSection title="Notifications">
          <SettingsRow
            label="Push alerts"
            description="Storm warnings and road closures from admins"
            value={settings.pushAlerts}
            // Saved now. Sending push notifications is out of v1 scope (docs/ROADMAP.md).
            onValueChange={(next) => saveSetting("pushAlerts", next)}
          />
        </SettingsSection>

        <SettingsSection title="Location">
          <SettingsRow
            label="Share my location by default"
            description="Applies when you share your location"
            value={settings.shareLocationByDefault}
            // Saved now. TODO: use it as the default for the SOS "share location" action.
            onValueChange={(next) =>
              saveSetting("shareLocationByDefault", next)
            }
          />
        </SettingsSection>

        <SettingsSection title="Accessibility">
          <SettingsRow
            label="Larger text"
            description="Increases text size across the app"
            value={largeText}
            // Saved now. Other screens grow too once ThemedText reads
            // useAccessibility().textScale (see accessibility.ts).
            onValueChange={(next) => {
              setLargeText(next);
              saveSetting("largeText", next);
            }}
          />
          <SettingsRow
            label="Colour-blind friendly mode"
            description="Adjusts the map and risk colours"
            value={settings.colourBlindMode}
            // Saved now. TODO: the map and risk colours need to read this before it has any effect.
            onValueChange={(next) => saveSetting("colourBlindMode", next)}
          />
        </SettingsSection>

        <SettingsSection title="About">
          <SettingsRow label="App version" description="1.0.0" />
          <SettingsRow label="Privacy policy" onPress={onPrivacyPolicy} />
          <SettingsRow label="Terms of use" onPress={onTermsOfUse} />
        </SettingsSection>

        {isLoggedIn ? (
          <Pressable onPress={onLogOut}>
            <ThemedView type="backgroundElement" style={styles.logOutButton}>
              <ScaledText type="smallBold" style={{ color: DANGER }}>
                Log out
              </ScaledText>
            </ThemedView>
          </Pressable>
        ) : null}
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  contentContainer: { alignItems: "center" },
  container: {
    width: "100%",
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
  },
  screenTitle: { marginBottom: Spacing.three },

  accountCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: Spacing.three,
    padding: Spacing.three,
    marginBottom: Spacing.four,
  },
  avatar: { width: 56, height: 56, borderRadius: 28 },
  avatarFallback: {
    backgroundColor: ACCENT,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarFallbackText: { color: "#FFFFFF", fontSize: 18 },
  accountTextWrap: { marginLeft: Spacing.three, flexShrink: 1 },

  section: { marginBottom: Spacing.four },
  sectionTitle: {
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: Spacing.two,
    marginLeft: Spacing.one,
  },
  sectionCard: { borderRadius: Spacing.three, overflow: "hidden" },

  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowTextWrap: { flexShrink: 1, paddingRight: Spacing.three },
  chevron: { fontSize: 20 },
  pressed: { opacity: 0.6 },

  logOutButton: {
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
    alignItems: "center",
    marginBottom: Spacing.four,
  },
});
