// EmergencyProfileScreen.tsx
// Emergency details and document vault. Needs a real (non-guest) account.
// Everything saved here is private to the signed-in user (see firestore.rules
// and storage.rules). Never log values from this screen.

import { router } from "expo-router";
import { useState } from "react";
import { Alert, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Button, Card } from "@/components/ui/form";
import { BottomTabInset, Spacing } from "@/constants/theme";
import { ScaledText } from "@/features/settings/ScaledText";
import { useAuth } from "@/hooks/use-auth";
import { useDocuments, useEmergencyProfile } from "@/hooks/use-emergency-data";
import { deleteAllEmergencyData } from "@/services/documents";
import { saveEmergencyProfile } from "@/services/emergencyProfile";
import type { EmergencyProfile } from "@/types";

import { DocumentsSection } from "./DocumentsSection";
import { ProfileFields } from "./ProfileFields";
import {
  formToProfile,
  profileToForm,
  validateForm,
  type FieldErrors,
  type ProfileForm,
} from "./profileValidation";

export default function EmergencyProfileScreen() {
  const { user, isLoggedIn, loading: authLoading } = useAuth();
  const uid = isLoggedIn ? user?.uid : undefined;
  const { profile, loading, error } = useEmergencyProfile(uid);
  const docs = useDocuments(uid);

  if (authLoading || (isLoggedIn && loading)) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText>Loading…</ThemedText>
      </ThemedView>
    );
  }

  if (!isLoggedIn || !uid) {
    return (
      <ThemedView style={styles.gate}>
        <ThemedText type="title">Emergency profile</ThemedText>
        <ThemedText>Sign in to save your emergency details.</ThemedText>
        <Button label="Sign in or register" onPress={() => router.navigate("/settings/login")} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView edges={["top"]} style={styles.screen}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <ThemedText type="title">Emergency profile</ThemedText>
          {error && (
            <ScaledText type="small" style={styles.error} accessibilityRole="alert">
              Couldn&apos;t load your saved details. Check your connection.
            </ScaledText>
          )}

          {!profile?.consentAcceptedAt ? (
            <ConsentCard uid={uid} />
          ) : (
            <>
              <Editor key={uid} uid={uid} initial={profile} />
              <DocumentsSection uid={uid} documents={docs.documents} loading={docs.loading} error={docs.error} />
              <DeleteAll uid={uid} />
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

// First time only: explain what is stored before anything is saved.
function ConsentCard({ uid }: { uid: string }) {
  const [busy, setBusy] = useState(false);

  async function accept() {
    setBusy(true);
    try {
      await saveEmergencyProfile(uid, { nextOfKin: [] });
    } catch {
      Alert.alert("Couldn't continue", "Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <ScaledText type="heading" accessibilityRole="header">Before you start</ScaledText>
      <ScaledText>
        Store your emergency documents (ID, insurance, medical aid etc) for easy access and safe
        keeping.
      </ScaledText>
      <ScaledText>
        Why: so you and the people helping you can find this quickly in an emergency.
      </ScaledText>
      <ScaledText>
        Who can see it: only you, while signed in. It is never shared with your group or used for
        location sharing.
      </ScaledText>
      <ScaledText>
        You can edit or delete any item at any time, or use &quot;Delete all my emergency data&quot;
        at the bottom of this page. See the privacy policy in Settings for more.
      </ScaledText>
      <Button label={busy ? "Please wait…" : "I understand, continue"} disabled={busy} onPress={accept} />
    </Card>
  );
}

function Editor({ uid, initial }: { uid: string; initial: EmergencyProfile }) {
  const [form, setForm] = useState<ProfileForm>(() => profileToForm(initial));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);

  const change = (patch: Partial<ProfileForm>) => setForm((f) => ({ ...f, ...patch }));

  async function save() {
    const found = validateForm(form);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      Alert.alert("Check your details", "Some fields need fixing. They are marked in red.");
      return;
    }
    setSaving(true);
    try {
      await saveEmergencyProfile(uid, formToProfile(form), initial.consentAcceptedAt);
      Alert.alert("Saved", "Your emergency details are saved.");
    } catch {
      Alert.alert("Couldn't save", "Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <ProfileFields form={form} errors={errors} onChange={change} />
      <Button label={saving ? "Saving…" : "Save details"} disabled={saving} onPress={save} />
    </>
  );
}

function DeleteAll({ uid }: { uid: string }) {
  const [busy, setBusy] = useState(false);

  function confirm() {
    Alert.alert(
      "Delete all my emergency data?",
      "This removes your saved details and every uploaded document. It can't be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete everything",
          style: "destructive",
          onPress: async () => {
            setBusy(true);
            try {
              await deleteAllEmergencyData(uid);
              Alert.alert("Deleted", "Your emergency data has been removed.");
            } catch {
              Alert.alert("Couldn't delete everything", "Check your connection and try again.");
            } finally {
              setBusy(false);
            }
          },
        },
      ],
    );
  }

  return (
    <Card>
      <ScaledText type="heading" accessibilityRole="header">Delete my data</ScaledText>
      <ScaledText type="small" themeColor="textSecondary">
        Permanently removes everything on this page from your account.
      </ScaledText>
      <Button label={busy ? "Deleting…" : "Delete all my emergency data"} disabled={busy} onPress={confirm} />
    </Card>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  gate: { flex: 1, justifyContent: "center", padding: Spacing.four, gap: Spacing.three },
  content: {
    padding: Spacing.four,
    gap: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.six,
  },
  error: { color: "#B91C1C" },
});
