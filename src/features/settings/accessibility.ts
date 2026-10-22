// accessibility.ts
// Tiny shared store for accessibility settings, so the Settings toggle can
// change what other screens look like without needing a provider in the
// root layout.
//
// NOTE: this store is in memory. SettingsScreen saves the choice to the user's
// Firestore profile and sets it again here when the profile loads.

import { useSyncExternalStore } from "react";

const LARGE_TEXT_SCALE = 1.3;

type AccessibilityState = {
  largeText: boolean;
};

let state: AccessibilityState = { largeText: false };
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return state;
}

export function setLargeText(next: boolean) {
  state = { ...state, largeText: next };
  listeners.forEach((listener) => listener());
}

export function useAccessibility() {
  const current = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return {
    largeText: current.largeText,
    // Multiply font sizes by this
    textScale: current.largeText ? LARGE_TEXT_SCALE : 1,
    setLargeText,
  };
}
