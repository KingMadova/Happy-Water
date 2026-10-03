// components/WeatherBadge.tsx
import { CloudSun, Thermometer } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";

import { colors, fontSize, radius, spacing } from "../src/constants/theme";
import {
  COEFFICIENT_CHAUD,
  COEFFICIENT_FRAIS,
  isHot,
} from "../src/utils/hydration";
import { useHydrationStore, selectCoefficient, selectIsWeatherLive } from "../src/store/useHydrationStore";

export function WeatherBadge() {
  const temperatureC = useHydrationStore((s) => s.temperatureC);
  const heatThresholdC = useHydrationStore((s) => s.heatThresholdC);
  const isLive = useHydrationStore(selectIsWeatherLive);
  const coefficient = useHydrationStore(selectCoefficient);

  const hot = isHot(temperatureC, heatThresholdC);

  if (!isLive || temperatureC === null) {
    // Mode manuel ou météo indisponible : pas de badge live
    return null;
  }

  const Icon = hot ? CloudSun : Thermometer;
  const iconColor = hot ? colors.warning : colors.primary;

  return (
    <View style={styles.container}>
      <Icon size={16} color={iconColor} />
      <Text style={styles.text}>
        {Math.round(temperatureC)}°C · coefficient ×{coefficient} ml/kg
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radius.pill,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  text: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: "500",
  },
});