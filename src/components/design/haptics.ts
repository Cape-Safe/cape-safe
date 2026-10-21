// haptics.ts
// A light vibration on taps. If the installed app build does not include the
// haptics module yet (older development build), this quietly does nothing
// instead of crashing.

type HapticsModule = typeof import("expo-haptics");

let haptics: HapticsModule | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  haptics = require("expo-haptics") as HapticsModule;
} catch {
  haptics = null;
}

export function tapFeedback() {
  if (!haptics) return;
  haptics.impactAsync(haptics.ImpactFeedbackStyle.Light).catch(() => {});
}
