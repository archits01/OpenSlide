---
name: slide-redesign-project-review
description: "Build professional 1280x720 HTML engineering/technical presentation decks from any technical data, incident reports, sprint summaries, or architecture reviews. Produces a single combined HTML file with all slides stacked vertically. Designed for engineering all-hands, incident post-mortems, architecture reviews, sprint retrospectives, performance audits, and any technical audience presentation where precision and developer credibility are non-negotiable. Trigger when the user says 'make an engineering deck', 'build a tech presentation', 'create slides for my engineering team', 'build a post-mortem deck', 'make a sprint retro', or provides incident data, sprint metrics, or technical findings and asks for slides. Uses Inter + JetBrains Mono dual-font system. Key differences from the business review skill - no left accent stripe, mono metadata everywhere, inline code in task descriptions, 2px card border-radius."
---

# Engineering HTML Slide Deck Builder

## Before You Start

Read both reference files **in order** before writing any code:
1. `references/design-system.md` — Colors, typography, CSS shell (including `.code-inline`, `.info-panel`, `.section-label`, `.avatar`, `.task-card`), component patterns, SVG icons
2. `references/layout-library.md` — All 15 layout patterns with CSS, HTML templates, selection guide

**Do not begin building until you have read both files.**

---

## What This Skill Produces

A **single combined HTML file** containing all slides stacked vertically, each exactly 1280×720px. The file is:
- Self-contained (no external dependencies except Google Fonts: Inter + JetBrains Mono)
- Scrollable in any browser
- Named `[context]-[type]-deck.html` and saved to `/mnt/user-data/outputs/`
- Presented via `present_files` at the end

---

## Full Pipeline

### Step 1: Analyze the Content

Extract from user's input:
- **Deck type** — incident retro, arch review, sprint planning, perf audit, etc.
- **Team/system name** — for headers and file naming
- **All technical data** — metrics, error rates, latencies, bug counts, timestamps
- **Action items** — who owns what, by when, what status
- **Slide count** — default 15 for full reviews; shorter for targeted decks

### Step 2: Classify Content → Pattern

Match each topic to a pattern using the Layout Selection Guide:

| Content type | Pattern |
|---|---|
| System architecture, tiered diagram | 2 |
| Tech stack inventory | 3 |
| Auth/request flow | 4 |
| Sprint metrics + table | 5 |
| Feature impact, A/B | 6 |
| CI/CD changes | 7 |
| Deployment KPIs | 8 |
| Bug/regression analysis | 9 |
| Root cause | 10 |
| Performance bottleneck | 11 |
| **Action items, mitigation tasks** | **12** |
| **Incident post-mortem** | **13** |
| **Architecture tradeoffs, ADRs** | **14** |
| **Sprint planning, priorities** | **15** |

### Step 3: Assign Header Badge Per Slide

| Status | Badge class |
|---|---|
| Deployed, complete | `.badge-green` |
| In progress | `.badge-amber` |
| Critical, incident | `.badge-red` |
| Reference, ADR | `.badge-gray` |
| Sprint goal | `.badge-green` with specific sprint text |

### Step 4: Build the Combined HTML File

**Shell structure:**
```
<head>
  [Google Fonts: Inter 400/600/700 + JetBrains Mono 400/500]
  [Full shared CSS from design-system.md — Combined File HTML Shell]
  [Pattern-specific CSS from layout-library.md for each pattern used]
</head>
<body>
<div class="deck">
  [Slide 01 — cover, use Pattern 1 structure]
  [Slide 02 — first content slide]
  ...
</div>
</body>
```

**Per-slide wrapper:**
```html
<div class="slide-wrapper">
  <div class="slide-num">NN · Section Name</div>
  <div class="slide">   <!-- standard padding: 36px 40px -->
    <header class="slide-header">
      <div class="slide-title-block">
        <h1>Slide Title</h1>
        <p class="slide-subtitle">MONO SUBTITLE UPPERCASE</p>
      </div>
      <span class="badge-green">DEPLOYED</span>
    </header>
    [LAYOUT CONTENT]
    <footer class="slide-footer">
      <span class="mono">Ref: [JIRA-KEY]</span>
      <span class="mono">Confidential - Engineering Internal</span>
    </footer>
  </div>
</div>
```

**Incident slide wrapper (special padding):**
```html
<div class="slide-wrapper">
  <div class="slide-num">13 · Incident Post-Mortems</div>
  <div class="slide" style="padding:34px 40px 0;">   <!-- NO bottom padding -->
    <header class="slide-header">...</header>
    [INCIDENT CARD GRID]
    <div class="incident-footer">   <!-- border-radius:4px 4px 0 0 -->
      [3-col mitigation grid]
    </div>
  </div>
</div>
```

### Step 5: Quality Standards — Embed These While Building

Apply these rules as you write each slide. Do not retroactively check — build them in from the start.

