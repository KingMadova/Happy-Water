// app/onboarding.tsx
import { useRouter } from "expo-router";
import { ArrowRight, Droplets, MapPin, ThermometerSun } from "lucide-react-native";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";

import { Stepper } from "../components/Stepper";
import {
  COEFFICIENT_CHAUD,
  COEFFICIENT_FRAIS,
  computeDailyGoalMl,
  formatLiters,
  WEIGHT_MAX,
  WEIGHT_MIN,
} from "../src/utils/hydration";
import { colors, fontSize, gradients, radius, spacing } from "../src/constants/theme";
import { useHydrationStore } from "../src/store/useHydrationStore";
import { refreshWeather } from "../src/services/weather";

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  const weightKg = useHydrationStore((s) => s.weightKg);
  const setWeightKg = useHydrationStore((s) => s.setWeightKg);
  const completeOnboarding = useHydrationStore((s) => s.completeOnboarding);

  const goalFrais = computeDailyGoalMl(weightKg, COEFFICIENT_FRAIS);
  const goalChaud = computeDailyGoalMl(weightKg, COEFFICIENT_CHAUD);

  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsGranted, setGpsGranted] = useState(false);

  const requestGps = async () => {
    setGpsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const granted = status === "granted";
      setGpsGranted(granted);
      if (granted) {
        await refreshWeather();
      }
    } catch {
      setGpsGranted(false);
    } finally {
      setGpsLoading(false);
    }
  };

  const finishOnboarding = () => {
    completeOnboarding();
    router.replace("/(tabs)");
  };

  if (step === 1) return <WelcomeStep onNext={() => setStep(2)} />;
  if (step === 2)
    return (
      <ProfileStep
        weightKg={weightKg}
        setWeightKg={setWeightKg}
        goalFrais={goalFrais}
        goalChaud={goalChaud}
        onNext={() => setStep(3)}
      />
    );
  return (
    <WeatherStep
      gpsLoading={gpsLoading}
      gpsGranted={gpsGranted}
      requestGps={requestGps}
      onFinish={finishOnboarding}
    />
  );
}

// ============================================
// ÉTAPE 1 : Bienvenue
// ============================================
function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <LinearGradient colors={[...gradients.background]} style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Droplets size={80} color={colors.primary} strokeWidth={1.5} />
        </View>
        <Text style={styles.title}>Hydra</Text>
        <Text style={styles.subtitle}>Votre rappel d'eau quotidien, personnalisé et intelligent.</Text>
      </View>
      <View style={styles.footer}>
        <Pressable onPress={onNext} style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}>
          <LinearGradient colors={[...gradients.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.ctaGradient}>
            <Text style={styles.ctaText}>Commencer</Text>
            <ArrowRight size={20} color={colors.textOnPrimary} />
          </LinearGradient>
        </Pressable>
      </View>
    </LinearGradient>
  );
}

// ============================================
// ÉTAPE 2 : Profil (poids + formule)
// ============================================
function ProfileStep({
  weightKg,
  setWeightKg,
  goalFrais,
  goalChaud,
  onNext,
}: {
  weightKg: number;
  setWeightKg: (kg: number) => void;
  goalFrais: number;
  goalChaud: number;
  onNext: () => void;
}) {
  return (
    <LinearGradient colors={[...gradients.background]} style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.stepTitle}>Votre profil</Text>
        <Text style={styles.stepSubtitle}>Pour personnaliser votre objectif quotidien.</Text>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Votre poids</Text>
          <Stepper
            value={weightKg}
            onChange={setWeightKg}
            min={WEIGHT_MIN}
            max={WEIGHT_MAX}
            step={1}
            unit="kg"
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>💡 La formule</Text>
          <Text style={styles.formulaText}>
            <Text style={styles.formulaBold}>{weightKg} kg</Text> ×{" "}
            <Text style={styles.formulaBold}>{COEFFICIENT_FRAIS} ml</Text> ={" "}
            <Text style={styles.formulaResult}>{formatLiters(goalFrais)}/jour</Text>
          </Text>
          <Text style={styles.formulaTextSmall}>(temps frais)</Text>

          <View style={styles.divider} />

          <Text style={styles.formulaText}>
            <Text style={styles.formulaBold}>{weightKg} kg</Text> ×{" "}
            <Text style={styles.formulaBold}>{COEFFICIENT_CHAUD} ml</Text> ={" "}
            <Text style={styles.formulaResult}>{formatLiters(goalChaud)}/jour</Text>
          </Text>
          <Text style={styles.formulaTextSmall}>(temps chaud)</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Pressable onPress={onNext} style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}>
          <LinearGradient colors={[...gradients.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.ctaGradient}>
            <Text style={styles.ctaText}>Continuer</Text>
            <ArrowRight size={20} color={colors.textOnPrimary} />
          </LinearGradient>
        </Pressable>
      </View>
    </LinearGradient>
  );
}

