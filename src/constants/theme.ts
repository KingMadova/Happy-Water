// src/constants/theme.ts

export const colors = {
  // --- Fond "nuit aquatique" ---
  bgDeep: "#07182F",
  bgMid: "#0E3A5E",
  bgTop: "#0B2A4A",

  // --- Accents ---
  primary: "#4A90D9",
  accent: "#2DD4BF",
  glow: "#5EEAD4",

  // --- Texte (clair sur fond sombre) ---
  textPrimary: "#FFFFFF",
  textSecondary: "rgba(255,255,255,0.62)",
  textTertiary: "rgba(255,255,255,0.40)",

  // --- Glassmorphism ---
  glassFill: "rgba(255,255,255,0.10)",
  glassFillStrong: "rgba(255,255,255,0.16)",
  glassBorder: "rgba(255,255,255,0.22)",
  glassBorderStrong: "rgba(255,255,255,0.35)",

  // --- Sémantique ---
  success: "#34D399",
  warning: "#FBBF24",
  danger: "#F87171",

  // --- Héritage (compat composants existants) ---
  card: "rgba(255,255,255,0.10)",
  chipBackground: "rgba(255,255,255,0.10)",
  border: "rgba(255,255,255,0.18)",
  textOnPrimary: "#FFFFFF",
} as const;

export const gradients = {
  /** CTA principal + anneau */
  primary: ["#4A90D9", "#2DD4BF"] as const,
  /** Fond global nuit aquatique */
  background: ["#07182F", "#0E3A5E", "#0B2A4A"] as const,
  /** Eau volumétrique */
  water: ["#5EEAD4", "#2563EB"] as const,
} as const;

export const radius = {
  sm: 14,
  md: 20,
  lg: 28,
  xl: 36,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 28,
  xxl: 40,
} as const;

/** Ombres adaptées au fond sombre (plus profondes, halo cyan subtil) */
export const shadows = {
  card: {
    shadowColor: "#000000",
    shadowOpacity: 0.35,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  glow: {
    shadowColor: "#2DD4BF",
    shadowOpacity: 0.45,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
} as const;