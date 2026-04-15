// src/skills/slide-categories/template-category-map.ts
// Maps homepage template slugs to their SlideCategory.
//
// When a user picks a template from the homepage, we already know what kind
// of presentation they want. Skipping the classifier saves ~500ms and ~2000
// input tokens per new session, and guarantees the correct skill loads.
//
// Fallback: if a template slug isn't in this map, the normal classifier runs.

import type { SlideCategory } from "./slide-classifier";

export interface TemplateClassification {
  category: SlideCategory;
  /** Optional — matches a file under src/skills/<category>/types/<name>.md */
  presentationType?: string;
}

/**
 * Keyed by template slug (stable, db-indexed identifier).
 * Each entry picks the skill that best matches the template's prompt + purpose.
 */
export const TEMPLATE_CATEGORY_MAP: Record<string, TemplateClassification> = {
  // Q1 revenue/NPS/churn metrics deck — internal QBR lives under investment_finance
  "quarterly-business-review": {
    category: "business_corporate/investment_finance",
    presentationType: "quarterly_business_review_internal",
  },
  // Engineering deck — uses dedicated legacy skill with 15 layout patterns + design system
  "engineering-team-update": {
    category: "slide-redesign-project-review",
  },
  // Senior AE at consulting firm — classic sales proposal
  "professional-consulting-proposal": {
    category: "sales_marketing/sales",
    presentationType: "proposal_presentation",
  },
  // CEO weekly ExCo briefing
  "executive-leadership-briefing": {
    category: "business_corporate/operations_reporting",
    presentationType: "executive_briefing",
  },
  // Palantir deep research → competitive/market analysis
  "deep-research-report": {
    category: "business_corporate/strategy_planning",
    presentationType: "competitive_analysis",
  },
  // Space tech innovation showcase → brand/thought-leadership marketing
  "technology-innovation-showcase": {
    category: "sales_marketing/marketing",
    presentationType: "brand_presentation",
  },
  // Academic ML research — educational domain
  "educational-research-presentation": {
    category: "educational/academic",
    presentationType: "research_presentation",
  },
  // Series B SaaS board deck — exact match
  "startup-board-deck": {
    category: "business_corporate/investment_finance",
    presentationType: "board_deck",
  },
};

/**
 * Look up a template's pre-classified category.
 * Returns null if the slug isn't mapped — caller should fall back to classifyDeck().
 */
export function resolveTemplateClassification(
  slug: string | null | undefined
): TemplateClassification | null {
  if (!slug) return null;
  return TEMPLATE_CATEGORY_MAP[slug] ?? null;
}
