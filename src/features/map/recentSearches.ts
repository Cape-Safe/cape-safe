// recentSearches.ts
// The last few places the user searched for, kept on the device only.

import AsyncStorage from "@react-native-async-storage/async-storage";

import type { PlaceSuggestion } from "@/types";

const KEY = "capesafe:recentSearches";
export const MAX_RECENTS = 5;

/** Newest first, no duplicates, capped at MAX_RECENTS. */
export function addRecent(
  list: PlaceSuggestion[],
  item: PlaceSuggestion,
): PlaceSuggestion[] {
  return [item, ...list.filter((r) => r.placeId !== item.placeId)].slice(
    0,
    MAX_RECENTS,
  );
}

export async function loadRecents(): Promise<PlaceSuggestion[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (r): r is PlaceSuggestion =>
          !!r && typeof r.placeId === "string" && typeof r.primaryText === "string",
      )
      .slice(0, MAX_RECENTS);
  } catch {
    return [];
  }
}

export async function saveRecent(
  item: PlaceSuggestion,
): Promise<PlaceSuggestion[]> {
  const next = addRecent(await loadRecents(), item);
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Recents are a convenience. Ignore storage failures.
  }
  return next;
}
