// ─── Cover Archetype System ─────────────────────────────────────────────────
// Maps presentation types → spatial cover archetypes. The model reads the
// directive and writes HTML guided by the geometry, not locked to a template.

export const COVER_ARCHETYPES: Record<string, { name: string; directive: string }> = {
  fundraising: {
    name: "fundraising",
    directive:
      "Full-width centered layout — no split panels. Company name at 64-72px, bold. One-line tagline below at 18px. Founders listed at bottom with thin accent divider above. Generous whitespace on all sides (80px+ padding). Optional: single bold market stat or vision statement as a muted large-type watermark behind the title. Tone: visionary, clean, founder-led.",
  },
  executive: {
    name: "executive",
    directive:
      "Asymmetric 70/30 layout. Left 70%: period badge top-left (e.g. 'Q2 2025' or 'FY2025' in a bordered pill), headline below at 52-60px, subtitle at 14px uppercase muted. Right 30%: thin vertical strip with dark or accent background, 3-4 KPI preview stats stacked vertically (label + number pairs, 11px labels, 28px numbers). Thin border separating panels. 'Presented by' footer bottom-left. Tone: formal, data-forward, boardroom-ready.",
  },
  internal: {
    name: "internal",
    directive:
      "Full-width centered layout — no panels, no splits. Large warm headline at 56-64px, centered. Subtitle with meeting name + date below. No stats, no KPIs, no data. Optional: team name or emoji-free icon as a subtle decorative element. Bottom: simple attribution line. Generous vertical centering — content should feel like it floats in the middle. Tone: approachable, human, low-ceremony.",
  },
  pitch: {
    name: "pitch",
    directive:
      "Full-bleed dark background (use var(--slide-dark) or deep navy). Bold headline centered at 52-60px, white text. One punchy value-prop line below at 18px, slightly muted. Below that: a single social proof stat or customer count in large type (36-44px) with a small label. Optional: thin accent bar or geometric accent shape (circle, diagonal line) as decoration — not functional. No panels. Tone: confident, high-contrast, action-oriented.",
  },
  analytical: {
    name: "analytical",
    directive:
      "Top-stack layout. Upper 60%: headline at 44-52px left-aligned with a category label above it (10px uppercase, accent color). Lower 40%: a horizontal metadata bar with 3-4 columns (scope, methodology, timeframe, data sources) separated by thin vertical dividers. Light background with accent-colored top border (3-4px). Tone: structured, rigorous, research-grade.",
  },
  review: {
    name: "review",
    directive:
      "Split 60/40. Left 60%: period context at top (date range or sprint name in a badge), headline at 48-56px, 'Prepared by' attribution at bottom. Right 40%: dark or muted background panel with 3-5 status summary items — short labels with colored status dots (green/amber/red) or directional arrows. Think dashboard preview, not full data. Tone: operational, structured, status-aware.",
  },
  creative: {
    name: "creative",
    directive:
      "Offset asymmetric layout. Content block positioned in the lower-left 60% of the slide, leaving upper-right open. Brand or campaign name at 48-56px, one bold descriptor line. Upper-right area: geometric accent — a large circle, diagonal stripe, or overlapping rectangles using accent color at 8-15% opacity. No stats, no data. Optional: campaign tagline or date in small mono type bottom-right. Tone: expressive, brand-forward, visually bold.",
  },
};

/** Map each presentation type slug to its cover archetype */
export const TYPE_TO_ARCHETYPE: Record<string, string> = {
  // ─── fundraising: visionary, founder-led, full-width centered
  investor_pitch_seed_deck: "fundraising",
  series_a_deck: "fundraising",
  fundraising_roadshow: "fundraising",

  // ─── executive: formal, data-forward, 70/30 with KPI strip
  board_deck: "executive",
  earnings_presentation: "executive",
  budget_proposal: "executive",
  analyst_investor_day: "executive",
  executive_briefing: "executive",
  executive_sponsorship: "executive",

  // ─── internal: warm, centered, no data
  all_hands_meeting: "internal",
  onboarding_deck: "internal",
  team_offsite: "internal",
  culture_deck: "internal",
  dei_presentation: "internal",
  employer_branding: "internal",
  performance_review: "internal",
  org_design: "internal",
  sales_enablement: "internal",

  // ─── pitch: bold dark, social proof, high-contrast
  sales_pitch_deck: "pitch",
  agency_pitch: "pitch",
  product_demo: "pitch",
  proposal_presentation: "pitch",
  product_launch_deck: "pitch",
  event_sponsorship_proposal: "pitch",
  influencer_partnership_brief: "pitch",

  // ─── analytical: top-stack, structured, research-grade
  competitive_analysis: "analytical",
  go_to_market_strategy: "analytical",
  business_case_proposal: "analytical",
  scenario_planning: "analytical",
  swot_strategic_review: "analytical",
  ma_due_diligence: "analytical",
  content_strategy: "analytical",
  marketing_strategy: "analytical",
  pr_communications_strategy: "analytical",

  // ─── review: status-aware split with dashboard preview
  quarterly_business_review_internal: "review",
  operational_review: "review",
  project_status_update: "review",
  post_mortem: "review",
  risk_review: "review",
  vendor_review: "review",
  customer_qbr: "review",
  partnership_update: "review",
  renewal_upsell: "review",

  // ─── creative: offset, brand-forward, geometric accents
  brand_presentation: "creative",
  campaign_presentation: "creative",
  media_kit: "creative",
  case_study_presentation: "creative",
  discovery_needs_analysis: "creative",

  // ─── strategy types → analytical (structured thinking)
  okr_goal_setting: "analytical",
  product_roadmap: "analytical",
  strategy_presentation: "analytical",
  rfp_response: "analytical",

  // ─── battle cards → pitch (competitive, bold)
  competitive_battle_card: "pitch",
};

/** Resolve the cover archetype directive for a given presentation type */
export function getCoverArchetype(presentationType?: string): string | null {
  if (!presentationType) return null;
  const archetypeKey = TYPE_TO_ARCHETYPE[presentationType];
  if (!archetypeKey) return null;
  const archetype = COVER_ARCHETYPES[archetypeKey];
  if (!archetype) return null;
  return `**Cover archetype: ${archetype.name}** — ${archetype.directive}`;
}
