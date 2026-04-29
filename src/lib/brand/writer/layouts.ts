/**
 * Generate per-cluster layout patterns. Each cluster yields one Pattern entry
 * matching the structure of the generic layout-library.md (name, "Use when",
 * "Structure", full HTML using brand vars).
 */

import { callVision } from "./vision";
import type { BrandVars } from "../types";
import type { SlideCluster } from "./cluster";

export interface LayoutGenerationInput {
  brandVars: BrandVars;
  clusters: SlideCluster[];
  /** Image lookup by 1-based slide index. */
  imagesByIndex: Map<number, string>;
}

export interface GeneratedPattern {
  intent: string;
  patternName: string;
  /** The full markdown block for this pattern (heading + Use when + HTML code block). */
  markdown: string;
}

const SYSTEM = `You are a senior front-end engineer who writes pixel-precise
HTML layouts for slide presentations. Slides render at exactly 1280×720 with
overflow:hidden. You produce layouts that visually match a reference slide
image while using brand variables for all colors and fonts. You never use
literal hex codes or font names — only {{brand.*}} placeholders that get
substituted at load time.`;

const intentToName: Record<string, string> = {
  cover: "Cover Slide",
  "section-divider": "Section Divider",
  "stat-band": "Dark Stat Band + Context Cards",
  "single-stat": "Hero Stat with Sidebar",
  "cards-row": "Cards Row",
  "two-column": "Two Column Split",
  "comparison-table": "Comparison Table",
  "before-after": "Before / After Strip",
  timeline: "Timeline Flow",
  quote: "Pull Quote",
  "image-hero": "Image Hero",
  "process-flow": "Process Flow",
  "matrix-2x2": "2×2 Matrix",
  "list-content": "Bulleted Content",
  "closing-cta": "Closing CTA",
  agenda: "Agenda",
  other: "Custom Layout",
};

function buildPatternPrompt(
  vars: BrandVars,
  cluster: SlideCluster,
  patternIndex: number,
): string {
  const patternName = intentToName[cluster.intent] ?? "Custom Layout";
  return `
You are writing **Pattern ${patternIndex}** for ${vars.brandName}'s
layout-library. The attached image is a representative slide from this brand
template (intent: \`${cluster.intent}\`).

Brand-context observation: ${cluster.description}

Brand variables to use (substitute these as {{...}} placeholders in your HTML):
- Colors: \`{{brand.colors.bg}}\`, \`{{brand.colors.surface}}\`,
  \`{{brand.colors.text}}\`, \`{{brand.colors.textSecondary}}\`,
  \`{{brand.colors.textMuted}}\`, \`{{brand.colors.border}}\`,
  \`{{brand.colors.borderSubtle}}\`, \`{{brand.colors.accent}}\`,
  \`{{brand.colors.accentLight}}\`, \`{{brand.colors.dark}}\`,
  \`{{brand.colors.darkInner}}\`
- Fonts: \`{{brand.fonts.headingFamily}}\`, \`{{brand.fonts.bodyFamily}}\`
- Header text: \`{{brand.headerLeft}}\`, \`{{brand.headerRight}}\`
- Footer text: \`{{brand.footerText}}\`
- Logo URL (only used if cover): \`{{brand.logo.url}}\`

Output format — produce EXACTLY this markdown structure:

## Pattern ${patternIndex}: ${patternName}

**Use when:** <one line — the content shape this fits>

**Structure:** <one sentence — describes the layout regions>

\`\`\`html
<!-- Full self-contained HTML for the slide content area, sized 1280×720 -->
...
\`\`\`

**Notes:** <optional 1-line caveat — when not to use it>

Strict requirements for the HTML:
- Wrap in a top-level \`<div style="width:1280px;height:720px;...">\`
- Use inline CSS only (no <style> tag, no Tailwind classes)
- Use {{brand.*}} placeholders for ALL colors and font-family values
- Match the reference image's signature visual moves (specific shapes, blocks,
  stripes, divider treatments, spacing)
- DO NOT include real text content — use placeholder phrases like
  "Section Title Goes Here", "Key insight or data point", "Subtitle line"
- DO NOT use emojis (use inline SVG icons if needed)
- Keep total content within the 1280×720 frame; no overflow

Return ONLY the markdown block (heading through Notes), nothing before or after.`;
}

export async function generateLayoutPatterns(
  input: LayoutGenerationInput,
): Promise<GeneratedPattern[]> {
  const out: GeneratedPattern[] = [];
  let patternIndex = 1;
  for (const cluster of input.clusters) {
    const repImage = input.imagesByIndex.get(cluster.representativeIndex);
    if (!repImage) {
      console.warn(
        `[brand-writer] No image for representative slide ${cluster.representativeIndex} (intent=${cluster.intent}); skipping`,
      );
      continue;
    }

    const prompt = buildPatternPrompt(input.brandVars, cluster, patternIndex);
    let markdown: string;
    try {
      markdown = await callVision({
        system: SYSTEM,
        images: [repImage],
        prompt,
        maxTokens: 4096,
      });
    } catch (err) {
      console.warn(
        `[brand-writer] Pattern ${patternIndex} (${cluster.intent}) generation failed:`,
        err,
      );
      continue;
    }

    out.push({
      intent: cluster.intent,
      patternName: intentToName[cluster.intent] ?? "Custom Layout",
      markdown: markdown.trim(),
    });
    patternIndex++;
  }
  return out;
}

/** Build a Pattern Index table to put at the top of layout-library.md. */
export function buildPatternIndex(patterns: GeneratedPattern[]): string {
  const rows = patterns.map((p, i) => {
    return `| ${i + 1} | ${p.patternName} | ${p.intent} |`;
  });
  return `| # | Name | Intent |
|---|---|---|
${rows.join("\n")}`;
}
