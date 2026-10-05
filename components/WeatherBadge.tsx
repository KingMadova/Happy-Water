// components/WeatherBadge.tsx
import { BlurView } from "expo-blur";
import { CloudSun, Thermometer } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";

import { colors, fontSize, radius, spacing } from "../src/constants/theme";
import { isHot } from "../src/utils/hydration";
import {
  useHydrationStore,
  selectCoefficient,
  selectIsWeatherLive,
} from "../src/store/useHydrationStore";

export function WeatherBadge() {
  const temperatureC = useHydrationStore((s) => s.temperatureC);
  const heatThresholdC = useHydrationStore((s) => s.heatThresholdC);
  const isLive = useHydrationStore(selectIsWeatherLive);
  const coefficient = useHydrationStore(selectCoefficient);

  const hot = isHot(temperatureC, heatThresholdC);

  if (!isLive || temperatureC === null) {
    return null;
  }

  const Icon = hot ? CloudSun : Thermometer;
  const iconColor = hot ? colors.warning : colors.glow;

  return (
    <BlurView intensity={24} tint="dark" style={styles.container}>
      <Icon size={16} color={iconColor} />
      <Text style={styles.text}>
        {Math.round(temperatureC)}°C · ×{coefficient} ml/kg
      </Text>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.pill,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glassFill,
    overflow: "hidden",
  },
  text: {
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    fontWeight: "600",
  },
});