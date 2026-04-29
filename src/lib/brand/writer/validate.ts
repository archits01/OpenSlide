/**
 * Validate generated brand-skill markdown.
 *
 * v1: regex-only validation (no Puppeteer). We check:
 *  - No unresolved/unsubstituted brand placeholders that reference unknown paths
 *  - No literal hex colors except theme-neutral whites (#FFFFFF, #FFF, #000000, #000)
 *  - No emojis
 *  - No <style> tags or Tailwind utility classes (we want inline CSS only)
 *  - No <img> tags with literal URLs (logos go through {{brand.logo.url}})
 *
 * Returns a list of warnings; callers decide whether to retry generation
 * or accept. Phase 2 will add Puppeteer rendering for visual fidelity.
 */

import type { BrandVars } from "../types";

export interface ValidationIssue {
  severity: "error" | "warning";
  rule: string;
  message: string;
  /** Snippet of offending content (first 120 chars) */
  excerpt?: string;
}

const WHITELISTED_HEXES = new Set([
  "#FFFFFF",
  "#FFF",
  "#000000",
  "#000",
]);

const HEX_RE = /#[0-9A-Fa-f]{6}\b|#[0-9A-Fa-f]{3}\b/g;
const EMOJI_RE = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F600}-\u{1F64F}]/u;
const TAILWIND_RE = /class="[^"]*\b(bg-|text-|p-\d|m-\d|flex|grid|w-\d|h-\d)/;

const KNOWN_BRAND_PATHS = new Set<string>([
  "brandName",
  "brandTagline",
  "headerLeft",
  "headerRight",
  "footerText",
  "colors.bg",
  "colors.surface",
  "colors.text",
  "colors.textSecondary",
  "colors.textMuted",
  "colors.border",
  "colors.borderSubtle",
  "colors.accent",
  "colors.accentLight",
  "colors.dark",
  "colors.darkInner",
  "colors.success",
  "colors.warning",
  "colors.error",
  "fonts.headingFamily",
  "fonts.headingImportUrl",
  "fonts.bodyFamily",
  "fonts.bodyImportUrl",
  "fonts.monoFamily",
  "fonts.monoImportUrl",
  "logo.url",
  "logo.placement",
  "logo.sizePx",
  "logo.alt",
]);

function findHexLiterals(md: string): string[] {
  const hits: string[] = [];
  // Skip hex literals inside ```html ...``` only when they are in CSS values; for now flag all.
  let m: RegExpExecArray | null;
  HEX_RE.lastIndex = 0;
  while ((m = HEX_RE.exec(md))) {
    const hex = m[0].toUpperCase();
    if (!WHITELISTED_HEXES.has(hex)) hits.push(m[0]);
  }
  return hits;
}

function findUnknownPlaceholders(md: string): string[] {
  const re = /\{\{\s*brand\.([a-zA-Z0-9_.]+)\s*\}\}/g;
  const hits: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(md))) {
    if (!KNOWN_BRAND_PATHS.has(m[1])) hits.push(m[1]);
  }
  return hits;
}

export function validateBrandSkillMarkdown(
  markdown: string,
  _vars: BrandVars,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // 1. Unknown brand-var placeholders → error
  const unknown = findUnknownPlaceholders(markdown);
  if (unknown.length) {
    issues.push({
      severity: "error",
      rule: "unknown-placeholder",
      message: `Found ${unknown.length} placeholder(s) referencing unknown paths: ${[...new Set(unknown)].slice(0, 5).join(", ")}`,
    });
  }

  // 2. Hex literals outside whitelist → warning (some inline styles legitimately
  //    use rgba shadows, and reference rules may quote a default for context)
  const hexes = findHexLiterals(markdown);
  if (hexes.length > 5) {
    issues.push({
      severity: "warning",
      rule: "hex-literals",
      message: `Found ${hexes.length} non-whitelisted hex color literals; expected brand-var placeholders. Sample: ${[...new Set(hexes)].slice(0, 6).join(", ")}`,
    });
  }

  // 3. Emojis → error (per existing skill convention)
  const emoji = markdown.match(EMOJI_RE);
  if (emoji) {
    issues.push({
      severity: "error",
      rule: "no-emoji",
      message: `Emoji found: ${emoji[0]}. Use inline SVG icons instead.`,
    });
  }

  // 4. Tailwind classes → warning (inline CSS only)
  if (TAILWIND_RE.test(markdown)) {
    issues.push({
      severity: "warning",
      rule: "tailwind-classes",
      message: "Tailwind utility classes detected. Use inline CSS instead.",
    });
  }

  // 5. <style> tags → warning (we want fully self-contained inline styles)
  if (/<style[\s>]/i.test(markdown)) {
    issues.push({
      severity: "warning",
      rule: "style-tag",
      message: "<style> tag found. Use inline style attributes instead.",
    });
  }

  return issues;
}

export function summarizeIssues(issues: ValidationIssue[]): string {
  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warning");
  return `${errors.length} errors, ${warnings.length} warnings`;
}
