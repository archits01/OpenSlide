---
name: html-executive-business-review-builder
description: Build professional 1280x720 HTML executive/leadership business review decks from any business data, briefing, or QBR content. Produces a single combined HTML file with all slides stacked vertically. Designed for quarterly business reviews, board presentations, leadership performance updates, operating reviews, and any executive-level structured corporate presentation where data density and boardroom credibility are non-negotiable. Trigger when the user says "make a QBR deck", "build a business review", "create a leadership deck", "make me an executive presentation", "build slides for our board update", or provides metrics/KPI data and asks for executive slides. Uses a boardroom-grade design system with Inter/emerald/charcoal defaults. 14 proven layout patterns ensure every deck is visually varied, data-dense, and executive-grade.
---

# Executive Business Review HTML Slide Deck Builder

## Before You Start

Read both reference files **in order** before writing any code:
1. `references/design-system.md` — Colors, typography, component patterns, SVG chart recipes, HTML shell
2. `references/layout-library.md` — All 14 layout patterns with CSS, HTML templates, selection guide

**Do not begin building until you have read both files.** The quality checklist in Step 7 references specific values from these files — you cannot fill it out without reading them first.

---

## What This Skill Produces

A **single combined HTML file** containing all slides stacked vertically, each exactly 1280×720px. The file is:
- Self-contained (no external dependencies except Google Fonts: Inter)
- Scrollable in any browser
- Named `[period]-[company]-review.html` and saved to `/mnt/user-data/outputs/`
- Presented via `present_files` at the end

---

## Full Pipeline

### Step 1: Analyze the Content

Extract from user's input:
- **Company/team name** — for headers and naming
- **Period** — Q1 2026, H1 2025, FY 2024, etc.
- **All metrics** — extract every number with: label, target, actual, delta, and status
- **Narrative** — what story does the data tell? wins? risks?
- **Decisions needed** — anything requiring executive approval?
- **Slide count** — default: 14 for QBRs; shorten if requested

### Step 2: Classify Every Metric

Before assigning content to slides, classify every metric:

| Status | Rule | Visual treatment |
|---|---|---|
| **Miss** (red) | Actual >5% below target, or explicitly flagged as miss | Delta text `#C0504D`, badge `#FEE2E2`/`#991B1B` |
| **Near** (amber) | Actual 1–5% below target, or flagged "at risk" | Delta text `#D97706`, badge `#FEF3C7`/`#92400E` |
| **Good** (green) | At or above target | Delta text `#2D7D46`, badge `#D1FAE5`/`#065F46` |
| **Track** (neutral) | On track, informational only | Delta text `#9CA3AF`, badge `#F3F4F6`/`#374151` |

**This classification drives:** delta text color, status pill/badge color, table row tint.
**This classification does NOT drive:** metric card top-border color (always uniform `#333333`).

### Step 3: Plan the Deck Structure

Map content to the **Standard Business Review Arc:**

| Slide | Content | Pattern |
|---|---|---|
| 01 | Cover — period, company, presenter | 1 |
| 02 | Executive Summary — top 5 KPIs + narrative | 2 |
| 03 | KPI Dashboard — full scorecard (15 KPIs) | 3 |
| 04 | Revenue Trend — monthly actuals vs target | 4 |
| 05 | Performance Breakdown — root cause of misses | 5 |
| 06 | Wins & Highlights — top 5 achievements | 6 |
| 07 | Challenges & Risks — missed targets + top 4 risks | 7 |
| 08 | Strategic Initiatives — program tracking | 8 |
| 09 | Initiative Deep-Dive — most at-risk initiative | 9 |
| 10 | Financial Overview — P&L + cash + mix | 10 |
| 11 | Unit Economics — CAC, LTV, efficiency | 11 |
| 12 | Segment Performance — by customer tier | 12 |
| 13 | Forward Priorities — next period objectives | 13 |
| 14 | Critical Decisions — executive approvals | 14 |

**Shorter decks:** Always keep slides 01, 02, 03, 07, 13 as minimum.  
For 8-slide deck: 01→02→03→04→06→07→13→14.

### Step 4: Assign Header Border Color Per Slide

| Slide Content | Border color |
|---|---|
| Neutral/standard (revenue, wins, initiatives, priorities) | `#333333` |
| Challenges, risks, missed targets, unit economics | `#C0504D` |
| Financial statement (income table) | **No border** |
| Slides with AT RISK badge in header | `#333333` (badge carries the red) |
| Cover | No header — uses Pattern 1 structure |

