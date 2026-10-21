// SearchBar.tsx
// Search box at the top of the map. Shows suggestions while typing and the
// last few searches when the box is focused and empty.

import { Keyboard, Pressable, StyleSheet, TextInput, View } from "react-native";

import { Spacing } from "@/constants/theme";
import { ScaledText } from "@/features/settings/ScaledText";
import { useTheme } from "@/hooks/use-theme";
import type { PlaceSuggestion } from "@/types";

import type { MapSearch } from "./useMapSearch";
import { CARD_SHADOW } from "./mapTheme";

type Props = {
  search: MapSearch;
  focused: boolean;
  onFocusChange: (focused: boolean) => void;
  onChoose: (item: PlaceSuggestion) => void;
};

export function SearchBar({ search, focused, onFocusChange, onChoose }: Props) {
  const theme = useTheme();
  const { query, suggestions, recents, status, error } = search;
  const typing = query.trim().length >= 2;
  const showRecents = focused && !typing && recents.length > 0;
  const showPanel = focused && (typing || showRecents);

  const pick = (item: PlaceSuggestion) => {
    Keyboard.dismiss();
    onChoose(item);
  };

  return (
    <View>
      <View
        style={[
          styles.box,
          { backgroundColor: theme.background, borderColor: theme.backgroundSelected },
        ]}
      >
        <TextInput
          value={query}
          onChangeText={search.setQuery}
          onFocus={() => onFocusChange(true)}
          onBlur={() => onFocusChange(false)}
          placeholder="Search places in Cape Town"
          placeholderTextColor={theme.textSecondary}
          returnKeyType="search"
          autoCorrect={false}
          accessibilityLabel="Search for a place"
          style={[styles.input, { color: theme.text }]}
        />
        {(query.length > 0 || focused) && (
          <Pressable
            onPress={() => {
              search.clear();
              Keyboard.dismiss();
              onFocusChange(false);
            }}
            accessibilityRole="button"
            accessibilityLabel="Clear search"
            style={styles.clear}
          >
            <ScaledText type="smallBold">Clear</ScaledText>
          </Pressable>
        )}
      </View>

      {showPanel && (
        <View
          style={[styles.panel, { backgroundColor: theme.background }]}
          accessibilityLiveRegion="polite"
        >
          {showRecents && (
            <>
              <ScaledText type="smallBold" themeColor="textSecondary" style={styles.panelTitle}>
                Recent searches
              </ScaledText>
              {recents.map((item) => (
                <Row key={item.placeId} item={item} onPress={pick} />
              ))}
            </>
          )}

          {typing && status === "loading" && suggestions.length === 0 && (
            <ScaledText type="small" themeColor="textSecondary" style={styles.message}>
              Searching…
            </ScaledText>
          )}
          {typing && status === "error" && (
            <ScaledText type="small" style={[styles.message, styles.errorText]}>
              {error ?? "Search isn't working right now."}
            </ScaledText>
          )}
          {typing && status === "empty" && (
            <ScaledText type="small" themeColor="textSecondary" style={styles.message}>
              No places found. Try a different name or address.
            </ScaledText>
          )}
          {typing &&
            suggestions.map((item) => (
              <Row key={item.placeId} item={item} onPress={pick} />
            ))}
        </View>
      )}
    </View>
  );
}

function Row({
  item,
  onPress,
}: {
  item: PlaceSuggestion;
  onPress: (item: PlaceSuggestion) => void;
}) {
  return (
    <Pressable
      onPress={() => onPress(item)}
      accessibilityRole="button"
      accessibilityLabel={`${item.primaryText}, ${item.secondaryText}`}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <ScaledText type="smallBold" numberOfLines={1}>
        {item.primaryText}
      </ScaledText>
      {item.secondaryText ? (
        <ScaledText type="small" themeColor="textSecondary" numberOfLines={1}>
          {item.secondaryText}
        </ScaledText>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 48,
    borderRadius: 24,
    borderWidth: 1,
    paddingLeft: Spacing.three,
    boxShadow: CARD_SHADOW,
  },
  input: { flex: 1, fontSize: 16, minHeight: 48 },
  clear: {
    minHeight: 48,
    minWidth: 48,
    paddingHorizontal: Spacing.three,
    alignItems: "center",
    justifyContent: "center",
  },
  panel: {
    marginTop: Spacing.two,
    borderRadius: 16,
    paddingVertical: Spacing.one,
    boxShadow: CARD_SHADOW,
  },
  panelTitle: { paddingHorizontal: Spacing.three, paddingTop: Spacing.two },
  row: {
    minHeight: 48,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    justifyContent: "center",
  },
  pressed: { opacity: 0.6 },
  message: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.three },
  errorText: { color: "#B91C1C" },
});
