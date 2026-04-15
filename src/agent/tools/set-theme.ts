import type { AgentTool } from "./index";

export type ThemeName = "minimal" | "dark-pro" | "academic" | "bold";

export interface ThemeColors {
  bg: string;
  text: string;
  accent: string;
  secondary: string;
  dark: string;
  accentLight: string;
  border: string;
}

export interface SetThemeInput {
  theme: ThemeName;
  custom_colors?: Partial<ThemeColors>;
}

export const THEME_DEFINITIONS: Record<ThemeName, ThemeColors & { label: string }> = {
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
};

/** Resolve final theme colors — base preset + optional overrides */
export function resolveThemeColors(theme: ThemeName, overrides?: Partial<ThemeColors>): ThemeColors {
  const base = THEME_DEFINITIONS[theme] ?? THEME_DEFINITIONS.minimal;
  if (!overrides) return { bg: base.bg, text: base.text, accent: base.accent, secondary: base.secondary, dark: base.dark, accentLight: base.accentLight, border: base.border };
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

export const setThemeTool: AgentTool = {
  name: "set_theme",
  description:
    "Set the visual theme for the entire presentation. Updates CSS custom properties " +
    "(--slide-bg, --slide-text, --slide-accent, --slide-secondary) across all slides instantly. " +
    "Preset themes: minimal (white/indigo), dark-pro (dark/purple), academic (warm/blue), bold (cream/rose). " +
    "For brand colors: pick the closest preset as base, then pass custom_colors to override specific colors. " +
    "Example: set_theme({ theme: 'dark-pro', custom_colors: { accent: '#E82127' } }) for dark slides with Tesla red.",
  input_schema: {
    type: "object",
    properties: {
      theme: {
        type: "string",
        enum: ["minimal", "dark-pro", "academic", "bold"],
        description: "Base theme for structural style. Pick the closest match to the brand's aesthetic.",
      },
      custom_colors: {
        type: "object",
        description:
          "Optional color overrides from detected brand colors. Only include colors you want to change — omitted colors keep the base theme's values.",
        properties: {
          bg: { type: "string", description: "Background color hex" },
          text: { type: "string", description: "Primary text color hex" },
          accent: { type: "string", description: "Accent/brand color hex" },
          secondary: { type: "string", description: "Secondary/muted text color hex" },
          dark: { type: "string", description: "Dark panel background hex" },
          accentLight: { type: "string", description: "Lighter accent for dark panels hex" },
          border: { type: "string", description: "Border/divider color hex" },
        },
      },
    },
    required: ["theme"],
  },

  async execute(rawInput: unknown): Promise<{ theme: string; colors: ThemeColors }> {
    const input = rawInput as SetThemeInput;
    const colors = resolveThemeColors(input.theme, input.custom_colors);
    return { theme: input.theme, colors };
  },
};
