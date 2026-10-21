// FilterChips.tsx
// Toggle chips that show or hide things on the map.

import { Pressable, ScrollView, StyleSheet } from "react-native";

import { Spacing } from "@/constants/theme";
import { ScaledText } from "@/features/settings/ScaledText";
import { useTheme } from "@/hooks/use-theme";

export type FilterKey = "police" | "zones" | "alerts";

export type Filters = Record<FilterKey, boolean>;

const CHIPS: { key: FilterKey; label: string }[] = [
  { key: "police", label: "Police" },
  { key: "zones", label: "Risk areas" },
  { key: "alerts", label: "Alerts" },
];

type Props = {
  filters: Filters;
  onToggle: (key: FilterKey) => void;
};

export function FilterChips({ filters, onToggle }: Props) {
  const theme = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {CHIPS.map(({ key, label }) => {
        const on = filters[key];
        return (
          <Pressable
            key={key}
            onPress={() => onToggle(key)}
            accessibilityRole="button"
            accessibilityLabel={`${label} filter`}
            accessibilityState={{ selected: on }}
            style={[
              styles.chip,
              {
                backgroundColor: on ? theme.primary : theme.background,
                borderColor: on ? theme.primary : theme.backgroundSelected,
              },
            ]}
          >
            <ScaledText
              type="smallBold"
              style={{ color: on ? theme.onPrimary : theme.text }}
            >
              {on ? `${label}: on` : `${label}: off`}
            </ScaledText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: Spacing.two, paddingVertical: Spacing.one },
  chip: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: Spacing.three,
    borderRadius: 22,
    borderWidth: 1,
  },
});
