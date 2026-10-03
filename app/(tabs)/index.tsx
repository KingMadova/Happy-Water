// app/(tabs)/index.tsx
import { LinearGradient } from "expo-linear-gradient";
import { Droplets } from "lucide-react-native";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { QuantityChips, QuantityMl } from "../../components/QuantityChips";
import { WaterRing } from "../../components/WaterRing";
import { WeatherBadge } from "../../components/WeatherBadge";
import { colors, fontSize, gradients, radius, spacing } from "../../src/constants/theme";
import {
  selectDailyGoalMl,
  selectTodayLog,
  useHydrationStore,
} from "../../src/store/useHydrationStore";
import { formatDayFr } from "../../src/utils/hydration";

export default function HomeScreen() {
  const [selectedMl, setSelectedMl] = useState<QuantityMl>(250);

  const totalMl = useHydrationStore((s) => selectTodayLog(s).totalMl);
  const goalMl = useHydrationStore(selectDailyGoalMl);
  const addIntake = useHydrationStore((s) => s.addIntake);

  const reached = goalMl > 0 && totalMl >= goalMl;

  return (
    <LinearGradient colors={[...gradients.background]} style={styles.container}>
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <Text style={styles.dateText}>{formatDayFr()}</Text>

        <View style={styles.badgeRow}>
          <WeatherBadge />
        </View>

        <View style={styles.ringContainer}>
          <WaterRing currentMl={totalMl} goalMl={goalMl} />
          {reached && (
            <View style={styles.successBadge}>
              <Droplets size={14} color={colors.success} />
              <Text style={styles.successText}>Objectif atteint, bravo !</Text>
            </View>
          )}
        </View>

        <QuantityChips selectedQuantity={selectedMl} onSelect={setSelectedMl} />

        <View style={styles.ctaContainer}>
          <Pressable
            onPress={() => addIntake(selectedMl)}
            style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
            accessibilityRole="button"
            accessibilityLabel={`Ajouter ${selectedMl} millilitres`}
          >
            <LinearGradient
              colors={[...gradients.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaGradient}
            >
              <Text style={styles.ctaText}>+{selectedMl} ml</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  dateText: {
    textAlign: "center",
    fontSize: fontSize.lg,
    fontWeight: "600",
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  badgeRow: {
    alignItems: "center",
    marginTop: spacing.sm,
    minHeight: 28,
  },
  ringContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  successBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.card,
    borderRadius: radius.pill,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  successText: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.success,
  },
  ctaContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    paddingTop: spacing.lg,
  },
  cta: {
    borderRadius: radius.pill,
    overflow: "hidden",
  },
  ctaPressed: {
    opacity: 0.9,
  },
  ctaGradient: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md + 2,
  },
  ctaText: {
    color: colors.textOnPrimary,
    fontSize: fontSize.xl,
    fontWeight: "800",
  },
});