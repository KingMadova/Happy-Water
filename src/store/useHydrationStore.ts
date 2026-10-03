// src/store/useHydrationStore.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import {
  clamp,
  computeDailyGoalMl,
  DEFAULT_HEAT_THRESHOLD,
  getCoefficient,
  HEAT_THRESHOLD_MAX,
  HEAT_THRESHOLD_MIN,
  MANUAL_GOAL_MAX_ML,
  MANUAL_GOAL_MIN_ML,
  MANUAL_GOAL_STEP_ML,
  todayKey,
  WEIGHT_MAX,
  WEIGHT_MIN,
  type WeatherMode,
} from "../utils/hydration";

export type ManualWeatherMode = "frais" | "chaud";

export interface DayLog {
  totalMl: number;
  goalMl: number; // objectif en vigueur ce jour-là (ml)
  entries: { ml: number; at: string }[]; // at = ISO string
}

export interface HydraState {
  // ----- Données persistées -----
  onboardingDone: boolean;
  weightKg: number;
  weatherAutoEnabled: boolean; // toggle "Météo automatique (API)"
  manualMode: ManualWeatherMode; // segmented control (fallback / mode manuel)
  temperatureC: number | null; // null = météo indisponible
  weatherFetchedAt: string | null; // ISO
  heatThresholdC: number; // seuil "chaud" configurable (défaut 27)
  manualGoalOverrideMl: number | null; // slider manuel (null = calcul auto)
  remindersEnabled: boolean;
  startHour: number; // 0-23
  endHour: number; // 0-23
  frequencyHours: number; // 1 | 2 | 3 | 4
  logs: Record<string, DayLog>; // clé "YYYY-MM-DD", 30 jours glissants

  // ----- Actions -----
  completeOnboarding: () => void;
  setWeightKg: (kg: number) => void;
  setWeatherAutoEnabled: (enabled: boolean) => void;
  setManualMode: (mode: ManualWeatherMode) => void;
  setWeatherData: (temperatureC: number | null, fetchedAt: string | null) => void;
  setHeatThresholdC: (c: number) => void;
  setManualGoalOverrideMl: (ml: number | null) => void;
  setRemindersEnabled: (enabled: boolean) => void;
  setReminderWindow: (startHour: number, endHour: number) => void;
  setFrequencyHours: (hours: number) => void;
  addIntake: (ml: number) => void;
  pruneOldLogs: () => void;
}

const LOG_RETENTION_DAYS = 30;

// Wrapper défensif pour AsyncStorage (évite les crashes si le module natif est absent en Expo Go)
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
      // stockage natif indisponible : on continue en mémoire
    }
  },
  removeItem: async (name: string) => {
    try {
      await AsyncStorage.removeItem(name);
    } catch {
      // ignore
    }
  },
};

export const useHydrationStore = create<HydraState>()(
  persist(
    (set, get) => ({
      // ----- État initial -----
      onboardingDone: false,
      weightKg: 70,
      weatherAutoEnabled: true,
      manualMode: "frais",
      temperatureC: null,
      weatherFetchedAt: null,
      heatThresholdC: DEFAULT_HEAT_THRESHOLD,
      manualGoalOverrideMl: null,
      remindersEnabled: true,
      startHour: 8,
      endHour: 22,
      frequencyHours: 2,
      logs: {},

      // ----- Actions -----
      completeOnboarding: () => set({ onboardingDone: true }),

      setWeightKg: (kg) =>
        set({ weightKg: clamp(Math.round(kg), WEIGHT_MIN, WEIGHT_MAX) }),

      setWeatherAutoEnabled: (enabled) => set({ weatherAutoEnabled: enabled }),

      setManualMode: (mode) => set({ manualMode: mode }),

      setWeatherData: (temperatureC, fetchedAt) =>
        set({ temperatureC, weatherFetchedAt: fetchedAt }),

      setHeatThresholdC: (c) =>
        set({
          heatThresholdC: clamp(Math.round(c), HEAT_THRESHOLD_MIN, HEAT_THRESHOLD_MAX),
        }),

      setManualGoalOverrideMl: (ml) => {
        if (ml === null) {
          set({ manualGoalOverrideMl: null });
          return;
        }
        const rounded =
          Math.round(clamp(ml, MANUAL_GOAL_MIN_ML, MANUAL_GOAL_MAX_ML) / MANUAL_GOAL_STEP_ML) *
          MANUAL_GOAL_STEP_ML;
        set({ manualGoalOverrideMl: rounded });
      },

      setRemindersEnabled: (enabled) => set({ remindersEnabled: enabled }),

      setReminderWindow: (startHour, endHour) => {
        const s = clamp(Math.round(startHour), 0, 23);
        let e = clamp(Math.round(endHour), 0, 23);
        if (e <= s) e = Math.min(23, s + 1); // garde une fenêtre valide
        set({ startHour: s, endHour: e });
      },

      setFrequencyHours: (hours) => set({ frequencyHours: clamp(Math.round(hours), 1, 4) }),

      // Pas besoin d'action "reset jour" : les logs sont indexés par date,
      // le compteur du jour repart donc de 0 naturellement à minuit.
      addIntake: (ml) => {
        const key = todayKey();
        const current = get().logs[key] ?? { totalMl: 0, goalMl: 0, entries: [] };
        const updated: DayLog = {
          totalMl: current.totalMl + ml,
          goalMl: selectDailyGoalMl(get()),
          entries: [...current.entries, { ml, at: new Date().toISOString() }],
        };
        set({ logs: { ...get().logs, [key]: updated } });
        get().pruneOldLogs();
      },

      pruneOldLogs: () => {
        const cutoff = Date.now() - LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000;
        const logs = get().logs;
        const kept: Record<string, DayLog> = {};
        let changed = false;
        for (const [key, value] of Object.entries(logs)) {
          if (new Date(`${key}T00:00:00`).getTime() >= cutoff) kept[key] = value;
          else changed = true;
        }
        if (changed) set({ logs: kept });
      },
    }),
    {
      name: "hydra-store",
      storage: createJSONStorage(() => safeAsyncStorage),
      version: 1,
    }
  )
);

// ----- Sélecteurs dérivés (à utiliser dans les composants) -----

/** Mode effectif : auto si API dispo, sinon manuel. */
export function selectEffectiveMode(s: HydraState): WeatherMode {
  return s.weatherAutoEnabled && s.temperatureC !== null ? "auto" : s.manualMode;
}

/** Coefficient appliqué (30 ou 35 ml/kg). */
export function selectCoefficient(s: HydraState): number {
  return getCoefficient(s.temperatureC, selectEffectiveMode(s), s.heatThresholdC);
}

/** Objectif issu de la formule poids × coefficient. */
export function selectComputedGoalMl(s: HydraState): number {
  return computeDailyGoalMl(s.weightKg, selectCoefficient(s));
}

/** Objectif final affiché (override manuel prioritaire). */
export function selectDailyGoalMl(s: HydraState): number {
  return s.manualGoalOverrideMl ?? selectComputedGoalMl(s);
}

/** Log du jour (jamais undefined). */
export function selectTodayLog(s: HydraState): DayLog {
  return s.logs[todayKey()] ?? { totalMl: 0, goalMl: 0, entries: [] };
}

/** true si la température affichée vient bien de l'API en temps réel. */
export function selectIsWeatherLive(s: HydraState): boolean {
  return s.weatherAutoEnabled && s.temperatureC !== null;
}