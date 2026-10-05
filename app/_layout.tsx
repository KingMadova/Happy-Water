// app/_layout.tsx
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";

import { colors } from "../src/constants/theme";
import {
  consumePendingResponse,
  initNotificationResponseHandler,
  initNotifications,
  syncRemindersOnStartup,
} from "../src/services/notifications";
import { useHydrationStore } from "../src/store/useHydrationStore";

// Le splash reste visible jusqu'à l'hydratation du store
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (useHydrationStore.persist.hasHydrated()) {
      useHydrationStore.getState().updateStreak();
      setReady(true);
    }
    const unsubscribe = useHydrationStore.persist.onFinishHydration(() => {
      useHydrationStore.getState().updateStreak();
      setReady(true);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [ready]);

  useEffect(() => {
    void initNotifications();
    void syncRemindersOnStartup();
    const removeResponseHandler = initNotificationResponseHandler();
    void consumePendingResponse();
    return () => {
      removeResponseHandler();
    };
  }, []);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bgDeep },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}