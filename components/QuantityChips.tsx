// components/QuantityChips.tsx
import { StyleSheet, Text, View, Pressable } from "react-native";

import { colors, radius, spacing, fontSize } from "../src/constants/theme";

export type QuantityMl = 100 | 250 | 500;

interface QuantityChipsProps {
  selectedQuantity: QuantityMl;
  onSelect: (ml: QuantityMl) => void;
  disabled?: boolean;
}

export function QuantityChips({ selectedQuantity, onSelect, disabled = false }: QuantityChipsProps) {
  const options: QuantityMl[] = [100, 250, 500];

  return (
    <View style={styles.container}>
      {options.map((ml) => (
        <Pressable
          key={ml}
          onPress={() => !disabled && onSelect(ml)}
          disabled={disabled}
          style={({ pressed }) => [
            styles.chip,
            selectedQuantity === ml && styles.chipSelected,
            pressed && !disabled && styles.chipPressed,
            disabled && styles.chipDisabled,
          ]}
          accessibilityRole="button"
          accessibilityLabel={`${ml} ml`}
          accessibilityState={{ selected: selectedQuantity === ml }}
        >
          <Text style={[
            styles.chipText,
            selectedQuantity === ml && styles.chipTextSelected,
            disabled && styles.chipTextDisabled,
          ]}>
            {ml} ml
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "center",
  },
  chip: {
    backgroundColor: colors.chipBackground,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderWidth: 2,
    borderColor: colors.border,
    minWidth: 80,
    alignItems: "center",
  },
  chipSelected: {
    borderColor: colors.primary,
    backgroundColor: "rgba(74, 144, 217, 0.1)",
  },
  chipPressed: {
    opacity: 0.8,
  },
  chipDisabled: {
    opacity: 0.4,
  },
  chipText: {
    fontSize: fontSize.md,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  chipTextSelected: {
    color: colors.primary,
    fontWeight: "700",
  },
  chipTextDisabled: {
    color: colors.textSecondary,
  },
});