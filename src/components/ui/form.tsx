import { Pressable, StyleSheet, TextInput } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

const ACCENT = "#208AEF";

export function Card({ children }: { children: React.ReactNode }) {
  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      {children}
    </ThemedView>
  );
}

export function Input(props: React.ComponentProps<typeof TextInput>) {
  const theme = useTheme();
  return (
    <TextInput
      placeholderTextColor={theme.textSecondary}
      {...props}
      style={[
        styles.input,
        { color: theme.text, borderColor: theme.backgroundSelected },
      ]}
    />
  );
}

export function Button({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        (pressed || disabled) && styles.buttonDimmed,
      ]}
    >
      <ThemedText style={styles.buttonText}>{label}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.two,
  },
  input: {
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
  },
  button: {
    backgroundColor: ACCENT,
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    alignItems: "center",
  },
  buttonDimmed: { opacity: 0.5 },
  buttonText: { color: "#fff", fontWeight: "600" },
});
