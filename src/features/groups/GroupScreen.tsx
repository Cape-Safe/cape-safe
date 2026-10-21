import { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

import { Button, Card, Input } from "@/components/ui/form";
import { useAuth } from "@/hooks/use-auth";
import { ScaledText } from "@/features/settings/ScaledText";
import { ThemedView } from "@/components/themed-view";
import { BottomTabInset, Spacing } from "@/constants/theme";
import { useGroup } from "@/hooks/use-group";
import { useMyProfile } from "@/hooks/use-my-profile";
import { useNow } from "@/hooks/use-now";
import { createGroup, joinGroup, leaveGroup } from "@/services/groups";
import { updateProfile } from "@/services/users";

import { isFresh, lastSeenLabel } from "./lastSeen";

// Group tab: sign-in prompt for guests, then either the create/join forms
// or the current group's details.

export default function GroupScreen() {
  // Guests use the app anonymously; groups need a real account.
  const { isLoggedIn, loading: authLoading } = useAuth();
  const { uid, profile, groupCode, loading } = useMyProfile();

  if (!authLoading && !isLoggedIn) {
    return (
      <ThemedView style={styles.gate}>
        <ScaledText type="subtitle">Groups</ScaledText>
        <ScaledText>
          Sign in to create or join a group and share your live location with
          friends.
        </ScaledText>
        <Button
          label="Sign in or register"
          onPress={() => router.navigate("/settings/login")}
        />
      </ThemedView>
    );
  }
  // Wait for the profile so we know whether the user is already in a group.
  if (loading || !uid) {
    return (
      <ThemedView style={styles.centered}>
        <ScaledText>Loading…</ScaledText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView edges={["top"]} style={styles.screen}>
        <ScrollView contentContainerStyle={styles.content}>
          <ScaledText type="subtitle">Group</ScaledText>
          {groupCode ? (
            <GroupDetails
              uid={uid}
              code={groupCode}
              sharing={profile?.locationSharing ?? false}
            />
          ) : (
            <NoGroup uid={uid} savedName={profile?.displayName ?? ""} />
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

// Shown when the user isn't in a group: set a display name, then create or join one.
function NoGroup({ uid, savedName }: { uid: string; savedName: string }) {
  const [name, setName] = useState(savedName);
  const [groupName, setGroupName] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  // Saves the user's name first: the group sees it on the map.
  async function run(action: () => Promise<unknown>) {
    if (!name.trim()) {
      Alert.alert("Enter your name", "Your group sees this name on the map.");
      return;
    }
    setBusy(true);
    try {
      await updateProfile(uid, { displayName: name.trim() });
      await action();
    } catch (err) {
      Alert.alert(
        "Something went wrong",
        err instanceof Error ? err.message : String(err),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Card>
        <ScaledText type="smallBold">Your name</ScaledText>
        <Input value={name} onChangeText={setName} placeholder="e.g. Sam" />
      </Card>

      <Card>
        <ScaledText type="heading">Start a group</ScaledText>
        <Input
          value={groupName}
          onChangeText={setGroupName}
          placeholder="Group name (optional)"
        />
        <Button
          label="Create group"
          disabled={busy}
          onPress={() =>
            run(() => createGroup(groupName.trim() || `${name.trim()}'s group`))
          }
        />
      </Card>

      <Card>
        <ScaledText type="heading">Join a group</ScaledText>
        <Input
          value={code}
          onChangeText={(text) => setCode(text.toUpperCase())}
          placeholder="6-character invite code"
          autoCapitalize="characters"
          maxLength={6}
        />
        <Button
          label="Join group"
          disabled={busy || code.trim().length !== 6}
          onPress={() => run(() => joinGroup(code))}
        />
      </Card>
    </>
  );
}

// Shown once the user is in a group: invite code, sharing toggle and who's sharing.
function GroupDetails({
  uid,
  code,
  sharing,
}: {
  uid: string;
  code: string;
  sharing: boolean;
}) {
  const { group, locations } = useGroup(code);
  // Re-render every 30 s so "last seen" labels stay current
  const now = useNow(30_000);
  const sharingNow = locations.filter((l) => isFresh(l, now));

  const confirmLeave = () =>
    Alert.alert(
      "Leave group?",
      "You'll stop sharing your location with this group.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Leave",
          style: "destructive",
          onPress: () =>
            leaveGroup(code).catch((err) =>
              Alert.alert("Couldn't leave", String(err)),
            ),
        },
      ],
    );

  return (
    <>
      <Card>
        <ScaledText type="heading">{group?.name ?? "Your group"}</ScaledText>
        <ScaledText themeColor="textSecondary">
          {group?.memberIds.length ?? 1} member(s) · invite code
        </ScaledText>
        <ScaledText type="subtitle" style={styles.code}>
          {code}
        </ScaledText>
        <Button
          label="Share invite code"
          onPress={() =>
            Share.share({
              message: `Join my Cape Safe group with code ${code}`,
            })
          }
        />
      </Card>

      <Card>
        <View style={styles.row}>
          <View style={styles.rowText}>
            <ScaledText type="smallBold">Share my location</ScaledText>
            <ScaledText type="small" themeColor="textSecondary">
              Only while the app is open
            </ScaledText>
          </View>
          <Switch
            value={sharing}
            onValueChange={(value) =>
              updateProfile(uid, { locationSharing: value }).catch((err) =>
                Alert.alert("Couldn't update", String(err)),
              )
            }
          />
        </View>
      </Card>

      <Card>
        <ScaledText type="smallBold">Sharing now</ScaledText>
        {sharingNow.length === 0 ? (
          <ScaledText type="small" themeColor="textSecondary">
            Nobody is sharing their location right now.
          </ScaledText>
        ) : (
          sharingNow.map((l) => (
            <View key={l.uid} style={styles.row}>
              <ScaledText>
                {l.uid === uid ? `${l.displayName} (you)` : l.displayName}
              </ScaledText>
              <ScaledText type="small" themeColor="textSecondary">
                {lastSeenLabel(l, now)}
              </ScaledText>
            </View>
          ))
        )}
      </Card>

      <Pressable onPress={confirmLeave} style={styles.leave}>
        <ScaledText style={styles.leaveText}>Leave group</ScaledText>
      </Pressable>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: {
    padding: Spacing.four,
    gap: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.four,
  },
  rowText: { flex: 1 },
  code: { letterSpacing: 4 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.two,
  },
  leave: { alignItems: "center", padding: Spacing.three },
  leaveText: { color: "#C0392B", fontWeight: "600" },
  gate: {
    flex: 1,
    justifyContent: "center",
    padding: Spacing.four,
    gap: Spacing.three,
  },
});
