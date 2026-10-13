// SettingsScreen.tsx
// Settings screen for Cape Safe. UI only for now: see the "TODO: connect"
// comments for where Firebase and navigation need to be wired in.

import { useState, type ReactNode } from 'react';
import {
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { ScaledText } from './ScaledText';
import { setLargeText, useAccessibility } from './accessibility';

// Accent colours that are not in src/constants/theme.ts yet.
// TODO: move these into the theme once the team picks a palette.
const ACCENT = '#1DB2F5';
const DANGER = '#C0392B';

type CurrentUser = {
  name: string;
  email: string;
  avatarUrl?: string;
};

// TODO: connect to the signed-in Firebase user (src/services/firebase.ts).
const DEFAULT_USER: CurrentUser = {
  name: 'Denzel Chingodza',
  email: 'denzel.chingodza@icloud.com',
};

type SettingsRowProps = {
  label: string;
  description?: string;
  value?: boolean;
  onValueChange?: (next: boolean) => void;
  onPress?: () => void;
};

function SettingsRow({ label, description, value, onValueChange, onPress }: SettingsRowProps) {
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
      disabled={isToggle && !onPress}>
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
          {'›'}
        </ScaledText>
      ) : null}
    </Pressable>
  );
}

function SettingsSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <ScaledText type="smallBold" themeColor="textSecondary" style={styles.sectionTitle}>
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
  Alert.alert('Coming soon', `${feature} will be available in a future update.`);
}

type SettingsScreenProps = {
  user?: CurrentUser;
  onEditProfile?: () => void;
  onChangePassword?: () => void;
  onPrivacyPolicy?: () => void;
  onTermsOfUse?: () => void;
  onLogOut?: () => void;
};

export default function SettingsScreen({
  user = DEFAULT_USER,
  onEditProfile = () => showComingSoon('Editing your profile'),
  onChangePassword = () => showComingSoon('Changing your password'),
  onPrivacyPolicy,
  onTermsOfUse,
  onLogOut,
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

  // TODO: read and save these from the user's stored settings (Firestore users/{uid}).
  const [pushAlerts, setPushAlerts] = useState(true);
  const [shareLocationByDefault, setShareLocationByDefault] = useState(false);
  const { largeText } = useAccessibility();
  const [colourBlindMode, setColourBlindMode] = useState(false);

  const initials = user.name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: theme.background }]}
      contentInset={insets}
      contentContainerStyle={[styles.contentContainer, contentPlatformStyle]}
      showsVerticalScrollIndicator={false}>
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
          <SettingsRow
            label="Edit profile"
            description="Name, email and phone number"
            // TODO: replace the "coming soon" message with the Profile edit
            // screen once it exists.
            onPress={onEditProfile}
          />
          <SettingsRow
            label="Change password"
            // TODO: replace the "coming soon" message with Firebase
            // Authentication's password reset flow.
            onPress={onChangePassword}
          />
        </SettingsSection>

        <SettingsSection title="Notifications">
          <SettingsRow
            label="Push alerts"
            description="Storm warnings and road closures from admins"
            value={pushAlerts}
            // TODO: push notifications are out of v1 scope (see docs/ROADMAP.md).
            onValueChange={setPushAlerts}
          />
        </SettingsSection>

        <SettingsSection title="Location">
          <SettingsRow
            label="Share my location by default"
            description="Applies when you share your location"
            value={shareLocationByDefault}
            // TODO: save as the default for the SOS "share location" action.
            onValueChange={setShareLocationByDefault}
          />
        </SettingsSection>

        <SettingsSection title="Accessibility">
          <SettingsRow
            label="Larger text"
            description="Increases text size across the app"
            value={largeText}
            // Works on the settings screens now. Other screens grow too once
            // ThemedText reads useAccessibility().textScale (see accessibility.ts).
            onValueChange={setLargeText}
          />
          <SettingsRow
            label="Colour-blind friendly mode"
            description="Adjusts the map and risk colours"
            value={colourBlindMode}
            // TODO: needs an app-wide setting before this has any effect.
            onValueChange={setColourBlindMode}
          />
        </SettingsSection>

        <SettingsSection title="About">
          <SettingsRow label="App version" description="1.0.0" />
          <SettingsRow label="Privacy policy" onPress={onPrivacyPolicy} />
          <SettingsRow label="Terms of use" onPress={onTermsOfUse} />
        </SettingsSection>

        <Pressable onPress={onLogOut}>
          <ThemedView type="backgroundElement" style={styles.logOutButton}>
            <ScaledText type="smallBold" style={{ color: DANGER }}>
              Log out
            </ScaledText>
          </ThemedView>
        </Pressable>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  contentContainer: { alignItems: 'center' },
  container: {
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
  },
  screenTitle: { marginBottom: Spacing.three },

  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Spacing.three,
    padding: Spacing.three,
    marginBottom: Spacing.four,
  },
  avatar: { width: 56, height: 56, borderRadius: 28 },
  avatarFallback: {
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: { color: '#FFFFFF', fontSize: 18 },
  accountTextWrap: { marginLeft: Spacing.three, flexShrink: 1 },

  section: { marginBottom: Spacing.four },
  sectionTitle: {
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.two,
    marginLeft: Spacing.one,
  },
  sectionCard: { borderRadius: Spacing.three, overflow: 'hidden' },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    alignItems: 'center',
    marginBottom: Spacing.four,
  },
});
