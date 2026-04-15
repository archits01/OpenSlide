---
name: business_corporate/investment_finance
description: Board decks, investor presentations, earnings reports, QBRs, fundraising, financial reviews
---

# Investment & Finance Presentations

Authoritative, data-driven decks for board members, investors, and financial stakeholders. Every slide earns its place by adding information value. No fluff, no vague statements, no unsupported claims.

## Tone

Formal, precise, authoritative. Use complete sentences for key insights but keep them concise. Numbers are the language — lead with data, follow with context. Passive constructions are acceptable when the data speaks for itself ("Revenue increased 18%"). Never use marketing language ("amazing", "exciting") — use factual language ("ahead of plan", "exceeding consensus estimates").

## Design

Use the Corporate design system (see `../shared/design-system.md`). Apply the accent stripe on every non-cover slide. Dark anchor element mandatory on every slide. KPI cards over plain text whenever quantifying performance.

## Pattern Priorities

For investment and finance presentations, prefer these patterns in this order:

1. **Executive Cover** (Pattern 1) — opens every deck
2. **KPI Scorecard** (Pattern 2) — for financial summary, earnings highlights, KPI dashboards
3. **Dark Stat Band + Context** (Pattern 3) — for full-year/quarter results, key metrics
4. **Comparison Table** (Pattern 5) — for competitive analysis, vendor evaluation, prior vs. current period
5. **Bar Chart + Key Insights** (Pattern 7) — for revenue trends, EBITDA progression, volume charts
6. **Budget/Investment Breakdown** (Pattern 11) — for budget allocation, capex/opex splits, cost analysis
7. **Quarterly Roadmap** (Pattern 6) — for strategic initiatives, M&A timelines, product roadmap
8. **Action Items** (Pattern 12) — to close every board or investor deck

## Content Rules

- **Always cite period and comparison**: Never write "$612M revenue" — always write "$612M revenue in Q1 2026, +21% vs. Q1 2025". Every number needs a period and a comparison.
- **Always show YoY comparison**: For any financial metric (revenue, margin, headcount, ARR) show the prior year or prior period alongside current — even if that means a smaller font.
- **Never vague statements**: "Strong growth" is not acceptable. "18% revenue growth, 240bps EBITDA margin expansion" is acceptable.
- **Trend indicators are mandatory**: Every KPI card must show ↑ ↓ → with exact delta (not just direction).
- **Use footnotes for disclaimers**: Unaudited figures, non-GAAP measures, and guidance should include a small footnote in the dark footer area.
- **Avoid forward-looking language without hedging**: "expects", "targets", "guidance" must be clearly labeled. Never state future results as certainties.
- **Round consistently**: Either use consistent decimal places within a slide (all 1dp or all whole numbers) — never mix.
- **Always include a reconciliation note for non-GAAP**: Even a one-line footnote ("Adjusted EBITDA excludes stock-based compensation and one-time restructuring charges").

## Slide-by-Slide Guidance

### Board Deck (12–16 slides)
1. Cover (Pattern 1) — meeting date, board composition, confidential label
2. Agenda / Table of Contents (Pattern 4: 3-Column Pillars listing agenda sections)
3. Executive Summary (Pattern 2: KPI Scorecard) — 4 headline metrics, 1–2 sentences each
4. Full Year / Quarter Results (Pattern 3: Dark Stat Band) — revenue, EBITDA, FCF
5. Revenue Bridge (Pattern 7: Bar Chart) — by segment, by geography, vs. prior year
6. Operational Metrics (Pattern 2: KPI Scorecard) — NPS, churn, CAC, NRR
7. Strategic Initiative Update (Pattern 8: Status Dashboard) — 4–6 workstreams with RAG
8. Capital & Liquidity (Pattern 11: Budget Breakdown) — cash position, debt, burn rate
9. Guidance / Outlook (Pattern 3: Dark Stat Band) — full year guidance with ranges
10. Risk & Mitigation (Pattern 5: Comparison Table) — risk, probability, impact, mitigation
11. Appendix slides — detailed financials, segment breakdown

### Investor Pitch (10–14 slides)
1. Cover (Pattern 1)
2. Investment Thesis (Pattern 4: 3-Column Pillars) — 3 core reasons to invest
3. Market Opportunity (Pattern 3: Dark Stat Band) — TAM, SAM, SOM with sources
4. Business Model (Pattern 11: Budget Breakdown) — revenue streams by type
5. Financial Performance (Pattern 2: KPI Scorecard) — ARR, growth rate, NRR, margin
6. Revenue Trend (Pattern 7: Bar Chart) — trailing 8 quarters
7. Competitive Moat (Pattern 5: Comparison Table)
8. Use of Funds (Pattern 11: Budget Breakdown) — allocation by category
9. Team (Pattern 4: 3-Column Pillars)
10. Financial Projections (Pattern 7: Bar Chart) — 3-year model with assumptions

### Quarterly Business Review (8–12 slides)
1. Cover (Pattern 1) — quarter label, date, participants
2. QBR Scorecard (Pattern 2: KPI Scorecard) — 4 headline metrics vs. plan vs. prior quarter
3. Revenue Analysis (Pattern 3: Dark Stat Band + context panels)
4. Customer Metrics (Pattern 2: KPI Scorecard) — adds, churn, NPS, NRR
5. Operational Update (Pattern 8: Status Dashboard) — key initiatives
6. Financial Summary (Pattern 11: Budget Breakdown) — budget vs. actual
7. Next Quarter Plan (Pattern 6: Roadmap) — key bets for next quarter
8. Action Items (Pattern 12) — owners, dates, priorities

## Data Formatting Standards

- Revenue under $100M: show in $XM with one decimal ($42.3M)
- Revenue $100M–$1B: show in $XXXm with no decimal ($612M)
- Revenue over $1B: show in $X.XB with one decimal ($2.4B)
- Percentages: always show sign (↑ 18%, ↓ 2.3%)
- Margins: show in percentage points (e.g., "68.4%", "↑ 180bps")
- Headcount: whole numbers only (2,140 — not "~2,100")
- Dates: Month DD, YYYY for footnotes; "Q1 2026" or "FY2025" for headers
