/**
 * slide-classifier.ts
 *
 * Graph-routed slide classifier. Replaces the old keyword + blind LLM approach.
 *
 * Instead of hardcoded keyword rules and a Haiku call that only sees category names,
 * this loads a structured skill graph (slide-skill-graph.json) that gives the LLM
 * full context: what each type is, who the audience is, example triggers, and
 * disambiguation rules for commonly confused types.
 *
 * Single-phase classification: one Haiku call with full graph context.
 * No keyword phase — the LLM handles everything with rich context.
 */

import { callRouterNonStreaming } from "@/agent/stream";
import graphData from "./slide-skill-graph.json";

// ─── Types ────────────────────────────────────────────────────────────────────

export type SlideCategory =
  | "business_corporate/investment_finance"
  | "business_corporate/operations_reporting"
  | "business_corporate/people_culture"
  | "business_corporate/strategy_planning"
  | "sales_marketing/marketing"
  | "sales_marketing/sales"
  | "educational/academic"
  | "slide-redesign-project-review" // template-only: engineering team updates
  | "general-deck"; // fallback

export type Confidence = "high" | "medium" | "low";

export interface ClassificationResult {
  category: SlideCategory;
  confidence: Confidence;
  method: "graph" | "default" | "template";
  presentationType?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_CATEGORY: SlideCategory = "general-deck";
const CLASSIFIER_MODEL = "claude-sonnet-4-6";
const CLASSIFIER_TIMEOUT_MS = 15_000;
const RETRY_DELAY_MS = 500;

const VALID_CATEGORIES: SlideCategory[] = [
  "business_corporate/investment_finance",
  "business_corporate/operations_reporting",
  "business_corporate/people_culture",
  "business_corporate/strategy_planning",
  "sales_marketing/marketing",
  "sales_marketing/sales",
  "educational/academic",
  "general-deck",
];

// Build valid types map from graph data (single source of truth)
const VALID_TYPES: Record<string, string[]> = {};
for (const [category, subdomain] of Object.entries(graphData.subdomains)) {
  VALID_TYPES[category] = Object.keys(
    (subdomain as { types: Record<string, unknown> }).types
  );
}

// ─── Graph-Derived Classifier Prompt ─────────────────────────────────────────

/**
 * Build the classifier system prompt from the graph.
 * Optimized for Sonnet — compact category/type listing without triggers/similar.
 * Sonnet's stronger reasoning means we need less hand-holding.
 * Cached as a module-level constant — graph never changes at runtime.
 */
function buildClassifierPrompt(): string {
  const sections: string[] = [];

  for (const [category, subdomain] of Object.entries(graphData.subdomains)) {
    const sd = subdomain as {
      label: string;
      when: string;
      not: string;
      types: Record<string, {
        what: string;
        audience: string;
        triggers?: string[];
        similar?: string[];
        not_this?: string;
      }>;
    };

    // Compact type list: just name + one-line description
    const typeLines = Object.entries(sd.types)
      .map(([name, data]) => `  ${name}: ${data.what}`)
      .join("\n");

    sections.push(`### ${category}\n${sd.when}\n${typeLines}`);
  }

  // Only the most confusing disambiguation cases — Sonnet handles the rest
  const CRITICAL_DISAMBIG = [
    `"pitch deck" ALWAYS → business_corporate/investment_finance, regardless of company name. "Pitch deck for Anthropic" = investment_finance, NOT educational`,
    `"presentation about [company]" (Apple, Tesla, etc.) WITHOUT "pitch deck"/"investor"/"fundraise" context → educational/academic:topic_explainer`,
    `"marketing strategy/plan" → sales_marketing/marketing, NOT strategy_planning`,
    `"QBR" with customer → sales_marketing/sales. Internal QBR → business_corporate/investment_finance`,
    `"presentation about [topic]" / "explain X" / "top 10 X" → educational/academic:topic_explainer`,
    `Product launch/campaign/brand → sales_marketing/marketing, NOT strategy_planning`,
    `"for my team" / vague internal → use low confidence, prefer business_corporate if any signal`,
    `Company stage ("Series A company") ≠ presentation purpose. Only fundraising = investment_finance`,
  ];

  return `Classify the user's presentation request into one category and type.

## Decision Framework

1. **No business/company context?** → educational/academic (topic_explainer for general topics)
2. **External audience** (customers, prospects, press, partners) → sales_marketing/
3. **Internal audience** (board, execs, employees, team) → business_corporate/
4. **Academic/research/teaching** → educational/academic
5. **Nothing fits** → general-deck (last resort, use low confidence)

## Categories & Types

${sections.join("\n\n")}

### general-deck
Last resort — only when nothing above fits. No types.

## Key Disambiguation
${CRITICAL_DISAMBIG.map(r => `- ${r}`).join("\n")}

## Output
One line: CATEGORY:TYPE:CONFIDENCE
- TYPE = type name from the category, or "none" for general-deck
- CONFIDENCE = high | medium | low`;
}


const CLASSIFIER_SYSTEM_PROMPT = buildClassifierPrompt();
// Debug: log prompt length once at startup
console.log(`[classifier] Graph prompt built: ${CLASSIFIER_SYSTEM_PROMPT.length} chars, ~${Math.round(CLASSIFIER_SYSTEM_PROMPT.length / 4)} tokens`);

// Truncate long prompts — but keep enough to capture the actual ask
// (real prompts often have 500+ chars of context before stating intent).
const LLM_PROMPT_MAX_CHARS = 1500;

// ─── LLM Classification ─────────────────────────────────────────────────────

async function callLLMOnce(prompt: string): Promise<ClassificationResult> {
  const truncated = prompt.length > LLM_PROMPT_MAX_CHARS
    ? prompt.slice(0, LLM_PROMPT_MAX_CHARS) + "…"
    : prompt;

  const text = await callRouterNonStreaming({
    model: CLASSIFIER_MODEL,
    max_tokens: 30,
    system: [{ type: "text", text: CLASSIFIER_SYSTEM_PROMPT }],
    messages: [{ role: "user", content: truncated }],
  });

  const cleaned = text.trim().toLowerCase();
  const parts = cleaned.split(":");

  let rawCategory: string;
  let rawType: string;
  let rawConfidence: string;

  if (parts.length >= 3) {
    rawCategory = parts[0]?.trim();
    rawType = parts[1]?.trim();
    rawConfidence = parts[2]?.trim();
  } else if (parts.length === 2) {
    rawCategory = parts[0]?.trim();
    rawType = "none";
    rawConfidence = parts[1]?.trim();
  } else {
    rawCategory = parts[0]?.trim();
    rawType = "none";
    rawConfidence = "medium";
  }

  const category = VALID_CATEGORIES.includes(rawCategory as SlideCategory)
    ? (rawCategory as SlideCategory)
    : DEFAULT_CATEGORY;

  const confidence: Confidence =
    rawConfidence === "high" || rawConfidence === "medium" || rawConfidence === "low"
      ? rawConfidence
      : "medium";

  // Validate type against known types for this category
  const validTypesForCategory = VALID_TYPES[category] ?? [];
  const presentationType =
    rawType && rawType !== "none" && validTypesForCategory.includes(rawType)
      ? rawType
      : undefined;

  return { category, confidence, method: "graph", ...(presentationType ? { presentationType } : {}) };
}

async function classifyWithGraph(prompt: string): Promise<ClassificationResult> {
  try {
    return await callLLMOnce(prompt);
  } catch (err) {
    console.warn("[slide-classifier] Graph LLM attempt 1 failed, retrying:", err);
  }

  await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));

  try {
    return await callLLMOnce(prompt);
  } catch (err) {
    console.warn("[slide-classifier] Graph LLM attempt 2 failed, falling back:", err);
    return { category: DEFAULT_CATEGORY, confidence: "low", method: "default" };
  }
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export async function classifyDeck(prompt: string): Promise<ClassificationResult> {
  const llmPromise = classifyWithGraph(prompt);
  let timeoutId: ReturnType<typeof setTimeout>;
  const timeoutPromise = new Promise<ClassificationResult>((resolve) => {
    timeoutId = setTimeout(() => {
      console.warn("[classifier] Graph classifier timed out — falling back to general-deck");
      resolve({ category: DEFAULT_CATEGORY, confidence: "low", method: "default" });
    }, CLASSIFIER_TIMEOUT_MS);
  });

  const result = await Promise.race([llmPromise, timeoutPromise]);
  clearTimeout(timeoutId!);
  console.log(`[classifier] ${result.category}${result.presentationType ? `/${result.presentationType}` : ""} (${result.confidence}, ${result.method})`);
  return result;
}

// ─── Utility ──────────────────────────────────────────────────────────────────

export function resolveSkillName(category: SlideCategory): string {
  if (category === "general-deck") return "general-deck";
  if (category === "educational/academic") return "educational-deck";
  return category;
}

export function allSlideSkillNames(): string[] {
  return [
    "business_corporate/investment_finance",
    "business_corporate/operations_reporting",
    "business_corporate/people_culture",
    "business_corporate/strategy_planning",
    "sales_marketing/marketing",
    "sales_marketing/sales",
    "educational/academic",
    "educational-deck",
    "slide-redesign-project-review",
    "general-deck",
  ];
}
