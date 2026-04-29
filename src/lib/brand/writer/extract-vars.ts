/**
 * Extract structural brand vars from a PPTX without LLM calls.
 *
 * - Colors come from `ppt/slides/*.xml` `<a:srgbClr val="...">` frequency.
 * - Fonts come from typeface declarations across slides + slideMasters.
 * - Best-effort logo: smallest opaque PNG in `ppt/media/` is usually a logo
 *   (returns nothing if none looks logo-like).
 *
 * Falls back gracefully when fields can't be inferred — vision is the second
 * pass that fills gaps.
 */

import { exec as execCb } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import os from "os";
import { DEFAULT_BRAND_VARS, type BrandVars } from "../types";

const exec = promisify(execCb);

export interface ExtractStructuralOptions {
  /** Brand name to embed in BrandVars. */
  brandName: string;
  /** Pre-extracted PPTX directory. If omitted, the function unzips the pptx itself. */
  pptxDir?: string;
  /** Path to the original pptx (used when pptxDir is not provided). */
  pptxPath?: string;
}

export interface StructuralExtraction {
  brandVars: BrandVars;
  /** Raw ranked colors (most → least frequent). Top-15 cap. */
  colorsByFrequency: Array<{ hex: string; count: number }>;
  /** Raw ranked typefaces from slides + masters. */
  typefacesByFrequency: Array<{ name: string; count: number }>;
  /** The unzipped pptx directory — exposed so the caller can scan ppt/media/ for logos before cleanup runs. */
  pptxDir: string;
  /** Cleanup callback when we created the pptxDir ourselves. */
  cleanup?: () => void;
}

function unzipPptx(pptxPath: string): { dir: string; cleanup: () => void } {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "brand-pptx-"));
  return { dir, cleanup: () => fs.rmSync(dir, { recursive: true, force: true }) };
}

async function readAllSlideXml(pptxDir: string): Promise<string> {
  const slides = path.join(pptxDir, "ppt", "slides");
  const masters = path.join(pptxDir, "ppt", "slideMasters");
  let combined = "";
  for (const dir of [slides, masters]) {
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir)) {
      if (f.endsWith(".xml")) combined += fs.readFileSync(path.join(dir, f), "utf-8");
    }
  }
  return combined;
}

function rankColors(xml: string): Array<{ hex: string; count: number }> {
  const re = /<a:srgbClr val="([A-Fa-f0-9]{6})"/g;
  const counts = new Map<string, number>();
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) {
    const hex = `#${m[1].toUpperCase()}`;
    counts.set(hex, (counts.get(hex) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([hex, count]) => ({ hex, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);
}

function rankTypefaces(xml: string): Array<{ name: string; count: number }> {
  const re = /<a:latin\s+typeface="([^"]+)"/g;
  const counts = new Map<string, number>();
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) {
    const name = m[1];
    if (name.startsWith("+")) continue; // theme references, not literal fonts
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

function isNeutral(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  // White, black, near-grey
  if (Math.abs(r - g) < 12 && Math.abs(g - b) < 12 && Math.abs(r - b) < 12) return true;
  return false;
}

function luminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function googleFontUrl(family: string, weights: string): string {
  const fam = family.replace(/\s+/g, "+");
  return `https://fonts.googleapis.com/css2?family=${fam}:wght@${weights}&display=swap`;
}

/**
 * Map raw ranked colors into BrandVars color slots:
 *  - dark: darkest non-neutral with luminance < 0.2
 *  - text: darkest of (dark candidates) — often shares with `dark`
 *  - accent: most frequent saturated mid-tone
 *  - accentLight: an alternate saturated tone for dark-bg use
 *  - surface: the darkest near-white neutral
 *  - border: a mid-grey neutral
 */
function assignColorSlots(
  ranked: Array<{ hex: string; count: number }>,
): BrandVars["colors"] {
  const colors = { ...DEFAULT_BRAND_VARS.colors };

  const nonNeutrals = ranked.filter((c) => !isNeutral(c.hex));
  const dark = nonNeutrals.filter((c) => luminance(c.hex) < 0.2).sort((a, b) => luminance(a.hex) - luminance(b.hex));
  const mid = nonNeutrals.filter((c) => luminance(c.hex) >= 0.2 && luminance(c.hex) < 0.6);

  if (dark[0]) {
    colors.dark = dark[0].hex;
    colors.text = dark[0].hex;
  }
  if (dark[1]) {
    colors.darkInner = dark[1].hex;
  }
  if (mid[0]) {
    colors.accent = mid[0].hex;
  }
  if (mid[1]) {
    colors.accentLight = mid[1].hex;
  } else if (mid[0]) {
    colors.accentLight = mid[0].hex;
  }
  return colors;
}

export async function extractStructuralBrandVars(
  opts: ExtractStructuralOptions,
): Promise<StructuralExtraction> {
  let pptxDir = opts.pptxDir;
  let cleanup: (() => void) | undefined;
  if (!pptxDir) {
    if (!opts.pptxPath) throw new Error("Provide pptxDir or pptxPath");
    const u = unzipPptx(opts.pptxPath);
    pptxDir = u.dir;
    cleanup = u.cleanup;
    await exec(`unzip -o "${opts.pptxPath}" -d "${pptxDir}" > /dev/null`);
  }

  const xml = await readAllSlideXml(pptxDir);
  const colorsByFrequency = rankColors(xml);
  const typefacesByFrequency = rankTypefaces(xml);

  const colors = assignColorSlots(colorsByFrequency);

  // Pick the dominant typeface (skipping office defaults if a real brand font exists).
  const officeDefaults = new Set(["Calibri", "Calibri Light", "Cambria", "Arial", "Times New Roman"]);
  const branded = typefacesByFrequency.find((t) => !officeDefaults.has(t.name));
  const headingFamily = branded?.name ?? typefacesByFrequency[0]?.name ?? DEFAULT_BRAND_VARS.fonts.headingFamily;
  // Body falls back to the same family unless we found a clearly different secondary.
  const bodyCandidate = typefacesByFrequency.find((t) => t.name !== headingFamily && !officeDefaults.has(t.name));
  const bodyFamily = bodyCandidate?.name ?? headingFamily;

  const brandVars: BrandVars = {
    ...DEFAULT_BRAND_VARS,
    brandName: opts.brandName,
    headerLeft: opts.brandName.toUpperCase().slice(0, 40),
    headerRight: "Confidential",
    colors,
    fonts: {
      headingFamily,
      headingImportUrl: googleFontUrl(headingFamily, "400;500;600;700;800"),
      bodyFamily,
      bodyImportUrl: googleFontUrl(bodyFamily, "400;500;600"),
    },
    logo: { ...DEFAULT_BRAND_VARS.logo },
  };

  return { brandVars, colorsByFrequency, typefacesByFrequency, pptxDir, cleanup };
}
