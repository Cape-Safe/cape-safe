// ScaledText.tsx
// Same look as the team's ThemedText, but it grows when "Larger text" is on.
// TODO: once ThemedText reads useAccessibility().textScale itself, delete this
// file and switch the settings screens back to ThemedText.

import { Text, type TextProps } from 'react-native';

import type { ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { useAccessibility } from './accessibility';

const BASE = {
  default: { fontSize: 16, lineHeight: 24, fontWeight: '500' },
  small: { fontSize: 14, lineHeight: 20, fontWeight: '500' },
  smallBold: { fontSize: 14, lineHeight: 20, fontWeight: '700' },
  heading: { fontSize: 20, lineHeight: 26, fontWeight: '700' },
  subtitle: { fontSize: 32, lineHeight: 44, fontWeight: '600' },
} as const;

type ScaledTextProps = TextProps & {
  type?: keyof typeof BASE;
  themeColor?: ThemeColor;
};

export function ScaledText({ type = 'default', themeColor, style, ...rest }: ScaledTextProps) {
  const theme = useTheme();
  const { textScale } = useAccessibility();
  const base = BASE[type];

  return (
    <Text
      style={[
        {
          color: theme[themeColor ?? 'text'],
          fontSize: base.fontSize * textScale,
          lineHeight: base.lineHeight * textScale,
          fontWeight: base.fontWeight,
        },
        style,
      ]}
      {...rest}
    />
  );
}
