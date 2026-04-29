/**
 * Render-validate generated layout patterns via the pdf-server's /validate-html
 * endpoint. Returns per-pattern reports describing overflow, console errors,
 * and failed resource loads.
 *
 * If PDF_SERVER_URL is unset (local dev without a configured server), this
 * silently returns "skipped" reports so the pipeline still succeeds — only
 * regex-based validation runs in that case.
 */

import { substituteBrandVars } from "../template";
import type { BrandVars } from "../types";
import type { GeneratedPattern } from "./layouts";

export interface RenderReport {
  patternIntent: string;
  ok: boolean;
  /** When PDF_SERVER_URL is unset — every report is skipped. */
  skipped?: boolean;
  metrics?: {
    scrollHeight: number;
    scrollWidth: number;
    hasVerticalOverflow: boolean;
    hasHorizontalOverflow: boolean;
    elementsPastViewport: number;
    imgsWithLiteralSrc: number;
    totalImgs: number;
  };
  consoleErrors?: string[];
  failedResources?: Array<{ url: string; reason: string }>;
  error?: string;
}

const PDF_SERVER_URL = process.env.PDF_SERVER_URL ?? "";
const PDF_SERVER_SECRET = process.env.PDF_SERVER_SECRET ?? "";

/** Extract the first ```html ... ``` code block from a Pattern's markdown. */
function extractHtmlBlock(markdown: string): string | null {
  const m = markdown.match(/```html\s*\n([\s\S]+?)```/);
  return m ? m[1].trim() : null;
}

export async function renderValidatePatterns(
  patterns: GeneratedPattern[],
  brandVars: BrandVars,
): Promise<RenderReport[]> {
  if (!PDF_SERVER_URL || patterns.length === 0) {
    return patterns.map((p) => ({ patternIntent: p.intent, ok: true, skipped: true }));
  }

  // Substitute brand vars into each pattern's HTML so the rendered output
  // is what the slide engine will actually produce.
  const items = patterns
    .map((p, idx) => {
      const html = extractHtmlBlock(p.markdown);
      if (!html) return null;
      const { output } = substituteBrandVars(html, brandVars);
      return { id: String(idx), html: output };
    })
    .filter((x): x is { id: string; html: string } => x !== null);

  if (items.length === 0) {
    return patterns.map((p) => ({ patternIntent: p.intent, ok: false, error: "no html block found" }));
  }

  try {
    const res = await fetch(`${PDF_SERVER_URL}/validate-html`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(PDF_SERVER_SECRET ? { Authorization: `Bearer ${PDF_SERVER_SECRET}` } : {}),
      },
      body: JSON.stringify({ items }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`pdf-server /validate-html ${res.status}: ${text.slice(0, 200)}`);
    }
    const data = (await res.json()) as { reports: Array<{ id: string; ok: boolean; metrics?: RenderReport["metrics"]; consoleErrors?: string[]; failedResources?: RenderReport["failedResources"]; error?: string }> };

    // Map back to patterns by index. Patterns without a usable html block get
    // a synthetic failure report so they're not silently dropped.
    const byId = new Map(data.reports.map((r) => [r.id, r]));
    return patterns.map((p, idx) => {
      const rep = byId.get(String(idx));
      if (!rep) {
        return { patternIntent: p.intent, ok: false, error: "no html block" };
      }
      return {
        patternIntent: p.intent,
        ok: rep.ok,
        metrics: rep.metrics,
        consoleErrors: rep.consoleErrors,
        failedResources: rep.failedResources,
        error: rep.error,
      };
    });
  } catch (err) {
    // Don't fail the whole pipeline if the server is unreachable; surface
    // skipped reports and let regex-only validation be the floor.
    console.warn(`[render-validate] pdf-server validation failed, skipping: ${err}`);
    return patterns.map((p) => ({
      patternIntent: p.intent,
      ok: true,
      skipped: true,
      error: String(err).slice(0, 200),
    }));
  }
}

/**
 * Build a one-paragraph fix-up prompt addendum from a failing render report,
 * so the writer can re-prompt vision to regenerate the bad pattern with
 * specific feedback ("your output overflows by 80px") rather than blind retry.
 */
export function buildFixupHint(report: RenderReport): string {
  const parts: string[] = [];
  if (report.metrics?.hasVerticalOverflow) {
    parts.push(
      `Your previous output rendered to ${report.metrics.scrollHeight}px tall — exceeds the 720px slide frame. Reduce content density, smaller font sizes, or fewer rows so the layout fits within 720px.`,
    );
  }
  if (report.metrics?.hasHorizontalOverflow) {
    parts.push(
      `Your previous output rendered to ${report.metrics.scrollWidth}px wide — exceeds the 1280px frame. Tighten widths and gaps.`,
    );
  }
  if (report.metrics?.elementsPastViewport && report.metrics.elementsPastViewport > 0) {
    parts.push(
      `${report.metrics.elementsPastViewport} elements extend below the 720px frame. Either remove them or move them up.`,
    );
  }
  if (report.consoleErrors?.length) {
    parts.push(
      `Browser console errors during render: ${report.consoleErrors.slice(0, 2).join("; ")}. Fix invalid HTML/CSS.`,
    );
  }
  if (report.metrics?.imgsWithLiteralSrc && report.metrics.imgsWithLiteralSrc > 0) {
    parts.push(
      `Your output contains ${report.metrics.imgsWithLiteralSrc} <img> tag(s) with literal external URLs. Use {{brand.logo.url}} only or omit images entirely.`,
    );
  }
  return parts.join(" ");
}
