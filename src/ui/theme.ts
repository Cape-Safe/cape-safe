import { Platform, useColorScheme } from "react-native";

export const Colors = {
  light: { text: "#000000", background: "#FFFFFF", backgroundElement: "#F0F0F3", backgroundSelected: "#E0E1E6", textSecondary: "#60646C" },
  dark: { text: "#FFFFFF", background: "#000000", backgroundElement: "#212225", backgroundSelected: "#2E3135", textSecondary: "#B0B4BA" },
} as const;

export type ThemeColor = keyof typeof Colors.light;

export const Spacing = { half: 2, one: 4, two: 8, three: 16, four: 24, five: 32, six: 64 } as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;

export function useColorSchemeName(): "light" | "dark" {
  return useColorScheme() === "dark" ? "dark" : "light";
}

export function useTheme() {
  return Colors[useColorSchemeName()];
}
