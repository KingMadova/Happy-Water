// app/(tabs)/settings.tsx
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import Slider from "@react-native-community/slider";
import { RotateCcw } from "lucide-react-native";
import { useState, type ReactNode } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppBackground } from "../../components/AppBackground";
import { GlassCard } from "../../components/GlassCard";
import { Stepper } from "../../components/Stepper";
import { colors, fontSize, radius, spacing } from "../../src/constants/theme";
import { ensurePermission, rescheduleReminders, sendTestNotification } from "../../src/services/notifications";
import { refreshWeather } from "../../src/services/weather";
import {
  selectCoefficient,
  selectDailyGoalMl,
  selectIsWeatherLive,
  useHydrationStore,
  type ManualWeatherMode,
} from "../../src/store/useHydrationStore";
import {
  COEFFICIENT_CHAUD,
  COEFFICIENT_FRAIS,
  HEAT_THRESHOLD_MAX,
  HEAT_THRESHOLD_MIN,
  MANUAL_GOAL_MAX_ML,
  MANUAL_GOAL_MIN_ML,
  MANUAL_GOAL_STEP_ML,
  WEIGHT_MAX,
  WEIGHT_MIN,
  formatLiters,
  isHot,
} from "../../src/utils/hydration";

const FREQUENCIES = [1, 2, 3, 4];

