// design.ts
// Shared colours for the polished look (headers, cards, emergency buttons).
// New file on purpose, so theme.ts stays as the team left it.

import { useColorScheme } from "@/hooks/use-color-scheme";

export const Palette = {
  light: {
    screen: "#F4F6F8",
    card: "#FFFFFF",
    line: "#E3E8ED",
    ink: "#0B1F2E",
    muted: "#5E7080",
    hero: "#0B2233",
    accent: "#1B9BD6",
    accentSoft: "#E6F3FA",
    danger: "#C8372D",
    medical: "#16415A",
    onDark: "#FFFFFF",
    onDarkMuted: "#B7CAD7",
    live: "#35C48A",
  },
  dark: {
    screen: "#071520",
    card: "#0F2431",
    line: "#1B3444",
    ink: "#EAF1F6",
    muted: "#8FA4B3",
    hero: "#06141E",
    accent: "#38B6EE",
    accentSoft: "#12303F",
    danger: "#D9473C",
    medical: "#1B4D68",
    onDark: "#FFFFFF",
    onDarkMuted: "#B7CAD7",
    live: "#35C48A",
  },
} as const;

export type PaletteColors = (typeof Palette)["light"] | (typeof Palette)["dark"];

export function usePalette(): PaletteColors {
  const scheme = useColorScheme();
  return scheme === "dark" ? Palette.dark : Palette.light;
}

export const CardShadow = "0 1px 2px rgba(11, 31, 46, 0.06), 0 4px 14px rgba(11, 31, 46, 0.06)";
