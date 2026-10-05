// app/(tabs)/index.tsx
import { LinearGradient } from "expo-linear-gradient";
import { Droplets } from "lucide-react-native";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { AppBackground } from "../../components/AppBackground";
import { GlassCard } from "../../components/GlassCard";
import { PressScale } from "../../components/PressScale";
import { QuantityChips } from "../../components/QuantityChips";
import { StreakBadge } from "../../components/StreakBadge";
import { WaterRing } from "../../components/WaterRing";
import { WeatherBadge } from "../../components/WeatherBadge";
import { colors, fontSize, gradients, radius, shadows, spacing } from "../../src/constants/theme";
import {
  selectDailyGoalMl,
  selectTodayLog,
  useHydrationStore,
} from "../../src/store/useHydrationStore";
import { formatDayFr } from "../../src/utils/hydration";

export default function HomeScreen() {
  const [selectedMl, setSelectedMl] = useState(250);
  const insets = useSafeAreaInsets();

  const totalMl = useHydrationStore((s) => selectTodayLog(s).totalMl);
  const goalMl = useHydrationStore(selectDailyGoalMl);
  const addIntake = useHydrationStore((s) => s.addIntake);

  const reached = goalMl > 0 && totalMl >= goalMl;

  return (
    <AppBackground>
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <Text style={styles.dateText}>{formatDayFr()}</Text>

        <View style={styles.badgeRow}>
          <StreakBadge />
        </View>
        <View style={styles.badgeRow}>
          <WeatherBadge />
        </View>

        <View style={styles.ringContainer}>
          <WaterRing currentMl={totalMl} goalMl={goalMl} />
          {reached && (
            <GlassCard style={styles.successBadge} intensity={20}>
              <Droplets size={14} color={colors.success} />
              <Text style={styles.successText}>Objectif atteint, bravo !</Text>
            </GlassCard>
          )}
        </View>

        <View style={[styles.bottomBlock, { paddingBottom: 88 + insets.bottom }]}>
          <QuantityChips selectedQuantity={selectedMl} onSelect={setSelectedMl} />

          <PressScale
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
          </PressScale>
        </View>
      </SafeAreaView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  dateText: {
    textAlign: "center",
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.textPrimary,
    marginTop: spacing.md,
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  badgeRow: { alignItems: "center", marginTop: spacing.sm, minHeight: 32 },
  ringContainer: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.md },
  successBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    borderRadius: radius.pill,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  successText: { fontSize: fontSize.sm, fontWeight: "700", color: colors.success },
  bottomBlock: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.md },
  cta: { borderRadius: radius.pill, overflow: "hidden", ...shadows.glow },
  ctaPressed: { opacity: 0.9 },
  ctaGradient: { alignItems: "center", justifyContent: "center", paddingVertical: spacing.md + 2 },
  ctaText: { color: colors.textOnPrimary, fontSize: fontSize.xl, fontWeight: "800" },
});