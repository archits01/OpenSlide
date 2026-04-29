/**
 * Seed a new brand kit's markdown files from the existing general-deck skill,
 * with brand-specific hex/font values replaced by {{brand.*}} placeholders.
 *
 * This is the Phase 0 fallback: until the AI skill writer is built, every brand
 * kit starts with templated copies of the proven generic files. The user gets
 * a presentation that uses the 16 generic patterns styled to their brand —
 * not as good as a custom-extracted kit, but already better than the previous
 * "rules-only" brand injection.
 */

import fs from "fs";
import path from "path";

const GENERIC_SKILL_DIR = path.join(
  process.cwd(),
  "src",
  "skills",
  "general-deck",
);

export interface SeededBrandSkill {
  skillMd: string;
  designSystemMd: string;
  layoutLibraryMd: string;
}

/**
 * Replacements applied to the generic markdown to convert raw hex/font values
 * to {{brand.*}} placeholders. Order matters — longer/more specific strings
 * first so they don't get partially matched.
 *
 * Source values come from src/skills/general-deck/references/design-system.md.
 */
const REPLACEMENTS: Array<[RegExp | string, string]> = [
  // ─── Fonts ─────────────────────────────────────────────────────────────
  // Must come before color replacements (font strings could pattern-collide).
  [/'Plus Jakarta Sans'/g, "'{{brand.fonts.headingFamily}}'"],
  [/Plus Jakarta Sans/g, "{{brand.fonts.headingFamily}}"],
  [/'DM Sans'/g, "'{{brand.fonts.bodyFamily}}'"],
  [/DM Sans/g, "{{brand.fonts.bodyFamily}}"],
  [
    "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=DM+Sans:wght@400;500;600&display=swap",
    "{{brand.fonts.headingImportUrl}}",
  ],

  // ─── Colors — DARK-PANEL CONTEXT FIRST ────────────────────────────────
  // In general-deck, #0F172A is BOTH the primary text color AND the dark-panel
  // background. We can't disambiguate by hex alone, so replace dark-panel uses
  // with {{brand.colors.dark}} BEFORE the generic #0F172A → text mapping.
  // McKinsey-style brands set text and dark to different hexes; brands that
  // use the same color get matching output by coincidence.

  // CSS-var mapping rows in design-system.md tables:
  //   | `#0F172A` | `var(--slide-text)` | ...   ← keep as text
  //   | `#0F172A` | `var(--slide-dark)` | ...   ← rewrite to dark
  [
    /\| `#0F172A` \| `var\(--slide-dark\)`/gi,
    "| `{{brand.colors.dark}}` | `var(--slide-dark)`",
  ],
  // Palette docs: "Primary dark (slate-900) | `#0F172A` | Dark panels..."
  [
    /\| `#0F172A` \| Dark panels/gi,
    "| `{{brand.colors.dark}}` | Dark panels",
  ],
  // Prose: "On dark panels (#0F172A):" — rewrite the parenthetical hex.
  [/On dark panels \(#0F172A\)/gi, "On dark panels ({{brand.colors.dark}})"],
  // CSS / inline-style dark-panel backgrounds.
  [/background:\s*#0F172A/gi, "background:{{brand.colors.dark}}"],
  [/background-color:\s*#0F172A/gi, "background-color:{{brand.colors.dark}}"],

  // ─── Accent palette ────────────────────────────────────────────────────
  [/#15803D/gi, "{{brand.colors.accent}}"],
  [/#4ADE80/gi, "{{brand.colors.accentLight}}"],

  // ─── Remaining colors ──────────────────────────────────────────────────
  // Now that dark-panel uses are rewritten, any leftover #0F172A is text.
  [/#0F172A/gi, "{{brand.colors.text}}"],
  // Slate-800 inner dark divider.
  [/#1E293B/gi, "{{brand.colors.darkInner}}"],
  // Body text / secondary.
  [/#475569/gi, "{{brand.colors.textSecondary}}"],
  [/#64748B/gi, "{{brand.colors.textSecondary}}"],
  // Muted text.
  [/#94A3B8/gi, "{{brand.colors.textMuted}}"],
  // Borders.
  [/#E2E8F0/gi, "{{brand.colors.border}}"],
  [/#F1F5F9/gi, "{{brand.colors.borderSubtle}}"],
  // Surface.
  [/#F8FAFC/gi, "{{brand.colors.surface}}"],
  // Background — keep #FFFFFF as-is (theme-neutral white).
];

function applyReplacements(input: string): string {
  let out = input;
  for (const [pattern, replacement] of REPLACEMENTS) {
    if (typeof pattern === "string") {
      out = out.split(pattern).join(replacement);
    } else {
      out = out.replace(pattern, replacement);
    }
  }
  return out;
}

/**
 * Build the SKILL.md content for a brand kit. This is the entry point the
 * skill loader sees — it points to the design-system + layout-library files
 * and contains brand-aware front matter.
 */
function buildSkillMd(brandName: string): string {
  return `---
name: brand-kit-${slugify(brandName)}
description: Custom brand kit for ${brandName}. Uses brand-specific design system and layout library.
---

# ${brandName} Brand Kit

This is a custom brand kit for **${brandName}**. All slides built under this kit
must follow the design-system.md and layout-library.md references — those files
contain the colors, fonts, and layouts specific to this brand.

When generating slides:
- **Use {{brand.colors.accent}} as the primary accent** on light backgrounds.
- **Use {{brand.colors.accentLight}} as the accent** on dark panels.
- **Headings use {{brand.fonts.headingFamily}}**; body text uses {{brand.fonts.bodyFamily}}.
- **Brand name in headers**: "{{brand.headerLeft}}".
- **Logo URL** (when needed): {{brand.logo.url}}.

The design system and layout library below are the authoritative reference for
every visual decision. Do not invent colors, fonts, or layouts not present here.
`;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40) || "kit";
}

/**
 * Read general-deck/design-system.md and layout-library.md from disk, apply
 * brand-var replacements, and return the templated markdown ready to be saved
 * to a BrandKit row.
 */
export function seedBrandSkillFromGeneric(brandName: string): SeededBrandSkill {
  const designSystemPath = path.join(
    GENERIC_SKILL_DIR,
    "references",
    "design-system.md",
  );
  const layoutLibraryPath = path.join(
    GENERIC_SKILL_DIR,
    "references",
    "layout-library.md",
  );

  if (!fs.existsSync(designSystemPath) || !fs.existsSync(layoutLibraryPath)) {
    throw new Error(
      `Generic skill files missing — expected ${designSystemPath} and ${layoutLibraryPath}`,
    );
  }

  const rawDesignSystem = fs.readFileSync(designSystemPath, "utf-8");
  const rawLayoutLibrary = fs.readFileSync(layoutLibraryPath, "utf-8");

  return {
    skillMd: buildSkillMd(brandName),
    designSystemMd: applyReplacements(rawDesignSystem),
    layoutLibraryMd: applyReplacements(rawLayoutLibrary),
  };
}
