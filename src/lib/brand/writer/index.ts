/**
 * Brand kit writer — orchestrator.
 *
 * End-to-end pipeline that takes a source PPTX or PDF, produces a structured
 * brand kit (skill.md + design-system.md + layout-library.md + brandVars), and
 * runs validation. Returns the BrandKit content ready to persist.
 *
 * Pipeline:
 *   1. Rasterize source (PPTX → PDF → PNGs, or PDF → PNGs)
 *   2. Sample N representative slides
 *   3. Extract structural brand vars (colors, fonts) from PPTX XML
 *      (PDF flow uses vision instead — see TODO)
 *   4. Vision: classify each slide → cluster by intent
 *   5. Vision: generate Critical Rules section
 *   6. Vision: generate one Pattern entry per cluster
 *   7. Stitch into final markdown files
 *   8. Validate
 */

import fs from "fs";
import path from "path";
import os from "os";
import { rasterizePptx, rasterizePdf, rasterizeUrl } from "./rasterize";
import {
  extractStructuralBrandVars,
  type StructuralExtraction,
} from "./extract-vars";
import { classifySlides, clusterSlides } from "./cluster";
import { generateCriticalRules } from "./critical-rules";
import { generateLayoutPatterns, buildPatternIndex, type GeneratedPattern } from "./layouts";
import { validateBrandSkillMarkdown, summarizeIssues } from "./validate";
import { renderValidatePatterns, buildFixupHint, type RenderReport } from "./render-validate";
import { callVision, callVisionJson } from "./vision";
import { findLogoCandidatesInPptx, pickBestLogoCandidate, mimeFor } from "./detect-logo";
import type { BrandExtractionLogEntry, BrandVars } from "../types";

export interface RunWriterOptions {
  /** Display name of the brand. */
  brandName: string;
  /** Source kind. */
  source:
    | { kind: "pptx"; path: string }
    | { kind: "pdf"; path: string }
    | { kind: "url"; url: string };
  /** Sampling cap: how many representative slides feed into critical-rules + classify. Default 8. */
  sampleSize?: number;
  /** Max layout patterns to generate. Default 12. */
  maxPatterns?: number;
  /**
   * Optional: when provided, an auto-detected logo from the PPTX media folder
   * is uploaded via this callback. Returns the public URL to set on
   * brandVars.logo.url. If omitted, logo detection still runs but the file
   * isn't persisted (only the candidate path is logged).
   */
  uploadLogo?: (buffer: Buffer, ext: string, mimeType: string) => Promise<string>;
  /** Optional: progress callback per pipeline step. */
  onProgress?: (step: string, status: "started" | "succeeded" | "failed", message?: string) => void;
}

export interface WriterResult {
  brandVars: BrandVars;
  skillMd: string;
  designSystemMd: string;
  layoutLibraryMd: string;
  log: BrandExtractionLogEntry[];
  /** Validation summary (errors block, warnings inform). */
  validation: {
    designSystem: ReturnType<typeof validateBrandSkillMarkdown>;
    layoutLibrary: ReturnType<typeof validateBrandSkillMarkdown>;
  };
  /** Per-pattern Puppeteer render reports (skipped if PDF_SERVER_URL unset). */
  renderReports?: RenderReport[];
  /** Auto-generated 1-line summary of the kit's design language. */
  autoDescription?: string;
}

const STEP_ORDER = [
  "rasterize",
  "sample",
  "extract-vars",
  "detect-logo",
  "classify",
  "cluster",
  "critical-rules",
  "layouts",
  "render-validate",
  "stitch",
  "validate",
] as const;

type Step = (typeof STEP_ORDER)[number];

function logStep(
  log: BrandExtractionLogEntry[],
  step: Step,
  status: BrandExtractionLogEntry["status"],
  startedAt: number,
  message?: string,
  error?: string,
): void {
  log.push({
    step,
    status,
    message,
    error,
    ts: new Date().toISOString(),
    durationMs: Date.now() - startedAt,
  });
}

