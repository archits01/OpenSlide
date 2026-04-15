# Layout Library — Engineering HTML Slide Deck Builder

Fifteen proven layout patterns. Each slide uses exactly one pattern. Never repeat on consecutive slides.

---

## Pattern Index

| # | Name | Best For | Key Visual |
|---|---|---|---|
| 1 | Technical Cover | Opening slide | 58/42 split, JSON + terminal cards |
| 2 | Tiered Architecture | System diagrams, service maps | Vertical tiers with connectors + failure markers |
| 3 | Component Card Grid | Tech stack, service specs | 2×2 cards with colored tech label pills |
| 4 | Two-Phase Flow | Sequential flows, auth paths | 2 columns of numbered step cards + footer grid |
| 5 | Metric Cards + Table | Sprint summaries, shipments | 3-card row + table left / chart+notes right |
| 6 | Left Metrics + Right Chart | Feature impact, A/B results | Stacked metric boxes left + SVG chart + dark quote |
| 7 | Checklist + Chart | CI/CD, infrastructure gains | Change list + terminal left + grouped chart right |
| 8 | KPI Cards + Analysis | Deployment metrics, rollbacks | KPI stack left + donut/table + dark analysis right |
| 9 | Problem + Item Grid | Bug analysis, regression review | Callout box + severity chart + 2×2 item grid + dark footer |
| 10 | Chart + Tracker | Root cause, P1 backlog | Donut + quote left + bug tracker list right |
| 11 | Two Bottleneck Cards | Performance, dual analysis | 2 equal analysis cards with sub-charts/metrics |
| 12 | Task + Timeline | Action items, mitigation plans | 3 task cards left (8fr) + dark timeline + info panel right (4fr) |
| 13 | Incident Post-Mortems | Outage reviews, post-mortems | 2 incident cards with horizontal timelines + flush dark footer |
| 14 | Matrix Table | Architecture tradeoffs, ADRs | Dark-header matrix table + summary section + reference |
| 15 | Sprint Roadmap | Planning, action items, next sprint | Sprint goal banner + priority table (7fr) + action cards (5fr) |

---

## E1: Technical Cover
For: cover — first slide only

```css
.cover { width: 1280px; height: 720px; overflow: hidden; background: #F8F9FA;
         display: flex; font-family: 'Inter', sans-serif; color: #1A202C; }
.cover-left { width: 58%; height: 100%; display: flex; flex-direction: column;
              justify-content: space-between; padding: 48px; }
.cover-title { font-size: 62px; font-weight: 700; letter-spacing: -2px;
               line-height: 1.05; color: #1A202C; margin: 0 0 20px; }
.cover-title em { color: #D35400; font-style: normal; }
.cover-meta-grid { display: grid; grid-template-columns: repeat(4,1fr);
                   gap: 24px; border-top: 1px solid var(--slide-border); padding-top: 28px; }
.cover-right { flex: 1; height: 100%; padding: 48px 48px 48px 24px;
               display: flex; flex-direction: column; justify-content: center; gap: 16px; }
```

Structure: 58% left — monospace file path nav (top) + large title with orange `<em>` accent + subtitle + 4-col metadata grid (bottom). 42% right — JSON metrics card (white bordered) + terminal output card (dark bg) stacked vertically. Thin vertical divider between halves.

---

## E2: Tiered Architecture Diagram
For: system diagrams — service boundaries, infrastructure layers, request flow

```css
.tier-card { background: #fff; border: 1px solid var(--slide-border); border-radius: 4px; }
.connector { display: flex; justify-content: center; flex-shrink: 0; height: 18px; }
.connector-line { width: 1px; background: #CBD5E0; }
.data-layer { background: var(--slide-bg); border: 1px solid var(--slide-border); border-radius: 4px;
              padding: 14px; display: flex; flex-direction: column; }
```

Structure: flex-col — centered user box → connector → full-width API Gateway → 4-col microservices → 3-col data layer.

---

## E3: Component Card Grid
For: tech stack inventory — individual services, infrastructure pieces

```css
.comp-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; flex: 1; min-height: 0; }
.comp-card { background: #fff; border: 1px solid var(--slide-border); border-radius: 4px; padding: 16px 18px; }
```

Structure: 2×2 grid of component cards. Each card has colored tech label pill, icon, name, description, and spec rows.

