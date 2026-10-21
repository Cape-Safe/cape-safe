import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Redirect } from "expo-router";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Button, Card, Input } from "@/components/ui/form";
import { BottomTabInset, Spacing } from "@/constants/theme";
import { useAuth } from "@/hooks/use-auth";
import {
  authErrorMessage,
  logIn,
  register,
  resetPassword,
} from "@/services/auth";

export default function LoginScreen() {
  const { isLoggedIn, loading } = useAuth();

  if (loading) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText>Loading…</ThemedText>
      </ThemedView>
    );
  }

  if (isLoggedIn) return <Redirect href="/settings" />;

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView edges={["top"]} style={styles.screen}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <AuthForm />
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function AuthForm() {
  const [registering, setRegistering] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!email.trim() || !password) {
      Alert.alert("Missing details", "Enter your email and password.");
      return;
    }
    if (registering && !name.trim()) {
      Alert.alert("Enter your name", "Your group sees this name on the map.");
      return;
    }
    if (registering && password !== confirm) {
      Alert.alert("Passwords don't match", "Re-enter your password.");
      return;
    }
    setBusy(true);
    try {
      if (registering) await register(name, email, password);
      else await logIn(email, password);
    } catch (err) {
      Alert.alert(
        registering ? "Couldn't create account" : "Couldn't sign in",
        authErrorMessage(err),
      );
    } finally {
      setBusy(false);
    }
  }

  async function forgotPassword() {
    if (!email.trim()) {
      Alert.alert(
        "Enter your email",
        "Type your email above, then tap Forgot password.",
      );
      return;
    }
    try {
      await resetPassword(email);
      Alert.alert(
        "Check your inbox",
        `We sent a reset link to ${email.trim()}.`,
      );
    } catch (err) {
      Alert.alert("Couldn't send reset email", authErrorMessage(err));
    }
  }

  return (
    <>
      <ThemedText type="title">
        {registering ? "Create account" : "Sign in"}
      </ThemedText>
      <ThemedText>
        Sign in to create or join a group and share your location.
      </ThemedText>

      <Card>
        {registering && (
          <Input
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            autoComplete="name"
          />
        )}
        <Input
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
        />
        <Input
          value={password}
          onChangeText={setPassword}
          placeholder="Password (6+ characters)"
          secureTextEntry
          autoComplete={registering ? "new-password" : "current-password"}
        />
        {registering && (
          <Input
            value={confirm}
            onChangeText={setConfirm}
            placeholder="Confirm password"
            secureTextEntry
            autoComplete="new-password"
          />
        )}
        <Button
          label={
            busy ? "Please wait…" : registering ? "Create account" : "Sign in"
          }
          disabled={busy}
          onPress={submit}
        />
      </Card>

      {!registering && (
        <TextLink label="Forgot password?" onPress={forgotPassword} />
      )}
      <TextLink
        label={
          registering
            ? "Already have an account? Sign in"
            : "New here? Create an account"
        }
        onPress={() => setRegistering(!registering)}
      />
    </>
  );
}

function TextLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.link}>
      <ThemedText type="linkPrimary">{label}</ThemedText>
    </Pressable>
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
  link: { alignItems: "center", padding: Spacing.two },
});