### Step 5: Build the Combined HTML File

**Shell structure:**
```
<head>
  [Google Fonts: Inter 300/400/600/700/800]
  [All shared CSS from design-system.md — Combined File HTML Shell]
  [Slide-specific CSS from layout-library.md for each pattern used]
</head>
<body>
<div class="deck">
  [Slide 01 — cover, padding:0; flex-direction:row]
  [Slide 02 — exec summary]
  ...
</div>
</body>
```

**Per-slide wrapper:**
```html
<div class="slide-wrapper" style="margin-top:36px;">
  <div class="slide-num">NN · Section Name</div>
  <div class="slide">
    <!-- 4px accent stripe — #2D7D46 (standard) or #C0504D (risk/challenge slides) -->
    <div style="position:absolute;left:0;top:0;bottom:0;width:4px;background:#2D7D46;z-index:10;"></div>

    <header style="flex-shrink:0;margin-bottom:14px;">
      <h1 style="font-size:28px;font-weight:700;border-left:8px solid #333333;padding-left:13px;margin:0 0 4px;">
        Slide Title
      </h1>
      <p style="font-size:13px;font-weight:300;color:#6B7280;margin:0 0 0 21px;">
        Subtitle / Context
      </p>
    </header>

    [LAYOUT CONTENT — from layout-library.md]

  </div>
</div>
```

### Step 5.5: Quality Standards — Embed These While Building

Apply these rules slide by slide as you write each one. Do not retroactively check — build them in from the start.

**Card borders:**
- Metric cards (Pattern 2): `border-top:4px solid #333333` — UNIFORM. Never color-coded.
- KPI section cards (Pattern 3): `border-top:4px solid #E5E7EB` — GRAY. Never section-colored.
- Risk/priority/decision cards: `border-left:6px solid [status color]` — intentional, by design.
- Win cards: `border-bottom:6px solid #2D7D46` — always green.

**Card shadows — every white card gets this:**
```css
box-shadow: 0 2px 8px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05);
```

**Card radius — every main card:**
```css
border-radius: 10px;  /* Main cards */
border-radius: 8px;   /* Utility containers, floating table rows */
```

**Spacing:**
- Slide padding: `34px 40px` — not `28px 36px`
- Gap between metric cards: `16px`
- Gap between KPI section cards: `18px`
- Gap between win cards: `14px`
- Gap between risk cards: `14px`
- Dark footer border-radius: `12px`

**Component sizing:**
- Win card titles: `font-size:15px` minimum — not 13px
- Risk card inner padding: `18px 20px` — not `13px 15px`
- Priority card inner padding: `16px 18px`
- All body text: always explicit `line-height:1.55`

**Secondary metric boxes inside win cards:**
Every win card should have a secondary context box:
```html
<div style="background:#F0FDF4;border-radius:6px;padding:7px 10px;margin-bottom:10px;">
  <div style="font-size:11px;color:#2D7D46;font-weight:600;">Context line here</div>
</div>
```

**Risk mini metric boxes:**
Every risk card with a quantified impact should show it in a colored mini box:
```html
<div style="background:#FEF2F2;border-radius:6px;padding:6px 10px;text-align:center;flex-shrink:0;">
  <div style="font-size:17px;font-weight:800;color:#C0504D;">$2.1M</div>
  <div style="font-size:9px;color:#9CA3AF;text-transform:uppercase;margin-top:2px;">ARR at Risk</div>
</div>
```

**Dark accent rule — one dark block per slide:**
Every content slide needs one `#333333`-background element. If the layout has no natural dark element (table header, footer bar), promote the most critical data container to dark.

### Step 6: Content Placement Rules

**Metrics:**
- Hero stats: 28–42px 800-weight, letter-spacing:-0.5px
- Always pair metric with: unit, delta indicator (↑↓—), target comparison
- Use Unicode arrows only: ↓ (miss), ↑ (good), — (flat)
- Never Font Awesome arrows

**Text density:**
- Body text: 12–13px, 400-weight, `#4B5563` or `#6B7280`, always `line-height:1.55`
- Labels: 10–11px, 700-weight, uppercase, letter-spacing:1–2px
- Never below **11px** for any visible element

**Charts:**
- All charts: inline SVG only — no echarts, chart.js, or any JS library
- Progress bars: CSS div with percentage width
- Donut: SVG stroke-dasharray (formula in design-system.md)
- Revenue trend: bar+line SVG (formula in design-system.md)
- Diverging bar: CSS grid layout (see Pattern 12 in layout-library.md)

