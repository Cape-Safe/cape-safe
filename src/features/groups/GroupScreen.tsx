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
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { BottomTabInset, Spacing } from "@/constants/theme";
import { useGroup } from "@/hooks/use-group";
import { useMyProfile } from "@/hooks/use-my-profile";
import { useNow } from "@/hooks/use-now";
import { createGroup, joinGroup, leaveGroup } from "@/services/groups";
import { updateProfile } from "@/services/users";

import { isFresh, lastSeenLabel } from "./lastSeen";

export default function GroupScreen() {
  const { isLoggedIn, loading: authLoading } = useAuth();
  const { uid, profile, groupCode, loading } = useMyProfile();

  if (!authLoading && !isLoggedIn) {
    return (
      <ThemedView style={styles.gate}>
        <ThemedText type="title">Groups</ThemedText>
        <ThemedText>
          Sign in to create or join a group and share your live location with
          friends.
        </ThemedText>
        <Button
          label="Sign in or register"
          onPress={() => router.navigate("/login")}
        />
      </ThemedView>
    );
  }

  if (loading || !uid) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText>Loading…</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView edges={["top"]} style={styles.screen}>
        <ScrollView contentContainerStyle={styles.content}>
          <ThemedText type="title">Group</ThemedText>
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
        <ThemedText type="smallBold">Your name</ThemedText>
        <Input value={name} onChangeText={setName} placeholder="e.g. Sam" />
      </Card>

      <Card>
        <ThemedText type="subtitle">Start a group</ThemedText>
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
        <ThemedText type="subtitle">Join a group</ThemedText>
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
        <ThemedText type="subtitle">{group?.name ?? "Your group"}</ThemedText>
        <ThemedText themeColor="textSecondary">
          {group?.memberIds.length ?? 1} member(s) · invite code
        </ThemedText>
        <ThemedText type="title" style={styles.code}>
          {code}
        </ThemedText>
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
            <ThemedText type="smallBold">Share my location</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Only while the app is open
            </ThemedText>
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
        <ThemedText type="smallBold">Sharing now</ThemedText>
        {sharingNow.length === 0 ? (
          <ThemedText type="small" themeColor="textSecondary">
            Nobody is sharing their location right now.
          </ThemedText>
        ) : (
          sharingNow.map((l) => (
            <View key={l.uid} style={styles.row}>
              <ThemedText>
                {l.uid === uid ? `${l.displayName} (you)` : l.displayName}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {lastSeenLabel(l, now)}
              </ThemedText>
            </View>
          ))
        )}
      </Card>

      <Pressable onPress={confirmLeave} style={styles.leave}>
        <ThemedText style={styles.leaveText}>Leave group</ThemedText>
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
