import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, TextInput } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/ui/theme";
import { ThemedText, ThemedView } from "@/ui/themed";

export default function LoginScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const input = [styles.input, { backgroundColor: theme.backgroundElement, color: theme.text }];

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top + 48 }]}>
      <ThemedText type="title">Cape Safe</ThemedText>
      <ThemedText themeColor="textSecondary">Sign in (mock: any details work).</ThemedText>
      <TextInput style={input} placeholder="Email" placeholderTextColor={theme.textSecondary}
        autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
      <TextInput style={input} placeholder="Password" placeholderTextColor={theme.textSecondary}
        secureTextEntry value={password} onChangeText={setPassword} />
      <Pressable style={styles.button} onPress={() => router.replace("/")}>
        <ThemedText style={styles.buttonText}>Sign in</ThemedText>
      </Pressable>
      <Pressable onPress={() => router.back()}>
        <ThemedText type="link" style={styles.center}>Continue as guest</ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 14 },
  input: { borderRadius: 12, padding: 14, fontSize: 16 },
  button: { backgroundColor: "#208AEF", borderRadius: 12, padding: 14, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "700" },
  center: { textAlign: "center" },
});