**Images / icons:**
- Never use external image URLs
- Use geometric shapes or avatar initials instead of team photos
- Always inline SVG — see design-system.md SVG Icon Reference
- Never Font Awesome, Heroicons CDN, or any icon library

**Tables:**
- Miss rows: `background:#FFF5F5` + `border-bottom:1px solid #FEE2E2`
- Near rows: `background:#FFFDF0` + `border-bottom:1px solid #FEF3C7`
- Good rows: `background:#F0FFF4`
- Dark table headers: `background:#333333; color:rgba(255,255,255,0.55)` — 10px uppercase labels

### Step 7: Validate Before Saving

Work through this checklist before saving. Every "no" is a defect.

**Layout:**
- [ ] Every slide is 1280×720px with `overflow:hidden`
- [ ] Cover is the only slide with `flex-direction:row` and `padding:0`
- [ ] All non-cover slides use `padding:34px 40px; flex-direction:column`
- [ ] No consecutive slides use the same pattern

**Card quality:**
- [ ] All metric card top borders are `#333333` (UNIFORM — never color-coded)
- [ ] All KPI section card top borders are `#E5E7EB` (GRAY — never color-coded)
- [ ] All white cards have `box-shadow:0 2px 8px rgba(0,0,0,0.08),0 1px 3px rgba(0,0,0,0.05)`
- [ ] All main cards use `border-radius:10px`
- [ ] Win card titles are `font-size:15px` or larger
- [ ] Risk cards use `padding:18px 20px` (not 13px)
- [ ] Dark footer bars use `border-radius:12px` (not 8px)

**Typography:**
- [ ] Only Inter used — no monospace, no other fonts
- [ ] No text below 11px
- [ ] Uppercase labels always have `letter-spacing ≥ 1px`
- [ ] Body text always has explicit `line-height:1.55`
- [ ] Hero stats are visually prominent — never buried in text

**Content completeness:**
- [ ] Every metric card has: label → value → delta → plan reference → status badge
- [ ] Every win card has: icon → title → hero metric → secondary context box → description
- [ ] Every risk card has: title → severity dot → mini metric box → description → mitigation
- [ ] Every initiative row has: status pill → progress bar → Q1 progress → Q2 milestone
- [ ] Every decision card has: A/B options → REC badge → context note

**Anti-patterns (none of these should appear anywhere):**
- [ ] No `transform: scale()` or `compress-body`
- [ ] No Tailwind CSS classes
- [ ] No Font Awesome or any external icon CDN
- [ ] No external image URLs
- [ ] No echarts, chart.js, d3, or JS chart libraries
- [ ] No monospace fonts
- [ ] No `min-height:720px` (must be `height:720px`)
- [ ] No `flex-direction:row` on non-cover slides
- [ ] No gradient backgrounds
- [ ] No emojis anywhere — use inline SVG icons or Unicode arrows (↑↓) only

### Step 8: Save and Present

```python
file_path = "/mnt/user-data/outputs/[period]-[company]-review.html"
# Examples: "q1-2026-acme-review.html", "h1-board-update.html"
present_files([file_path])
```

---

## Content → Layout Mapping (Quick Reference)

| Content | Pattern | Key Visual |
|---|---|---|
| Opening title | 1 — Two-Panel Cover | Dark left + KPI snapshot right |
| 5 headline KPIs + narrative | 2 — Metric Row + Narrative | 5 uniform-border cards + 7/5 split |
| Full KPI scorecard | 3 — 3-Column Tables | Gray-border section cards + miss tinting |
| Revenue trend / time series | 4 — Chart + Sidebar | SVG bar+line + dark insight panel |
| Revenue/margin root cause | 5 — Bridge + Bars | Waterfall + bps bars |
| Wins / achievements | 6 — Win Cards + Quote | 5 cards border-bottom green |
| Risks / missed targets | 7 — RED Table + Risk Grid | Dark header table + 2×2 padded cards |
| Program tracking | 8 — Floating Table + Footer | Floating rows + 12px-radius dark footer |
| Initiative spotlight | 9 — Badge + Deep-Dive | AT RISK pill + 7/5 analysis |
| P&L + cash + mix | 10 — Financial Statement | Dark header table + donut |
| CAC / LTV / efficiency | 11 — RED Scorecards + Charts | 3 cards + data table + mini bars |
| Segment split | 12 — Segment Cards + Chart | 3 top-border cards + diverging bar |
| Forward objectives | 13 — Priority Cards + Panel | 4 numbered cards + dark enterprise panel |
| Decisions needed | 14 — Decision Grid + Footer | 2×2 A/B cards + avatar footer |