---

## E4: Two-Phase Flow
For: sequential process — auth flow, multi-stage pipeline, onboarding steps

```css
.phase-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; flex: 1; min-height: 0; }
.step-card { background: #fff; border: 1px solid var(--slide-border); border-radius: 4px;
             padding: 12px 14px; display: flex; gap: 12px; align-items: flex-start;
             margin-bottom: 8px; }
```

Structure: 2-col grid — each column is a phase with numbered step cards stacked. Footer grid below with summary stats.

---

## E5: Metric Cards + Table
For: sprint summary — 3 headline metrics + table breakdown

```css
.metric-row { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px;
              flex-shrink: 0; margin-bottom: 14px; }
.metric-card { background: #fff; border: 1px solid var(--slide-border); border-radius: 4px; padding: 16px; }
.main-grid { display: grid; grid-template-columns: 5fr 3fr; gap: 16px; flex: 1; min-height: 0; }
```

Structure: 3-card metric row (top) → `5fr/3fr` grid: table left, chart + notes right.

---

## E6: Left Metrics + Right Chart
For: feature impact — A/B results, before/after comparison

```css
.left-right { display: grid; grid-template-columns: 3fr 5fr; gap: 18px; flex: 1; min-height: 0; }
.metric-box { background: #fff; border: 1px solid var(--slide-border); border-radius: 4px;
              padding: 14px 16px; margin-bottom: 10px; }
```

Structure: `3fr/5fr` — stacked metric boxes left + SVG bar chart + dark quote card right.

---

## E7: Checklist + Chart
For: CI/CD changes — infrastructure gains, deployment results

```css
.main-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; flex: 1; min-height: 0; }
```

Structure: `1fr/1fr` — change checklist + terminal card left, grouped bar chart right.

---

## E8: KPI Cards + Analysis
For: deployment metrics — rollback history, quality gates

```css
.three-col { display: grid; grid-template-columns: 3fr 4fr 4fr; gap: 14px; flex: 1; min-height: 0; }
.kpi-card { background: #fff; border: 1px solid var(--slide-border); border-radius: 4px; padding: 16px; }
```

Structure: `3fr/4fr/4fr` — KPI stack left, donut/table center, dark analysis panel right.

---

## E9: Problem + Item Grid
For: bug analysis — regression review, regression post-incident

```css
.problem-callout { background: #FEF2F2; border: 1px solid #FECACA; border-radius: 4px;
                   padding: 14px 16px; flex-shrink: 0; margin-bottom: 12px; }
.item-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; flex: 1; min-height: 0; }
```

Structure: red callout box (top) → severity chart + `2×2` item grid → dark footer.

---

## E10: Chart + Tracker
For: root cause analysis — P1 backlog breakdown

```css
.chart-tracker { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; flex: 1; min-height: 0; }
```

Structure: `1fr/1fr` — donut chart + dark quote left, bug tracker list right.

---

## E11: Two Bottleneck Cards
For: performance analysis — two parallel root causes

```css
.bottleneck-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; flex: 1; min-height: 0; }
.bottleneck-card { background: #fff; border: 1px solid var(--slide-border); border-radius: 4px;
                   padding: 18px 20px; display: flex; flex-direction: column; }
```

Structure: `1fr/1fr` — two equal analysis cards each with sub-chart, metrics, and dark analysis section.

---

## E12: Task + Timeline
For: action items — mitigation plans, post-incident remediation

Grid: `8fr 4fr`. Task card `border-radius: 2px` (intentional engineering aesthetic). Task card gap: `14px`.

```css
.task-layout { display: grid; grid-template-columns: 8fr 4fr; gap: 20px; flex: 1; min-height: 0; }
.task-col { display: flex; flex-direction: column; gap: 14px; min-height: 0; }
.timeline-col { display: flex; flex-direction: column; gap: 12px; min-height: 0; }
.task-card { background: #fff; border: 1px solid var(--slide-border); border-left: 4px solid #2D3436;
             border-radius: 2px; padding: 14px 16px; display: flex; gap: 16px;
             align-items: flex-start; }
.task-card-o { border-left-color: #D35400; }
.task-card-g { border-left-color: #CBD5E0; }
```

