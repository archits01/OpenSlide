/**
 * Brand variable substitution.
 *
 * Markdown skill files use `{{brand.path.to.var}}` placeholders. This module
 * walks a markdown string and replaces every placeholder with the resolved
 * value from BrandVars. Missing variables become an empty string and are
 * logged — generation bugs surface early instead of leaking placeholders into
 * the system prompt.
 */

import type { BrandVars } from "./types";

const PLACEHOLDER_RE = /\{\{\s*brand\.([a-zA-Z0-9_.]+)\s*\}\}/g;

/**
 * Walk a dotted path through brand vars. Returns undefined if any segment
 * is missing.
 */
function resolvePath(vars: BrandVars, path: string): unknown {
  const parts = path.split(".");
  let cur: unknown = vars;
  for (const part of parts) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return cur;
}

export interface SubstituteResult {
  output: string;
  /** Paths that were referenced but had no value. */
  missing: string[];
}

/**
 * Substitute every `{{brand.x.y}}` placeholder in the markdown with the
 * resolved value. Non-string values are coerced via String().
 *
 * Missing values are replaced with an empty string and tracked in `missing`
 * so callers can decide to warn / fail.
 */
export function substituteBrandVars(
  markdown: string,
  vars: BrandVars,
): SubstituteResult {
  const missing: string[] = [];
  const output = markdown.replace(PLACEHOLDER_RE, (_match, path: string) => {
    const value = resolvePath(vars, path);
    if (value === undefined || value === null || value === "") {
      missing.push(path);
      return "";
    }
    return typeof value === "string" ? value : String(value);
  });
  return { output, missing };
}

/**
 * Strict variant: throws if any placeholder is unresolved. Use during
 * generation/validation, not at runtime where partial vars are allowed.
 */
export function substituteBrandVarsStrict(
  markdown: string,
  vars: BrandVars,
): string {
  const { output, missing } = substituteBrandVars(markdown, vars);
  if (missing.length) {
    const unique = Array.from(new Set(missing)).sort();
    throw new Error(
      `Unresolved brand placeholders: ${unique.map((m) => `{{brand.${m}}}`).join(", ")}`,
    );
  }
  return output;
}
