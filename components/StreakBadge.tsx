// components/StreakBadge.tsx
import { BlurView } from "expo-blur";
import { Flame } from "lucide-react-native";
import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { useShallow } from "zustand/react/shallow";

import { colors, fontSize, radius, shadows, spacing } from "../src/constants/theme";
import { selectStreak, useHydrationStore } from "../src/store/useHydrationStore";

export function StreakBadge() {
  // useShallow évite les re-renders infinis en comparant {current, best} en profondeur
  const { current, best } = useHydrationStore(useShallow(selectStreak));
  const prevCurrent = useRef(current);
  const scale = useRef(new Animated.Value(1)).current;

  // Animation "record battu"
  useEffect(() => {
    if (current > prevCurrent.current && current === best && current > 1) {
      Animated.sequence([
        Animated.spring(scale, { toValue: 1.25, friction: 3, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, friction: 4, useNativeDriver: true }),
      ]).start();
    }
    prevCurrent.current = current;
  }, [current, best, scale]);

  if (current === 0 && best === 0) {
    return (
      <BlurView intensity={24} tint="dark" style={styles.container}>
        <Flame size={16} color="rgba(255,255,255,0.45)" />
        <Text style={styles.textEmpty}>Atteins ton objectif pour démarrer la série !</Text>
      </BlurView>
    );
  }

  const isNewRecord = current > 0 && current === best && current > 1;

  return (
    <Animated.View style={[styles.containerWrap, { transform: [{ scale }] }]}>
      <BlurView
        intensity={28}
        tint="dark"
        style={[styles.container, isNewRecord && styles.containerRecord]}
      >
        <Flame size={18} color={isNewRecord ? colors.warning : colors.accent} />
        <Text style={[styles.text, isNewRecord && styles.textRecord]}>
          {current} jour{current > 1 ? "s" : ""}
        </Text>
        {best > 1 && (
          <Text style={styles.bestText}>Record : {best}j</Text>
        )}
      </BlurView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  containerWrap: {
    alignSelf: "center",
  },
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
  containerRecord: {
    borderColor: "rgba(251,191,36,0.55)",
    backgroundColor: "rgba(251,191,36,0.12)",
    ...shadows.glow,
  },
  textEmpty: {
    fontSize: fontSize.sm,
    color: "rgba(255,255,255,0.45)",
    fontWeight: "600",
  },
  text: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
    fontWeight: "800",
  },
  textRecord: {
    color: colors.warning,
  },
  bestText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: "600",
    marginLeft: spacing.xs,
    paddingLeft: spacing.xs,
    borderLeftWidth: 1,
    borderLeftColor: "rgba(255,255,255,0.2)",
  },
});