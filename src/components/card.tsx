import type { ReactNode } from "react";
import { StyleSheet, type ViewProps } from "react-native";

import { ThemedView } from "@/ui/themed";
import { Spacing } from "@/ui/theme";

export function Card({ children, style, ...rest }: ViewProps & { children: ReactNode }) {
  return (
    <ThemedView type="backgroundElement" style={[styles.card, style]} {...rest}>
      {children}
    </ThemedView>
  );
}

const styles = StyleSheet.create({ card: { borderRadius: 16, padding: Spacing.three, gap: Spacing.two } });