/** Pick N slide indices spread evenly across the deck (so cover, middle, end are all covered). */
function sampleIndices(total: number, n: number): number[] {
  if (total <= n) return Array.from({ length: total }, (_, i) => i + 1);
  const step = total / n;
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    out.push(Math.min(total, Math.max(1, Math.round(i * step) + 1)));
  }
  return Array.from(new Set(out));
}

function buildSkillMd(brandName: string): string {
  const slug = brandName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40) || "kit";
  return `---
name: brand-kit-${slug}
description: Custom brand kit for ${brandName}. Authoritative design system + layout library extracted from the brand's own template.
---

# ${brandName} Brand Kit

This is a brand-extracted kit for **${brandName}**. The design-system.md and
layout-library.md references are derived from analysis of the brand's actual
slides — not generic patterns. Use them as the authoritative reference for
every visual decision.

When generating slides:
- **Use {{brand.colors.accent}}** as the primary accent on light backgrounds.
- **Use {{brand.colors.accentLight}}** as the accent on dark panels.
- **Headings use {{brand.fonts.headingFamily}}**; body text uses {{brand.fonts.bodyFamily}}.
- **Header brand name**: "{{brand.headerLeft}}".
- **Logo URL** (when needed): {{brand.logo.url}}.

Do not invent colors, fonts, or layouts not present in this kit's references.
`;
}

function buildDesignSystemMd(
  brandName: string,
  vars: BrandVars,
  criticalRules: string,
): string {
  return `# Design System Reference — ${brandName}

Visual language extracted from ${brandName}'s actual presentation template.
All slides built under this kit must follow these values without deviation.

---

## Critical Rules (Read First)

${criticalRules}

---

## Color Palette

| Role | Variable | Default Hex | Usage |
|---|---|---|---|
| Background | \`var(--slide-bg)\` | \`{{brand.colors.bg}}\` | Slide background |
| Surface | — | \`{{brand.colors.surface}}\` | Subtle step-up surface |
| Text primary | \`var(--slide-text)\` | \`{{brand.colors.text}}\` | Headings, primary text |
| Text secondary | \`var(--slide-secondary)\` | \`{{brand.colors.textSecondary}}\` | Body text |
| Text muted | — | \`{{brand.colors.textMuted}}\` | Metadata, captions |
| Border | \`var(--slide-border)\` | \`{{brand.colors.border}}\` | Card borders, dividers |
| Border subtle | — | \`{{brand.colors.borderSubtle}}\` | Inner dividers |
| Accent (light bg) | \`var(--slide-accent)\` | \`{{brand.colors.accent}}\` | Accents on white/surface |
| Accent (dark bg) | \`var(--slide-accent-light)\` | \`{{brand.colors.accentLight}}\` | Accents on dark panels |
| Dark panel | \`var(--slide-dark)\` | \`{{brand.colors.dark}}\` | Dark panel backgrounds |
| Dark inner | — | \`{{brand.colors.darkInner}}\` | Inner dividers inside dark panels |

**Always use CSS variables in slide HTML** — \`set_theme\` populates them from the brand vars above.
**Never hardcode literal hex values** for theme-driven colors.

---

## Typography

**Heading family:** \`{{brand.fonts.headingFamily}}\`
**Body family:** \`{{brand.fonts.bodyFamily}}\`

Google Fonts import (include on every slide):
\`\`\`html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="{{brand.fonts.headingImportUrl}}" rel="stylesheet">
<link href="{{brand.fonts.bodyImportUrl}}" rel="stylesheet">
\`\`\`

| Role | Family | Size | Weight |
|---|---|---|---|
| Slide title | \`{{brand.fonts.headingFamily}}\` | 28-32px | 700-800 |
| Cover title | \`{{brand.fonts.headingFamily}}\` | 48-64px | 700-800 |
| Body text | \`{{brand.fonts.bodyFamily}}\` | 13-14px | 400-500 |
| Muted label | \`{{brand.fonts.bodyFamily}}\` | 11-12px | 600 |

---

## Standard Slide Shell

\`\`\`html
<div style="width:1280px;height:720px;overflow:hidden;background:var(--slide-bg);position:relative;display:flex;flex-direction:column;font-family:'{{brand.fonts.headingFamily}}','{{brand.fonts.bodyFamily}}',sans-serif;color:var(--slide-text);">
  <!-- Pattern content goes here — see layout-library.md -->
</div>
\`\`\`

The Critical Rules above describe exactly which signature elements (stripes,
panels, headers, footers) must appear on every slide. Apply them to whichever
pattern from the layout library you choose.
`;
}

