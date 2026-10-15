import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Switch, View } from "react-native";

import { Card } from "@/components/card";
import { Screen } from "@/components/screen";
import { ThemedText } from "@/ui/themed";

export default function ProfileScreen() {
  const [alerts, setAlerts] = useState(true);
  const [sharing, setSharing] = useState(false);

  return (
    <Screen title="Profile" subtitle="Mock screen: nothing is saved yet.">
      <Card>
        <ThemedText type="smallBold">Guest user</ThemedText>
        <ThemedText themeColor="textSecondary">Sign in to sync reports and trusted contacts.</ThemedText>
        <Pressable style={styles.button} onPress={() => router.push("/login")}>
          <ThemedText style={styles.buttonText}>Sign in</ThemedText>
        </Pressable>
      </Card>

      <Card>
        <View style={styles.row}>
          <ThemedText style={styles.flex}>Safety alerts nearby</ThemedText>
          <Switch value={alerts} onValueChange={setAlerts} />
        </View>
        <View style={styles.row}>
          <ThemedText style={styles.flex}>Share live location with contacts</ThemedText>
          <Switch value={sharing} onValueChange={setSharing} />
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  button: { backgroundColor: "#208AEF", borderRadius: 12, padding: 12, alignItems: "center", marginTop: 8 },
  buttonText: { color: "#fff", fontWeight: "700" },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  flex: { flex: 1 },
});
