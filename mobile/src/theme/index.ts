export const colors = {
  // Background gradients (approximated as solid colors for RN)
  bgPrimary: "#0f172a",
  bgSecondary: "#1e293b",
  bgCard: "rgba(255, 255, 255, 0.1)",
  bgCardBorder: "rgba(255, 255, 255, 0.2)",

  // Brand colors
  cyan400: "#22d3ee",
  cyan500: "#06b6d4",
  cyan600: "#0891b2",
  teal400: "#2dd4bf",
  teal500: "#14b8a6",
  teal600: "#0d9488",

  // Purple/pink for body parts
  purple500: "#a855f7",
  pink500: "#ec4899",
  pink600: "#db2777",

  // Emerald for success
  emerald400: "#34d399",
  emerald500: "#10b981",

  // Blue
  blue500: "#3b82f6",
  blue600: "#2563eb",

  // Amber for warnings
  amber300: "#fcd34d",
  amber400: "#fbbf24",
  amber500: "#f59e0b",

  // Red for errors
  red300: "#fca5a5",
  red400: "#f87171",
  red500: "#ef4444",

  // Neutral
  white: "#ffffff",
  slate300: "#cbd5e1",
  slate400: "#94a3b8",
  slate500: "#64748b",
  slate600: "#475569",
  slate900: "#0f172a",
  slate950: "#020617",

  // Transparent
  whiteAlpha05: "rgba(255, 255, 255, 0.05)",
  whiteAlpha10: "rgba(255, 255, 255, 0.1)",
  whiteAlpha20: "rgba(255, 255, 255, 0.2)",
  cyanAlpha20: "rgba(6, 182, 212, 0.2)",
  purpleAlpha20: "rgba(168, 85, 247, 0.2)",
  amberAlpha20: "rgba(245, 158, 11, 0.2)",
  redAlpha20: "rgba(239, 68, 68, 0.2)",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
} as const;

export const fontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;