// ============================================
// ÉTAPE 3 : Météo (GPS + toggle auto)
// ============================================
function WeatherStep({
  gpsLoading,
  gpsGranted,
  requestGps,
  onFinish,
}: {
  gpsLoading: boolean;
  gpsGranted: boolean;
  requestGps: () => void;
  onFinish: () => void;
}) {
  return (
    <LinearGradient colors={[...gradients.background]} style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.stepTitle}>Météo en temps réel</Text>
        <Text style={styles.stepSubtitle}>Ajustez automatiquement votre objectif selon la température.</Text>

        <View style={styles.card}>
          <ThermometerSun size={48} color={colors.primary} />
          <Text style={styles.weatherTitle}>S'il fait chaud (+27°C)</Text>
          <Text style={styles.weatherDesc}>
            Votre besoin en eau augmente. Hydra ajuste automatiquement le coefficient à{" "}
            <Text style={styles.formulaBold}>35 ml/kg</Text>.
          </Text>
        </View>

        <Pressable
          onPress={requestGps}
          disabled={gpsLoading}
          style={({ pressed }) => [styles.gpsButton, pressed && styles.gpsButtonPressed, gpsLoading && styles.gpsButtonDisabled]}
        >
          {gpsLoading ? (
            <ActivityIndicator color={colors.textOnPrimary} />
          ) : (
            <>
              <MapPin size={20} color={colors.textOnPrimary} />
              <Text style={styles.gpsButtonText}>
                {gpsGranted ? "✓ Localisation activée" : "Activer la localisation"}
              </Text>
            </>
          )}
        </Pressable>

        {gpsGranted && (
          <Text style={styles.gpsHint}>
            Parfait ! Hydra récupérera la météo locale toutes les 3h.
          </Text>
        )}
      </View>

      <View style={styles.footer}>
        <Pressable onPress={onFinish} style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}>
          <LinearGradient colors={[...gradients.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.ctaGradient}>
            <Text style={styles.ctaText}>C'est parti !</Text>
            <ArrowRight size={20} color={colors.textOnPrimary} />
          </LinearGradient>
        </Pressable>
      </View>
    </LinearGradient>
  );
}

// ============================================
// Styles
// ============================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl * 2,
    alignItems: "center",
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  iconCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: fontSize.xxl * 1.2,
    fontWeight: "800",
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 24,
  },
  stepTitle: {
    fontSize: fontSize.xl,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textAlign: "center",
  },
  stepSubtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.xl,
  },
  card: {
    width: "100%",
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    alignItems: "center",
  },
  cardLabel: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: spacing.md,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  formulaText: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  formulaTextSmall: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  formulaBold: {
    fontWeight: "700",
  },
  formulaResult: {
    fontWeight: "700",
    color: colors.primary,
  },
  divider: {
    width: "100%",
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  weatherTitle: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  weatherDesc: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  gpsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  gpsButtonPressed: {
    opacity: 0.8,
  },
  gpsButtonDisabled: {
    opacity: 0.6,
  },
  gpsButtonText: {
    color: colors.textOnPrimary,
    fontWeight: "600",
    fontSize: fontSize.md,
  },
  gpsHint: {
    fontSize: fontSize.sm,
    color: colors.success,
    textAlign: "center",
    marginTop: spacing.md,
    fontWeight: "500",
  },
  cta: {
    borderRadius: radius.pill,
    overflow: "hidden",
  },
  ctaPressed: {
    opacity: 0.9,
  },
  ctaGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  ctaText: {
    color: colors.textOnPrimary,
    fontSize: fontSize.lg,
    fontWeight: "700",
  },
});