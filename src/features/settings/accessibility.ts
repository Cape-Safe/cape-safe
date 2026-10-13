// accessibility.ts
// Tiny shared store for accessibility settings, so the Settings toggle can
// change what other screens look like without needing a provider in the
// root layout.
//
// NOTE: kept in memory only for now, so it resets when the app restarts.
// TODO: save it (for example in the user's Firestore profile) once storage exists.

import { useSyncExternalStore } from 'react';

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
    // Multiply font sizes by this. Teammates can use it in themed-text.tsx.
    textScale: current.largeText ? LARGE_TEXT_SCALE : 1,
    setLargeText,
  };
}
