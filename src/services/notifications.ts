// src/services/notifications.ts
import Constants from "expo-constants";
import { Platform } from "react-native";

import {
  selectDailyGoalMl,
  selectTodayLog,
  useHydrationStore,
} from "../store/useHydrationStore";
import { formatLiters } from "../utils/hydration";

const CHANNEL_ID = "hydra-reminders";

const CATEGORY_REMINDER = "hydra-reminder";
const ACTION_ADD_250 = "ADD_250";
const handledResponses = new Set<string>(); // anti double-comptage

type NotificationsModule = typeof import("expo-notifications");
type TriggerInput = import("expo-notifications").NotificationTriggerInput;
type ContentInput = import("expo-notifications").NotificationContentInput;
type TimeIntervalTriggerInput = import("expo-notifications").TimeIntervalTriggerInput;

/** undefined = pas encore testé · null = indisponible */
let cachedModule: NotificationsModule | null | undefined;

/**
 * Détection précoce d'Expo Go :
 * - "storeClient" = Expo Go (pas de notifications push, module jette à l'import)
 * - "bare" ou "standalone" = dev build / production build (module utilisable)
 * On évite donc totalement d'importer expo-notifications en Expo Go.
 */
const isExpoGo = Constants.executionEnvironment === "storeClient";

async function loadNotifications(): Promise<NotificationsModule | null> {
  if (cachedModule !== undefined) return cachedModule;

  if (isExpoGo) {
    cachedModule = null;
    // Log une seule fois
    console.warn(
      "[Hydra] Notifications désactivées : Expo Go (SDK 53+) ne supporte pas expo-notifications. " +
        "Utilisez un development build (npx expo run:android / npx expo run:ios) pour tester."
    );
    return null;
  }

  try {
    const mod = await import("expo-notifications");
    const usable =
      !!mod &&
      typeof mod.setNotificationHandler === "function" &&
      typeof mod.scheduleNotificationAsync === "function" &&
      typeof mod.cancelAllScheduledNotificationsAsync === "function";
    if (usable) {
      cachedModule = mod;
    } else {
      cachedModule = null;
      console.warn("[Hydra] expo-notifications chargé mais API incomplète. Notifications désactivées.");
    }
  } catch (error) {
    cachedModule = null;
    console.warn("[Hydra] Impossible de charger expo-notifications :", error);
  }
  return cachedModule;
}

export async function initNotifications(): Promise<void> {
  try {
    const N = await loadNotifications();
    if (!N) return;
    N.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
    await N.setNotificationCategoryAsync(CATEGORY_REMINDER, [
      { identifier: ACTION_ADD_250, buttonTitle: "+250 ml 💧" },
    ]);
  } catch (error) {
    console.warn("[Hydra] initNotifications échoué :", error);
  }
}

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== "android") return;
  try {
    const N = await loadNotifications();
    if (!N || typeof N.setNotificationChannelAsync !== "function") return;
    await N.setNotificationChannelAsync(CHANNEL_ID, {
      name: "Rappels d'hydratation",
      importance: (N.AndroidImportance?.DEFAULT ?? 3) as import("expo-notifications").AndroidImportance,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#4A90D9",
    });
  } catch (error) {
    console.warn("[Hydra] ensureAndroidChannel échoué :", error);
  }
}

export async function isPermissionGranted(): Promise<boolean> {
  try {
    const N = await loadNotifications();
    if (!N || typeof N.getPermissionsAsync !== "function") return false;
    const status = await N.getPermissionsAsync();
    return status.granted;
  } catch {
    return false;
  }
}

export async function ensurePermission(): Promise<boolean> {
  try {
    if (await isPermissionGranted()) return true;
    const N = await loadNotifications();
    if (!N || typeof N.requestPermissionsAsync !== "function") return false;
    const request = await N.requestPermissionsAsync();
    return request.granted;
  } catch {
    return false;
  }
}

function buildReminderBody(): string {
  const s = useHydrationStore.getState();
  const totalMl = selectTodayLog(s).totalMl;
  const goalMl = selectDailyGoalMl(s);
  return `Tu as bu ${formatLiters(totalMl)} sur ${formatLiters(goalMl)} aujourd'hui. Un verre d'eau ?`;
}

