// SettingsScreen.tsx
// Settings screen for Cape Safe. The toggles are saved to the signed-in
// user's Firestore profile (users/{uid}.settings).

import { SymbolView, type SymbolViewProps } from "expo-symbols";
import { useEffect, useState, type ReactNode } from "react";
import { Alert, Image, StyleSheet, Switch, View } from "react-native";

import { PressableScale } from "@/components/design/PressableScale";
import { ScreenScaffold } from "@/components/design/ScreenScaffold";
import { Button, Card } from "@/components/ui/form";
import { usePalette } from "@/constants/design";
import { Spacing } from "@/constants/theme";
import { useAuth } from "@/hooks/use-auth";
import { useMyProfile } from "@/hooks/use-my-profile";
import { updateProfile } from "@/services/users";
import type { UserSettings } from "@/types";

import { ScaledText } from "./ScaledText";
import { setLargeText, useAccessibility } from "./accessibility";

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

const ICONS = {
  edit: { ios: "pencil", android: "edit", web: "edit" },
  key: { ios: "key.fill", android: "key", web: "key" },
  bell: { ios: "bell.fill", android: "notifications", web: "notifications" },
  pin: { ios: "location.fill", android: "location_on", web: "location_on" },
  text: { ios: "textformat.size", android: "text_fields", web: "text_fields" },
  eye: { ios: "eye.fill", android: "visibility", web: "visibility" },
  lock: { ios: "lock.fill", android: "lock", web: "lock" },
  doc: { ios: "doc.text.fill", android: "description", web: "description" },
  info: { ios: "info.circle.fill", android: "info", web: "info" },
} as const satisfies Record<string, SymbolViewProps["name"]>;

type IconKey = keyof typeof ICONS;

type SettingsRowProps = {
  icon: IconKey;
  label: string;
  description?: string;
  value?: boolean;
  onValueChange?: (next: boolean) => void;
  onPress?: () => void;
  last?: boolean;
};

function SettingsRow({
  icon,
  label,
  description,
  value,
  onValueChange,
  onPress,
  last,
}: SettingsRowProps) {
  const palette = usePalette();
  const isToggle = onValueChange !== undefined;
  const content = (
    <>
      <View style={[styles.icon, { backgroundColor: palette.accentSoft }]}>
        <SymbolView name={ICONS[icon]} size={20} tintColor={palette.accent} />
      </View>
      <View style={styles.rowTextWrap}>
        <ScaledText type="smallBold" style={{ color: palette.ink }}>
          {label}
        </ScaledText>
        {description ? (
          <ScaledText type="small" style={{ color: palette.muted }}>
            {description}
          </ScaledText>
        ) : null}
      </View>
      {isToggle ? (
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: palette.line, true: palette.accent }}
          thumbColor="#FFFFFF"
          accessibilityLabel={label}
        />
      ) : onPress ? (
        <SymbolView
          name={{
            ios: "chevron.right",
            android: "chevron_right",
            web: "chevron_right",
          }}
          size={16}
          tintColor={palette.muted}
        />
      ) : null}
    </>
  );

  const rowStyle = [
    styles.row,
    !last && {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: palette.line,
    },
  ];

  if (!onPress) return <View style={rowStyle}>{content}</View>;
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={rowStyle}
    >
      {content}
    </PressableScale>
  );
}

function SettingsSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const palette = usePalette();
  return (
    <View style={styles.section}>
      <ScaledText
        type="smallBold"
        accessibilityRole="header"
        style={[styles.sectionTitle, { color: palette.muted }]}
      >
        {title.toUpperCase()}
      </ScaledText>
      <Card style={styles.sectionCard}>{children}</Card>
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
  const palette = usePalette();
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
    <ScreenScaffold eyebrow="Settings" title="Your account">
      <Card>
        <View style={styles.accountRow}>
          {user.avatarUrl ? (
            <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
          ) : (
            <View
              style={[
                styles.avatar,
                styles.avatarFallback,
                { backgroundColor: palette.accentSoft },
              ]}
            >
              <ScaledText
                type="smallBold"
                style={[styles.avatarFallbackText, { color: palette.accent }]}
              >
                {initials || "?"}
              </ScaledText>
            </View>
          )}
          <View style={styles.accountTextWrap}>
            <ScaledText type="heading" style={{ color: palette.ink }}>
              {user.name}
            </ScaledText>
            <ScaledText type="small" style={{ color: palette.muted }}>
              {user.email}
            </ScaledText>
          </View>
        </View>
        {!isLoggedIn && onSignIn ? (
          <Button label="Sign in or register" onPress={onSignIn} />
        ) : null}
      </Card>

      {isLoggedIn ? (
        <SettingsSection title="Account">
          <SettingsRow
            icon="edit"
            label="Edit profile"
            description="Name, email and phone number"
            // TODO: replace the "coming soon" message with the Profile edit
            // screen once it exists.
            onPress={onEditProfile}
          />
          <SettingsRow
            icon="key"
            label="Change password"
            description="We'll email you a reset link"
            onPress={onChangePassword}
            last
          />
        </SettingsSection>
      ) : null}

      <SettingsSection title="Notifications">
        <SettingsRow
          icon="bell"
          label="Push alerts"
          description="Storm warnings and road closures from admins"
          value={settings.pushAlerts}
          // Saved now. Sending push notifications is out of v1 scope (docs/ROADMAP.md).
          onValueChange={(next) => saveSetting("pushAlerts", next)}
          last
        />
      </SettingsSection>

      <SettingsSection title="Location">
        <SettingsRow
          icon="pin"
          label="Share my location by default"
          description="Applies when you share your location"
          value={settings.shareLocationByDefault}
          // Saved now. TODO: use it as the default for the SOS "share location" action.
          onValueChange={(next) => saveSetting("shareLocationByDefault", next)}
          last
        />
      </SettingsSection>

      <SettingsSection title="Accessibility">
        <SettingsRow
          icon="text"
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
          icon="eye"
          label="Colour-blind friendly mode"
          description="Adjusts the map and risk colours"
          value={settings.colourBlindMode}
          // Saved now. TODO: the map and risk colours need to read this before it has any effect.
          onValueChange={(next) => saveSetting("colourBlindMode", next)}
          last
        />
      </SettingsSection>

      <SettingsSection title="About">
        <SettingsRow icon="info" label="App version" description="1.0.0" />
        <SettingsRow
          icon="lock"
          label="Privacy policy"
          onPress={onPrivacyPolicy}
        />
        <SettingsRow
          icon="doc"
          label="Terms of use"
          onPress={onTermsOfUse}
          last
        />
      </SettingsSection>

      {isLoggedIn ? (
        <PressableScale
          onPress={onLogOut}
          accessibilityRole="button"
          accessibilityLabel="Log out"
        >
          <Card style={styles.logOutButton}>
            <ScaledText type="smallBold" style={{ color: palette.danger }}>
              Log out
            </ScaledText>
          </Card>
        </PressableScale>
      ) : null}
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  accountRow: { flexDirection: "row", alignItems: "center", gap: Spacing.three },
  avatar: { width: 56, height: 56, borderRadius: 28 },
  avatarFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  avatarFallbackText: { fontSize: 18 },
  accountTextWrap: { flexShrink: 1 },

  section: { gap: Spacing.two },
  sectionTitle: {
    letterSpacing: 1.6,
    fontSize: 11,
    marginLeft: Spacing.one,
  },
  sectionCard: { padding: 0, gap: 0, overflow: "hidden" },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
    minHeight: 64,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  rowTextWrap: { flex: 1 },

  logOutButton: {
    paddingVertical: Spacing.three,
    alignItems: "center",
  },
});
