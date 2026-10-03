// components/WaterRing.tsx
import { useEffect } from "react";
import { StyleSheet, Text as RNText, View } from "react-native";
import Svg, { Circle, ClipPath, Defs, G, LinearGradient, Path, Stop, Text as SvgText } from "react-native-svg";
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { colors, fontSize } from "../src/constants/theme";
import { formatLitersCompact, formatSmart } from "../src/utils/hydration";

const AnimatedG = Animated.createAnimatedComponent(G);

const WAVE_AMPLITUDE = 6;

interface WaterRingProps {
  currentMl: number;
  goalMl: number;
  size?: number;
  strokeWidth?: number;
}

/** Une sinusoïde de 2 périodes (largeur = 2 × size) + remplissage vers le bas. */
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

export function WaterRing({ currentMl, goalMl, size = 260, strokeWidth = 18 }: WaterRingProps) {
  const progress = goalMl > 0 ? Math.min(currentMl / goalMl, 1) : 0;
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);
  const clipRadius = radius - strokeWidth / 2;

  // --- Vagues : translation horizontale en boucle (boucle parfaite sur 1 période = size)
  const wave1X = useSharedValue(0);
  const wave2X = useSharedValue(-size / 3);
  useEffect(() => {
    wave1X.value = withRepeat(withTiming(-size, { duration: 4200, easing: Easing.linear }), -1, false);
    wave2X.value = withRepeat(
      withTiming(-size / 3 - size, { duration: 6400, easing: Easing.linear }),
      -1,
      false
    );
  }, [size, wave1X, wave2X]);

  // --- Niveau d'eau : animé à chaque changement de progress
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

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="hydraRingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={colors.primary} />
            <Stop offset="100%" stopColor={colors.accent} />
          </LinearGradient>
          <LinearGradient id="hydraWaterGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={colors.accent} stopOpacity={0.85} />
            <Stop offset="100%" stopColor={colors.primary} stopOpacity={0.9} />
          </LinearGradient>
          <ClipPath id="hydraWaterClip">
            <Circle cx={center} cy={center} r={clipRadius} />
          </ClipPath>
        </Defs>

        {/* Fond intérieur du cercle */}
        <Circle cx={center} cy={center} r={clipRadius} fill={colors.card} />

        {/* Eau animée, clippée dans le cercle */}
        {progress > 0 && (
          <G clipPath="url(#hydraWaterClip)">
            <AnimatedG animatedProps={wave2Props}>
              <Path d={wavePath} fill="url(#hydraWaterGradient)" opacity={0.45} />
            </AnimatedG>
            <AnimatedG animatedProps={wave1Props}>
              <Path d={wavePath} fill="url(#hydraWaterGradient)" opacity={0.8} />
            </AnimatedG>
          </G>
        )}

        {/* Anneau de progression */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={colors.chipBackground}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke="url(#hydraRingGradient)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          rotation={-90}
          origin={`${center}, ${center}`}
        />
      </Svg>

      <View style={styles.labelContainer} pointerEvents="none">
        <View style={styles.labelPill}>
          <RNText style={styles.labelText}>
            {formatSmart(currentMl)} / {formatLitersCompact(goalMl)}
          </RNText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  labelContainer: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  labelPill: {
    backgroundColor: "rgba(255,255,255,0.82)",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  labelText: {
    fontSize: fontSize.xl,
    fontWeight: "800",
    color: colors.textPrimary,
  },
});