**Left column:**
```html
<div class="task-col">
  <div class="section-label" style="flex-shrink:0;">
    [list icon 13px var(--slide-secondary)]
    [SECTION LABEL]
  </div>

  <!-- Task 1: Critical (dark border) -->
  <div class="task-card">
    <svg viewBox="0 0 24 24" fill="none" stroke="var(--slide-secondary)" stroke-width="2"
         stroke-linecap="round" stroke-linejoin="round" width="20" height="20"
         style="flex-shrink:0;margin-top:2px;">
      [icon paths]
    </svg>
    <div style="flex:1;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
        <h3 style="font-size:15px;font-weight:700;margin:0;">[TASK TITLE]</h3>
        <span class="owner-badge">[OWNER]</span>
      </div>
      <p style="font-size:12px;color:#64748B;margin:0 0 8px;line-height:1.5;">
        [TASK DESCRIPTION] <code>[inline code if needed]</code>
      </p>
      <div style="display:flex;align-items:center;gap:16px;">
        <div style="display:flex;align-items:center;gap:5px;" class="mono">
          [calendar svg 11px]
          <span style="font-size:10px;color:#A0AEC0;">Deadline: [DATE]</span>
        </div>
        <div style="display:flex;align-items:center;gap:5px;">
          [status svg 11px]
          <span class="mono" style="font-size:10px;color:#27AE60;">[STATUS]</span>
        </div>
      </div>
    </div>
  </div>
  <!-- repeat for each item -->
</div>
```

**Right column:**
```html
<div class="timeline-col">
  <!-- Dark timeline box — border-radius: 6px -->
  <div class="dark-box" style="flex:1;">
    <div class="mono" style="font-size:10px;color:#4A5568;text-transform:uppercase;margin-bottom:20px;">
      [TIMELINE LABEL]
    </div>
    <!-- Container position:relative is REQUIRED -->
    <div style="border-left:1px solid rgba(255,255,255,0.08);padding-left:20px;
                display:flex;flex-direction:column;gap:28px;position:relative;">
      <div style="display:flex;gap:12px;align-items:flex-start;">
        <!-- Dot: position:absolute;left:-7px -->
        <div style="width:12px;height:12px;border-radius:50%;background:#fff;
                    flex-shrink:0;margin-top:2px;position:absolute;left:-7px;"></div>
        <div>
          <div class="mono" style="font-size:10px;color:#718096;">[DATE]</div>
          <div style="font-size:13px;font-weight:700;color:#fff;">[MILESTONE]</div>
        </div>
      </div>
      <!-- repeat for each item -->
    </div>
  </div>

  <!-- Neutral info panel — gray dashed border -->
  <div class="info-panel" style="padding:16px;">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
      [info circle svg 13px #A0AEC0]
      <span class="mono" style="font-size:10px;font-weight:700;text-transform:uppercase;color:#4A5568;">
        [PANEL LABEL]
      </span>
    </div>
    <div style="display:flex;flex-direction:column;gap:10px;">
      <div style="display:flex;align-items:flex-start;gap:8px;">
        <span style="color:#27AE60;font-size:14px;flex-shrink:0;line-height:1.2;">●</span>
        <span style="font-size:12px;color:#4A5568;">[METRIC]: <strong>[VALUE]</strong></span>
      </div>
      <!-- repeat for each item -->
    </div>
  </div>
</div>
```

**Footer:**
```html
<footer class="slide-footer">
  <span class="mono">[REF LABEL]</span>
  <span class="mono">[CLASSIFICATION]</span>
</footer>
```

---

## E13: Incident Post-Mortems
For: outage reviews — critical incident analysis, post-mortem summary

**CRITICAL: Slide uses `padding:34px 40px 0` (no bottom padding) so dark footer reaches slide edge.**
**CRITICAL: Dark footer uses `border-radius:4px 4px 0 0` (flat bottom).**

```css
.slide.incident { padding: 34px 40px 0; }
.inc-card { background: #fff; border-left: 4px solid #C0392B;
            padding: 16px 18px; display: flex; flex-direction: column; flex: 1; }
.inc-card-o { border-left-color: #D35400; }
.meta-box { background: var(--slide-bg); padding: 10px 12px; border-radius: 3px; }
```

