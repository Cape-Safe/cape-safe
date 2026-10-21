import {
  StyleSheet,
  TextInput,
  type StyleProp,
  type ViewStyle,
  View,
} from "react-native";

import { PressableScale } from "@/components/design/PressableScale";
import { CardShadow, usePalette } from "@/constants/design";
import { Spacing } from "@/constants/theme";
import { ScaledText } from "@/features/settings/ScaledText";
import { useTheme } from "@/hooks/use-theme";

// Shared card, input and button styles, used by Settings, Group and Sign in.
export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const palette = usePalette();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: palette.card, borderColor: palette.line },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Input(props: React.ComponentProps<typeof TextInput>) {
  const palette = usePalette();
  return (
    <TextInput
      placeholderTextColor={palette.muted}
      {...props}
      style={[
        styles.input,
        {
          color: palette.ink,
          borderColor: palette.line,
          backgroundColor: palette.screen,
        },
        props.style,
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
    <PressableScale
      haptic
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      style={[
        styles.button,
        { backgroundColor: theme.primary },
        disabled && styles.buttonDisabled,
      ]}
    >
      <ScaledText style={[styles.buttonText, { color: theme.onPrimary }]}>
        {label}
      </ScaledText>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.three,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.two,
    boxShadow: CardShadow,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    minHeight: 48,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
  },
  button: {
    borderRadius: 12,
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: { opacity: 0.45 },
  buttonText: { fontWeight: "700" },
});
