// components/AppBackground.tsx
import { LinearGradient } from "expo-linear-gradient";
import { type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { BlurView } from "expo-blur";

import { gradients } from "../src/constants/theme";

interface AppBackgroundProps {
  children: ReactNode;
}

export function AppBackground({ children }: AppBackgroundProps) {
  return (
    <LinearGradient colors={[...gradients.background]} style={styles.fill}>
      {/* Orbes de lumière décoratifs (floutés par le BlurView parent de chaque écran) */}
      <View style={[styles.orb, styles.orbCyan]} />
      <View style={[styles.orb, styles.orbBlue]} />
      <View style={[styles.orb, styles.orbGlow]} />
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  orb: {
    position: "absolute",
    borderRadius: 999,
    // Le flou réel est assuré par le contraste avec le contenu glass par-dessus ;
    // ici on adoucit via opacité + grande taille pour un halo diffus.
    opacity: 0.5,
  },
  orbCyan: {
    width: 320,
    height: 320,
    top: -120,
    left: -90,
    backgroundColor: "#2DD4BF",
    opacity: 0.28,
  },
  orbBlue: {
    width: 360,
    height: 360,
    bottom: -140,
    right: -110,
    backgroundColor: "#4A90D9",
    opacity: 0.3,
  },
  orbGlow: {
    width: 240,
    height: 240,
    top: "38%",
    left: "55%",
    backgroundColor: "#5EEAD4",
    opacity: 0.16,
  },
});