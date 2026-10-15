import { Alert, Linking, Pressable, StyleSheet } from "react-native";

import { Card } from "@/components/card";
import { Screen } from "@/components/screen";
import { ThemedText } from "@/ui/themed";
import { EMERGENCY_NUMBERS } from "@/data/mock";

export default function EmergencyScreen() {
  return (
    <Screen title="Emergency" subtitle="Get help fast. (Mock screen: SOS does not send anything yet.)">
      <Pressable
        style={styles.sos}
        onLongPress={() => Alert.alert("SOS (mock)", "In the real app this will alert your trusted contacts with your live location.")}
        delayLongPress={1200}>
        <ThemedText style={styles.sosText}>SOS</ThemedText>
        <ThemedText style={styles.sosHint}>Hold for 1 second</ThemedText>
      </Pressable>

      {EMERGENCY_NUMBERS.map((n) => (
        <Pressable key={n.number} onPress={() => Linking.openURL(`tel:${n.number.replace(/\s/g, "")}`)}>
          <Card>
            <ThemedText type="smallBold">{n.label}</ThemedText>
            <ThemedText type="subtitle">{n.number}</ThemedText>
          </Card>
        </Pressable>
      ))}

      <Card>
        <ThemedText type="smallBold">Trusted contacts</ThemedText>
        <ThemedText themeColor="textSecondary">Add people who get notified when you press SOS. Coming soon.</ThemedText>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sos: { backgroundColor: "#FF3B30", borderRadius: 999, aspectRatio: 1, width: "60%", alignSelf: "center", alignItems: "center", justifyContent: "center" },
  sosText: { color: "#fff", fontSize: 48, fontWeight: "800" },
  sosHint: { color: "#fff", opacity: 0.85 },
});
