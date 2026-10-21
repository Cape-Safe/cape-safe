import {
  Pressable,
  StyleSheet,
  TextInput,
  useColorScheme,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { Spacing } from "@/constants/theme";
import { ScaledText } from "@/features/settings/ScaledText";
import { useTheme } from "@/hooks/use-theme";

// Card, input and button styles match the SOS screen (EmergencyScreen.tsx).
export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  const isDark = useColorScheme() === "dark";
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: isDark ? theme.backgroundElement : "#FFFFFF" },
        isDark ? styles.cardBorderDark : styles.cardShadow,
        style,
      ]}
    >
      {children}
    </View>
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
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: theme.primary },
        (pressed || disabled) && styles.buttonDimmed,
      ]}
    >
      <ScaledText style={[styles.buttonText, { color: theme.onPrimary }]}>
        {label}
      </ScaledText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.three,
    borderRadius: 28,
    gap: Spacing.two,
  },
  cardShadow: { boxShadow: "0 8px 24px rgba(0,0,0,0.12)" },
  cardBorderDark: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.12)",
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    minHeight: 48,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
  },
  button: {
    borderRadius: 999,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDimmed: { opacity: 0.5 },
  buttonText: { fontWeight: "700" },
});
