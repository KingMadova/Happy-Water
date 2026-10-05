// src/store/useHydrationStore.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import {
  COEFFICIENT_CHAUD,
  COEFFICIENT_FRAIS,
  computeDailyGoalMl,
  isHot,
  todayKey,
} from "../utils/hydration";

// ---------- Types ----------

export interface DayLog {
  totalMl: number;
  goalMl: number;
  entries?: { ml: number; at: string }[];
}

export type ManualWeatherMode = "frais" | "chaud";

export interface HydraState {
  // ----- Onboarding -----
  onboardingDone: boolean;
  completeOnboarding: () => void;
  resetOnboarding: () => void;

  // ----- Profil -----
  weightKg: number;
  setWeightKg: (kg: number) => void;

  // ----- Météo -----
  weatherAutoEnabled: boolean;
  setWeatherAutoEnabled: (enabled: boolean) => void;
  manualMode: ManualWeatherMode;
  setManualMode: (mode: ManualWeatherMode) => void;
  temperatureC: number | null;
  setTemperatureC: (t: number | null) => void;
  weatherFetchedAt: string | null; // ISO string
  setWeatherFetchedAt: (iso: string | null) => void;
  setWeatherData: (temperatureC: number | null, iso: string | null) => void;

  // ----- Réglages -----
  heatThresholdC: number;
  setHeatThresholdC: (t: number) => void;
  manualGoalOverrideMl: number | null;
  setManualGoalOverrideMl: (ml: number | null) => void;

  // ----- Rappels -----
  remindersEnabled: boolean;
  setRemindersEnabled: (enabled: boolean) => void;
  startHour: number;
  endHour: number;
  setReminderWindow: (start: number, end: number) => void;
  frequencyHours: number;
  setFrequencyHours: (h: number) => void;

  // ----- Logs -----
  logs: Record<string, DayLog>;
  addIntake: (ml: number) => void;
  pruneOldLogs: () => void;

  // ----- Streak -----
  currentStreak: number;
  bestStreak: number;
  lastAchievedDate: string | null;
  updateStreak: () => void;
  resetStreak: () => void;
}

// ---------- Storage sécurisé ----------

const safeAsyncStorage = {
  getItem: async (name: string) => {
    try {
      return await AsyncStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: async (name: string, value: string) => {
    try {
      await AsyncStorage.setItem(name, value);
    } catch {
      /* mémoire seulement */
    }
  },
  removeItem: async (name: string) => {
    try {
      await AsyncStorage.removeItem(name);
    } catch {
      /* ignore */
    }
  },
};

// ---------- Store ----------

export const useHydrationStore = create<HydraState>()(
  persist(
    (set, get) => ({
      onboardingDone: false,
      completeOnboarding: () => set({ onboardingDone: true }),
      resetOnboarding: () => set({ onboardingDone: false }),

      weightKg: 70,
      setWeightKg: (kg) => set({ weightKg: kg }),

      weatherAutoEnabled: true,
      setWeatherAutoEnabled: (enabled) => set({ weatherAutoEnabled: enabled }),
      manualMode: "frais",
      setManualMode: (mode) => set({ manualMode: mode }),
      temperatureC: null,
      setTemperatureC: (t) => set({ temperatureC: t }),
      weatherFetchedAt: null,
      setWeatherFetchedAt: (iso) => set({ weatherFetchedAt: iso }),
      setWeatherData: (temperatureC, iso) => set({ temperatureC, weatherFetchedAt: iso }),

      heatThresholdC: 27,
      setHeatThresholdC: (t) => set({ heatThresholdC: t }),
      manualGoalOverrideMl: null,
      setManualGoalOverrideMl: (ml) => set({ manualGoalOverrideMl: ml }),

      remindersEnabled: true,
      setRemindersEnabled: (enabled) => set({ remindersEnabled: enabled }),
      startHour: 8,
      endHour: 22,
      setReminderWindow: (start, end) => set({ startHour: start, endHour: end }),
      frequencyHours: 2,
      setFrequencyHours: (h) => set({ frequencyHours: h }),

      logs: {},
      addIntake: (ml) => {
        const key = todayKey();
        const current = get().logs[key] ?? { totalMl: 0, goalMl: 0, entries: [] };
        const updated: DayLog = {
          totalMl: current.totalMl + ml,
          goalMl: selectDailyGoalMl(get()),
          entries: [...(current.entries ?? []), { ml, at: new Date().toISOString() }],
        };
        set({ logs: { ...get().logs, [key]: updated } });
        get().pruneOldLogs();
        get().updateStreak();
      },
      pruneOldLogs: () => {
        const logs = get().logs;
        const keys = Object.keys(logs);
        if (keys.length <= 30) return;
        const sorted = keys.sort();
        const toRemove = sorted.slice(0, keys.length - 30);
        const next = { ...logs };
        toRemove.forEach((k) => delete next[k]);
        set({ logs: next });
      },

      currentStreak: 0,
      bestStreak: 0,
      lastAchievedDate: null,

      resetStreak: () => set({ currentStreak: 0, lastAchievedDate: null }),

      updateStreak: () => {
        const state = get();
        const today = todayKey();
        const goalMl = selectDailyGoalMl(state);
        const todayLog = state.logs[today];
        const todayReached = !!todayLog && todayLog.totalMl > 0 && todayLog.totalMl >= goalMl;

        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const yesterdayKey = todayKey(yesterday);
        const yLog = state.logs[yesterdayKey];
        const yGoal = yLog?.goalMl || goalMl;
        const yesterdayReached = !!yLog && yLog.totalMl > 0 && yLog.totalMl >= yGoal;

        if (!todayReached) {
          if (!yesterdayReached && state.currentStreak > 0) {
            set({ currentStreak: 0, lastAchievedDate: null });
          }
          return;
        }

        let newStreak: number;
        if (state.lastAchievedDate === today) {
          newStreak = state.currentStreak;
        } else if (yesterdayReached) {
          newStreak = state.currentStreak + 1;
        } else {
          newStreak = 1;
        }

        set({
          currentStreak: newStreak,
          bestStreak: Math.max(state.bestStreak, newStreak),
          lastAchievedDate: today,
        });
      },
    }),
    {
      name: "hydra-store",
      storage: createJSONStorage(() => safeAsyncStorage),
      version: 1,
    }
  )
);

// ---------- Sélecteurs ----------

export function selectIsWeatherLive(s: HydraState): boolean {
  if (!s.weatherAutoEnabled || s.temperatureC === null || s.weatherFetchedAt === null) return false;
  const fetched = new Date(s.weatherFetchedAt).getTime();
  if (Number.isNaN(fetched)) return false;
  const THREE_HOURS = 3 * 60 * 60 * 1000;
  return Date.now() - fetched < THREE_HOURS;
}

export function selectCoefficient(s: HydraState): number {
  if (selectIsWeatherLive(s)) {
    return isHot(s.temperatureC as number, s.heatThresholdC) ? COEFFICIENT_CHAUD : COEFFICIENT_FRAIS;
  }
  return s.manualMode === "chaud" ? COEFFICIENT_CHAUD : COEFFICIENT_FRAIS;
}

export function selectDailyGoalMl(s: HydraState): number {
  if (s.manualGoalOverrideMl !== null) return s.manualGoalOverrideMl;
  return computeDailyGoalMl(s.weightKg, selectCoefficient(s));
}

export function selectTodayLog(s: HydraState): DayLog {
  return s.logs[todayKey()] ?? { totalMl: 0, goalMl: 0, entries: [] };
}

export function selectStreak(s: HydraState): { current: number; best: number } {
  return { current: s.currentStreak, best: s.bestStreak };
}