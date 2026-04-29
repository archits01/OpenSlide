/**
 * Pure theme definitions + color resolution. No DB / browser-incompatible
 * imports — safe to import from client components and server tools alike.
 *
 * `set-theme.ts` (the AgentTool) imports from here and adds a server-only
 * "from_brand_kit" runtime branch on top.
 */

export type ThemeName = "minimal" | "dark-pro" | "academic" | "bold" | "executive" | "editorial" | "from_brand_kit";

export interface ThemeColors {
  bg: string;
  text: string;
  accent: string;
  secondary: string;
  dark: string;
  accentLight: string;
  border: string;
}

/** Concrete themes (no "from_brand_kit" — that's a runtime sentinel). */
export const THEME_DEFINITIONS: Record<Exclude<ThemeName, "from_brand_kit">, ThemeColors & { label: string }> = {
  minimal: {
    label: "Minimal",
    bg: "#FFFFFF",
    text: "#111111",
    accent: "#4F46E5",
    secondary: "rgba(17,17,17,0.55)",
    dark: "#0F172A",
    accentLight: "#818CF8",
    border: "#E2E8F0",
  },
  "dark-pro": {
    label: "Dark Pro",
    bg: "#0F0F0F",
    text: "#F5F5F5",
    accent: "#A78BFA",
    secondary: "rgba(245,245,245,0.55)",
    dark: "#1A1A2E",
    accentLight: "#C4B5FD",
    border: "rgba(245,245,245,0.12)",
  },
  academic: {
    label: "Academic",
    bg: "#F8F7F3",
    text: "#1A1A1A",
    accent: "#1D4ED8",
    secondary: "rgba(26,26,26,0.55)",
    dark: "#1E293B",
    accentLight: "#60A5FA",
    border: "#D5D3CD",
  },
  bold: {
    label: "Bold",
    bg: "#F5F0E8",
    text: "#111111",
    accent: "#E11D48",
    secondary: "rgba(17,17,17,0.55)",
    dark: "#1C1917",
    accentLight: "#FB7185",
    border: "#E2D9CC",
  },
  executive: {
    label: "Executive",
    bg: "#0f172a",
    text: "#f1f5f9",
    accent: "#f59e0b",
    secondary: "#94a3b8",
    dark: "#020617",
    accentLight: "#fbbf24",
    border: "#1e293b",
  },
  editorial: {
    label: "Editorial",
    bg: "#faf7f2",
    text: "#1c1917",
    accent: "#c2410c",
    secondary: "#78716c",
    dark: "#292524",
    accentLight: "#fed7aa",
    border: "#e7e5e4",
  },
};

/** Resolve final theme colors — base preset + optional overrides. Pure function, no IO. */
export function resolveThemeColors(theme: ThemeName, overrides?: Partial<ThemeColors>): ThemeColors {
  const baseKey = (theme === "from_brand_kit" ? "minimal" : theme) as Exclude<ThemeName, "from_brand_kit">;
  const base = THEME_DEFINITIONS[baseKey] ?? THEME_DEFINITIONS.minimal;
  if (!overrides) {
    return { bg: base.bg, text: base.text, accent: base.accent, secondary: base.secondary, dark: base.dark, accentLight: base.accentLight, border: base.border };
  }
  return {
    bg: overrides.bg ?? base.bg,
    text: overrides.text ?? base.text,
    accent: overrides.accent ?? base.accent,
    secondary: overrides.secondary ?? base.secondary,
    dark: overrides.dark ?? base.dark,
    accentLight: overrides.accentLight ?? base.accentLight,
    border: overrides.border ?? base.border,
  };
}
