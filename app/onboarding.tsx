// app/onboarding.tsx
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { ArrowRight, MapPin, ThermometerSun } from "lucide-react-native";
import { useState } from "react";
import { ActivityIndicator, Image, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppBackground } from "../components/AppBackground";
import { GlassCard } from "../components/GlassCard";
import { PressScale } from "../components/PressScale";
import { Stepper } from "../components/Stepper";
import { colors, fontSize, radius, shadows, spacing } from "../src/constants/theme";
import { refreshWeather } from "../src/services/weather";
import { useHydrationStore } from "../src/store/useHydrationStore";
import {
  COEFFICIENT_CHAUD,
  COEFFICIENT_FRAIS,
  computeDailyGoalMl,
  formatLiters,
  WEIGHT_MAX,
  WEIGHT_MIN,
} from "../src/utils/hydration";

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
      if (granted) await refreshWeather();
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

  return (
    <AppBackground>
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <StepDots step={step} />
        {step === 1 && <WelcomeStep onNext={() => setStep(2)} />}
        {step === 2 && (
          <ProfileStep
            weightKg={weightKg}
            setWeightKg={setWeightKg}
            goalFrais={goalFrais}
            goalChaud={goalChaud}
            onNext={() => setStep(3)}
          />
        )}
        {step === 3 && (
          <WeatherStep
            gpsLoading={gpsLoading}
            gpsGranted={gpsGranted}
            requestGps={requestGps}
            onFinish={finishOnboarding}
          />
        )}
      </SafeAreaView>
    </AppBackground>
  );
}

function StepDots({ step }: { step: number }) {
  return (
    <View style={styles.dots}>
      {[1, 2, 3].map((i) => (
        <View key={i} style={[styles.dot, i === step && styles.dotActive, i < step && styles.dotDone]} />
      ))}
    </View>
  );
}

function Credits() {
  return (
    <View style={styles.credits}>
      <Text style={styles.creditsText}>
        Conçu par <Text style={styles.creditsName}>Alvine Yoka</Text>
      </Text>
      <Text style={[styles.creditsText, { marginTop: 2 }]}>
        pour <Text style={styles.creditsCommunity}>Les Conquérants d'une Excellente Vie</Text>
      </Text>
    </View>
  );
}

function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <>
      <View style={styles.content}>
        <View style={styles.dropHalo}>
          <Image source={require("../assets/drop-3d.png")} style={styles.dropImage} resizeMode="contain" />
        </View>
        <Text style={styles.title}>Hydra</Text>
        <Text style={styles.subtitle}>
          Votre rappel d'eau quotidien,{"\n"}personnalisé et intelligent.
        </Text>
      </View>
      <View style={styles.footer}>
        <Credits />
        <CtaButton label="Commencer" onPress={onNext} />
      </View>
    </>
  );
}

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
    <>
      <View style={styles.content}>
        <Text style={styles.stepTitle}>Votre profil</Text>
        <Text style={styles.stepSubtitle}>Pour personnaliser votre objectif quotidien.</Text>

        <GlassCard style={styles.card}>
          <Text style={styles.cardLabel}>Votre poids</Text>
          <Stepper value={weightKg} onChange={setWeightKg} min={WEIGHT_MIN} max={WEIGHT_MAX} step={1} unit="kg" />
        </GlassCard>

        <GlassCard style={styles.card} strong>
          <Text style={styles.cardLabel}>💡 La formule</Text>
          <Text style={styles.formulaText}>
            <Text style={styles.formulaBold}>{weightKg} kg</Text> ×{" "}
            <Text style={styles.formulaBold}>{COEFFICIENT_FRAIS} ml</Text> ={" "}
            <Text style={styles.formulaResult}>{formatLiters(goalFrais)}/jour</Text>
          </Text>
          <Text style={styles.formulaSmall}>(temps frais)</Text>
          <View style={styles.divider} />
          <Text style={styles.formulaText}>
            <Text style={styles.formulaBold}>{weightKg} kg</Text> ×{" "}
            <Text style={styles.formulaBold}>{COEFFICIENT_CHAUD} ml</Text> ={" "}
            <Text style={styles.formulaResult}>{formatLiters(goalChaud)}/jour</Text>
          </Text>
          <Text style={styles.formulaSmall}>(temps chaud)</Text>
        </GlassCard>
      </View>
      <View style={styles.footer}>
        <Credits />
        <CtaButton label="Continuer" onPress={onNext} />
      </View>
    </>
  );
}

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
    <>
      <View style={styles.content}>
        <Text style={styles.stepTitle}>Météo en temps réel</Text>
        <Text style={styles.stepSubtitle}>Votre objectif s'ajuste à la température.</Text>

        <GlassCard style={styles.card} strong>
          <ThermometerSun size={48} color={colors.glow} />
          <Text style={styles.weatherTitle}>S'il fait chaud (+27°C)</Text>
          <Text style={styles.weatherDesc}>
            Votre besoin en eau augmente. Hydra passe automatiquement au coefficient{" "}
            <Text style={styles.formulaBold}>{COEFFICIENT_CHAUD} ml/kg</Text>.
          </Text>
        </GlassCard>

        <PressScale
          onPress={requestGps}
          disabled={gpsLoading}
          style={[styles.gpsButton, gpsLoading && styles.gpsDisabled]}
        >
          {gpsLoading ? (
            <ActivityIndicator color={colors.textOnPrimary} />
          ) : (
            <>
              <MapPin size={20} color={colors.textOnPrimary} />
              <Text style={styles.gpsText}>{gpsGranted ? "✓ Localisation activée" : "Activer la localisation"}</Text>
            </>
          )}
        </PressScale>

        {gpsGranted && (
          <Text style={styles.gpsHint}>Parfait ! Hydra récupérera la météo locale toutes les 3 h.</Text>
        )}
      </View>
      <View style={styles.footer}>
        <Credits />
        <CtaButton label="C'est parti !" onPress={onFinish} />
      </View>
    </>
  );
}

function CtaButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <PressScale onPress={onPress} style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}>
      <LinearGradient
        colors={["#4A90D9", "#2DD4BF"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.ctaGradient}
      >
        <Text style={styles.ctaText}>{label}</Text>
        <ArrowRight size={20} color={colors.textOnPrimary} />
      </LinearGradient>
    </PressScale>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  dots: { flexDirection: "row", justifyContent: "center", gap: spacing.sm, paddingTop: spacing.lg },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.25)" },
  dotDone: { backgroundColor: "rgba(255,255,255,0.5)" },
  dotActive: { width: 24, backgroundColor: colors.accent },
  content: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.xl, alignItems: "center" },
  footer: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  dropHalo: {
    width: 200,
    height: 200,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
    borderRadius: 100,
    ...shadows.glow,
  },
  dropImage: { width: 190, height: 190 },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: "800",
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  subtitle: { fontSize: fontSize.md, color: colors.textSecondary, textAlign: "center", lineHeight: 24 },
  stepTitle: { fontSize: fontSize.xl, fontWeight: "800", color: colors.textPrimary, textAlign: "center", marginBottom: spacing.xs },
  stepSubtitle: { fontSize: fontSize.md, color: colors.textSecondary, textAlign: "center", marginBottom: spacing.lg },
  card: { width: "100%", padding: spacing.lg, marginBottom: spacing.md, alignItems: "center" },
  cardLabel: {
    fontSize: fontSize.sm,
    fontWeight: "700",
    color: colors.textSecondary,
    marginBottom: spacing.md,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  formulaText: { fontSize: fontSize.md, color: colors.textPrimary, textAlign: "center", marginBottom: spacing.xs },
  formulaSmall: { fontSize: fontSize.xs, color: colors.textSecondary, marginBottom: spacing.md },
  formulaBold: { fontWeight: "700" },
  formulaResult: { fontWeight: "800", color: colors.glow },
  divider: { width: "100%", height: 1, backgroundColor: "rgba(255,255,255,0.15)", marginVertical: spacing.md },
  weatherTitle: { fontSize: fontSize.lg, fontWeight: "700", color: colors.textPrimary, marginTop: spacing.md, marginBottom: spacing.sm, textAlign: "center" },
  weatherDesc: { fontSize: fontSize.sm, color: colors.textSecondary, textAlign: "center", lineHeight: 22 },
  gpsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  gpsDisabled: { opacity: 0.6 },
  gpsText: { color: colors.textPrimary, fontWeight: "700", fontSize: fontSize.md },
  gpsHint: { fontSize: fontSize.sm, color: colors.success, textAlign: "center", marginTop: spacing.md, fontWeight: "600" },
  cta: { borderRadius: radius.pill, overflow: "hidden", ...shadows.glow },
  ctaPressed: { opacity: 0.9 },
  ctaGradient: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: spacing.md, gap: spacing.sm },
  ctaText: { color: colors.textOnPrimary, fontSize: fontSize.lg, fontWeight: "800" },
  credits: {
    alignItems: "center",
    marginBottom: spacing.md,
  },
  creditsText: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    textAlign: "center",
  },
  creditsName: {
    color: colors.textPrimary,
    fontWeight: "700",
  },
  creditsCommunity: {
    color: colors.glow,
    fontStyle: "italic",
    fontWeight: "600",
  },
});