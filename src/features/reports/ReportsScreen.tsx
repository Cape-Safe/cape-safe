import { Alert, Pressable, StyleSheet, View } from "react-native";

import { Card } from "@/components/card";
import { Screen } from "@/components/screen";
import { ThemedText } from "@/ui/themed";
import { INCIDENTS, SEVERITY_COLOR } from "@/data/mock";

export default function ReportsScreen() {
  return (
    <Screen title="Reports" subtitle="Recent incidents near you. (Sample data.)">
      <Pressable
        style={styles.button}
        onPress={() => Alert.alert("Report incident (mock)", "The report form will go here.")}>
        <ThemedText style={styles.buttonText}>+ Report an incident</ThemedText>
      </Pressable>

      {INCIDENTS.map((i) => (
        <Card key={i.id}>
          <View style={styles.row}>
            <View style={[styles.dot, { backgroundColor: SEVERITY_COLOR[i.severity] }]} />
            <ThemedText type="smallBold" style={styles.flex}>{i.title}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">{i.reportedAt}</ThemedText>
          </View>
          <ThemedText type="small" themeColor="textSecondary">{i.category}</ThemedText>
          <ThemedText>{i.description}</ThemedText>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  button: { backgroundColor: "#208AEF", borderRadius: 12, padding: 14, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "700" },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  flex: { flex: 1 },
  dot: { width: 10, height: 10, borderRadius: 5 },
});
