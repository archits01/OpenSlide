---
name: sales_marketing/marketing
description: Brand presentations, campaign pitches, product launches, content strategy, media kits, agency pitches, event sponsorship
---

# Marketing Presentations

Creative, brand-aligned decks for marketing teams, agency pitches, product launches, and campaign planning. Marketing decks must earn attention — they are often shown to skeptical, time-constrained audiences who will judge the brand by how the deck looks as much as what it says.

## Tone

Creative, brand-aligned, compelling, and audience-aware. Write for the specific audience — a CMO deck is different from an agency brief. In general: lead with insight, not feature lists. Show you understand the audience's world before presenting a solution. Marketing language should be evocative but grounded — never vague. "We help enterprise teams ship faster" is better than "we unlock value through synergistic innovation."

Avoid: buzzword soup, overly casual language in B2B contexts, generic claims without data, walls of text.

Use: audience-specific language, bold claims backed by evidence, visual-first framing, one clear idea per slide.

## Design

Use the Sales & Marketing design system (see `../shared/design-system.md`). Marketing decks lean more visual than corporate decks. Use generous padding (52px+), large typography for key messages, and the accent color boldly. The cover must be striking — it sets the tone for the entire deck.

For brand presentations, the designer may wish to apply custom brand colors via `set_theme` with `custom_colors`. Always suggest doing this if the user mentions a specific brand palette.

## Pattern Priorities

1. **Sales/Marketing Cover** (Pattern 1) — brand-forward, always bold
2. **Social Proof — Logos + Testimonial** (Pattern 4) — for case studies, credentials, agency pitches
3. **Results / ROI Stats** (Pattern 5) — for campaign results, performance reviews, proving impact
4. **Product Demo / Screenshot** (Pattern 8) — for product launches, feature announcements, content showcases
5. **3-Column Strategic Pillars** (from Corporate, Pattern 4) — for brand pillars, campaign themes, content strategy
6. **Competitive Comparison** (Pattern 7) — for market positioning, agency pitches
7. **Campaign / Channel Breakdown** (Pattern 11) — for campaign reporting, media planning
8. **Call to Action** (Pattern 12) — to close agency pitches, media kits, partner decks

## Content Rules

- **Lead with insight, not feature**: Don't open with "Here's what we do." Open with the market insight that makes your approach relevant — "Attention spans dropped 47% on social in 2025 — here's how brands are winning anyway." Then introduce the solution.
- **Always tie back to audience impact**: Every claim must be relevant to the specific audience's goal. A CMO cares about pipeline and brand equity, not your product's API. An agency prospect cares about creative output and ROI, not your internal process.
- **Brand colors must be applied via custom_colors**: If the user mentions specific brand colors (hex codes, brand guidelines), always apply them using the `set_theme` tool with `custom_colors` parameter before building slides. Never use the default violet palette for a client's branded deck.
- **Visual-first over text-heavy**: If content can be shown visually (a stat, a before/after, a photo), show it visually. Reserve text blocks for nuanced arguments that can't be simplified to a visual.
- **Campaign results need three elements**: Metric + period + comparison. Not "3M impressions." Always "3M impressions in Q1 2026, +42% vs. Q1 2025 and 28% above our $2.2M CPM target."
- **Product launches require narrative arc**: Cover → Problem (who suffers) → Solution (what it is) → Proof (who it helped) → CTA (what to do now). Never lead with features.
- **Agency pitches must show process, not just output**: Clients want to know how you think, not just what you've made. Include: how you develop insight, how you measure success, how you iterate.
- **Media kits need audience data front and center**: Reach, demographics, engagement — shown with charts or stat cards. Advertisers don't read body text, they scan numbers.
- **Event/sponsorship decks**: Lead with audience profile, then reach, then tiered packages. Every tier should have clear deliverables and a "best for" label.

## Slide-by-Slide Guidance

### Brand Presentation (10–14 slides)
1. Cover (Pattern 1) — brand name, "Brand Guidelines & Story"
2. Brand Vision (Pattern 10: Dark Quote from Corporate) — CEO/CMO brand vision statement
3. Who We Are (Pattern 3: Dark Stat Band) — founding, reach, key milestones
4. Our Audience (Pattern 4: 3-Column Pillars) — 3 audience personas
5. Brand Values (Pattern 4: 3-Column Pillars) — 3 brand values with brand behaviors
6. Visual Identity (Pattern 8: Screenshot) — logo, colors, typography preview
7. Tone of Voice (Pattern 4: 3-Column Pillars) — 3 voice characteristics with do/don't examples
8. Campaign Work (Pattern 4: Social Proof + Logos) — key campaigns, outcomes
9. By the Numbers (Pattern 5: ROI Stats) — reach, engagement, brand awareness metrics
10. What's Next (Pattern 6: Roadmap) — upcoming campaigns and launches

### Campaign Pitch (10–12 slides)
1. Cover (Pattern 1) — campaign name, pitch date, client name
2. Market Insight (Pattern 2: Problem) — the insight that makes this campaign necessary
3. Campaign Concept (Pattern 4: 3-Column Pillars) — big idea, strategic platform, creative territory
4. Creative Approach (Pattern 8: Screenshot/Demo) — creative direction, visual language
5. Channel Strategy (Pattern 11: Campaign Breakdown) — channels, investment, reach targets
6. Timeline (Pattern 6: Roadmap) — production, launch, sustain phases
7. Success Metrics (Pattern 2: KPI Scorecard from Corporate) — KPIs with targets
8. Budget Summary (Pattern 11: Budget Breakdown from Corporate) — media, production, tech
9. Agency Credentials (Pattern 4: Social Proof) — relevant case studies
10. Next Steps (Pattern 12: CTA)

### Product Launch Deck (10–12 slides)
1. Cover (Pattern 1) — product name, launch date
2. The Problem (Pattern 2: Problem/Pain)
3. Introducing [Product] (Pattern 3: Solution Overview)
4. Key Features (Pattern 8: Screenshot/Demo) — 3 hero features with visuals
5. Who It's For (Pattern 4: 3-Column Pillars) — 3 target personas with jobs-to-be-done
6. Early Results (Pattern 5: ROI Stats) — beta/pilot outcomes
7. Customer Story (Pattern 6: Case Study) — one beta customer's experience
8. How to Get Started (Pattern 9: Process Steps from Corporate) — 4-step onboarding
9. Pricing (Pattern 9: Pricing Tiers)
10. CTA (Pattern 12: Call to Action)

### Media Kit (6–8 slides)
1. Cover (Pattern 1) — publication/brand name, "Media Kit 2026"
2. Audience Profile (Pattern 3: Dark Stat Band) — reach, demographics, engagement rate
3. Audience Deep Dive (Pattern 4: 3-Column Pillars) — 3 audience segments
4. Formats & Placements (Pattern 5: Comparison Table) — format, specs, placement, CPM
5. Past Partners (Pattern 4: Social Proof + Logos)
6. Sponsorship Packages (Pattern 9: Pricing Tiers) — 3 tiers (Standard, Premium, Exclusive)
7. Contact / Next Steps (Pattern 12: CTA)