```html
<div class="slide" style="padding:34px 40px 0;">
  <header class="slide-header">
    <div class="slide-title-block">
      <h1>[SLIDE TITLE]</h1>
      <p class="slide-subtitle" style="text-decoration:underline;text-decoration-color:#C0392B;">
        [SUBTITLE]
      </p>
    </div>
    <span class="mono" style="font-size:11px;font-weight:700;background:#FEE2E2;color:#991B1B;padding:3px 12px;border-radius:999px;">
      [N] INCIDENTS RECORDED
    </span>
  </header>

  <div style="flex:1;display:grid;grid-template-columns:1fr 1fr;gap:16px;min-height:0;">

    <!-- Incident 1: Red -->
    <div class="inc-card">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;">
        <h2 style="font-size:18px;font-weight:700;margin:0;">[INCIDENT TITLE]</h2>
        <span class="mono" style="font-size:11px;font-weight:700;color:#A0AEC0;">ID: [INC-ID]</span>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;">
        <div class="meta-box">
          <div class="mono" style="font-size:10px;color:#A0AEC0;text-transform:uppercase;margin-bottom:4px;">Duration</div>
          <div style="font-size:16px;font-weight:700;">[DURATION]</div>
        </div>
        <div class="meta-box">
          <div class="mono" style="font-size:10px;color:#A0AEC0;text-transform:uppercase;margin-bottom:4px;">Impact</div>
          <div style="font-size:16px;font-weight:700;color:#C0392B;">[IMPACT]</div>
        </div>
      </div>
      <div style="margin-bottom:12px;">
        <div class="mono" style="font-size:10px;font-weight:700;text-transform:uppercase;color:#718096;margin-bottom:5px;">Root Cause</div>
        <p style="font-size:12px;color:#4A5568;line-height:1.55;margin:0;">[ROOT CAUSE]</p>
      </div>
      <!-- Horizontal timeline — red incident -->
      <div style="position:relative;height:56px;margin-bottom:12px;flex-shrink:0;">
        <div style="position:absolute;top:10px;left:6px;right:6px;height:2px;background:#FECACA;"></div>
        <div style="position:absolute;top:4px;left:0;width:12px;height:12px;border-radius:50%;background:#C0392B;"></div>
        <div style="position:absolute;top:22px;left:0;">
          <div class="mono" style="font-size:10px;color:#718096;white-space:nowrap;">[TIME]</div>
          <div style="font-size:9px;font-weight:700;color:var(--slide-secondary);text-transform:uppercase;">Detected</div>
        </div>
        <div style="position:absolute;top:2px;left:calc(50% - 8px);width:16px;height:16px;border-radius:50%;background:#9B1C1C;"></div>
        <div style="position:absolute;top:22px;left:calc(50%);transform:translateX(-50%);text-align:center;">
          <div class="mono" style="font-size:10px;color:#C0392B;white-space:nowrap;">[TIME]</div>
          <div style="font-size:9px;font-weight:700;color:#C0392B;text-transform:uppercase;">Peak Impact</div>
        </div>
        <div style="position:absolute;top:4px;right:0;width:12px;height:12px;border-radius:50%;background:#27AE60;"></div>
        <div style="position:absolute;top:22px;right:0;text-align:right;">
          <div class="mono" style="font-size:10px;color:#27AE60;white-space:nowrap;">[TIME]</div>
          <div style="font-size:9px;font-weight:700;color:#27AE60;text-transform:uppercase;">Resolved</div>
        </div>
      </div>
      <div style="background:#F0FFF4;border:1px solid #C6F6D5;padding:10px 12px;border-radius:4px;margin-top:auto;">
        <div class="mono" style="font-size:10px;font-weight:700;text-transform:uppercase;color:#276749;margin-bottom:4px;">Resolution Strategy</div>
        <p style="font-size:11px;color:#2F855A;margin:0;line-height:1.5;">[RESOLUTION]</p>
      </div>
    </div>

    <!-- Incident 2: Orange — same structure, border-left:#D35400, timeline track:#FFEDD5, dot1:#D35400, dot2(center):#EA580C -->
    <div class="inc-card inc-card-o">
      <!-- same structure as above -->
    </div>
  </div>

  <!-- Dark footer — border-radius:4px 4px 0 0 (FLAT BOTTOM) -->
  <div class="incident-footer">
    <div style="flex-shrink:0;">
      <span class="mono" style="font-size:11px;font-weight:700;color:#F59E0B;">⚠ ONGOING MITIGATION</span>
    </div>
    <div style="flex:1;display:grid;grid-template-columns:repeat(3,1fr);gap:20px;">
      <div style="display:flex;align-items:flex-start;gap:8px;">
        [icon SVG 13px #4A5568 flex-shrink:0 margin-top:2px]
        <p style="font-size:11px;color:var(--slide-secondary);line-height:1.5;margin:0;">[MITIGATION ITEM]</p>
      </div>
      <!-- repeat for each item -->
    </div>
  </div>
</div>
```