**Task cards (Pattern 12):**
- `border-radius: 2px` — NOT 4px or 6px
- Every task card has exactly 4 layers: icon → title+owner → description → metadata
- **Owner badge is MANDATORY** — `<span class="owner-badge">DBA</span>` — never omit
- Inline code: use `<code>` element or `.code-inline` class for technical terms
- Section label above task cards: always use `.section-label` + SVG icon

**Dark boxes / timeline panels:**
- `border-radius: 6px` — NOT 4px
- Vertical timeline: container needs `position:relative`, dots use `position:absolute;left:-7px`
- Timeline dot colors: `#fff` = complete, `#F59E0B` = in-progress, `#4A5568` = upcoming

**Info panels (success criteria, targets):**
- Use gray dashed border: `border:1px dashed var(--slide-border)` (`.info-panel` class)
- NOT the red dashed `.failure` class — that's only for broken/failure states

**Incident slides (Pattern 13):**
- Slide padding: `34px 40px 0` (no bottom padding)
- Dark footer: `border-radius:4px 4px 0 0` (flat bottom, flush to slide edge)
- Meta boxes: `.meta-box` = `background:var(--slide-bg);padding:10px 12px;border-radius:3px`
- Horizontal timeline: dot 1 = incident color, dot 2 (center, larger 16px) = peak, dot 3 = green resolved

**Matrix tables (Pattern 14):**
- Improved rows: `background:rgba(220,252,231,0.2)` (subtle green tint)
- Lowered rows: `background:rgba(254,226,226,0.2)` (subtle red tint)
- Neutral rows: no background
- Row grid: always `3fr 2fr 7fr` columns

**Sprint slides (Pattern 15):**
- Sprint goal banner: `background:rgba(39,174,96,0.05);border:1px solid rgba(39,174,96,0.2);border-radius:4px`
- Action cards: `border-radius:2px` (same as task cards)
- Action card deadline tags: mono, `background:#F1F5F9;border-radius:2px`
- Avatar: `.avatar` class — 26×26px, gray bg, mono font

