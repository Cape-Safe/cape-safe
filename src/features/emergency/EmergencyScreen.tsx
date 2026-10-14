import { StyleSheet } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

// Placeholder until the SOS screen is built.
export default function EmergencyScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">SOS</ThemedText>
      <ThemedText>Emergency screen coming soon</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
});
