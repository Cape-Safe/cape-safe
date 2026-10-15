import type { ReactNode } from "react";
import { Platform, ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/ui/themed";
import { BottomTabInset, Spacing, useTheme } from "@/ui/theme";

export function Screen({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const platformPadding = Platform.select({
    android: { paddingTop: insets.top + Spacing.three, paddingBottom: insets.bottom + BottomTabInset + Spacing.three },
    default: { paddingTop: Spacing.three, paddingBottom: BottomTabInset + Spacing.three },
  });

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={[styles.content, platformPadding]}>
      <ThemedText type="subtitle">{title}</ThemedText>
      {subtitle ? <ThemedText themeColor="textSecondary">{subtitle}</ThemedText> : null}
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({ content: { paddingHorizontal: Spacing.three, gap: Spacing.three } });