**Typography everywhere:**
- Body text: always `font-size:12px;color:#4A5568;line-height:1.5`
- Section labels: always `.section-label` class (mono, 10px, uppercase, #A0AEC0, letter-spacing:1px)
- All metadata (deadlines, status, IDs, file paths): always JetBrains Mono
- Technical terms in descriptions: always `<code>` element

### Step 6: Content Placement Rules

**Section labels:** Every content column with a heading uses `.section-label` + a relevant SVG icon. Never plain text labels.

**Icons:**
- Task card icons: 20px, stroke color matches left border color, `margin-top:2px`, `flex-shrink:0`
- Header badge icons: 11px
- Footer reference icons: 11px
- Section label icons: 13px, `var(--slide-secondary)` stroke

**Technical data:**
- Always pair metrics with units and comparison context
- Latency in ms, error rates as %, times in HH:MM format or "X minutes"
- All numeric labels: Inter font, `font-weight:700`
- All identifiers (INC-0328, ADR-012): JetBrains Mono

**Charts:**
- All charts: inline SVG only — no echarts, chart.js, or JS libraries
- Progress bars: CSS div with percentage width
- Donut: SVG stroke-dasharray formula (see design-system.md)
- Never use external image URLs

### Step 7: Validate Before Saving

Work through this checklist before saving. Every "no" is a defect.

**Structure:**
- [ ] Every slide is 1280×720px with `overflow:hidden`
- [ ] Cover uses Pattern 1 structure (no standard header)
- [ ] All content slides use `.slide-header` with `border-bottom:2px solid #1A202C`
- [ ] No consecutive slides use the same pattern
- [ ] No left accent stripe anywhere (this is the business deck, not engineering)

**Typography and fonts:**
- [ ] All metadata (deadlines, status labels, file paths, IDs, section labels) use JetBrains Mono
- [ ] All headings and body text use Inter
- [ ] No text below 11px anywhere
- [ ] `<code>` or `.code-inline` used for all inline technical terms

**Task cards (Pattern 12):**
- [ ] All task cards have `border-radius:2px` (NOT 4px)
- [ ] Every task card has an owner badge (MANDATORY)
- [ ] Every task card has exactly 4 layers: icon → title+owner → description → metadata
- [ ] Section label (`.section-label`) present above task card column
- [ ] Dark timeline uses `border-radius:6px`
- [ ] Vertical timeline container has `position:relative`
- [ ] Timeline dots use `position:absolute;left:-7px`
- [ ] Info panel (success metrics) uses gray dashed border (NOT red `.failure`)

**Incident slides (Pattern 13):**
- [ ] Slide padding is `34px 40px 0` (no bottom padding)
- [ ] Dark footer uses `border-radius:4px 4px 0 0`
- [ ] Meta boxes use `.meta-box` (background:var(--slide-bg))
- [ ] Horizontal timeline has 3 dots (detected, peak, resolved) with correct colors
- [ ] Resolution card uses green background (#F0FFF4) with green border

**Matrix slides (Pattern 14):**
- [ ] Improved rows have green tint `rgba(220,252,231,0.2)`
- [ ] Lowered rows have red tint `rgba(254,226,226,0.2)`
- [ ] Row grid is `3fr 2fr 7fr`

**Sprint slides (Pattern 15):**
- [ ] Sprint goal banner uses correct green bg/border
- [ ] Action card border-radius is `2px`
- [ ] Avatars are 26×26px using `.avatar` class
- [ ] Priority table uses `.prow-header` + `.prow` with correct padding

**Anti-patterns (none of these should appear):**
- [ ] No `transform:scale()` or compress-body
- [ ] No Tailwind CSS classes
- [ ] No Font Awesome or external icon CDN
- [ ] No external image URLs
- [ ] No echarts, chart.js, d3, or JS chart libraries
- [ ] No `min-height:720px` (must be `height:720px`)
- [ ] No left accent stripe
- [ ] No gradient backgrounds
- [ ] No emojis anywhere — use inline SVG icons or Unicode arrows only
- [ ] No `border-radius:4px` on dark boxes (must be 6px)
- [ ] No `border-radius:4px` on task cards (must be 2px)
- [ ] No red dashed border on info/success panels (use gray dashed)
- [ ] No missing owner badges on task cards

### Step 8: Save and Present

```python
file_path = "/mnt/user-data/outputs/[sprint-or-topic]-[type]-deck.html"
# Examples: "sprint18-retro-deck.html", "auth-incident-postmortem.html"
present_files([file_path])
```

---

## Content → Layout Quick Reference

| Content | Pattern | Key visual |
|---|---|---|
| Opening / system context | 1 | Technical cover |
| Service tiers / request flow diagram | 2 | Tier boxes + connectors |
| Component inventory | 3 | 2×2 card grid |
| Auth / process flow | 4 | 2-column step cards |
| Sprint metrics + table | 5 | 3 metrics + table+chart |
| Feature A/B results | 6 | Metrics left + chart right |
| CI/CD changes | 7 | Checklist + chart |
| Deployment KPIs | 8 | KPI stack + dark analysis |
| Bug analysis | 9 | Callout + 2×2 item grid |
| Root cause | 10 | Donut + tracker list |
| Performance bottleneck | 11 | 2 analysis cards |
| Action items | **12** | **Task cards (2px br) + dark timeline (6px br) + info panel (gray dashed)** |
| Incident post-mortem | **13** | **Incident cards + horizontal timelines + flush dark footer (4px 4px 0 0)** |
| Architecture tradeoffs | **14** | **Matrix table + direction tints + summary** |
| Sprint planning | **15** | **Sprint goal banner + priority table + action cards (2px br) + avatars** |

---

## Anti-Patterns Table

| What | Why it fails |
|---|---|
| `border-radius:4px` on task/action cards | Too round — looks like a marketing deck, not an engineering one |
| `border-radius:4px` on dark boxes | Too sharp — looks like a card, not an analysis panel. Use 6px. |
| Red dashed border on info panels | `.failure` is for broken states only. Info = gray dashed `.info-panel`. |
| Missing owner badge | Every task needs an owner. It's the whole point of an action item. |
| Missing section label | Columns without section labels look unlabeled and incomplete. |
| Plain text instead of `<code>` for tech terms | `(user_id, last_login)` looks naked in body text — wrap it. |
| Standard padding on incident slides | Dark footer won't reach the edge. Use `padding:34px 40px 0`. |
| `border-radius:6px` on incident footer | Footer must be `4px 4px 0 0` to flush with slide edge. |
| Neutral matrix rows with tints | Only tint improved (green) and lowered (red) rows. Neutral = no bg. |
| Vertical timeline without `position:relative` | Dots positioned `position:absolute;left:-7px` won't work without relative parent. |
| JetBrains Mono for headings | Mono is metadata only. Titles use Inter. |
| Inter for metadata, timestamps, labels | Metadata must be JetBrains Mono. |
| `transform:scale()` | Breaks layout. Fix by reducing font-size (floor: 11px). |
| Font Awesome or Heroicons CDN | Use inline SVG paths from design-system.md. |
| echarts / chart.js | External dependency. Use inline SVG formulas. |
| External image URLs | Breaks offline. Use geometric shapes or terminal output blocks. |
| Consecutive identical patterns | Kills visual variety. Check variety rules in layout-library.md. |

---

## Skill Files

```
SKILL.md                       ← You are here
references/design-system.md   ← Colors, typography, CSS shell, all components
references/layout-library.md  ← 15 layout patterns with CSS, HTML, selection guide
```