export default function SettingsScreen() {
  // ----- Store -----
  const weightKg = useHydrationStore((s) => s.weightKg);
  const setWeightKg = useHydrationStore((s) => s.setWeightKg);

  const temperatureC = useHydrationStore((s) => s.temperatureC);
  const weatherAutoEnabled = useHydrationStore((s) => s.weatherAutoEnabled);
  const setWeatherAutoEnabled = useHydrationStore((s) => s.setWeatherAutoEnabled);
  const manualMode = useHydrationStore((s) => s.manualMode);
  const setManualMode = useHydrationStore((s) => s.setManualMode);
  const isLive = useHydrationStore(selectIsWeatherLive);

  const heatThresholdC = useHydrationStore((s) => s.heatThresholdC);
  const setHeatThresholdC = useHydrationStore((s) => s.setHeatThresholdC);

  const manualGoalOverrideMl = useHydrationStore((s) => s.manualGoalOverrideMl);
  const setManualGoalOverrideMl = useHydrationStore((s) => s.setManualGoalOverrideMl);

  const coefficient = useHydrationStore(selectCoefficient);
  const dailyGoalMl = useHydrationStore(selectDailyGoalMl);

  const remindersEnabled = useHydrationStore((s) => s.remindersEnabled);
  const setRemindersEnabled = useHydrationStore((s) => s.setRemindersEnabled);
  const startHour = useHydrationStore((s) => s.startHour);
  const endHour = useHydrationStore((s) => s.endHour);
  const setReminderWindow = useHydrationStore((s) => s.setReminderWindow);
  const frequencyHours = useHydrationStore((s) => s.frequencyHours);
  const setFrequencyHours = useHydrationStore((s) => s.setFrequencyHours);

  const resetOnboarding = useHydrationStore((s) => s.resetOnboarding);

  // ----- État local -----
  const [openPicker, setOpenPicker] = useState<null | "start" | "end">(null);

  const hot = isHot(temperatureC, heatThresholdC);

  const onToggleWeatherAuto = (enabled: boolean) => {
    setWeatherAutoEnabled(enabled);
    if (enabled) void refreshWeather();
  };

  const onToggleReminders = async (enabled: boolean) => {
    setRemindersEnabled(enabled);
    if (enabled) await ensurePermission();
    await rescheduleReminders();
  };

  const updateReminders = (mutate: () => void) => {
    mutate();
    void rescheduleReminders();
  };

  const pickerDate = (hour: number) => {
    const d = new Date();
    d.setHours(hour, 0, 0, 0);
    return d;
  };

  const handleTimeChange = (which: "start" | "end") => (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === "android") {
      setOpenPicker(null);
      if (event.type !== "set" || !date) return;
    } else if (!date) {
      return;
    }
    const h = date.getHours();
    updateReminders(() => {
      if (which === "start") setReminderWindow(h, endHour);
      else setReminderWindow(startHour, h);
    });
  };

  return (
    <AppBackground>
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.screenTitle}>Paramètres</Text>

          {/* ---------- PROFIL ---------- */}
          <Card title="Mon profil">
            <View style={styles.row}>
              <Text style={styles.label}>Poids</Text>
              <Stepper value={weightKg} onChange={setWeightKg} min={WEIGHT_MIN} max={WEIGHT_MAX} step={1} unit="kg" />
            </View>
          </Card>

          {/* ---------- OBJECTIF CALCULÉ ---------- */}
          <Card title="Objectif quotidien calculé">
            <View style={styles.goalBadgeRow}>
              <View style={[styles.goalBadge, hot && styles.goalBadgeHot]}>
                <Text style={[styles.goalBadgeText, hot && styles.goalBadgeTextHot]}>
                  {isLive && temperatureC !== null
                    ? `${Math.round(temperatureC)}°C · temps ${hot ? "chaud" : "frais"}`
                    : "Météo indisponible · mode manuel"}
                </Text>
              </View>
            </View>

            <Text style={styles.formulaText}>
              {weightKg} kg × {coefficient} ml/kg
            </Text>
            <Text style={styles.bigGoal}>{formatLiters(dailyGoalMl)} / jour</Text>

            {manualGoalOverrideMl !== null && (
              <Pressable style={styles.resetRow} onPress={() => setManualGoalOverrideMl(null)}>
                <RotateCcw size={14} color={colors.glow} />
                <Text style={styles.resetText}>Réinitialiser au calcul automatique</Text>
              </Pressable>
            )}

            <View style={styles.toggleRow}>
              <Text style={styles.label}>Météo automatique (API)</Text>
              <Switch
                value={weatherAutoEnabled}
                onValueChange={onToggleWeatherAuto}
                trackColor={{ false: "rgba(255,255,255,0.15)", true: colors.accent }}
                thumbColor={colors.textPrimary}
              />
            </View>

            <View style={styles.segmented}>
              {(["frais", "chaud"] as ManualWeatherMode[]).map((mode) => {
                const active = !isLive && manualMode === mode;
                return (
                  <Pressable
                    key={mode}
                    onPress={() => setManualMode(mode)}
                    style={[
                      styles.segment,
                      active && (mode === "chaud" ? styles.segmentHot : styles.segmentCold),
                    ]}
                  >
                    <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                      {mode === "frais" ? `Frais · ${COEFFICIENT_FRAIS}` : `Chaud · ${COEFFICIENT_CHAUD}`}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.sliderBlock}>
              <Text style={styles.label}>Ajustement manuel</Text>
              <Slider
                minimumValue={MANUAL_GOAL_MIN_ML}
                maximumValue={MANUAL_GOAL_MAX_ML}
                step={MANUAL_GOAL_STEP_ML}
                value={dailyGoalMl}
                onValueChange={(v) => setManualGoalOverrideMl(v)}
                minimumTrackTintColor={colors.accent}
                maximumTrackTintColor="rgba(255,255,255,0.18)"
                thumbTintColor={colors.accent}
              />
              <View style={styles.sliderBounds}>
                <Text style={styles.sliderBoundText}>{formatLiters(MANUAL_GOAL_MIN_ML)}</Text>
                <Text style={styles.sliderBoundText}>{formatLiters(MANUAL_GOAL_MAX_ML)}</Text>
              </View>
            </View>
          </Card>

          {/* ---------- SEUIL DE CHALEUR ---------- */}
          <Card title="Seuil de chaleur">
            <Text style={styles.hintText}>
              À partir de cette température, Hydra passe au coefficient {COEFFICIENT_CHAUD} ml/kg.
            </Text>
            <View style={styles.sliderBlock}>
              <Slider
                minimumValue={HEAT_THRESHOLD_MIN}
                maximumValue={HEAT_THRESHOLD_MAX}
                step={1}
                value={heatThresholdC}
                onValueChange={(v) => setHeatThresholdC(v)}
                minimumTrackTintColor={colors.warning}
                maximumTrackTintColor="rgba(255,255,255,0.18)"
                thumbTintColor={colors.warning}
              />
              <View style={styles.sliderBounds}>
                <Text style={styles.sliderBoundText}>{HEAT_THRESHOLD_MIN}°C</Text>
                <Text style={[styles.sliderBoundText, styles.sliderBoundCurrent]}>{heatThresholdC}°C</Text>
                <Text style={styles.sliderBoundText}>{HEAT_THRESHOLD_MAX}°C</Text>
              </View>
            </View>
          </Card>

          {/* ---------- RAPPELS ---------- */}
          <Card title="Rappels">
            <View style={styles.toggleRow}>
              <Text style={styles.label}>Activer les rappels</Text>
              <Switch
                value={remindersEnabled}
                onValueChange={(v) => void onToggleReminders(v)}
                trackColor={{ false: "rgba(255,255,255,0.15)", true: colors.success }}
                thumbColor={colors.textPrimary}
              />
            </View>

            <View style={styles.timeRow}>
              <Pressable style={styles.timeButton} onPress={() => setOpenPicker(openPicker === "start" ? null : "start")}>
                <Text style={styles.timeButtonText}>Début : {String(startHour).padStart(2, "0")}:00</Text>
              </Pressable>
              <Pressable style={styles.timeButton} onPress={() => setOpenPicker(openPicker === "end" ? null : "end")}>
                <Text style={styles.timeButtonText}>Fin : {String(endHour).padStart(2, "0")}:00</Text>
              </Pressable>
            </View>

            {openPicker !== null && (
              <View style={styles.pickerWrapper}>
                <DateTimePicker
                  value={pickerDate(openPicker === "start" ? startHour : endHour)}
                  mode="time"
                  is24Hour={true}
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={handleTimeChange(openPicker)}
                  themeVariant="dark"
                />
                {Platform.OS === "ios" && (
                  <Pressable style={styles.closePicker} onPress={() => setOpenPicker(null)}>
                    <Text style={styles.closePickerText}>Fermer</Text>
                  </Pressable>
                )}
              </View>
            )}

            <Text style={styles.label}>Fréquence</Text>
            <View style={styles.freqRow}>
              {FREQUENCIES.map((f) => {
                const active = frequencyHours === f;
                return (
                  <Pressable
                    key={f}
                    onPress={() => updateReminders(() => setFrequencyHours(f))}
                    style={[styles.freqChip, active && styles.freqChipActive]}
                  >
                    <Text style={[styles.freqChipText, active && styles.freqChipTextActive]}>
                      toutes les {f} h
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.hintText}>
              {remindersEnabled
                ? `Rappels planifiés de ${String(startHour).padStart(2, "0")}:00 à ${String(endHour).padStart(2, "0")}:00.`
                : "Rappels désactivés : aucune notification ne sera planifiée."}
            </Text>

            <Pressable style={styles.testButton} onPress={() => void sendTestNotification()}>
              <Text style={styles.testButtonText}>🧪 Tester une notification (5 s)</Text>
            </Pressable>
          </Card>

          {/* ---------- ZONE DEV ---------- */}
          <GlassCard style={styles.devCard} intensity={18}>
            <Text style={styles.devTitle}>Zone développeur</Text>
            <Pressable style={styles.devButton} onPress={resetOnboarding}>
              <Text style={styles.devButtonText}>Revoir l'onboarding</Text>
            </Pressable>
          </GlassCard>
        </ScrollView>
      </SafeAreaView>
    </AppBackground>
  );
}

// ---------- Sous-composants locaux ----------
function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <GlassCard style={styles.card} strong>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </GlassCard>
  );
}

// ---------- Styles ----------
const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  screenTitle: {
    fontSize: fontSize.xl,
    fontWeight: "800",
    color: colors.textPrimary,
    textAlign: "center",
    marginVertical: spacing.lg,
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  card: { padding: spacing.lg, marginBottom: spacing.md },
  cardTitle: { fontSize: fontSize.lg, fontWeight: "700", color: colors.textPrimary, marginBottom: spacing.md },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.md },
  label: { fontSize: fontSize.md, fontWeight: "600", color: colors.textPrimary },
  goalBadgeRow: { alignItems: "center", marginBottom: spacing.sm },
  goalBadge: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  goalBadgeHot: { backgroundColor: "rgba(251,191,36,0.18)", borderColor: "rgba(251,191,36,0.4)" },
  goalBadgeText: { fontSize: fontSize.sm, fontWeight: "700", color: colors.textSecondary },
  goalBadgeTextHot: { color: colors.warning },
  formulaText: { textAlign: "center", fontSize: fontSize.md, color: colors.textSecondary, marginBottom: spacing.xs },
  bigGoal: { textAlign: "center", fontSize: fontSize.xxl, fontWeight: "800", color: colors.glow, marginBottom: spacing.md },
  resetRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.xs, marginBottom: spacing.sm },
  resetText: { fontSize: fontSize.sm, fontWeight: "700", color: colors.glow },
  toggleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginVertical: spacing.sm },
  segmented: { flexDirection: "row", gap: spacing.sm, marginVertical: spacing.sm },
  segment: {
    flex: 1,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingVertical: spacing.sm + 2,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  segmentCold: { backgroundColor: colors.primary, borderColor: colors.primary },
  segmentHot: { backgroundColor: colors.accent, borderColor: colors.accent },
  segmentText: { fontSize: fontSize.sm, fontWeight: "700", color: colors.textSecondary },
  segmentTextActive: { color: colors.textOnPrimary },
  sliderBlock: { marginTop: spacing.sm },
  sliderBounds: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: spacing.xs },
  sliderBoundText: { fontSize: fontSize.xs, color: colors.textSecondary },
  sliderBoundCurrent: { fontWeight: "800", color: colors.textPrimary, fontSize: fontSize.sm },
  hintText: { fontSize: fontSize.sm, color: colors.textSecondary, lineHeight: 20, marginBottom: spacing.sm },
  timeRow: { flexDirection: "row", gap: spacing.sm, marginVertical: spacing.sm },
  timeButton: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderRadius: radius.pill,
    paddingVertical: spacing.sm + 2,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  timeButtonText: { fontSize: fontSize.sm, fontWeight: "700", color: colors.textPrimary },
  pickerWrapper: { alignItems: "center", marginVertical: spacing.sm },
  closePicker: { paddingVertical: spacing.xs },
  closePickerText: { fontSize: fontSize.sm, fontWeight: "700", color: colors.glow },
  freqRow: { flexDirection: "row", gap: spacing.sm, flexWrap: "wrap", marginVertical: spacing.sm },
  freqChip: {
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.10)",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  freqChipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  freqChipText: { fontSize: fontSize.sm, fontWeight: "700", color: colors.textSecondary },
  freqChipTextActive: { color: colors.textOnPrimary },
  testButton: {
    backgroundColor: "rgba(45,212,191,0.15)",
    borderRadius: radius.pill,
    paddingVertical: spacing.sm + 4,
    alignItems: "center",
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: "rgba(45,212,191,0.35)",
  },
  testButtonText: { fontSize: fontSize.sm, fontWeight: "700", color: colors.glow },
  devCard: { padding: spacing.lg, marginTop: spacing.lg, alignItems: "center" },
  devTitle: { fontSize: fontSize.sm, fontWeight: "700", color: colors.textTertiary, marginBottom: spacing.md, textTransform: "uppercase", letterSpacing: 1 },
  devButton: {
    backgroundColor: "rgba(248,113,113,0.15)",
    borderRadius: radius.pill,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(248,113,113,0.4)",
  },
  devButtonText: { fontSize: fontSize.sm, fontWeight: "700", color: colors.danger },
});