function buildLayoutLibraryMd(
  brandName: string,
  patterns: ReturnType<typeof generateLayoutPatterns> extends Promise<infer T> ? T : never,
): string {
  const indexTable = buildPatternIndex(patterns);
  const patternsText = patterns.map((p) => p.markdown).join("\n\n---\n\n");
  return `# Layout Library — ${brandName}

${patterns.length} layout patterns extracted from ${brandName}'s actual deck.
Each slide should pick exactly one pattern and follow its HTML structure.

---

## Pattern Index

${indexTable}

---

${patternsText}
`;
}

export async function runBrandKitWriter(
  options: RunWriterOptions,
): Promise<WriterResult> {
  const log: BrandExtractionLogEntry[] = [];
  const sampleSize = options.sampleSize ?? 8;
  const maxPatterns = options.maxPatterns ?? 12;

  const recordStart = (step: Step) => {
    options.onProgress?.(step, "started");
    return Date.now();
  };
  const recordOk = (step: Step, t0: number, msg?: string) => {
    options.onProgress?.(step, "succeeded", msg);
    logStep(log, step, "succeeded", t0, msg);
  };
  const recordFail = (step: Step, t0: number, err: unknown): never => {
    const msg = err instanceof Error ? err.message : String(err);
    options.onProgress?.(step, "failed", msg);
    logStep(log, step, "failed", t0, undefined, msg);
    throw err;
  };

  // ─── Step 1: Rasterize ────────────────────────────────────────────────
  const t1 = recordStart("rasterize");
  let pngPaths: string[];
  try {
    if (options.source.kind === "pptx") {
      const r = await rasterizePptx(options.source.path);
      pngPaths = r.pngPaths;
    } else if (options.source.kind === "pdf") {
      const r = await rasterizePdf(options.source.path);
      pngPaths = r.pngPaths;
    } else {
      const r = await rasterizeUrl(options.source.url);
      pngPaths = r.pngPaths;
    }
    recordOk("rasterize", t1, `${pngPaths.length} PNGs`);
  } catch (err) {
    return recordFail("rasterize", t1, err);
  }

  // ─── Step 2: Sample ───────────────────────────────────────────────────
  const t2 = recordStart("sample");
  const sampleIdx = sampleIndices(pngPaths.length, sampleSize);
  const sampleImages = sampleIdx.map((i) => pngPaths[i - 1]).filter(Boolean);
  recordOk("sample", t2, `Picked slides ${sampleIdx.join(",")}`);

  // ─── Step 3: Extract structural brand vars (PPTX only) ────────────────
  const t3 = recordStart("extract-vars");
  let extraction: StructuralExtraction | null = null;
  let brandVars: BrandVars;
  try {
    if (options.source.kind === "pptx") {
      extraction = await extractStructuralBrandVars({
        brandName: options.brandName,
        pptxPath: options.source.path,
      });
      brandVars = extraction.brandVars;
    } else {
      // PDF / URL flow: skip XML extraction; default vars + vision corrects fonts later.
      brandVars = {
        ...(await import("../types")).DEFAULT_BRAND_VARS,
        brandName: options.brandName,
        headerLeft: options.brandName.toUpperCase(),
      };
    }
    recordOk("extract-vars", t3, `accent=${brandVars.colors.accent} dark=${brandVars.colors.dark} font=${brandVars.fonts.headingFamily}`);
  } catch (err) {
    return recordFail("extract-vars", t3, err);
  }

  // ─── Step 3.5: Auto-detect logo from PPTX media ───────────────────────
  // Scan ppt/media/ for likely logo files (small, vector or transparent PNG,
  // logo-ish filenames). If a usable candidate is found and uploadLogo is
  // provided, persist it and stamp brandVars.logo.url.
  if (options.source.kind === "pptx" && extraction?.pptxDir) {
    const t35 = recordStart("detect-logo");
    try {
      const candidates = findLogoCandidatesInPptx(extraction.pptxDir);
      const best = pickBestLogoCandidate(candidates);
      if (best && options.uploadLogo) {
        const buf = fs.readFileSync(best.fullPath);
        const url = await options.uploadLogo(buf, best.ext, mimeFor(best.ext));
        brandVars = { ...brandVars, logo: { ...brandVars.logo, url } };
        recordOk("detect-logo", t35, `Uploaded ${best.filename} (${best.bytes} bytes, score ${best.score})`);
      } else if (best) {
        recordOk("detect-logo", t35, `Found ${best.filename} (score ${best.score}) but no uploader configured — skipping persist`);
      } else {
        recordOk("detect-logo", t35, `No suitable logo found in ${candidates.length} candidates`);
      }
    } catch (err) {
      // Non-fatal — kit still works without auto-detected logo (user can upload later).
      logStep(log, "detect-logo" as Step, "failed", t35, undefined, err instanceof Error ? err.message : String(err));
    }
  }

  // ─── Step 4: Classify slides ──────────────────────────────────────────
  const t4 = recordStart("classify");
  let classifications;
  try {
    classifications = await classifySlides(sampleImages);
    recordOk("classify", t4, `${classifications.length} classifications`);
  } catch (err) {
    return recordFail("classify", t4, err);
  }

  // ─── Step 5: Cluster ──────────────────────────────────────────────────
  const t5 = recordStart("cluster");
  // Map vision-call ordinal indices back to PPTX slide page indices.
  const remapped = classifications.map((c, i) => ({
    ...c,
    index: sampleIdx[i] ?? c.index,
  }));
  const clusters = clusterSlides(remapped, maxPatterns);
  recordOk("cluster", t5, `${clusters.length} clusters: ${clusters.map((c) => c.intent).join(", ")}`);

  // Build a lookup: slide page index → image path
  const imagesByIndex = new Map<number, string>();
  for (let i = 0; i < pngPaths.length; i++) imagesByIndex.set(i + 1, pngPaths[i]);

  // ─── Step 6: Critical Rules ───────────────────────────────────────────
  // Use a smaller image subset for this call (4) to keep latency under the
  // claude-router timeout. The sampled images already span cover/middle/end.
  const t6 = recordStart("critical-rules");
  let criticalRules: string;
  try {
    const rulesImages = sampleImages.length > 4
      ? [sampleImages[0], sampleImages[Math.floor(sampleImages.length / 3)],
         sampleImages[Math.floor((sampleImages.length * 2) / 3)],
         sampleImages[sampleImages.length - 1]]
      : sampleImages;
    criticalRules = await generateCriticalRules({
      brandVars,
      slideImages: rulesImages,
    });
    recordOk("critical-rules", t6, `${criticalRules.split("\n").filter((l) => /^\d+\./.test(l)).length} rules`);
  } catch (err) {
    return recordFail("critical-rules", t6, err);
  }

  // ─── Step 6.5: Font reconciliation via dedicated vision call ──────────
  // The XML-frequency heuristic in extract-vars often picks the most-USED
  // font (typically body-text "Inter" / "Calibri"), not the brand's actual
  // HEADING font (Garamond, etc.). Run a focused vision call with cover +
  // section-divider images to identify heading + body fonts directly.
  try {
    const fontImages = sampleImages.slice(0, 3);
    const result = await callVisionJson<{
      headingFamily: string;
      headingClass: "serif" | "sans-serif" | "mono" | "display";
      bodyFamily: string;
      bodyClass: "serif" | "sans-serif" | "mono";
      confidence: "high" | "medium" | "low";
      notes?: string;
    }>({
      system: "You are a typography expert. Identify the heading font (titles) and body font (paragraphs) used in these slide images. Return exact font names if you recognize them; otherwise the closest free Google Fonts equivalent.",
      images: fontImages,
      prompt: `Examine these slides. Return JSON with:
{
  "headingFamily": <exact name; if uncertain, the closest Google Fonts match>,
  "headingClass": "serif" | "sans-serif" | "mono" | "display",
  "bodyFamily": <exact name>,
  "bodyClass": "serif" | "sans-serif" | "mono",
  "confidence": "high" | "medium" | "low",
  "notes": <one-line: how confident are you, what's the visual signature>
}

Heuristic: the heading is the LARGEST text on cover/section slides. Body is the small paragraph text. They may or may not differ.`,
      maxTokens: 600,
    });

    if (result.confidence !== "low") {
      // Override only when the new font differs from the XML-frequency pick.
      const oldHeading = brandVars.fonts.headingFamily;
      if (result.headingFamily && result.headingFamily !== oldHeading) {
        console.log(`[brand-writer] Vision font detection overrides heading: ${oldHeading} → ${result.headingFamily} (${result.headingClass})`);
        const url = `https://fonts.googleapis.com/css2?family=${result.headingFamily.replace(/\s+/g, "+")}:wght@400;500;600;700;800&display=swap`;
        brandVars = {
          ...brandVars,
          fonts: { ...brandVars.fonts, headingFamily: result.headingFamily, headingImportUrl: url },
        };
      }
      if (result.bodyFamily && result.bodyFamily !== brandVars.fonts.bodyFamily) {
        console.log(`[brand-writer] Vision font detection overrides body: ${brandVars.fonts.bodyFamily} → ${result.bodyFamily} (${result.bodyClass})`);
        const url = `https://fonts.googleapis.com/css2?family=${result.bodyFamily.replace(/\s+/g, "+")}:wght@400;500;600&display=swap`;
        brandVars = {
          ...brandVars,
          fonts: { ...brandVars.fonts, bodyFamily: result.bodyFamily, bodyImportUrl: url },
        };
      }
    } else {
      console.log(`[brand-writer] Vision font detection low-confidence; keeping XML-extracted ${brandVars.fonts.headingFamily}`);
    }
  } catch (err) {
    console.warn(`[brand-writer] Vision font detection failed; falling back to XML-extracted fonts: ${err}`);
  }

  // ─── Step 7: Layout patterns ──────────────────────────────────────────
  const t7 = recordStart("layouts");
  let patterns: GeneratedPattern[];
  try {
    patterns = await generateLayoutPatterns({
      brandVars,
      clusters,
      imagesByIndex,
    });
    recordOk("layouts", t7, `${patterns.length} patterns generated`);
  } catch (err) {
    return recordFail("layouts", t7, err);
  }

  if (patterns.length === 0) {
    throw new Error("Layout generation produced 0 patterns — vision step failed for every cluster.");
  }

  // ─── Step 7.5: Render-validate patterns + retry bad ones once ─────────
  // Each pattern's HTML is rendered headlessly in the pdf-server; reports
  // surface overflow, console errors, and failed image loads. Patterns that
  // fail get one retry with a fix-up hint built from the report. If they fail
  // again, they're kept (better than dropping) but logged in the extraction
  // log so users can see which patterns are flaky.
  const t75 = recordStart("render-validate");
  let renderReports: RenderReport[] = [];
  try {
    renderReports = await renderValidatePatterns(patterns, brandVars);
    const failingIdx = renderReports
      .map((r, i) => ({ r, i }))
      .filter(({ r }) => !r.ok && !r.skipped);

    if (failingIdx.length > 0 && failingIdx.length < patterns.length) {
      // Retry each failing pattern once with feedback embedded in the prompt.
      for (const { r, i } of failingIdx) {
        const pattern = patterns[i];
        const cluster = clusters[i];
        const repImage = imagesByIndex.get(cluster.representativeIndex);
        if (!repImage) continue;
        const hint = buildFixupHint(r);
        const fixupPrompt = `${pattern.markdown}\n\n---\n\nRender feedback on the above pattern:\n${hint}\n\nProduce a corrected version of the pattern in the same markdown format. Keep the heading, "Use when", and "Structure" sections; only fix the HTML so it renders cleanly within the 1280×720 frame.`;
        try {
          const fixed = await callVision({
            system: "You are a senior front-end engineer fixing a slide layout that overflowed or errored. Output only the corrected markdown pattern block.",
            images: [repImage],
            prompt: fixupPrompt,
            maxTokens: 4096,
          });
          patterns[i] = { ...pattern, markdown: fixed.trim() };
        } catch {
          // Retry failed; keep original.
        }
      }
      // Re-validate the retried patterns once.
      renderReports = await renderValidatePatterns(patterns, brandVars);
    }

    const stillFailing = renderReports.filter((r) => !r.ok && !r.skipped).length;
    const skipped = renderReports.filter((r) => r.skipped).length;
    recordOk(
      "render-validate",
      t75,
      skipped === renderReports.length
        ? "skipped — PDF_SERVER_URL unset"
        : `${renderReports.length - stillFailing - skipped}/${renderReports.length} clean, ${stillFailing} flaky`,
    );
  } catch (err) {
    // Don't fail extraction if validation itself errors; record and continue.
    logStep(log, "render-validate" as Step, "failed", t75, undefined, err instanceof Error ? err.message : String(err));
  }

  // ─── Step 8: Stitch ───────────────────────────────────────────────────
  const t8 = recordStart("stitch");
  const skillMd = buildSkillMd(options.brandName);
  const designSystemMd = buildDesignSystemMd(options.brandName, brandVars, criticalRules);
  const layoutLibraryMd = buildLayoutLibraryMd(options.brandName, patterns);
  recordOk("stitch", t8, `${designSystemMd.length} + ${layoutLibraryMd.length} bytes`);

  // ─── Step 9: Validate ─────────────────────────────────────────────────
  const t9 = recordStart("validate");
  const dsIssues = validateBrandSkillMarkdown(designSystemMd, brandVars);
  const llIssues = validateBrandSkillMarkdown(layoutLibraryMd, brandVars);
  recordOk(
    "validate",
    t9,
    `design-system: ${summarizeIssues(dsIssues)}; layout-library: ${summarizeIssues(llIssues)}`,
  );

  // Auto-generate a 1-line description from the first critical rule. Cheap
  // heuristic — no extra LLM call. The critical rules already capture the
  // brand's signature visual moves; the first sentence usually describes the
  // most important one.
  let autoDescription: string | undefined;
  try {
    // Use [\s\S] instead of /s flag for ES targets that don't support dotAll.
    const firstRule = criticalRules.match(/^\d+\.\s+([\s\S]+?)(?=\n\d+\.|\n\n|$)/)?.[1];
    if (firstRule) {
      // Strip markdown bold/italic and collapse whitespace.
      const clean = firstRule
        .replace(/\*\*([^*]+)\*\*/g, "$1")
        .replace(/\*([^*]+)\*/g, "$1")
        .replace(/\{\{[^}]+\}\}/g, (m) => m.includes("color") ? "brand color" : m.includes("font") ? "brand font" : "")
        .replace(/\s+/g, " ")
        .trim();
      const firstSentence = clean.match(/^.+?[.!](?=\s|$)/)?.[0] ?? clean.slice(0, 140);
      autoDescription = `${options.brandName}: ${firstSentence}`;
    }
  } catch { /* non-fatal */ }

  // Cleanup pptx unzip dir (extract-vars makes one if pptxPath given)
  extraction?.cleanup?.();

  return {
    brandVars,
    skillMd,
    designSystemMd,
    layoutLibraryMd,
    log,
    validation: { designSystem: dsIssues, layoutLibrary: llIssues },
    renderReports,
    autoDescription,
  };
}
