// PressableScale.tsx
// A Pressable that dips slightly when pressed, so taps feel responsive.
// Respects "reduce motion": the dip is skipped and only the fade is used.

import {
  Pressable,
  type GestureResponderEvent,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { tapFeedback } from "./haptics";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = Omit<PressableProps, "style"> & {
  style?: StyleProp<ViewStyle>;
  /** Light vibration when pressed. Use on important actions like call buttons. */
  haptic?: boolean;
};

export function PressableScale({
  style,
  haptic = false,
  onPress,
  onPressIn,
  onPressOut,
  ...rest
}: Props) {
  const pressed = useSharedValue(0);
  const reduceMotion = useReducedMotion();

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 1 - 0.12 * pressed.value,
    transform: [{ scale: reduceMotion ? 1 : 1 - 0.03 * pressed.value }],
  }));

  return (
    <AnimatedPressable
      {...rest}
      onPressIn={(event: GestureResponderEvent) => {
        pressed.value = withTiming(1, { duration: 90 });
        onPressIn?.(event);
      }}
      onPressOut={(event: GestureResponderEvent) => {
        pressed.value = withTiming(0, { duration: 160 });
        onPressOut?.(event);
      }}
      onPress={(event: GestureResponderEvent) => {
        if (haptic) tapFeedback();
        onPress?.(event);
      }}
      style={[style, animatedStyle]}
    />
  );
}
