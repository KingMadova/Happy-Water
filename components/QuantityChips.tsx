// components/QuantityChips.tsx
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, View } from "react-native";

import { colors, fontSize, radius, shadows, spacing } from "../src/constants/theme";
import { PressScale } from "./PressScale";

interface QuantityChipsProps {
  selectedQuantity: number;
  onSelect: (quantity: number) => void;
  disabled?: boolean;
}

const QUANTITIES = [100, 250, 500];

export function QuantityChips({ selectedQuantity, onSelect, disabled = false }: QuantityChipsProps) {
  return (
    <View style={styles.container}>
      {QUANTITIES.map((qty) => {
        const isActive = selectedQuantity === qty;
        return (
          <PressScale
            key={qty}
            onPress={() => onSelect(qty)}
            disabled={disabled}
            style={isActive ? styles.chipWrapActive : undefined}
          >
            {isActive ? (
              <LinearGradient
                colors={["#4A90D9", "#2DD4BF"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.chipActiveGradient}
              >
                <Text style={styles.chipTextActive}>{qty} ml</Text>
              </LinearGradient>
            ) : (
              <BlurView intensity={22} tint="dark" style={styles.chipGlass}>
                <Text style={styles.chipText}>{qty} ml</Text>
              </BlurView>
            )}
          </PressScale>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.md,
    flexWrap: "wrap",
  },
  chipWrapActive: {
    borderRadius: radius.pill,
    overflow: "hidden",
    ...shadows.glow,
  },
  chipGlass: {
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glassFill,
    overflow: "hidden",
  },
  chipActiveGradient: {
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.30)",
  },
  chipText: {
    fontSize: fontSize.md,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  chipTextActive: {
    fontSize: fontSize.md,
    fontWeight: "800",
    color: colors.textOnPrimary,
  },
});