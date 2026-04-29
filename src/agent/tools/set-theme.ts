import type { AgentTool, AgentToolContext } from "./index";
import { DEFAULT_BRAND_VARS, type BrandVars } from "@/lib/brand/types";
import { THEME_DEFINITIONS, resolveThemeColors, type ThemeName, type ThemeColors } from "./theme-defs";

// Re-export for back-compat with all existing call sites.
export { THEME_DEFINITIONS, resolveThemeColors };
export type { ThemeName, ThemeColors };

export interface SetThemeInput {
  theme: ThemeName;
  custom_colors?: Partial<ThemeColors>;
}

/** Map BrandVars colors → ThemeColors. Single source of truth for the bridge. */
function brandVarsToThemeColors(vars: BrandVars): ThemeColors {
  return {
    bg: vars.colors.bg,
    text: vars.colors.text,
    accent: vars.colors.accent,
    secondary: vars.colors.textSecondary,
    dark: vars.colors.dark,
    accentLight: vars.colors.accentLight,
    border: vars.colors.border,
  };
}

export const setThemeTool: AgentTool = {
  name: "set_theme",
  description:
    "Set the visual theme for the entire presentation. Updates CSS custom properties " +
    "(--slide-bg, --slide-text, --slide-accent, --slide-secondary) across all slides instantly. " +
    "Preset themes: minimal (white/indigo), dark-pro (dark/purple), academic (warm/blue), bold (cream/rose), executive (navy/gold), editorial (cream/terracotta). " +
    "For brand colors: pick the closest preset as base, then pass custom_colors to override specific colors. " +
    "Example: set_theme({ theme: 'dark-pro', custom_colors: { accent: '#E82127' } }) for dark slides with Tesla red. " +
    "SHORTCUT: when a brand kit is active for this session, you can call set_theme({ theme: 'from_brand_kit' }) with no custom_colors — the server will pull all colors directly from the kit. This is preferred over manually mapping kit colors yourself; it eliminates accidental drops or mis-mappings.",
  input_schema: {
    type: "object",
    properties: {
      theme: {
        type: "string",
        enum: ["minimal", "dark-pro", "academic", "bold", "executive", "editorial", "from_brand_kit"],
        description: "Base theme for structural style. Pick the closest match to the brand's aesthetic, OR use 'from_brand_kit' to source all colors from the active kit (no custom_colors needed).",
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

  async execute(rawInput: unknown, _signal?: AbortSignal, context?: AgentToolContext): Promise<{ theme: string; colors: ThemeColors; resolvedFromKit?: string }> {
    const input = rawInput as SetThemeInput;

    // "from_brand_kit" — server resolves all colors directly from the active kit.
    // Removes a class of bugs where the model maps colors manually and drops/mis-maps one.
    if (input.theme === "from_brand_kit") {
      if (!context?.activeBrandKit?.id) {
        throw new Error(
          "set_theme({ theme: 'from_brand_kit' }) called but no brand kit is active for this session. Either pick a kit on the session or use a preset theme.",
        );
      }
      // Lazy-load prisma so this tool module stays browser-bundle-safe when
      // imported transitively by client-side helpers (e.g. slide-html).
      const { prisma } = await import("@/lib/db");
      const row = await prisma.brandKit.findUnique({
        where: { id: context.activeBrandKit.id },
        select: { brandVars: true, name: true },
      });
      if (!row) {
        throw new Error(`Brand kit ${context.activeBrandKit.id} not found`);
      }
      const rawVars = (row.brandVars as Partial<BrandVars> | null) ?? {};
      const vars: BrandVars = {
        ...DEFAULT_BRAND_VARS,
        ...rawVars,
        colors: { ...DEFAULT_BRAND_VARS.colors, ...rawVars.colors },
        fonts: { ...DEFAULT_BRAND_VARS.fonts, ...rawVars.fonts },
        logo: { ...DEFAULT_BRAND_VARS.logo, ...rawVars.logo },
      };
      const colors = brandVarsToThemeColors(vars);
      // Server-side overrides still allowed (e.g. for an alternate accent on
      // one specific deck) — applied on top of the kit's resolved colors.
      const finalColors = input.custom_colors
        ? { ...colors, ...input.custom_colors }
        : colors;
      return { theme: "from_brand_kit", colors: finalColors, resolvedFromKit: row.name };
    }

    const colors = resolveThemeColors(input.theme, input.custom_colors);
    return { theme: input.theme, colors };
  },
};
