import { router } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useState } from "react";
import { Alert, Share, StyleSheet, Switch, View } from "react-native";

import { PressableScale } from "@/components/design/PressableScale";
import { ScreenScaffold } from "@/components/design/ScreenScaffold";
import { ThemedView } from "@/components/themed-view";
import { Button, Card, Input } from "@/components/ui/form";
import { usePalette } from "@/constants/design";
import { Spacing } from "@/constants/theme";
import { ScaledText } from "@/features/settings/ScaledText";
import { useAuth } from "@/hooks/use-auth";
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
      <ScreenScaffold
        eyebrow="Group"
        title="Groups"
        lede="Keep track of friends and family while you explore."
      >
        <Card>
          <ScaledText>
            Sign in to create or join a group and share your live location with
            friends.
          </ScaledText>
          <Button
            label="Sign in or register"
            onPress={() => router.navigate("/settings/login")}
          />
        </Card>
      </ScreenScaffold>
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

  return groupCode ? (
    <GroupDetails
      uid={uid}
      code={groupCode}
      sharing={profile?.locationSharing ?? false}
    />
  ) : (
    <NoGroup uid={uid} savedName={profile?.displayName ?? ""} />
  );
}

function Label({ children }: { children: string }) {
  const palette = usePalette();
  return (
    <ScaledText
      type="smallBold"
      accessibilityRole="header"
      style={[styles.label, { color: palette.muted }]}
    >
      {children.toUpperCase()}
    </ScaledText>
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
    <ScreenScaffold
      eyebrow="Group"
      title="Join or start a group"
      lede="Your group sees your name and live location on the map."
    >
      <Card>
        <Label>Your name</Label>
        <Input value={name} onChangeText={setName} placeholder="e.g. Sam" />
      </Card>

      <Card>
        <Label>Start a group</Label>
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
        <Label>Join a group</Label>
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
    </ScreenScaffold>
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
  const palette = usePalette();
  const { group, locations } = useGroup(code);
  // Re-render every 30 s so "last seen" labels stay current
  const now = useNow(30_000);
  const sharingNow = locations.filter((l) => isFresh(l, now));
  const memberCount = group?.memberIds.length ?? 1;

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
    <ScreenScaffold
      eyebrow="Group"
      title={group?.name ?? "Your group"}
      meta={
        <View style={styles.metaRow}>
          <View style={[styles.liveDot, { backgroundColor: palette.live }]} />
          <ScaledText type="small" style={{ color: palette.onDarkMuted }}>
            {memberCount} {memberCount === 1 ? "member" : "members"}
          </ScaledText>
        </View>
      }
    >
      <Card>
        <Label>Invite code</Label>
        <View
          style={styles.codeRow}
          accessible
          accessibilityLabel={`Invite code ${code.split("").join(" ")}`}
        >
          {code.split("").map((char, index) => (
            <View
              key={index}
              style={[
                styles.codeBox,
                { backgroundColor: palette.screen, borderColor: palette.line },
              ]}
            >
              <ScaledText
                type="subtitle"
                style={[styles.codeChar, { color: palette.ink }]}
              >
                {char}
              </ScaledText>
            </View>
          ))}
        </View>
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
          <View style={[styles.icon, { backgroundColor: palette.accentSoft }]}>
            <SymbolView
              name={{
                ios: "location.fill",
                android: "location_on",
                web: "location_on",
              }}
              size={20}
              tintColor={palette.accent}
            />
          </View>
          <View style={styles.rowText}>
            <ScaledText type="smallBold" style={{ color: palette.ink }}>
              Share my location
            </ScaledText>
            <ScaledText type="small" style={{ color: palette.muted }}>
              Only while the app is open
            </ScaledText>
          </View>
          <Switch
            value={sharing}
            trackColor={{ false: palette.line, true: palette.accent }}
            thumbColor="#FFFFFF"
            onValueChange={(value) =>
              updateProfile(uid, { locationSharing: value }).catch((err) =>
                Alert.alert("Couldn't update", String(err)),
              )
            }
          />
        </View>
      </Card>

      <Card>
        <Label>Sharing now</Label>
        {sharingNow.length === 0 ? (
          <ScaledText type="small" style={{ color: palette.muted }}>
            Nobody is sharing their location right now.
          </ScaledText>
        ) : (
          sharingNow.map((l) => (
            <View key={l.uid} style={styles.sharingRow}>
              <ScaledText style={{ color: palette.ink }}>
                {l.uid === uid ? `${l.displayName} (you)` : l.displayName}
              </ScaledText>
              <ScaledText type="small" style={{ color: palette.muted }}>
                {lastSeenLabel(l, now)}
              </ScaledText>
            </View>
          ))
        )}
      </Card>

      <PressableScale
        onPress={confirmLeave}
        accessibilityRole="button"
        style={styles.leave}
      >
        <ScaledText style={[styles.leaveText, { color: palette.danger }]}>
          Leave group
        </ScaledText>
      </PressableScale>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  label: { letterSpacing: 1.6, fontSize: 11 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: Spacing.two },
  liveDot: { width: 7, height: 7, borderRadius: 4 },
  codeRow: { flexDirection: "row", gap: Spacing.two, marginVertical: Spacing.one },
  codeBox: {
    flex: 1,
    minHeight: 52,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  codeChar: { fontSize: 22, lineHeight: 28, fontWeight: "700" },
  row: { flexDirection: "row", alignItems: "center", gap: Spacing.three },
  rowText: { flex: 1 },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  sharingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.two,
  },
  leave: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
    padding: Spacing.two,
  },
  leaveText: { fontWeight: "600" },
});