---

## Standard Business Review Arc (14 Slides)

1. **Cover** — Period, company, presenting team, overall status dot
2. **Executive Summary** — 5 headline KPIs with plan comparison, 4 narrative bullets, Q2 pipeline outlook
3. **KPI Dashboard** — 15 KPIs across Revenue / Customer / Operational domains
4. **Revenue Trend** — 9-month monthly actuals vs targets with beat/miss annotations
5. **Performance Breakdown** — Revenue bridge (4–5 drivers) + margin compression (3–4 drivers)
6. **Q1 Wins** — 5 strategic wins with metrics + secondary context boxes + executive quote
7. **Challenges** — 4 missed metrics table + 4 business risks (2 high, 2 medium)
8. **Strategic Initiatives** — 6 initiatives with status, progress bar, Q1 progress, Q2 milestone
9. **Initiative Deep-Dive** — Most at-risk initiative with objective, progress, blockers, recovery plan
10. **Financial Overview** — Income statement (5 rows) + cash position + revenue mix donut
11. **Unit Economics** — 3 scorecards (Rule of 40, LTV:CAC, Payback) + historical table + 2 charts
12. **Segment Performance** — 3 segments with ARR/churn/growth + diverging variance chart + insights
13. **Q2 Priorities** — 4 numbered priorities (owner, deadline, tags) + enterprise pipeline panel
14. **Critical Decisions** — 4 decisions (A/B + REC) + dark footer with session date + avatars

---

## Domain Adaptations

**Board Deck (investor-facing):**
- Slide 02: Use NRR, ARR, Rule of 40, cash runway as the 5 headline KPIs
- Slide 14: Replace decisions with "The Ask" (round size, use of funds)

**Monthly Business Review (8 slides):**
01 → 02 → 03 → 04 → 06 → 07 → 13 → 14

**Sales Proposal Arc (9 slides):**
01 (Cover) → 02 (Challenge) → 04 (Solution+Chart) → 05 (Bridge) → 06 (Case Study) → 08 (How It Works) → 10 (ROI/Pricing) → 13 (Why Us) → 14 (Next Steps)

---

## Anti-Patterns (Never Do These)

| What | Why |
|---|---|
| Color-coding metric card top borders | Creates alarm-fatigue; executive decks should be calm. Status lives in text/badge only. |
| Color-coding KPI section card borders | Section health shown by dot + count. Gray card border keeps sections visually unified. |
| Slide padding 28px/36px | Makes slides feel cramped. Minimum 34px/40px. |
| Card shadow `0 1px 2px rgba(0,0,0,0.05)` | Too subtle — cards don't appear elevated above the gray background. |
| Win card titles 13px | Undersells the achievement. Minimum 15px. |
| Risk card padding 13px | Too cramped. Minimum 18px 20px. |
| `border-radius: 6px` on main cards | Looks utilitarian. Use 10px. |
| Dark footer `border-radius: 8px` | Looks too sharp. Use 12px. |
| `transform: scale()` or `compress-body` | Visual artifacts. Fix by reducing font-size (floor: 11px) or padding (floor: 22px). |
| Tailwind CSS | Classes don't resolve without the CDN. Use pure inline CSS. |
| Font Awesome / external icons | Breaks offline. Use inline SVG from design-system.md. |
| External image URLs | Break in sandboxed environments. Use geometric shapes or avatar initials. |
| echarts, chart.js, d3 | External dependency. Use inline SVG formulas from design-system.md. |
| Monospace fonts | Only Inter. Executive aesthetic is a single clean typeface. |
| Gradient backgrounds | Renders inconsistently. Use solid hex values only. |
| Consecutive slides same pattern | Kills visual variety. Check variety rules in layout-library.md. |
| No secondary context box on win cards | Win cards without context boxes look sparse. Always include the secondary metric box. |
| No mini metric boxes on risk cards | Quantified impact in a colored box is far more persuasive than the same number in body text. |
| All-white content slides (no dark panel) | Every content slide needs one dark anchor element. |
| Light footer everywhere | Use callout footer (accent left-border + takeaway) on most content slides. |

---

## Skill Files

```
SKILL.md                       ← You are here
references/design-system.md   ← Colors, typography, components, SVG recipes, HTML shell
references/layout-library.md  ← 14 layout patterns with CSS, HTML, selection guide
```