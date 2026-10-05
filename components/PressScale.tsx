// components/PressScale.tsx
import { useRef, type ReactNode } from "react";
import { Animated, Pressable, type GestureResponderEvent, type PressableProps } from "react-native";

interface PressScaleProps extends PressableProps {
  children: ReactNode;
  /** Échelle au press (0.90–0.98). */
  scaleTo?: number;
}

export function PressScale({ children, scaleTo = 0.94, onPressIn, onPressOut, ...rest }: PressScaleProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handleIn = (event: GestureResponderEvent) => {
    Animated.spring(scale, { toValue: scaleTo, friction: 6, useNativeDriver: true }).start();
    onPressIn?.(event);
  };

  const handleOut = (event: GestureResponderEvent) => {
    Animated.spring(scale, { toValue: 1, friction: 4, useNativeDriver: true }).start();
    onPressOut?.(event);
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable {...rest} onPressIn={handleIn} onPressOut={handleOut}>
        {children}
      </Pressable>
    </Animated.View>
  );
}