/**
 * Cluster brand slides by visual similarity.
 *
 * v1 strategy (no perceptual-hash deps): use a vision call to label each
 * slide with its layout intent, then group by intent. Cap at ~10 clusters
 * to keep the layout library focused.
 *
 * Tradeoff: this uses one extra vision call (modest cost, ~$0.05 for 30 slides).
 * In exchange we avoid adding a perceptual-hash dependency and we get
 * semantic clusters ("cover", "stat-grid", "comparison-table") rather than
 * pure visual ones — which is what the model needs anyway when picking
 * patterns later.
 */

import { callVisionJson } from "./vision";

export type LayoutIntent =
  | "cover"
  | "section-divider"
  | "stat-band"
  | "single-stat"
  | "cards-row"
  | "two-column"
  | "comparison-table"
  | "before-after"
  | "timeline"
  | "quote"
  | "image-hero"
  | "process-flow"
  | "matrix-2x2"
  | "list-content"
  | "closing-cta"
  | "agenda"
  | "other";

export interface SlideClassification {
  index: number; // 1-based page index
  intent: LayoutIntent;
  description: string;
}

export interface SlideCluster {
  intent: LayoutIntent;
  /** Representative slide (first one with this intent). Used as the source for the layout pattern. */
  representativeIndex: number;
  /** All slide indices sharing this intent. */
  memberIndices: number[];
  /** Vision-described composition of the representative. */
  description: string;
}

const SYSTEM = `You are a presentation-layout classifier. You look at slide
images and identify each slide's layout intent (its content shape) using a
fixed vocabulary. You return strict JSON.`;

const PROMPT = `For each slide in the attached images, output a JSON array
where each element matches this schema:

{
  "index": <1-based slide number, matching attachment order>,
  "intent": <one of: "cover", "section-divider", "stat-band", "single-stat",
            "cards-row", "two-column", "comparison-table", "before-after",
            "timeline", "quote", "image-hero", "process-flow", "matrix-2x2",
            "list-content", "closing-cta", "agenda", "other">,
  "description": <one-line describing the slide's actual composition: where
                  things sit, color usage, signature shapes>
}

Rules:
- Choose the BEST single intent for each slide. If ambiguous, pick the dominant one.
- Be precise in description (e.g. "Top-right dark navy block, gray inset card with
  serif title, navy underline, bottom-right date strip in dark navy").
- Return ONLY the JSON array, no prose.`;

export async function classifySlides(
  images: string[],
): Promise<SlideClassification[]> {
  if (images.length === 0) return [];
  const result = await callVisionJson<SlideClassification[]>({
    system: SYSTEM,
    images,
    prompt: PROMPT,
    maxTokens: 4000,
  });
  // Defensive: ensure indices line up with attachment order.
  return result.map((r, i) => ({
    index: r.index ?? i + 1,
    intent: r.intent ?? "other",
    description: r.description ?? "",
  }));
}

/**
 * Group classifications into clusters. One cluster per distinct intent (capped
 * at maxClusters; "other" is collapsed last).
 */
export function clusterSlides(
  classifications: SlideClassification[],
  maxClusters = 12,
): SlideCluster[] {
  const byIntent = new Map<LayoutIntent, SlideClassification[]>();
  for (const c of classifications) {
    if (!byIntent.has(c.intent)) byIntent.set(c.intent, []);
    byIntent.get(c.intent)!.push(c);
  }

  const clusters: SlideCluster[] = Array.from(byIntent.entries())
    .map(([intent, members]) => ({
      intent,
      representativeIndex: members[0].index,
      memberIndices: members.map((m) => m.index),
      description: members[0].description,
    }))
    // Larger clusters first; "other" pushed last
    .sort((a, b) => {
      if (a.intent === "other") return 1;
      if (b.intent === "other") return -1;
      return b.memberIndices.length - a.memberIndices.length;
    });

  return clusters.slice(0, maxClusters);
}