NO standard footer — dark flush footer replaces it.

---

## E14: Matrix Table
For: architecture tradeoffs — ADR documentation, quality attribute comparison

```css
.matrix-container { border: 1px solid var(--slide-border); background: #fff; border-radius: 6px;
                    overflow: hidden; flex-shrink: 0; }
.matrix-header { display: grid; background: #1A202C; color: #fff; padding: 12px 18px; }
.matrix-row { display: grid; grid-template-columns: 3fr 2fr 7fr;
              border-bottom: 1px solid #F1F5F9; padding: 12px 18px; align-items: center; }
.matrix-row:last-child { border-bottom: none; }
.matrix-improved { background: rgba(220,252,231,0.2); }
.matrix-lowered  { background: rgba(254,226,226,0.2); }
.badge-g  { background: #DCFCE7; color: #166534; }
.badge-r  { background: #FEE2E2; color: #991B1B; }
.badge-o  { background: #FEF3C7; color: #92400E; }
.badge-rs { background: #FEF2F2; color: #B91C1C; border: 1px solid #FECACA; }
/* All badges: display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:4px;font-size:11px;font-weight:700;text-transform:uppercase; */
```

```html
<div class="matrix-container">
  <div class="matrix-header" style="grid-template-columns:3fr 2fr 7fr;">
    <div class="mono" style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Quality Attribute</div>
    <div class="mono" style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;text-align:center;">Direction</div>
    <div class="mono" style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Decision Impact Rationale</div>
  </div>

  <!-- Row: Improved — green tint -->
  <div class="matrix-row matrix-improved">
    <div style="font-weight:700;font-size:14px;">[ATTRIBUTE]</div>
    <div style="display:flex;justify-content:center;">
      <span class="badge badge-g">↑ Improved</span>
    </div>
    <div style="font-size:12px;color:#4A5568;line-height:1.55;">
      [RATIONALE] via <span class="mono" style="font-weight:600;color:#1A202C;font-size:11px;">[CODE TERM]</span>.
    </div>
  </div>

  <!-- Row: Lowered — red tint -->
  <div class="matrix-row matrix-lowered">
    <div style="font-weight:700;font-size:14px;">[ATTRIBUTE]</div>
    <div style="display:flex;justify-content:center;">
      <span class="badge badge-r">↓ Lowered</span>
    </div>
    <div style="font-size:12px;color:#4A5568;line-height:1.55;">[RATIONALE]</div>
  </div>

  <!-- Row: Neutral — no tint -->
  <div class="matrix-row">
    <div style="font-weight:700;font-size:14px;">[ATTRIBUTE]</div>
    <div style="display:flex;justify-content:center;">
      <span class="badge badge-o">— Limited</span>
    </div>
    <div style="font-size:12px;color:#4A5568;line-height:1.55;">[RATIONALE]</div>
  </div>
  <!-- repeat for each item -->
</div>

<!-- Summary section below matrix -->
<div style="display:grid;grid-template-columns:2fr 1fr;gap:14px;margin-top:14px;flex:1;min-height:0;">
  <div style="background:#F1F5F9;border-radius:6px;padding:16px;display:flex;align-items:flex-start;gap:14px;">
    <div style="background:#1A202C;color:#fff;padding:10px;border-radius:5px;flex-shrink:0;">
      [question-mark SVG white 16px]
    </div>
    <div>
      <h4 style="font-weight:700;font-size:14px;color:#1A202C;margin:0 0 6px;">Strategic Conclusion</h4>
      <p style="font-size:12px;color:#4A5568;line-height:1.6;margin:0;font-style:italic;">"[STRATEGIC CONCLUSION]"</p>
    </div>
  </div>
  <div style="border-left:4px solid #D35400;padding-left:18px;display:flex;flex-direction:column;justify-content:center;">
    <div class="mono" style="font-size:10px;color:#A0AEC0;text-transform:uppercase;margin-bottom:6px;">Key Reference</div>
    <div style="font-size:14px;font-weight:600;color:#1A202C;margin-bottom:4px;">[ADR TITLE]</div>
    <div class="mono" style="font-size:11px;color:#3B82F6;text-decoration:underline;">[JIRA LINK]</div>
  </div>
</div>
```

