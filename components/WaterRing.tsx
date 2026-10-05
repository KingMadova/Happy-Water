// components/WaterRing.tsx
import { useEffect } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, ClipPath, Defs, G, LinearGradient, Path, RadialGradient, Stop, Ellipse } from "react-native-svg";
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
// 🔁 QUAND TON PNG EST PRÊT : décommente la ligne ci-dessous et commente le bloc SVG de la goutte
// import { Image } from "react-native";

import { colors, fontSize } from "../src/constants/theme";
import { formatLitersCompact, formatSmart } from "../src/utils/hydration";

const AnimatedG = Animated.createAnimatedComponent(G);

const WAVE_AMPLITUDE = 7;

interface WaterRingProps {
  currentMl: number;
  goalMl: number;
  size?: number;
  strokeWidth?: number;
}

function buildWavePath(width: number, amplitude: number, depth: number): string {
  const segment = width / 4;
  return (
    `M0 0 ` +
    `Q ${segment / 2} ${-amplitude} ${segment} 0 ` +
    `T ${segment * 2} 0 ` +
    `T ${segment * 3} 0 ` +
    `T ${segment * 4} 0 ` +
    `V ${depth} H 0 Z`
  );
}

/** Goutte 3D de secours en SVG (remplacée par le PNG quand disponible). */
function DropSVG({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <Defs>
        <RadialGradient id="dropBody" cx="38%" cy="32%" r="75%">
          <Stop offset="0%" stopColor="#A5F3FC" />
          <Stop offset="45%" stopColor="#2DD4BF" />
          <Stop offset="100%" stopColor="#0E3A5E" />
        </RadialGradient>
        <LinearGradient id="dropShine" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.9} />
          <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
        </LinearGradient>
      </Defs>
      {/* Corps de la goutte */}
      <Path
        d="M100 18 C138 64 168 100 168 132 A68 68 0 0 1 32 132 C32 100 62 64 100 18 Z"
        fill="url(#dropBody)"
      />
      {/* Reflet speculaire haut-gauche */}
      <Ellipse cx="74" cy="92" rx="16" ry="30" fill="url(#dropShine)" transform="rotate(-18 74 92)" />
      {/* Petit point lumineux */}
      <Circle cx="66" cy="74" r="6" fill="#FFFFFF" opacity={0.85} />
    </Svg>
  );
}

export function WaterRing({ currentMl, goalMl, size = 260, strokeWidth = 20 }: WaterRingProps) {
  const progress = goalMl > 0 ? Math.min(currentMl / goalMl, 1) : 0;
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);
  const clipRadius = radius - strokeWidth / 2;

  // --- Vagues ---
  const wave1X = useSharedValue(0);
  const wave2X = useSharedValue(-size / 3);
  useEffect(() => {
    wave1X.value = withRepeat(withTiming(-size, { duration: 4200, easing: Easing.linear }), -1, false);
    wave2X.value = withRepeat(withTiming(-size / 3 - size, { duration: 6400, easing: Easing.linear }), -1, false);
  }, [size, wave1X, wave2X]);

  // --- Niveau d'eau ---
  const level = useSharedValue(center + clipRadius + WAVE_AMPLITUDE);
  useEffect(() => {
    const target = center + clipRadius - progress * 2 * clipRadius;
    level.value = withTiming(target, { duration: 900, easing: Easing.out(Easing.cubic) });
  }, [progress, center, clipRadius, level]);

  const wavePath = buildWavePath(size * 2, WAVE_AMPLITUDE, size * 2);

  const wave1Props = useAnimatedProps(() => ({
    transform: [{ translateX: wave1X.value }, { translateY: level.value }],
  }));
  const wave2Props = useAnimatedProps(() => ({
    transform: [{ translateX: wave2X.value }, { translateY: level.value + WAVE_AMPLITUDE }],
  }));

  // 🔁 QUAND LE PNG EST PRÊT : remplace <DropSVG .../> par :
  // <Image source={require("../assets/drop-3d.png")} style={{ width: dropSize, height: dropSize }} />
  const dropSize = size * 0.42;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Defs>
          {/* Dégradé de l'anneau verre */}
          <LinearGradient id="ringGlass" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="rgba(255,255,255,0.55)" />
            <Stop offset="100%" stopColor="rgba(255,255,255,0.12)" />
          </LinearGradient>
          {/* Eau volumétrique */}
          <LinearGradient id="waterVol" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#5EEAD4" stopOpacity={0.95} />
            <Stop offset="100%" stopColor="#2563EB" stopOpacity={0.95} />
          </LinearGradient>
          <ClipPath id="waterClip">
            <Circle cx={center} cy={center} r={clipRadius} />
          </ClipPath>
        </Defs>

        {/* Fond intérieur du cercle (verre sombre) */}
        <Circle cx={center} cy={center} r={clipRadius} fill="rgba(7,24,47,0.55)" />

        {/* Eau animée */}
        {progress > 0 && (
          <G clipPath="url(#waterClip)">
            <AnimatedG animatedProps={wave2Props}>
              <Path d={wavePath} fill="url(#waterVol)" opacity={0.45} />
            </AnimatedG>
            <AnimatedG animatedProps={wave1Props}>
              <Path d={wavePath} fill="url(#waterVol)" opacity={0.85} />
            </AnimatedG>
            {/* Reflet speculaire en arc sur l'eau */}
            <Ellipse cx={center * 0.72} cy={center * 0.5} rx={clipRadius * 0.5} ry={clipRadius * 0.16} fill="#FFFFFF" opacity={0.18} transform={`rotate(-20 ${center * 0.72} ${center * 0.5})`} />
          </G>
        )}

        {/* Anneau en verre (bordure translucide + highlight) */}
        <Circle cx={center} cy={center} r={radius} stroke="rgba(255,255,255,0.10)" strokeWidth={strokeWidth} fill="none" />
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke="url(#ringGlass)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          rotation={-90}
          origin={`${center}, ${center}`}
        />
        {/* Highlight fin en haut de l'anneau (effet verre) */}
        <Circle cx={center} cy={center} r={radius + strokeWidth / 2 - 1} stroke="rgba(255,255,255,0.25)" strokeWidth={1.5} fill="none" strokeDasharray={`${circumference * 0.18} ${circumference}`} rotation={-110} origin={`${center}, ${center}`} />
      </Svg>

      {/* Goutte 3D au centre */}
      <View style={styles.dropWrap} pointerEvents="none">
        <Image
          source={require("../assets/drop-3d.png")}
          style={{ width: dropSize, height: dropSize }}
          resizeMode="contain"
        />
      </View>

      {/* Libellé */}
      <View style={styles.labelContainer} pointerEvents="none">
        <Text style={styles.labelText}>
          {formatSmart(currentMl)} / {formatLitersCompact(goalMl)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", justifyContent: "center" },
  dropWrap: { position: "absolute", alignItems: "center", justifyContent: "center", opacity: 0.92 },
  labelContainer: { position: "absolute", bottom: "16%", alignItems: "center" },
  labelText: {
    fontSize: fontSize.lg,
    fontWeight: "800",
    color: colors.textPrimary,
    textShadowColor: "rgba(0,0,0,0.45)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});