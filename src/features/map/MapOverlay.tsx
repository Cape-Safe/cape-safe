// MapOverlay.tsx
// Everything drawn on top of the map: alert banner, filter chips, the
// "Nearest help" and locate buttons, and the area sheet. It holds no map
// logic. MapScreen owns the state and passes it in.

import { Pressable, StyleSheet, View } from "react-native";

import { Spacing } from "@/constants/theme";
import { ScaledText } from "@/features/settings/ScaledText";
import { useTheme } from "@/hooks/use-theme";
import { useState } from "react";
import { AlertBanner } from "./AlertBanner";
import { AreaSheet } from "./AreaSheet";
import type { PlaceSuggestion, SafetyAlert } from "@/types";
import { SearchBar } from "./SearchBar";
import type { MapSearch } from "./useMapSearch";
import { FilterChips, type FilterKey, type Filters } from "./FilterChips";
import type { Station } from "./mapRisk";
import { CARD_SHADOW, MAP_BOTTOM_INSET } from "./mapTheme";

type Props = {
  alert: SafetyAlert | null;
  filters: Filters;
  onToggleFilter: (key: FilterKey) => void;
  selected: Station | null;
  onCloseSheet: () => void;
  helpActive: boolean;
  onNearestHelp: () => void;
  onLocate: () => void;
  search: MapSearch;
  onChooseSuggestion: (item: PlaceSuggestion) => void;
};

export function MapOverlay({
  alert,
  filters,
  onToggleFilter,
  selected,
  onCloseSheet,
  helpActive,
  onNearestHelp,
  onLocate,
  search,
  onChooseSuggestion,
}: Props) {
  const theme = useTheme();
  const [searchFocused, setSearchFocused] = useState(false);

  return (
    <View style={styles.fill} pointerEvents="box-none">
      <View style={styles.top} pointerEvents="box-none">
        <SearchBar
          search={search}
          focused={searchFocused}
          onFocusChange={setSearchFocused}
          onChoose={onChooseSuggestion}
        />
        {!searchFocused && filters.alerts && alert && (
          <AlertBanner alert={alert} />
        )}
        {!searchFocused && (
          <FilterChips filters={filters} onToggle={onToggleFilter} />
        )}
      </View>

      <View
        style={[
          styles.bottom,
          { paddingBottom: MAP_BOTTOM_INSET + Spacing.three },
        ]}
        pointerEvents="box-none"
      >
        {!selected && (
          <View style={styles.buttonRow} pointerEvents="box-none">
            <Pressable
              onPress={onNearestHelp}
              accessibilityRole="button"
              accessibilityLabel="Show nearest police station"
              accessibilityState={{ selected: helpActive }}
              style={[styles.pill, { backgroundColor: theme.primary }]}
            >
              <ScaledText type="smallBold" style={{ color: theme.onPrimary }}>
                {helpActive ? "Hide nearest help" : "Nearest help"}
              </ScaledText>
            </Pressable>
            <Pressable
              onPress={onLocate}
              accessibilityRole="button"
              accessibilityLabel="Centre map on my location"
              style={[
                styles.locate,
                {
                  backgroundColor: theme.background,
                  borderColor: theme.primary,
                },
              ]}
            >
              <ScaledText type="smallBold">Me</ScaledText>
            </Pressable>
          </View>
        )}
        {selected && <AreaSheet station={selected} onClose={onCloseSheet} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  top: {
    paddingTop: Spacing.five,
    paddingHorizontal: Spacing.three,
    gap: Spacing.two,
  },
  bottom: {
    flex: 1,
    justifyContent: "flex-end",
    paddingHorizontal: Spacing.three,
  },
  buttonRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pill: {
    minHeight: 48,
    paddingHorizontal: Spacing.four,
    borderRadius: 24,
    justifyContent: "center",
    boxShadow: CARD_SHADOW,
  },
  locate: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    boxShadow: CARD_SHADOW,
  },
  whiteText: { color: "#FFFFFF" },
});
