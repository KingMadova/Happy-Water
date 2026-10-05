// app/(tabs)/history.tsx
import { LinearGradient } from "expo-linear-gradient";
import { Droplets, Trophy } from "lucide-react-native";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { AppBackground } from "../../components/AppBackground";
import { GlassCard } from "../../components/GlassCard";
import { colors, fontSize, radius, spacing } from "../../src/constants/theme";
import {
  selectDailyGoalMl,
  useHydrationStore,
  type DayLog,
} from "../../src/store/useHydrationStore";
import { formatLiters, todayKey } from "../../src/utils/hydration";

const DAYS = 7;

interface DayRow {
  key: string;
  label: string;
  totalMl: number;
  goalMl: number;
  reached: boolean;
}

function buildDays(logs: Record<string, DayLog>, fallbackGoalMl: number): DayRow[] {
  const rows: DayRow[] = [];
  const now = new Date();
  for (let i = 0; i < DAYS; i++) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const key = todayKey(date);
    const log = logs[key];
    const totalMl = log?.totalMl ?? 0;
    const goalMl = log?.goalMl || fallbackGoalMl;
    const label =
      i === 0
        ? "Aujourd'hui"
        : i === 1
          ? "Hier"
          : date.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
    rows.push({ key, label, totalMl, goalMl, reached: totalMl > 0 && totalMl >= goalMl });
  }
  return rows;
}

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const logs = useHydrationStore((s) => s.logs);
  const fallbackGoalMl = useHydrationStore(selectDailyGoalMl);

  const rows = buildDays(logs, fallbackGoalMl);
  const reachedCount = rows.filter((r) => r.reached).length;
  const totalWeekMl = rows.reduce((sum, r) => sum + r.totalMl, 0);
  const hasData = rows.some((r) => r.totalMl > 0);

  return (
    <AppBackground>
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: 100 + insets.bottom }]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.screenTitle}>Historique</Text>

          {/* ---------- RÉCAP 7 JOURS ---------- */}
          <GlassCard style={styles.summaryCard} strong>
            <View style={styles.summaryItem}>
              <Trophy size={22} color={colors.warning} />
              <Text style={styles.summaryValue}>
                {reachedCount}/{DAYS}
              </Text>
              <Text style={styles.summaryLabel}>objectifs atteints</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Droplets size={22} color={colors.glow} />
              <Text style={styles.summaryValue}>{formatLiters(totalWeekMl)}</Text>
              <Text style={styles.summaryLabel}>bus sur 7 jours</Text>
            </View>
          </GlassCard>

          {/* ---------- ÉTAT VIDE ---------- */}
          {!hasData && (
            <GlassCard style={styles.emptyCard}>
              <Droplets size={40} color={colors.textTertiary} />
              <Text style={styles.emptyText}>
                Aucune donnée pour l'instant.{"\n"}Bois ton premier verre d'eau depuis l'accueil !
              </Text>
            </GlassCard>
          )}

          {/* ---------- BARRES PAR JOUR ---------- */}
          <GlassCard style={styles.daysCard} strong>
            {rows.map((row) => {
              const progress = row.goalMl > 0 ? Math.min(row.totalMl / row.goalMl, 1) : 0;
              return (
                <View key={row.key} style={styles.dayRow}>
                  <View style={styles.dayHeader}>
                    <Text style={styles.dayLabel}>{row.label}</Text>
                    <Text style={[styles.dayValue, row.reached && styles.dayValueReached]}>
                      {formatLiters(row.totalMl)} / {formatLiters(row.goalMl)}
                      {row.reached ? " ✓" : ""}
                    </Text>
                  </View>
                  <View style={styles.barTrack}>
                    {progress > 0 && (
                      <LinearGradient
                        colors={row.reached ? ["#34D399", "#2DD4BF"] : ["#4A90D9", "#2DD4BF"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[styles.barFill, { width: `${progress * 100}%` }]}
                      />
                    )}
                  </View>
                </View>
              );
            })}
          </GlassCard>
        </ScrollView>
      </SafeAreaView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  screenTitle: {
    fontSize: fontSize.xl,
    fontWeight: "800",
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: spacing.lg,
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  summaryCard: {
    flexDirection: "row",
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  summaryItem: { flex: 1, alignItems: "center", gap: spacing.xs },
  summaryDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.15)", marginHorizontal: spacing.md },
  summaryValue: { fontSize: fontSize.xl, fontWeight: "800", color: colors.textPrimary },
  summaryLabel: { fontSize: fontSize.xs, color: colors.textSecondary, textAlign: "center" },
  emptyCard: {
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  daysCard: { padding: spacing.lg, gap: spacing.md },
  dayRow: { gap: spacing.xs },
  dayHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  dayLabel: {
    fontSize: fontSize.sm,
    fontWeight: "700",
    color: colors.textPrimary,
    textTransform: "capitalize",
  },
  dayValue: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: "600" },
  dayValueReached: { color: colors.success, fontWeight: "800" },
  barTrack: {
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.12)",
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: radius.pill,
  },
});