// src/services/notifications.ts
import { Platform } from "react-native";
import type { NotificationContentInput, NotificationResponse } from "expo-notifications";

import {
  selectDailyGoalMl,
  selectTodayLog,
  useHydrationStore,
} from "../store/useHydrationStore";
import { formatLitersCompact, formatSmart } from "../utils/hydration";

const CHANNEL_ID = "hydra-reminders-v2";
const SOUND_FILE = "water-drop.wav";
const CATEGORY_REMINDER = "hydra-reminder";
const ACTION_ADD_250 = "ADD_250";
const handledResponses = new Set<string>();

type NotificationsModule = typeof import("expo-notifications");

let cachedModule: NotificationsModule | null | undefined;

async function loadNotifications(): Promise<NotificationsModule | null> {
  if (cachedModule !== undefined) return cachedModule;
  try {
    const mod = await import("expo-notifications");
    if (!mod || typeof mod.scheduleNotificationAsync !== "function") {
      console.warn(
        "[Hydra] Notifications désactivées : Expo Go (SDK 53+) ne supporte pas expo-notifications. Utilisez un development build."
      );
      cachedModule = null;
    } else {
      cachedModule = mod;
    }
  } catch {
    cachedModule = null;
  }
  return cachedModule;
}

export async function ensurePermission(): Promise<boolean> {
  const N = await loadNotifications();
  if (!N) return false;
  try {
    const { status } = await N.getPermissionsAsync();
    if (status === "granted") return true;
    const { status: next } = await N.requestPermissionsAsync();
    return next === "granted";
  } catch (error) {
    console.warn("[Hydra] ensurePermission échoué :", error);
    return false;
  }
}

export async function initNotifications(): Promise<void> {
  const N = await loadNotifications();
  if (!N) return;
  try {
    N.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    await N.setNotificationCategoryAsync(CATEGORY_REMINDER, [
      { identifier: ACTION_ADD_250, buttonTitle: "+250 ml 💧" },
    ]);
    if (Platform.OS === "android") {
      await N.setNotificationChannelAsync(CHANNEL_ID, {
        name: "Rappels d'hydratation",
        importance: N.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#4A90D9",
        sound: SOUND_FILE,
      });
    }
  } catch (error) {
    console.warn("[Hydra] initNotifications échoué :", error);
  }
}

function buildReminderBody(): string {
  const s = useHydrationStore.getState();
  const totalMl = selectTodayLog(s).totalMl;
  const goalMl = selectDailyGoalMl(s);
  return `Tu as bu ${formatSmart(totalMl)} sur ${formatLitersCompact(goalMl)} aujourd'hui. Un verre d'eau ?`;
}

export async function rescheduleReminders(): Promise<void> {
  const N = await loadNotifications();
  if (!N) return;
  try {
    await N.cancelAllScheduledNotificationsAsync();
    const s = useHydrationStore.getState();
    if (!s.remindersEnabled) return;
    const { status } = await N.getPermissionsAsync();
    if (status !== "granted") return;

    const content: NotificationContentInput = {
      title: "Hydrate-toi 💧",
      body: buildReminderBody(),
      sound: SOUND_FILE,
      categoryIdentifier: CATEGORY_REMINDER,
    };

    for (let hour = s.startHour; hour <= s.endHour; hour += s.frequencyHours) {
      await N.scheduleNotificationAsync({
        content,
        trigger: {
          type: N.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute: 0,
        },
      });
    }
  } catch (error) {
    console.warn("[Hydra] rescheduleReminders échoué :", error);
  }
}

/** Re-planifie les rappels au démarrage (si activés + permission). */
export async function syncRemindersOnStartup(): Promise<void> {
  const N = await loadNotifications();
  if (!N) return;
  const s = useHydrationStore.getState();
  if (!s.remindersEnabled) return;
  try {
    const { status } = await N.getPermissionsAsync();
    if (status !== "granted") return;
    await rescheduleReminders();
  } catch (error) {
    console.warn("[Hydra] syncRemindersOnStartup échoué :", error);
  }
}

// ---------- Réponses (tap notification / bouton +250 ml) ----------

function handleResponse(response: NotificationResponse): void {
  const key = response.notification.request.identifier;
  if (handledResponses.has(key)) return;
  handledResponses.add(key);
  if (response.actionIdentifier === ACTION_ADD_250) {
    useHydrationStore.getState().addIntake(250);
  }
}

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

// ---------- Bouton de test (Settings) ----------

export async function sendTestNotification(): Promise<void> {
  try {
    const N = await loadNotifications();
    if (!N) return;
    await N.scheduleNotificationAsync({
      content: {
        title: "Test Hydra 💧",
        body: "La chaîne de notifications fonctionne !",
        sound: SOUND_FILE,
        categoryIdentifier: CATEGORY_REMINDER,
      },
      trigger: {
        type: N.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 5,
      },
    });
  } catch (error) {
    console.warn("[Hydra] sendTestNotification échoué :", error);
  }
}