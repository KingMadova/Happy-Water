// components/QuantityChips.tsx
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, fontSize, radius, spacing } from "../src/constants/theme";

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
          <Pressable
            key={qty}
            onPress={() => onSelect(qty)}
            disabled={disabled}
            style={({ pressed }) => [
              styles.chip,
              isActive && styles.chipActive,
              pressed && styles.chipPressed,
            ]}
          >
            <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
              {qty} ml
            </Text>
          </Pressable>
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
  chip: {
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: colors.chipBackground,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipPressed: {
    opacity: 0.8,
  },
  chipText: {
    fontSize: fontSize.md,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: colors.textOnPrimary,
  },
});