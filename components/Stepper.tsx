// components/Stepper.tsx
import { Minus, Plus } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing, fontSize } from "../src/constants/theme";

interface StepperProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  /** Décimales affichées (0 par défaut). Utile pour "2,45 L" par ex. */
  decimals?: number;
  disabled?: boolean;
}

export function Stepper({
  value,
  onChange,
  min,
  max,
  step = 1,
  unit = "",
  decimals = 0,
  disabled = false,
}: StepperProps) {
  const canDecrement = value - step >= min;
  const canIncrement = value + step <= max;

  const decrement = () => {
    if (canDecrement) onChange(Number((value - step).toFixed(decimals)));
  };

  const increment = () => {
    if (canIncrement) onChange(Number((value + step).toFixed(decimals)));
  };

  const displayValue =
    decimals > 0
      ? value.toLocaleString("fr-FR", {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })
      : value.toString();

  return (
    <View style={styles.container}>
      <Pressable
        onPress={decrement}
        disabled={!canDecrement || disabled}
        accessibilityRole="button"
        accessibilityLabel="Diminuer"
        style={({ pressed }) => [
          styles.button,
          !canDecrement && styles.buttonDisabled,
          pressed && canDecrement && styles.buttonPressed,
        ]}
      >
        <Minus
          size={22}
          fill={canDecrement ? colors.primary : colors.textSecondary}
        />
      </Pressable>

      <View style={styles.valueContainer}>
        <Text style={styles.valueText}>{displayValue}</Text>
        {unit !== "" && <Text style={styles.unitText}> {unit}</Text>}
      </View>

      <Pressable
        onPress={increment}
        disabled={!canIncrement || disabled}
        accessibilityRole="button"
        accessibilityLabel="Augmenter"
        style={({ pressed }) => [
          styles.button,
          !canIncrement && styles.buttonDisabled,
          pressed && canIncrement && styles.buttonPressed,
        ]}
      >
        <Plus
          size={22}
          fill={canIncrement ? colors.primary : colors.textSecondary}
        />
      </Pressable>
    </View>
  );
}

const BUTTON_SIZE = 48;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.lg,
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.10)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
  },
  buttonPressed: {
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  buttonDisabled: {
    opacity: 0.35,
  },
  valueContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    minWidth: 120,
    justifyContent: "center",
  },
  valueText: {
    fontSize: fontSize.xxl,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  unitText: {
    fontSize: fontSize.lg,
    fontWeight: "500",
    color: "rgba(255,255,255,0.65)",
  },
});