// LegalScreen.tsx
// Simple scrolling text screen, used for the Privacy policy and Terms of use.
// Swipe from the left edge of the screen to go back.

import { useMemo, useRef } from 'react';
import { PanResponder, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { ScaledText } from './ScaledText';
import type { LegalDocument } from './legalContent';

// A swipe counts as "back" when it starts this close to the left edge
// and travels at least this far to the right.
const EDGE_WIDTH = 40;
const SWIPE_DISTANCE = 60;

type LegalScreenProps = {
  document: LegalDocument;
  onBack?: () => void;
};

export default function LegalScreen({ document, onBack }: LegalScreenProps) {
  const theme = useTheme();
  const safeAreaInsets = useSafeAreaInsets();
  const insets = {
    ...safeAreaInsets,
    bottom: safeAreaInsets.bottom + BottomTabInset + Spacing.three,
  };

  const contentPlatformStyle = Platform.select({
    android: {
      paddingTop: insets.top,
      paddingLeft: insets.left,
      paddingRight: insets.right,
      paddingBottom: insets.bottom,
    },
    web: {
      paddingTop: Spacing.six,
      paddingBottom: Spacing.four,
    },
  });

  const touchStartX = useRef(0);
  const swipeBack = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponderCapture: (event) => {
          touchStartX.current = event.nativeEvent.pageX;
          return false;
        },
        onMoveShouldSetPanResponderCapture: (_, gesture) =>
          touchStartX.current < EDGE_WIDTH &&
          gesture.dx > 12 &&
          Math.abs(gesture.dx) > Math.abs(gesture.dy) * 2,
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dx > SWIPE_DISTANCE) onBack?.();
        },
      }),
    [onBack],
  );

  return (
    <View style={styles.flex} {...swipeBack.panHandlers}>
      <ScrollView
        style={[styles.flex, { backgroundColor: theme.background }]}
        contentInset={insets}
        contentContainerStyle={[styles.contentContainer, contentPlatformStyle]}
        showsVerticalScrollIndicator={false}>
        <ThemedView style={styles.container}>
          <ScaledText type="subtitle">{document.title}</ScaledText>
          <ScaledText type="small" themeColor="textSecondary" style={styles.updated}>
            {document.updated}
          </ScaledText>

          {document.sections.map((section) => (
            <View key={section.heading} style={styles.section}>
              <ScaledText type="smallBold" style={styles.heading}>
                {section.heading}
              </ScaledText>
              <ScaledText type="small" themeColor="textSecondary">
                {section.body}
              </ScaledText>
            </View>
          ))}
        </ThemedView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  contentContainer: { alignItems: 'center' },
  container: {
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
  },
  updated: { marginTop: Spacing.one, marginBottom: Spacing.four },
  section: { marginBottom: Spacing.four },
  heading: { marginBottom: Spacing.one },
});
