import { Text, View, type TextProps, type ViewProps } from "react-native";

import { useTheme, type ThemeColor } from "@/ui/theme";

type TextType = "default" | "title" | "subtitle" | "small" | "smallBold" | "link";

const TEXT_STYLES = {
  default: { fontSize: 16, lineHeight: 24 },
  title: { fontSize: 40, lineHeight: 46, fontWeight: "700" },
  subtitle: { fontSize: 28, lineHeight: 34, fontWeight: "700" },
  small: { fontSize: 14, lineHeight: 20 },
  smallBold: { fontSize: 14, lineHeight: 20, fontWeight: "700" },
  link: { fontSize: 14, lineHeight: 30, color: "#3c87f7" },
} as const;

export function ThemedText({ type = "default", themeColor = "text", style, ...rest }: TextProps & { type?: TextType; themeColor?: ThemeColor }) {
  const theme = useTheme();
  return <Text style={[{ color: theme[themeColor] }, TEXT_STYLES[type], style]} {...rest} />;
}

export function ThemedView({ type = "background", style, ...rest }: ViewProps & { type?: ThemeColor }) {
  const theme = useTheme();
  return <View style={[{ backgroundColor: theme[type] }, style]} {...rest} />;
}
