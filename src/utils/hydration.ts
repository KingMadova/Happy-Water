export const COEFFICIENT_FRAIS = 30; // ml/kg — temps frais
export const COEFFICIENT_CHAUD = 35; // ml/kg — temps chaud

export const DEFAULT_HEAT_THRESHOLD = 27; // °C
export const HEAT_THRESHOLD_MIN = 20;
export const HEAT_THRESHOLD_MAX = 35;

export const WEIGHT_MIN = 30;
export const WEIGHT_MAX = 150;

export const MANUAL_GOAL_MIN_ML = 1000;
export const MANUAL_GOAL_MAX_ML = 4000;
export const MANUAL_GOAL_STEP_ML = 50;

export type WeatherMode = "auto" | "frais" | "chaud";

/**
 * Coefficient applicable (ml/kg).
 * - "chaud" / "frais" : forcé manuellement
 * - "auto" : basé sur la température vs seuil ; fallback frais si température inconnue
 */
export function getCoefficient(
  temperatureC: number | null,
  mode: WeatherMode,
  heatThreshold: number = DEFAULT_HEAT_THRESHOLD
): number {
  if (mode === "chaud") return COEFFICIENT_CHAUD;
  if (mode === "frais") return COEFFICIENT_FRAIS;
  if (temperatureC === null) return COEFFICIENT_FRAIS;
  return temperatureC >= heatThreshold ? COEFFICIENT_CHAUD : COEFFICIENT_FRAIS;
}

export function isHot(temperatureC: number | null, heatThreshold: number): boolean {
  return temperatureC !== null && temperatureC >= heatThreshold;
}

/** Objectif journalier en millilitres. */
export function computeDailyGoalMl(weightKg: number, coefficient: number): number {
  return Math.round(weightKg * coefficient);
}

/** 2450 → "2,45 L" */
export function formatLiters(ml: number): string {
  return `${(ml / 1000).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} L`;
}

/** 1700 → "1,7L" (version compacte pour l'anneau) */
export function formatLitersCompact(ml: number): string {
  return `${(ml / 1000).toLocaleString("fr-FR", { maximumFractionDigits: 2 })}L`;
}

/** Affichage intelligent : 500 → "500ml" · 1500 → "1,5L" */
export function formatSmart(ml: number): string {
  if (ml < 1000) return `${Math.round(ml)}ml`;
  return formatLitersCompact(ml);
}

/** Clé de log journalière : "2025-05-22" */
export function todayKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** "Mercredi 22 mai" */
export function formatDayFr(date: Date = new Date()): string {
  const s = date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}