// LegalScreen.tsx
// Simple scrolling text screen, used for the Privacy policy and Terms of use.
// Swipe from the left edge of the screen to go back.

import { useMemo, useRef } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';

import { ScreenScaffold } from '@/components/design/ScreenScaffold';
import { Card } from '@/components/ui/form';
import { usePalette } from '@/constants/design';
import { Spacing } from '@/constants/theme';

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
  const palette = usePalette();

  const touchStartX = useRef(0);
  const swipeBack = useMemo(
    () =>
      // The handlers only read the ref when a touch happens, not while rendering.
      // eslint-disable-next-line react-hooks/refs
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
      <ScreenScaffold eyebrow="Legal" title={document.title} lede={document.updated}>
        <Card>
          {document.sections.map((section, index) => (
            <View
              key={section.heading}
              style={[
                styles.section,
                index > 0 && {
                  borderTopWidth: StyleSheet.hairlineWidth,
                  borderTopColor: palette.line,
                },
              ]}
            >
              <ScaledText type="smallBold" style={{ color: palette.ink }}>
                {section.heading}
              </ScaledText>
              <ScaledText type="small" style={{ color: palette.muted }}>
                {section.body}
              </ScaledText>
            </View>
          ))}
        </Card>
      </ScreenScaffold>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  section: { gap: Spacing.one, paddingVertical: Spacing.three },
});
