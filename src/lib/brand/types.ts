/**
 * Brand kit v2 types.
 *
 * A brand kit is stored as markdown skill files (design-system.md, layout-library.md,
 * SKILL.md) with {{brand.path.to.var}} placeholders, plus a structured BrandVars
 * record that gets substituted in at load time.
 */

/** Logo placement on slides. */
export type LogoPlacement =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"
  | "header-inline";

/** Source kind for brand kit ingestion. */
export type BrandSourceKind = "pptx" | "pdf" | "url" | "logo" | "fonts" | "manual";

/** Which markdown file in a brand kit. */
export type BrandSkillFileKey = "skillMd" | "designSystemMd" | "layoutLibraryMd";

/** Pipeline status for a brand kit. */
export type BrandKitStatus = "draft" | "extracting" | "ready" | "failed";

/** A reference to one source file the user uploaded. */
export interface BrandSourceFile {
  kind: BrandSourceKind;
  storageUrl: string;
  originalName: string;
  uploadedAt: string; // ISO timestamp
}

/** One step in the extraction pipeline log. */
export interface BrandExtractionLogEntry {
  step: string; // e.g. "extract-vars" | "sample-slides" | "critical-rules" | ...
  status: "started" | "succeeded" | "failed";
  message?: string;
  error?: string;
  ts: string; // ISO
  durationMs?: number;
}

/**
 * Brand variables — substituted into markdown via {{brand.colors.primary}} style placeholders.
 *
 * Keep field names stable; renaming breaks templated markdown for existing kits.
 */
export interface BrandVars {
  brandName: string;
  brandTagline?: string;

  /** Free-form line shown in slide headers (left side). */
  headerLeft?: string;
  /** Free-form line shown in slide headers (right side). */
  headerRight?: string;
  /** Footer text used by closing slides / dark footer bars. */
  footerText?: string;

  colors: {
    /** Slide background. Defaults to white. */
    bg: string;
    /** Subtle step-up surface (card backgrounds, header cells). */
    surface: string;
    /** Primary text / headings color. */
    text: string;
    /** Body / muted text color. */
    textSecondary: string;
    /** Metadata / tertiary text color. */
    textMuted: string;
    /** Border color for cards, dividers, table lines. */
    border: string;
    /** Subtler border for inner dividers. */
    borderSubtle: string;
    /** Brand accent on light backgrounds. */
    accent: string;
    /** Brand accent on dark backgrounds (typically lighter for contrast). */
    accentLight: string;
    /** Dark panel background — use brand's deepest color, falls back to slate-900. */
    dark: string;
    /** Inner divider color used inside dark panels. */
    darkInner: string;
    /** Optional semantic colors. */
    success?: string;
    warning?: string;
    error?: string;
  };

  fonts: {
    /** Display / heading family (e.g. "Plus Jakarta Sans"). */
    headingFamily: string;
    /** Google Fonts (or other) import URL for the heading family. */
    headingImportUrl: string;
    /** Body family (e.g. "DM Sans"). May equal headingFamily. */
    bodyFamily: string;
    /** Import URL for the body family. */
    bodyImportUrl: string;
    /** Optional monospace family for labels / code. */
    monoFamily?: string;
    monoImportUrl?: string;
  };

  logo: {
    /** Public URL (Supabase Storage or external). Empty string = no logo. */
    url: string;
    placement: LogoPlacement;
    sizePx: number;
    /** Alt text for accessibility. */
    alt?: string;
  };
}

/** Default brand vars — used when seeding a new kit from the generic skill. */
export const DEFAULT_BRAND_VARS: BrandVars = {
  brandName: "Brand",
  brandTagline: undefined,
  headerLeft: "BRAND",
  headerRight: "Confidential",
  footerText: "Confidential",
  colors: {
    bg: "#FFFFFF",
    surface: "#F8FAFC",
    text: "#0F172A",
    textSecondary: "#475569",
    textMuted: "#94A3B8",
    border: "#E2E8F0",
    borderSubtle: "#F1F5F9",
    accent: "#15803D",
    accentLight: "#4ADE80",
    dark: "#0F172A",
    darkInner: "#1E293B",
  },
  fonts: {
    headingFamily: "Plus Jakarta Sans",
    headingImportUrl:
      "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap",
    bodyFamily: "DM Sans",
    bodyImportUrl: "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap",
  },
  logo: {
    url: "",
    placement: "top-left",
    sizePx: 32,
  },
};

/** Shape of a BrandKit row hydrated for the runtime. */
export interface BrandKitRecord {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  /** Optional registered domain for blocked-domain checks (fetch_logo). */
  domain?: string | null;
  /** Cap on layout patterns generated during extraction. */
  layoutCap?: number;
  brandVars: BrandVars;
  skillMd: string | null;
  designSystemMd: string | null;
  layoutLibraryMd: string | null;
  sourceFiles: BrandSourceFile[];
  sourceNotes: string | null;
  status: BrandKitStatus;
  extractionLog: BrandExtractionLogEntry[];
  version: number;
  userEditedFiles: BrandSkillFileKey[];
  createdAt: Date;
  updatedAt: Date;
}
