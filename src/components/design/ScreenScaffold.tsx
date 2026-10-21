// ScreenScaffold.tsx
// Shared page layout: a dimmed-map header with a label and title, and cards
// that overlap it. While scrolling, the header fades and a slim title bar
// appears at the top. Purely visual, so screens keep their own logic.

import { Image } from "expo-image";
import { useFocusEffect } from "expo-router";
import { setStatusBarStyle } from "expo-status-bar";
import { useCallback, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BottomTabInset, MaxContentWidth, Spacing } from "@/constants/theme";
import { usePalette } from "@/constants/design";
import { ScaledText } from "@/features/settings/ScaledText";
import { useAccessibility } from "@/features/settings/accessibility";

const HERO_ART = require("@/assets/images/hero-map.png");

const COMPACT_BAR_HEIGHT = 48;

type Props = {
  eyebrow: string;
  title: string;
  /** Small line under the title, for example a status. */
  meta?: ReactNode;
  /** Optional sentence under the status. */
  lede?: string;
  children: ReactNode;
};

export function ScreenScaffold({ eyebrow, title, meta, lede, children }: Props) {
  const palette = usePalette();
  const insets = useSafeAreaInsets();
  const { textScale } = useAccessibility();
  const scrollY = useSharedValue(0);

  // The header is always dark, so the status bar text must be light here.
  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle("light");
      return () => setStatusBarStyle("auto");
    }, []),
  );

  const onScroll = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const heroContentStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 110], [1, 0], Extrapolation.CLAMP),
    transform: [
      {
        translateY: interpolate(scrollY.value, [0, 200], [0, 60], Extrapolation.CLAMP),
      },
    ],
  }));

  const compactBarStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [90, 150], [0, 1], Extrapolation.CLAMP),
  }));

  return (
    <View style={[styles.screen, { backgroundColor: palette.screen }]}>
      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="never"
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={{
          paddingBottom: BottomTabInset + insets.bottom + Spacing.three,
        }}
      >
        <View
          style={[
            styles.hero,
            { backgroundColor: palette.hero, paddingTop: insets.top + Spacing.four },
          ]}
        >
          <Image source={HERO_ART} style={StyleSheet.absoluteFill} contentFit="cover" />
          <Animated.View style={[styles.heroContent, heroContentStyle]}>
            <ScaledText
              type="small"
              style={[styles.eyebrow, { color: palette.accent }]}
            >
              {eyebrow.toUpperCase()}
            </ScaledText>
            <ScaledText
              type="subtitle"
              accessibilityRole="header"
              style={{
                color: palette.onDark,
                fontSize: 30 * textScale,
                lineHeight: 36 * textScale,
                fontWeight: "700",
                letterSpacing: -0.5,
              }}
            >
              {title}
            </ScaledText>
            {meta ? <View style={styles.meta}>{meta}</View> : null}
            {lede ? (
              <ScaledText type="small" style={{ color: palette.onDarkMuted }}>
                {lede}
              </ScaledText>
            ) : null}
          </Animated.View>
        </View>

        <View style={styles.body}>{children}</View>
      </Animated.ScrollView>

      <Animated.View
        pointerEvents="none"
        style={[
          styles.compactBar,
          {
            backgroundColor: palette.hero,
            height: insets.top + COMPACT_BAR_HEIGHT,
            paddingTop: insets.top,
          },
          compactBarStyle,
        ]}
      >
        <ScaledText type="smallBold" style={{ color: palette.onDark }}>
          {title}
        </ScaledText>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  hero: {
    overflow: "hidden",
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.six,
  },
  heroContent: { gap: Spacing.one },
  eyebrow: { fontWeight: "700", letterSpacing: 2, fontSize: 11 },
  meta: { marginTop: Spacing.one },
  body: {
    marginTop: -Spacing.five - Spacing.two,
    paddingHorizontal: Spacing.three,
    gap: Spacing.three,
    maxWidth: MaxContentWidth,
    width: "100%",
    alignSelf: "center",
  },
  compactBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
  },
});
