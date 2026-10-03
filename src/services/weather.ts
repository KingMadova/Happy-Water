// src/services/weather.ts
import * as Location from "expo-location";

import { useHydrationStore } from "../store/useHydrationStore";

const OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast";
const FETCH_TIMEOUT_MS = 8000;

/** Durée de validité du cache météo : 3 heures. */
export const WEATHER_CACHE_TTL_MS = 3 * 60 * 60 * 1000;

interface OpenMeteoResponse {
  current?: {
    temperature_2m?: number;
  };
}

/** true si la température en cache a moins de 3h. */
export function isWeatherCacheFresh(fetchedAt: string | null, now = Date.now()): boolean {
  if (!fetchedAt) return false;
  const t = new Date(fetchedAt).getTime();
  return Number.isFinite(t) && now - t < WEATHER_CACHE_TTL_MS;
}

async function getPosition(): Promise<{ latitude: number; longitude: number } | null> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") return null;
  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });
  return { latitude: position.coords.latitude, longitude: position.coords.longitude };
}

async function fetchTemperature(latitude: number, longitude: number): Promise<number | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const params = new URLSearchParams({
      latitude: latitude.toFixed(4),
      longitude: longitude.toFixed(4),
      current: "temperature_2m",
    });
    const response = await fetch(`${OPEN_METEO_URL}?${params.toString()}`, {
      signal: controller.signal,
    });
    if (!response.ok) return null;
    const json = (await response.json()) as OpenMeteoResponse;
    const temp = json.current?.temperature_2m;
    return typeof temp === "number" && Number.isFinite(temp) ? temp : null;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Refresh complet : GPS → Open-Meteo → store.
 * - Si mode auto désactivé : ne fait rien.
 * - En cas d'erreur (GPS refusé, réseau, timeout) :
 *   conserve le cache s'il a moins de 3h, sinon temperatureC = null
 *   (l'UI basculera sur le mode manuel).
 * Jamais d'exception propagée.
 */
export async function refreshWeather(): Promise<void> {
  const state = useHydrationStore.getState();
  if (!state.weatherAutoEnabled) return;

  try {
    const position = await getPosition();
    if (!position) throw new Error("GPS_UNAVAILABLE");

    const temperature = await fetchTemperature(position.latitude, position.longitude);
    if (temperature === null) throw new Error("WEATHER_UNAVAILABLE");

    useHydrationStore
      .getState()
      .setWeatherData(Math.round(temperature * 10) / 10, new Date().toISOString());
  } catch {
    const current = useHydrationStore.getState();
    if (!isWeatherCacheFresh(current.weatherFetchedAt)) {
      current.setWeatherData(null, null);
    }
    // Sinon : on garde le cache tel quel
  }
}

/**
 * Timer foreground : refresh toutes les 3h.
 * Retourne la fonction de cleanup (à utiliser dans un useEffect).
 */
export function startWeatherAutoRefresh(intervalMs = WEATHER_CACHE_TTL_MS): () => void {
  const id = setInterval(() => {
    void refreshWeather();
  }, intervalMs);
  return () => clearInterval(id);
}