---

## E15: Sprint Roadmap
For: sprint planning — next sprint priorities, action items for upcoming cycle

Three sections: sprint goal banner → `7fr/5fr` grid (priority table left, action cards right).

```css
.sprint-goal { padding: 12px 16px; background: rgba(39,174,96,0.05);
               border: 1px solid rgba(39,174,96,0.2); border-radius: 4px;
               display: flex; align-items: center; gap: 16px;
               margin-bottom: 14px; flex-shrink: 0; }
.sprint-goal-icon { background: #27AE60; color: #fff; padding: 10px; border-radius: 4px; flex-shrink: 0; }
.sprint-grid { display: grid; grid-template-columns: 7fr 5fr; gap: 20px; flex: 1; min-height: 0; }
.priority-table-wrap { background: #fff; border: 1px solid var(--slide-border); border-radius: 4px;
                       overflow: hidden; flex: 1; }
.priority-table-wrap table { width: 100%; border-collapse: collapse; font-size: 12px; }
.prow-header { background: #F1F5F9; border-bottom: 1px solid var(--slide-border); }
.prow-header th { font-family: 'JetBrains Mono', monospace; padding: 10px 14px;
                  text-align: left; font-size: 10px; font-weight: 700;
                  text-transform: uppercase; color: #64748B; }
.prow { border-bottom: 1px solid #F1F5F9; }
.prow:nth-child(even) { background: #FBFBFC; }
.prow:last-child { border-bottom: none; }
.prow td { padding: 11px 14px; }
/* Action cards — border-radius: 2px (same engineering precision as task cards) */
.action-card { background: #fff; border: 1px solid var(--slide-border); border-left: 4px solid #2D3436;
               border-radius: 2px; padding: 10px 14px; }
```

```html
<div class="slide">
  <header class="slide-header">
    <div class="slide-title-block">
      <h1>[SLIDE TITLE]</h1>
      <p class="slide-subtitle">[SUBTITLE]</p>
    </div>
    <span class="badge-green">GOAL: [GOAL TEXT]</span>
  </header>

  <div class="sprint-goal">
    <div class="sprint-goal-icon">
      [target SVG white 18px]
    </div>
    <div>
      <h2 style="font-size:14px;font-weight:700;color:#27AE60;margin:0 0 3px;">[SPRINT GOAL TITLE]</h2>
      <p style="font-size:12px;color:#64748B;margin:0;">[SPRINT GOAL DESCRIPTION]</p>
    </div>
  </div>

  <div class="sprint-grid">

    <!-- LEFT: Priority table -->
    <div style="display:flex;flex-direction:column;min-height:0;">
      <div class="section-label" style="margin-bottom:8px;flex-shrink:0;">
        [list icon 13px]
        [SECTION LABEL]
      </div>
      <div class="priority-table-wrap">
        <table>
          <thead>
            <tr class="prow-header">
              <th>Task</th>
              <th>Owner</th>
              <th style="text-align:center;">Est.</th>
            </tr>
          </thead>
          <tbody>
            <tr class="prow">
              <td>
                <span style="font-weight:600;display:block;color:#1A202C;">[TASK TITLE]</span>
                <span style="font-size:11px;color:#A0AEC0;">[TASK SUBTITLE]</span>
              </td>
              <td class="mono" style="font-size:11px;color:#64748B;">[OWNER]</td>
              <td class="mono" style="text-align:center;font-weight:700;color:#64748B;">[EST]</td>
            </tr>
            <!-- repeat for each item -->
          </tbody>
        </table>
      </div>
    </div>

    <!-- RIGHT: Action cards — gap: 10px -->
    <div style="display:flex;flex-direction:column;min-height:0;">
      <div class="section-label" style="margin-bottom:8px;flex-shrink:0;">
        [arrow-right icon 13px]
        [SECTION LABEL]
      </div>
      <div style="display:flex;flex-direction:column;gap:10px;flex:1;">
        <div class="action-card">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">
            <span style="font-weight:700;font-size:13px;">[ACTION TITLE]</span>
            <span class="mono" style="font-size:10px;background:#F1F5F9;color:#64748B;padding:2px 7px;border-radius:2px;">[DEADLINE]</span>
          </div>
          <div style="display:flex;align-items:center;gap:8px;">
            <div class="avatar">[INITIALS]</div>
            <span style="font-size:11px;color:#64748B;">[ROLE]</span>
          </div>
        </div>
        <!-- repeat for each item -->
      </div>
    </div>
  </div>

  <footer class="slide-footer">
    <span class="mono">[TRACKER REF]</span>
    <div style="display:flex;gap:16px;">
      <div style="display:flex;align-items:center;gap:5px;">
        <div style="width:8px;height:8px;border-radius:50%;background:#27AE60;"></div>
        <span class="mono" style="font-size:10px;color:#A0AEC0;">[STATUS LABEL]</span>
      </div>
      <div style="display:flex;align-items:center;gap:5px;">
        <div style="width:8px;height:8px;border-radius:50%;background:#CBD5E0;"></div>
        <span class="mono" style="font-size:10px;color:#A0AEC0;">[STATUS LABEL]</span>
      </div>
    </div>
  </footer>
</div>
```

