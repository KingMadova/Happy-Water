// app/_layout.tsx
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";

import { colors } from "@/constants/theme";
import {
  initNotifications,
  syncRemindersOnStartup,
  initNotificationResponseHandler,
  consumePendingResponse,
} from "@/services/notifications";
import {
  isWeatherCacheFresh,
  refreshWeather,
  startWeatherAutoRefresh,
} from "@/services/weather";
import { useHydrationStore } from "@/store/useHydrationStore";

// Le splash reste visible jusqu'à l'hydratation du store
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (useHydrationStore.persist.hasHydrated()) {
      setReady(true);
    }
    const unsubscribe = useHydrationStore.persist.onFinishHydration(() => setReady(true));
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [ready]);

  useEffect(() => {
    // --- Notifications : handler foreground + canal Android + planification initiale
    void initNotifications();
    void syncRemindersOnStartup();

    const removeResponseHandler = initNotificationResponseHandler();
    void consumePendingResponse();

    // --- Logs : purge des entrées de plus de 30 jours
    useHydrationStore.getState().pruneOldLogs();

    // --- Météo : premier refresh si cache périmé, puis timer toutes les 3h
    if (!isWeatherCacheFresh(useHydrationStore.getState().weatherFetchedAt)) {
      void refreshWeather();
    }
    const stopAutoRefresh = startWeatherAutoRefresh();

    // --- Météo : refresh au retour au premier plan (si cache périmé)
    const onAppStateChange = (status: AppStateStatus) => {
      if (
        status === "active" &&
        !isWeatherCacheFresh(useHydrationStore.getState().weatherFetchedAt)
      ) {
        void refreshWeather();
      }
    };
    const appStateSub = AppState.addEventListener("change", onAppStateChange);

    return () => {
      stopAutoRefresh();
      appStateSub.remove();
      removeResponseHandler();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.backgroundStart },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </SafeAreaProvider>
  );
}