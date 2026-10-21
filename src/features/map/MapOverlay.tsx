// MapOverlay.tsx
// Everything drawn on top of the map: search bar, alert banner, filter chips,
// the "Nearest help" and locate buttons, and the area sheet. It holds no map
// logic. MapScreen owns the state and passes it in.

import { useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PressableScale } from "@/components/design/PressableScale";
import { usePalette } from "@/constants/design";
import { Spacing } from "@/constants/theme";
import { ScaledText } from "@/features/settings/ScaledText";
import { useTheme } from "@/hooks/use-theme";
import type { PlaceSuggestion, SafetyAlert } from "@/types";

import { AlertBanner } from "./AlertBanner";
import { AreaSheet } from "./AreaSheet";
import { FilterChips, type FilterKey, type Filters } from "./FilterChips";
import type { Station } from "./mapRisk";
import { CARD_SHADOW, MAP_BOTTOM_INSET } from "./mapTheme";
import { SearchBar } from "./SearchBar";
import type { MapSearch } from "./useMapSearch";

// Android draws its own zoom buttons in the bottom right corner, so the
// locate button sits above them.
const ZOOM_CONTROLS_CLEARANCE = Platform.select({ android: 96, default: 0 });

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
  const palette = usePalette();
  const insets = useSafeAreaInsets();
  const [searchFocused, setSearchFocused] = useState(false);

  return (
    <View style={styles.fill} pointerEvents="box-none">
      <View
        style={[styles.top, { paddingTop: insets.top + Spacing.two }]}
        pointerEvents="box-none"
      >
        <SearchBar
          search={search}
          focused={searchFocused}
          onFocusChange={setSearchFocused}
          onChoose={onChooseSuggestion}
        />
        {/* Hidden while searching so the suggestions never overlap them. */}
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
            <PressableScale
              haptic
              onPress={onNearestHelp}
              accessibilityRole="button"
              accessibilityLabel="Show nearest police station"
              accessibilityState={{ selected: helpActive }}
              style={[styles.pill, { backgroundColor: theme.primary }]}
            >
              <ScaledText type="smallBold" style={{ color: theme.onPrimary }}>
                {helpActive ? "Hide nearest help" : "Nearest help"}
              </ScaledText>
            </PressableScale>
            <PressableScale
              onPress={onLocate}
              accessibilityRole="button"
              accessibilityLabel="Centre map on my location"
              style={[
                styles.locate,
                {
                  backgroundColor: palette.card,
                  borderColor: palette.accent,
                  marginBottom: ZOOM_CONTROLS_CLEARANCE,
                },
              ]}
            >
              <ScaledText type="smallBold" style={{ color: palette.ink }}>
                Me
              </ScaledText>
            </PressableScale>
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
    alignItems: "flex-end",
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
});