---

## Layout Selection Guide

| Content | Pattern | Key signal |
|---|---|---|
| First slide | 1 | Always |
| System architecture, service map | 2 | Tier diagram, API gateway |
| Tech stack inventory | 3 | Service cards, 2×2 grid |
| Auth flow, onboarding steps | 4 | Numbered sequential steps |
| Sprint summary + table | 5 | 3 metrics + table |
| Feature A/B results | 6 | Before/after metrics |
| CI/CD changes, infra gains | 7 | Checklist + chart |
| Deployment metrics, rollbacks | 8 | KPI stack + dark analysis |
| Bug analysis | 9 | Problem box + item grid |
| Root cause, P1 list | 10 | Donut + tracker |
| Performance bottleneck | 11 | 2 parallel analysis cards |
| Action items, mitigation | **12** | **Task cards + timeline** |
| Incident post-mortem | **13** | **Incident cards + flush footer** |
| Architecture tradeoffs | **14** | **Matrix table + ADR ref** |
| Sprint planning | **15** | **Sprint goal + priority table + action cards** |

## Variety Rules

- Cover (Pattern 1) is always first
- Patterns 13 and 9 (both incident/problem heavy): never adjacent
- Patterns 2 and 3 (both architectural): never adjacent
- Pattern 12 and 15 (both action-item focused): never adjacent
- Standard 15-slide engineering review uses each pattern exactly once

## Standard 15-Slide Engineering Deck Arc

| Slide | Content | Pattern |
|---|---|---|
| 01 | Cover | 1 |
| 02 | Architecture Overview | 2 |
| 03 | Component Inventory | 3 |
| 04 | Request Flow | 4 |
| 05 | Sprint Summary | 5 |
| 06 | Feature Impact | 6 |
| 07 | CI/CD Pipeline Changes | 7 |
| 08 | Deployment Metrics | 8 |
| 09 | Bug Analysis | 9 |
| 10 | Root Cause | 10 |
| 11 | Performance Bottleneck | 11 |
| 12 | Action Items / Mitigation | 12 |
| 13 | Incident Post-Mortems | 13 |
| 14 | Architecture Tradeoffs | 14 |
| 15 | Sprint Planning | 15 |

## Domain Adaptations

**Architecture Review (10 slides):**
01 → 02 → 03 → 04 → 08 → 11 → 14 → 12 → 15 → 01

**Incident Retrospective (8 slides):**
01 → 02 → 09 → 10 → 11 → 13 → 12 → 15

**Performance Audit (8 slides):**
01 → 05 → 06 → 07 → 08 → 11 → 10 → 12

**Sprint Retro (6 slides):**
01 → 05 → 09 → 07 → 12 → 15