function buildTrigger(N: NotificationsModule, hour: number): TriggerInput {
  const daily = N.SchedulableTriggerInputTypes?.DAILY;
  if (daily !== undefined) {
    return Platform.OS === "android"
      ? { type: daily, hour, minute: 0, channelId: CHANNEL_ID }
      : { type: daily, hour, minute: 0 };
  }
  return (Platform.OS === "android"
    ? { hour, minute: 0, repeats: true, channelId: CHANNEL_ID }
    : { hour, minute: 0, repeats: true }) as unknown as TriggerInput;
}

export async function rescheduleReminders(): Promise<void> {
  try {
    const N = await loadNotifications();
    if (!N) return;

    await N.cancelAllScheduledNotificationsAsync();
    await ensureAndroidChannel();

    const s = useHydrationStore.getState();
    if (!s.remindersEnabled) return;
    if (!(await isPermissionGranted())) return;

    const slots: number[] = [];
    for (let h = s.startHour; h <= s.endHour; h += s.frequencyHours) slots.push(h);

    const content: ContentInput = {
      title: "Hydrate-toi 💧",
      body: buildReminderBody(),
      sound: true,
      categoryIdentifier: CATEGORY_REMINDER,
    };

    for (const hour of slots) {
      await N.scheduleNotificationAsync({ content, trigger: buildTrigger(N, hour) });
    }
  } catch (error) {
    console.warn("[Hydra] rescheduleReminders échoué :", error);
  }
}

export async function syncRemindersOnStartup(): Promise<void> {
  try {
    const s = useHydrationStore.getState();
    if (s.onboardingDone && s.remindersEnabled) {
      await ensurePermission();
    }
    await rescheduleReminders();
  } catch (error) {
    console.warn("[Hydra] syncRemindersOnStartup échoué :", error);
  }
}

function handleResponse(response: import("expo-notifications").NotificationResponse): void {
  const key = response.notification.request.identifier;
  if (handledResponses.has(key)) return;
  handledResponses.add(key);
  if (response.actionIdentifier === ACTION_ADD_250) {
    useHydrationStore.getState().addIntake(250);
  }
}

/** Écoute les taps & actions (y compris lancement depuis app killée). */
export function initNotificationResponseHandler(): () => void {
  let disposed = false;
  let remove: (() => void) | null = null;
  (async () => {
    const N = await loadNotifications();
    if (!N || disposed || typeof N.addNotificationResponseReceivedListener !== "function") return;
    const sub = N.addNotificationResponseReceivedListener(handleResponse);
    remove = () => sub.remove();
  })();
  return () => {
    disposed = true;
    remove?.();
  };
}

/** Filet de sécurité : réponse arrivée avant que le listener soit prêt. */
export async function consumePendingResponse(): Promise<void> {
  try {
    const N = await loadNotifications();
    if (!N || typeof N.getLastNotificationResponseAsync !== "function") return;
    const response = await N.getLastNotificationResponseAsync();
    if (response) handleResponse(response);
  } catch (error) {
    console.warn("[Hydra] consumePendingResponse échoué :", error);
  }
}

/** Bouton dev : notification dans 5 s pour valider toute la chaîne. */
export async function sendTestNotification(): Promise<void> {
  try {
    const N = await loadNotifications();
    if (!N) return;
    const timeInterval = N.SchedulableTriggerInputTypes?.TIME_INTERVAL;
    const trigger = timeInterval
      ? ({ type: timeInterval, seconds: 5, repeats: false } as TimeIntervalTriggerInput)
      : { seconds: 5, repeats: false } as unknown as TriggerInput;
    await N.scheduleNotificationAsync({
      content: {
        title: "Test Hydra 💧",
        body: "La chaîne de notifications fonctionne !",
        categoryIdentifier: CATEGORY_REMINDER,
        sound: true,
      },
      trigger,
    });
  } catch (error) {
    console.warn("[Hydra] sendTestNotification échoué :", error);
  }
}