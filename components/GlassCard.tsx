// components/GlassCard.tsx
import { BlurView } from "expo-blur";
import { type ReactNode } from "react";
import { StyleSheet, type ViewStyle } from "react-native";

import { colors, radius, shadows } from "../src/constants/theme";

interface GlassCardProps {
  children: ReactNode;
  style?: ViewStyle;
  /** Intensité du flou (0-100). 28 = verre standard iOS. */
  intensity?: number;
  /** Voile plus dense pour les cartes importantes. */
  strong?: boolean;
}

export function GlassCard({ children, style, intensity = 28, strong = false }: GlassCardProps) {
  return (
    <BlurView
      intensity={intensity}
      tint="dark"
      style={[
        styles.glass,
        {
          backgroundColor: strong ? colors.glassFillStrong : colors.glassFill,
          borderColor: strong ? colors.glassBorderStrong : colors.glassBorder,
        },
        shadows.card,
        style,
      ]}
    >
      {children}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  glass: {
    borderRadius: radius.lg,
    overflow: "hidden",
    borderWidth: 1,
  },
});