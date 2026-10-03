export const colors = {
  backgroundStart: "#EAF6FB",
  backgroundEnd: "#DFF7F4",
  card: "#FFFFFF",
  primary: "#4A90D9",
  accent: "#2DD4BF",
  textPrimary: "#0F2A43",
  textSecondary: "#5B7A94",
  textOnPrimary: "#FFFFFF",
  success: "#34C77B",
  warning: "#F5B841",
  chipBackground: "#F2F7FB",
  border: "#E3EEF5",
} as const;

export const gradients = {
  /** CTA principal + anneau de progression */
  primary: ["#4A90D9", "#2DD4BF"] as const,
  /** Fond d'écran global */
  background: ["#EAF6FB", "#DFF7F4"] as const,
} as const;

export const radius = {
  sm: 12,
  md: 16,
  lg: 24,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  half: 2,
  one: 4,
  two: 8,
  three: 12,
  four: 16,
  five: 20,
  six: 24,
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 28,
  xxl: 40,
} as const;

export const shadows = {
  card: {
    shadowColor: "#0F2A43",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
} as const;

// --- Compatibility exports for existing components ---
export const Colors = {
  light: {
    text: "#0F2A43",
    background: "#EAF6FB",
    backgroundElement: "#DFF7F4",
    backgroundSelected: "#D0E8F2",
    textSecondary: "#5B7A94",
    primary: "#4A90D9",
    border: "#E3EEF5",
    card: "#FFFFFF",
    notification: "#F5B841",
  },
  dark: {
    text: "#FFFFFF",
    background: "#0F2A43",
    backgroundElement: "#1A3A5C",
    backgroundSelected: "#2A4A6A",
    textSecondary: "#8FA8C0",
    primary: "#5AA0E0",
    border: "#2A4A6A",
    card: "#1A3A5C",
    notification: "#F5B841",
  },
} as const;

export type ThemeColor = keyof typeof Colors.light | 'backgroundSelected';

export const Fonts = {
  regular: "System",
  medium: "System",
  bold: "System",
  mono: "monospace",
} as const;

export const BottomTabInset = 44;
export const MaxContentWidth = 680;

export const Spacing = spacing;