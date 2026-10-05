// app/index.tsx
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

import { colors } from "../src/constants/theme";
import { useHydrationStore } from "../src/store/useHydrationStore";

export default function Index() {
  const router = useRouter();
  const onboardingDone = useHydrationStore((s) => s.onboardingDone);
  const hasHydrated = useHydrationStore.persist.hasHydrated();

  // Petit écran de chargement pendant que Zustand lit AsyncStorage
  if (!hasHydrated) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.bgDeep }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  useEffect(() => {
    if (hasHydrated) {
      if (!onboardingDone) {
        router.replace("/onboarding" as any);
      } else {
        router.replace("/(tabs)" as any);
      }
    }
  }, [hasHydrated, onboardingDone, router]);

  return null;
}