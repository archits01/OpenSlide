# Design System — Executive Business Review HTML Slide Deck

Complete visual language for executive/leadership business review decks. Every slide uses these values without deviation. Boardroom-grade aesthetic: **Inter only**, no monospace, no technical elements.

---

## ⚠️ Critical Corrections (Read First)

These rules are derived from forensic analysis of reference-quality Skyworks originals and override any prior intuition:

1. **Metric card top borders are UNIFORM `#333333`** — NOT color-coded by status. Status lives ONLY in the delta text color and the status badge. Color-coding the card frame makes every slide look like a dashboard alert.
2. **KPI section cards use GRAY `#E5E7EB` top border** — not section-colored. Color-coding section containers degrades the executive aesthetic.
3. **Slide padding is `34px 40px`** — not `28px 36px`. Tighter padding makes slides feel cramped and low-budget.
4. **Card shadows are clearly visible**: `0 2px 8px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)` — not barely perceptible. Cards must float above the gray background.
5. **All main cards use `border-radius: 10px`** — not 6px. The rounder radius reads as premium.
6. **Win card titles are 15–16px** — not 13px. Small titles undercut the achievement being celebrated.
7. **Risk card padding is `18px 20px`** — not `13px 15px`. Cramped risk cards look rushed.
8. **Dark footer uses `border-radius: 12px`** — not 8px. The rounder footer looks more intentional.

---

## CSS Variable Mapping (CRITICAL — use these in all slide HTML)

Every color below has a corresponding CSS variable set by `set_theme`. **Always use the CSS variable in slide HTML, not the raw hex.** The hex values are defaults — themes change them.

| Default Hex | CSS Variable | Where to use |
|---|---|---|
| `#F2F2F2` | `var(--slide-bg)` | Slide background |
| `#333333` | `var(--slide-text)` | Headings, primary text |
| `#2D7D46` | `var(--slide-accent)` | On light: accent, stripes, progress bars, borders |
| `#4B5563` / `#6B7280` | `var(--slide-secondary)` | Body text, muted text |
| `#333333` | `var(--slide-dark)` | Dark panel/footer backgrounds |
| `#2D7D46` | `var(--slide-accent-light)` | On dark: accent text, indicators |
| `#E5E7EB` | `var(--slide-border)` | Card borders, dividers, table lines |

**Hard-coded OK (don't change with theme):** box-shadow rgba values, font imports, status colors (`#C0504D` miss, `#D97706` near — these are semantic, not theme-dependent), `#9CA3AF` metadata text.

---

## Color Palette

| Role | Hex | Usage |
|---|---|---|
| Background | `#F2F2F2` | Slide background (warm light gray) |
| Surface | `#FFFFFF` | All card/panel backgrounds |
| Primary (charcoal) | `#333333` | Headers, dark panels, neutral borders, UNIFORM metric card borders |
| Accent (emerald) | `#2D7D46` | Wins, progress bars, positive indicators, actions |
| Miss / Critical | `#C0504D` | Revenue misses, high-severity risks, challenge slide headers |
| Near / Amber | `#D97706` | At-risk items, medium severity, near-target |
| Border | `#E5E7EB` | Card outlines, table lines, KPI section card top borders |
| Border subtle | `#F3F4F6` | Row dividers, inner section borders |
| Text primary | `#333333` | Headings, bold labels |
| Text body | `#4B5563` | Descriptive body text |
| Text muted | `#6B7280` | Secondary labels, subtitles |
| Text subtle | `#9CA3AF` | Metadata, timestamps, uppercase labels |

### Status Colors — Apply Only to Text, Badges, and Row Backgrounds

| Status | Text color | Badge bg | Badge text | Row bg | Row border |
|---|---|---|---|---|---|
| Miss / High | `#C0504D` ↓ | `#FEE2E2` | `#991B1B` | `#FFF5F5` | `#FEE2E2` |
| Near / Amber | `#D97706` — | `#FEF3C7` | `#92400E` | `#FFFDF0` | `#FEF3C7` |
| Good / Track | `#2D7D46` ↑ | `#D1FAE5` | `#065F46` | `#F0FFF4` | `#D1FAE5` |
| Neutral | `#9CA3AF` — | `#F3F4F6` | `#374151` | `#FBFBFC` | `#F3F4F6` |

Status colors apply to: delta indicator text, status badge background, table row tint.
Status colors do NOT apply to: metric card top borders, section card borders, card outlines.

---

## Typography

**Single font: Inter only.**
Import: `https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;800&display=swap`

| Element | Size | Weight | Color | Notes |
|---|---|---|---|---|
| Cover title | 66–72px | 800 | `#fff` | Letter-spacing: −2px |
| Slide h1 | 28px | 700 | `#333333` | Inside header left-border |
| Subtitle | 13px | 300 | `#6B7280` | Below h1, `margin-left: 21px` |
| Section card title | 16–17px | 700 | `#374151` | Inside section card header row |
| Win card title | 15–16px | 700 | `#333333` | NOT 13px |
| Risk/priority card title | 14px | 700 | `#333333` | |
| Body text | 12–13px | 400 | `#4B5563` or `#6B7280` | `line-height: 1.55` always |
| Uppercase label | 10–11px | 700 | `#9CA3AF` | `text-transform:uppercase; letter-spacing:1–2px` |
| Metric hero value | 28–42px | 800 | varies | `letter-spacing: -0.5px` |
| Delta indicator | 12px | 600 | status color | ↑↓— prefix, Unicode only |
| Status pill | 10px | 700 | varies | Uppercase |
| Table header | 10px | 700 | `#9CA3AF` | Uppercase, `letter-spacing:1px` |

**Hard rules:** Never below 11px. Body text always has explicit `line-height:1.55`. Uppercase labels always have `letter-spacing ≥ 1px`.

---

## Structural Constants

### Slide Container
```css
html, body { margin: 0; padding: 0; overflow: hidden; width: 1280px; height: 720px; }
* { box-sizing: border-box; }
.slide {
  width: 1280px; height: 720px; overflow: hidden;
  background: var(--slide-bg, #F2F2F2); display: flex; flex-direction: column;
  font-family: 'Inter', sans-serif; color: var(--slide-text, #333333);
  padding: 34px 40px; position: relative;
}
/* Cover ONLY: padding:0; flex-direction:row */
```

### Space Budget
| Element | Height |
|---|---|
| Padding top/bottom (34px each) | 68px total |
| Header (h1 28px + gap + subtitle 13px) | ~54px |
| Margin after header | 14px |
| Light footer (border-top + text) | ~38px + 10px margin |
| Dark footer bar | ~56px + 10px margin |
| **Content zone (standard)** | **~536px** |
| **Content zone (dark footer)** | **~520px** |

### Card Elevation — Apply to All White Cards
```css
/* Standard card elevation — every white card gets this */
box-shadow: 0 2px 8px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05);

/* Floating table rows — lighter variant */
box-shadow: 0 1px 4px rgba(0,0,0,0.06);

/* Dark footer bar — heavier variant */
box-shadow: 0 4px 12px rgba(0,0,0,0.15);
```

### Card Border Radius
```css
border-radius: 10px;  /* main cards: metric, section, win, narrative, insight panels */
border-radius: 8px;   /* table cells, floating rows, smaller utility cards */
border-radius: 6px;   /* inner boxes, secondary metric boxes */
border-radius: 4px;   /* badges, tags, small pills */
border-radius: 999px; /* status pills, progress bars, avatar circles */
```

### Left Accent Stripe (4px — every content slide)
```html
<div style="position:absolute;left:0;top:0;bottom:0;width:4px;background:var(--slide-accent, #2D7D46);z-index:10;"></div>
<!-- Challenge/risk slides: background:#C0504D (semantic, stays hard-coded) -->
```

### Header Left-Border Variants
```html
<!-- Neutral (most slides): -->
<h1 style="font-size:28px;font-weight:700;border-left:8px solid #333333;padding-left:13px;margin:0 0 4px;">Title</h1>

<!-- Critical/red (challenges, risks, unit economics): -->
<h1 style="font-size:28px;font-weight:700;border-left:8px solid #C0504D;padding-left:13px;margin:0 0 4px;">Title</h1>

<!-- 6px variant (performance breakdown): -->
<h1 style="font-size:28px;font-weight:700;border-left:6px solid #333333;padding-left:16px;margin:0 0 4px;">Title</h1>

<!-- No border (financial/income statement): -->
<h1 style="font-size:28px;font-weight:700;margin:0 0 4px;">Title</h1>
```

### Standard Slide Header
```html
<header style="flex-shrink:0;margin-bottom:14px;">
  <h1 style="font-size:28px;font-weight:700;border-left:8px solid var(--slide-dark, #333333);padding-left:13px;margin:0 0 4px;">
    Slide Title Here
  </h1>
  <p style="font-size:13px;font-weight:300;color:var(--slide-secondary, #6B7280);margin:0 0 0 21px;">
    Subtitle / Context
  </p>
</header>
```

### Header Right Badge Patterns
```html
<!-- Execution badge (green): -->
<span style="background:#2D7D46;color:#fff;padding:6px 16px;border-radius:4px;font-weight:700;font-size:11px;letter-spacing:2px;text-transform:uppercase;flex-shrink:0;">
  Quarterly Success Report
</span>

<!-- AT RISK pill (amber): -->
<div style="background:#FEF3C7;color:#92400E;border:1px solid #F59E0B;padding:7px 20px;border-radius:999px;font-weight:700;font-size:13px;display:flex;align-items:center;gap:8px;flex-shrink:0;">
  [warning SVG] AT RISK
</div>

<!-- Dual status tags: -->
<div style="display:flex;gap:8px;flex-shrink:0;">
  <span style="background:#FEE2E2;color:#991B1B;font-size:11px;font-weight:700;padding:5px 13px;border-radius:4px;text-transform:uppercase;">EBITDA ↓ 82% YoY</span>
  <span style="background:#D1FAE5;color:#065F46;font-size:11px;font-weight:700;padding:5px 13px;border-radius:4px;text-transform:uppercase;">21 Mo Runway ✓</span>
</div>
```

---

## Component Patterns

### Metric Cards (Pattern 2 — Executive Summary)

TOP BORDER IS ALWAYS `#333333`. Not `#C0504D`, not `#2D7D46`. Uniform across all 5 cards.

```html
<div style="background:#fff;border-top:4px solid #333333;border-radius:0 0 10px 10px;
            padding:16px;flex:1;display:flex;flex-direction:column;
            box-shadow:0 2px 8px rgba(0,0,0,0.08),0 1px 3px rgba(0,0,0,0.05);">
  <!-- Label -->
  <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#9CA3AF;margin-bottom:8px;">
    Total Revenue
  </div>
  <!-- Hero value -->
  <div style="font-size:30px;font-weight:800;margin-bottom:4px;line-height:1;letter-spacing:-0.5px;">
    $24.7M
  </div>
  <!-- Delta — color IS status-coded here -->
  <div style="font-size:12px;font-weight:600;color:#C0504D;margin-bottom:2px;">↓ 5.0% vs Plan</div>
  <!-- Plan reference -->
  <div style="font-size:11px;color:#9CA3AF;margin-bottom:12px;">Plan: $26.0M</div>
  <!-- Status badge — background IS status-coded here -->
  <div style="background:#FEE2E2;color:#991B1B;font-size:10px;font-weight:700;
              text-transform:uppercase;text-align:center;padding:4px 8px;
              border-radius:4px;margin-top:auto;">
    Lagging
  </div>
</div>
```

### KPI Section Cards (Pattern 3 — 3-column dashboard)

TOP BORDER IS ALWAYS `#E5E7EB` GRAY. Not colored. Section health shown via colored dot + count only.

```html
<div style="background:#fff;border-top:4px solid #E5E7EB;border-radius:10px;
            padding:18px 20px;display:flex;flex-direction:column;
            box-shadow:0 2px 8px rgba(0,0,0,0.08),0 1px 3px rgba(0,0,0,0.05);">
  <!-- Section header inside card -->
  <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;">
    <div style="width:10px;height:10px;border-radius:50%;background:#C0504D;flex-shrink:0;"></div>
    [domain SVG icon 15px #9CA3AF stroke]
    <span style="font-size:16px;font-weight:700;color:#374151;">Revenue Metrics</span>
    <span style="margin-left:auto;font-size:10px;color:#C0504D;font-weight:700;">3 Miss · 2 Near</span>
  </div>
  [table content]
</div>
```

### Win Cards (Pattern 6)
```html
<div style="background:#fff;border-bottom:6px solid #2D7D46;border-radius:10px 10px 0 0;
            padding:18px;display:flex;flex-direction:column;
            box-shadow:0 2px 8px rgba(0,0,0,0.08),0 1px 3px rgba(0,0,0,0.05);">
  <div style="margin-bottom:12px;">[SVG icon 22px green stroke]</div>
  <!-- Title is 15-16px NOT 13px -->
  <h2 style="font-size:15px;font-weight:700;line-height:1.35;margin:0 0 auto;">
    Strategic Enterprise Win
  </h2>
  <div style="margin-top:16px;">
    <p style="font-size:28px;font-weight:800;color:#2D7D46;margin:0 0 2px;letter-spacing:-0.5px;">$1.8M</p>
    <p style="font-size:10px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 10px;">GlobalTech ARR Deal</p>
    <!-- Secondary metric box — adds richness to the card -->
    <div style="background:#F0FDF4;border-radius:6px;padding:7px 10px;margin-bottom:10px;">
      <div style="font-size:11px;color:#2D7D46;font-weight:600;">3-year contract · Manufacturing vertical</div>
    </div>
    <p style="font-size:12px;color:#6B7280;line-height:1.55;margin:0;">Supporting description text.</p>
  </div>
</div>
```

### Risk Cards (Pattern 7 — 2×2 grid)

INNER PADDING IS `18px 20px` — not `13px 15px`. Cramped risk cards signal poor design.

```html
<!-- High severity: -->
<div style="background:#fff;border-left:6px solid #C0504D;border-radius:0 10px 10px 0;
            padding:18px 20px;display:flex;flex-direction:column;
            box-shadow:0 2px 8px rgba(0,0,0,0.08),0 1px 3px rgba(0,0,0,0.05);">
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">
    <h3 style="font-size:14px;font-weight:700;margin:0;">Churn Concentration</h3>
    <div style="display:flex;align-items:center;gap:4px;flex-shrink:0;">
      <div style="width:7px;height:7px;border-radius:50%;background:#C0504D;"></div>
      <span style="font-size:10px;font-weight:700;color:#C0504D;text-transform:uppercase;">High Severity</span>
    </div>
  </div>
  <!-- Mini metric boxes — use them for quantified impact, not just text -->
  <div style="display:flex;gap:10px;margin-bottom:10px;">
    <div style="background:#FEF2F2;border-radius:6px;padding:6px 10px;text-align:center;flex-shrink:0;">
      <div style="font-size:17px;font-weight:800;color:#C0504D;">$2.1M</div>
      <div style="font-size:9px;color:#9CA3AF;text-transform:uppercase;margin-top:2px;">ARR at Risk</div>
    </div>
  </div>
  <p style="font-size:12px;color:#6B7280;line-height:1.55;margin:0 0 10px;">Description with bold <strong>key fact</strong> highlighted.</p>
  <div style="display:flex;align-items:center;gap:5px;margin-top:auto;">
    [shield SVG 11px #2D7D46]
    <span style="font-size:11px;font-weight:600;color:#2D7D46;text-transform:uppercase;font-style:italic;">Mitigation: Action taken.</span>
  </div>
</div>

<!-- Medium severity: border-left-color:#D97706; mini box bg:#FFFBEB -->
```

### Priority Cards (Pattern 13)
```html
<div style="background:#fff;border-left:6px solid #2D7D46;border-radius:0 10px 10px 0;
            padding:16px 18px;display:flex;flex-direction:column;
            box-shadow:0 2px 8px rgba(0,0,0,0.08),0 1px 3px rgba(0,0,0,0.05);">
  <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:10px;">
    <div style="display:flex;align-items:flex-start;gap:10px;">
      <div style="width:28px;height:28px;background:#C0504D;border-radius:5px;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;color:#fff;flex-shrink:0;">1</div>
      <div>
        <h3 style="font-size:14px;font-weight:700;margin:0 0 2px;">Priority Title</h3>
        <p style="font-size:11px;color:#9CA3AF;margin:0;">Owner: <strong style="color:#333333;">CRO</strong></p>
      </div>
    </div>
    <div style="display:flex;align-items:center;gap:5px;flex-shrink:0;">
      [calendar SVG 12px red]
      <span style="font-size:10px;font-weight:700;color:#C0504D;">Due: June 30</span>
    </div>
  </div>
  <p style="font-size:12px;color:#6B7280;line-height:1.55;margin:0 0 10px;">Description...</p>
  <div style="display:flex;gap:6px;flex-wrap:wrap;">
    <span style="background:#F3F4F6;color:#374151;font-size:10px;font-weight:700;padding:3px 10px;border-radius:999px;text-transform:uppercase;">Target: $26.5M</span>
    <span style="background:#FEE2E2;color:#991B1B;font-size:10px;font-weight:700;padding:3px 10px;border-radius:999px;text-transform:uppercase;">Gap: −$1.3M</span>
  </div>
</div>
<!-- P1/P2 badge: background:#C0504D | P3/P4 badge: background:#D97706 -->
```

### Decision Cards (Pattern 14)
```html
<div style="background:#fff;border-left:6px solid #333333;border-radius:0 10px 10px 0;
            padding:16px 18px;display:flex;flex-direction:column;
            box-shadow:0 2px 8px rgba(0,0,0,0.08),0 1px 3px rgba(0,0,0,0.05);">
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;">
    <div style="display:flex;align-items:flex-start;gap:10px;">
      [category SVG 20px #9CA3AF]
      <div>
        <h3 style="font-size:15px;font-weight:700;margin:0 0 2px;">Decision Title</h3>
        <p style="font-size:11px;color:#9CA3AF;margin:0;">Owners: CRO · CFO</p>
      </div>
    </div>
    <!-- Standard deadline: #FEE2E2 bg | URGENT deadline: #C0504D bg #fff text -->
    <span style="background:#FEE2E2;color:#991B1B;font-size:10px;font-weight:700;text-transform:uppercase;padding:3px 10px;border-radius:999px;white-space:nowrap;flex-shrink:0;">Due Apr 30</span>
  </div>
  <div style="background:#F0FDF4;border:1px solid #D1FAE5;display:flex;align-items:flex-start;gap:7px;padding:7px 10px;border-radius:6px;margin-bottom:5px;">
    <span style="font-weight:700;font-size:12px;color:#2D7D46;flex-shrink:0;width:18px;">B:</span>
    <p style="font-size:12px;font-weight:600;color:#2D7D46;margin:0;line-height:1.45;">Recommended option text</p>
    <span style="background:#2D7D46;color:#fff;font-size:9px;font-weight:700;padding:2px 6px;border-radius:3px;flex-shrink:0;margin-left:4px;align-self:flex-start;">REC</span>
  </div>
  <div style="background:#F9FAFB;display:flex;align-items:flex-start;gap:7px;padding:7px 10px;border-radius:6px;">
    <span style="font-weight:700;font-size:12px;color:#6B7280;flex-shrink:0;width:18px;">A:</span>
    <p style="font-size:12px;color:#4B5563;margin:0;line-height:1.45;">Alternative option text</p>
  </div>
  <div style="margin-top:8px;font-size:11px;color:#9CA3AF;line-height:1.5;">Context note.</div>
</div>
```

### Floating Card Table Rows (Pattern 8)
```html
<table style="width:100%;border-collapse:separate;border-spacing:0 8px;">
  <thead>
    <tr>
      <th style="text-align:left;padding:4px 18px;color:#9CA3AF;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Initiative</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="background:#fff;padding:12px 18px;font-size:13px;vertical-align:middle;
                 border-radius:8px 0 0 8px;box-shadow:0 1px 4px rgba(0,0,0,0.06);">
        Initiative Name
      </td>
      <td style="background:#fff;padding:12px 18px;font-size:13px;vertical-align:middle;
                 border-radius:0 8px 8px 0;box-shadow:0 1px 4px rgba(0,0,0,0.06);">
        Milestone
      </td>
    </tr>
  </tbody>
</table>
```

### Miss-Row Table Tinting
```html
<tr style="background:#FFF5F5;">
  <td style="padding:9px 14px;border-bottom:1px solid #FEE2E2;font-size:12px;">...</td>
</tr>
<tr style="background:#FFFDF0;">
  <td style="padding:9px 14px;border-bottom:1px solid #FEF3C7;font-size:12px;">...</td>
</tr>
```

### Mini Progress Bar
```html
<div style="display:flex;align-items:center;gap:6px;">
  <div style="flex:1;background:#E5E7EB;height:6px;border-radius:999px;overflow:hidden;">
    <div style="background:#2D7D46;height:6px;width:72%;border-radius:999px;"></div>
  </div>
  <span style="font-size:10px;font-weight:700;color:#2D7D46;width:30px;text-align:right;">72%</span>
</div>
<!-- Progress colors: complete=#2D7D46, in-progress=#3B82F6, at-risk=#C0504D, delayed=#9CA3AF -->
```

### Avatar Initials (overlapping — Decision footer)
```html
<div style="display:flex;align-items:center;">
  <div style="width:32px;height:32px;border-radius:50%;background:#2D7D46;border:2px solid #333333;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#fff;flex-shrink:0;">CRO</div>
  <div style="width:32px;height:32px;border-radius:50%;background:#9CA3AF;border:2px solid #333333;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#fff;flex-shrink:0;margin-left:-8px;">CFO</div>
  <div style="width:32px;height:32px;border-radius:50%;background:#4B5563;border:2px solid #333333;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#fff;flex-shrink:0;margin-left:-8px;">CTO</div>
</div>
```

---

## Footer Variants

### Light Footer (fallback)
```html
<footer style="flex-shrink:0;border-top:1px solid #E5E7EB;padding-top:10px;margin-top:10px;
               display:flex;justify-content:space-between;align-items:center;
               font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#9CA3AF;">
  <span>Q1 2026 Business Review</span>
  <span>Executive Confidential</span>
</footer>
```

### Dark Footer Bar (initiatives, decisions) — 12px radius + shadow
```html
<footer style="flex-shrink:0;background:#333333;color:#fff;border-radius:12px;
               padding:14px 22px;margin-top:10px;display:flex;align-items:center;
               justify-content:space-between;
               box-shadow:0 4px 12px rgba(0,0,0,0.15);">
  [content]
</footer>
```

### Callout Footer (preferred — most content slides)
```html
<footer style="flex-shrink:0;margin-top:10px;display:flex;align-items:center;justify-content:space-between;">
  <div style="border-left:4px solid #2D7D46;padding:8px 16px;background:#fff;
              border-radius:0 8px 8px 0;
              box-shadow:0 2px 8px rgba(0,0,0,0.06);">
    <p style="font-size:13px;color:#333333;font-weight:500;margin:0;line-height:1.5;">
      Key takeaway — <strong style="color:#2D7D46;">insight highlighted</strong> in accent.
    </p>
  </div>
  <span style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#9CA3AF;">Q1 2026 · Confidential</span>
</footer>
```

Use callout on Patterns 2, 4, 5, 12. Dark footer on Patterns 8, 11, 14. Light footer only as fallback.

---

## SVG Chart Recipes

**Chart selection decision tree:**
- Data has a time axis (years, quarters, months)? → **Line Chart**
- Data shows proportions, market share, or composition? → **Donut Chart**
- Data ranks items with text labels (countries, products, segments)? → **Horizontal Bar Chart**
- Everything else (categorical comparison, metrics) → **Bar Chart** (default)

Only these 4 chart types are supported. Generate the chart SVG/HTML directly in the slide content — there is no external chart renderer.

### 1. Bar Chart

**Height Calculation (CRITICAL):**
```
bar_height = (data_value / max_value) * chart_height_px

Example: max=$15M, value=$7.5M, chart_height=200px
  height = (7.5 / 15) * 200 = 100px  ← CORRECT
  height = 7.5px                      ← WRONG (never use raw values as pixels)
```

Always find max across all data points first. Y-axis: 4-5 gridlines from 0 to max with unit labels (B, M, K).

```html
<div style="position:relative;height:200px;display:flex;align-items:flex-end;gap:16px;padding-left:44px;">
  <!-- Y-axis labels -->
  <div style="position:absolute;left:0;top:0;bottom:0;display:flex;flex-direction:column;justify-content:space-between;">
    <span style="font-size:10px;color:#9CA3AF;font-family:Inter,sans-serif;">$15M</span>
    <span style="font-size:10px;color:#9CA3AF;font-family:Inter,sans-serif;">$10M</span>
    <span style="font-size:10px;color:#9CA3AF;font-family:Inter,sans-serif;">$5M</span>
    <span style="font-size:10px;color:#9CA3AF;font-family:Inter,sans-serif;">$0</span>
  </div>
  <!-- Gridlines -->
  <div style="position:absolute;left:40px;right:0;top:0;height:1px;background:#F3F4F6;"></div>
  <div style="position:absolute;left:40px;right:0;top:33%;height:1px;background:#F3F4F6;"></div>
  <div style="position:absolute;left:40px;right:0;top:66%;height:1px;background:#F3F4F6;"></div>
  <!-- Repeat this bar group per category -->
  <div style="display:flex;align-items:flex-end;gap:4px;flex:1;justify-content:center;position:relative;">
    <div style="width:18px;background:#E5E7EB;border-radius:3px 3px 0 0;height:100px;"></div>
    <div style="width:18px;background:#2D7D46;border-radius:3px 3px 0 0;height:150px;"></div>
    <div style="position:absolute;bottom:-20px;font-size:10px;color:#9CA3AF;text-align:center;width:100%;">2024</div>
  </div>
</div>
```

Bar colors: Primary = `#2D7D46`, Secondary/comparison = `#E5E7EB`, Negative/miss = `#C0504D`.

### 2. Donut Chart

**Math (CRITICAL — get this right):**
```
r=65, cx/cy=100, circumference = 2 * pi * 65 = 408.4
Segment X%: stroke-dasharray = "(X / 100) * 408.4, 408.4"
Offset = negative sum of ALL prior segment dasharray values
Rotation: transform="rotate(-90 100 100)" — starts from 12 o'clock
Stroke-width: 28
```

**ALWAYS use this flex layout — donut left, legend right:**
```html
<div style="display:flex;align-items:center;gap:32px;">
  <!-- Donut SVG — 200x200, larger and clearer -->
  <svg viewBox="0 0 200 200" width="200" height="200">
    <!-- Segment 1: 55% = 224.6, offset=0 -->
    <circle cx="100" cy="100" r="65" fill="none" stroke="#2D7D46" stroke-width="28"
      stroke-dasharray="224.6 408.4" stroke-dashoffset="0" transform="rotate(-90 100 100)"/>
    <!-- Segment 2: 25% = 102.1, offset=-224.6 -->
    <circle cx="100" cy="100" r="65" fill="none" stroke="#333333" stroke-width="28"
      stroke-dasharray="102.1 408.4" stroke-dashoffset="-224.6" transform="rotate(-90 100 100)"/>
    <!-- Segment 3: 20% = 81.7, offset=-326.7 -->
    <circle cx="100" cy="100" r="65" fill="none" stroke="#E5E7EB" stroke-width="28"
      stroke-dasharray="81.7 408.4" stroke-dashoffset="-326.7" transform="rotate(-90 100 100)"/>
    <!-- Center label -->
    <text x="100" y="94" text-anchor="middle" font-family="Inter,sans-serif" font-size="12" fill="#9CA3AF">Total</text>
    <text x="100" y="114" text-anchor="middle" font-family="Inter,sans-serif" font-size="24" font-weight="800" fill="#333333">$50M</text>
  </svg>
  <!-- Legend — ALWAYS include this, never skip -->
  <div style="display:flex;flex-direction:column;gap:12px;">
    <div style="display:flex;align-items:center;gap:10px;">
      <div style="width:12px;height:12px;border-radius:3px;background:#2D7D46;flex-shrink:0;"></div>
      <span style="font-size:14px;font-weight:600;color:#333333;">SaaS Revenue</span>
      <span style="font-size:14px;color:#9CA3AF;margin-left:auto;">55%</span>
    </div>
    <div style="display:flex;align-items:center;gap:10px;">
      <div style="width:12px;height:12px;border-radius:3px;background:#333333;flex-shrink:0;"></div>
      <span style="font-size:14px;font-weight:600;color:#333333;">Services</span>
      <span style="font-size:14px;color:#9CA3AF;margin-left:auto;">25%</span>
    </div>
    <div style="display:flex;align-items:center;gap:10px;">
      <div style="width:12px;height:12px;border-radius:3px;background:#E5E7EB;flex-shrink:0;"></div>
      <span style="font-size:14px;font-weight:600;color:#333333;">Other</span>
      <span style="font-size:14px;color:#9CA3AF;margin-left:auto;">20%</span>
    </div>
  </div>
</div>
```

Donut colors: Largest = `#2D7D46`, second = `#333333`, third = `#E5E7EB`. Max 4-5 segments — group small ones as "Other".

### 3. Line Chart

**Point Calculation:**
```
chart_width=500, chart_height=180, padding_left=44, padding_bottom=24
x = padding_left + index * (chart_width / (num_points - 1))
y = chart_height - (value / max_value) * (chart_height - padding_bottom)
```

```html
<div style="position:relative;height:200px;padding-left:44px;">
  <!-- Y-axis labels -->
  <div style="position:absolute;left:0;top:0;bottom:24px;display:flex;flex-direction:column;justify-content:space-between;">
    <span style="font-size:10px;color:#9CA3AF;">$20M</span>
    <span style="font-size:10px;color:#9CA3AF;">$10M</span>
    <span style="font-size:10px;color:#9CA3AF;">$0</span>
  </div>
  <!-- Gridlines -->
  <div style="position:absolute;left:40px;right:0;top:0;height:1px;background:#F3F4F6;"></div>
  <div style="position:absolute;left:40px;right:0;top:50%;height:1px;background:#F3F4F6;"></div>
  <!-- SVG line + dots -->
  <svg viewBox="0 0 520 180" width="100%" height="176" style="position:absolute;left:40px;top:0;">
    <polygon points="0,180 0,126 130,90 260,54 390,36 500,18 500,180"
      fill="#2D7D46" opacity="0.06"/>
    <polyline points="0,126 130,90 260,54 390,36 500,18"
      fill="none" stroke="#2D7D46" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="0" cy="126" r="4" fill="#2D7D46"/>
    <circle cx="130" cy="90" r="4" fill="#2D7D46"/>
    <circle cx="260" cy="54" r="4" fill="#2D7D46"/>
    <circle cx="390" cy="36" r="4" fill="#2D7D46"/>
    <circle cx="500" cy="18" r="4" fill="#2D7D46"/>
  </svg>
  <!-- X-axis labels -->
  <div style="position:absolute;bottom:0;left:44px;right:0;display:flex;justify-content:space-between;">
    <span style="font-size:10px;color:#9CA3AF;">2020</span>
    <span style="font-size:10px;color:#9CA3AF;">2021</span>
    <span style="font-size:10px;color:#9CA3AF;">2022</span>
    <span style="font-size:10px;color:#9CA3AF;">2023</span>
    <span style="font-size:10px;color:#9CA3AF;">2024</span>
  </div>
</div>
```

Line colors: Primary = `#2D7D46`, Secondary line = `#9CA3AF` (dashed: `stroke-dasharray="6,4"`).

### 4. Horizontal Bar Chart

**Width Calculation:** `bar_width = (value / max_value) * 100%`

```html
<div style="display:flex;flex-direction:column;gap:14px;">
  <!-- Repeat per item -->
  <div style="display:flex;align-items:center;gap:12px;">
    <span style="font-size:13px;font-weight:600;color:#333333;width:100px;text-align:right;flex-shrink:0;">Enterprise</span>
    <div style="flex:1;background:#F3F4F6;border-radius:6px;height:26px;overflow:hidden;">
      <div style="height:100%;width:85%;background:#2D7D46;border-radius:6px;display:flex;align-items:center;justify-content:flex-end;padding-right:8px;">
        <span style="font-size:11px;font-weight:700;color:#fff;">$42.5M</span>
      </div>
    </div>
  </div>
  <div style="display:flex;align-items:center;gap:12px;">
    <span style="font-size:13px;font-weight:600;color:#333333;width:100px;text-align:right;flex-shrink:0;">Mid-Market</span>
    <div style="flex:1;background:#F3F4F6;border-radius:6px;height:26px;overflow:hidden;">
      <div style="height:100%;width:52%;background:#2D7D46;border-radius:6px;display:flex;align-items:center;justify-content:flex-end;padding-right:8px;">
        <span style="font-size:11px;font-weight:700;color:#fff;">$26.0M</span>
      </div>
    </div>
  </div>
  <div style="display:flex;align-items:center;gap:12px;">
    <span style="font-size:13px;font-weight:600;color:#333333;width:100px;text-align:right;flex-shrink:0;">SMB</span>
    <div style="flex:1;background:#F3F4F6;border-radius:6px;height:26px;overflow:hidden;">
      <div style="height:100%;width:30%;background:#9CA3AF;border-radius:6px;display:flex;align-items:center;justify-content:flex-end;padding-right:8px;">
        <span style="font-size:11px;font-weight:700;color:#fff;">$15.0M</span>
      </div>
    </div>
  </div>
</div>
```

Bar colors: Top item = `#2D7D46`, remaining = `#9CA3AF`. Highlight a specific bar with `#2D7D46` to draw attention.

---

## Inline SVG Icon Reference

Always inline SVG. Never Font Awesome, Heroicons CDN, or any external icon library.

```html
<!-- Trophy/Win: -->
<svg viewBox="0 0 24 24" fill="none" stroke="#2D7D46" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="22" height="22"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg>

<!-- Rocket/Launch: -->
<svg viewBox="0 0 24 24" fill="none" stroke="#2D7D46" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="22" height="22"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>

<!-- Warning triangle: -->
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="13" height="13"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>

<!-- Shield/Mitigation: -->
<svg viewBox="0 0 24 24" fill="none" stroke="#2D7D46" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="11" height="11"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>

<!-- Check circle: -->
<svg viewBox="0 0 24 24" fill="none" stroke="#065F46" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="10" height="10"><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></svg>

<!-- X circle: -->
<svg viewBox="0 0 24 24" fill="none" stroke="#C0504D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="13" height="13"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>

<!-- Users/Team: -->
<svg viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>

<!-- Calendar: -->
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="12" height="12"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>

<!-- Activity/Chart line: -->
<svg viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="13" height="13"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>

<!-- Document: -->
<svg viewBox="0 0 24 24" fill="none" stroke="#333333" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="13" height="13"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>

<!-- Funnel/Filter: -->
<svg viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="13" height="13"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
```

---

## Dark Accent Panel Rule

Every content slide must have exactly ONE dark element (`#333333` background) anchoring visual hierarchy. This is how the eye finds the most important data on each slide.

| Slide | Dark element |
|---|---|
| Cover | Left panel background |
| Executive Summary | The most critical metric card promoted to dark bg |
| KPI Dashboard | One section card header promoted to dark bg |
| Revenue Trend | "Key Momentum" sidebar panel (darkest insight card) |
| Performance Breakdown | Net Revenue Gap callout bar |
| Wins | Bottom accent block on the quote row |
| Challenges | Missed Targets table dark header row |
| Initiatives | Dark footer bar |
| Financial | Income table header row |
| Unit Economics | Insight footer bar |
| Segment Performance | Dark insight column panel |
| Q2 Priorities | Enterprise pipeline dark panel |
| Decisions | Dark avatar footer bar |

---

## Combined File HTML Shell

```html
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;800&display=swap" rel="stylesheet">
<style>
html, body { margin: 0; padding: 0; background: #1a1a2e; }
* { box-sizing: border-box; }
.deck { display: flex; flex-direction: column; width: 1280px; margin: 0 auto; padding: 32px 0; }
.slide-wrapper { width: 1280px; margin-bottom: 32px; }
.slide-num { font-family: 'Inter', sans-serif; font-size: 11px; font-weight: 600;
             color: #4B5563; text-transform: uppercase; letter-spacing: 2px;
             margin-bottom: 8px; padding-left: 4px; }
.slide { width: 1280px; height: 720px; overflow: hidden; background: #F2F2F2;
         display: flex; flex-direction: column; font-family: 'Inter', sans-serif;
         color: #333333; padding: 34px 40px; position: relative; }
</style>
</head>
<body>
<div class="deck">

  <div class="slide-wrapper" style="margin-top:36px;">
    <div class="slide-num">01 · Cover</div>
    <div class="slide" style="padding:0;flex-direction:row;">
      [Pattern 1 — cover content]
    </div>
  </div>

  <div class="slide-wrapper" style="margin-top:36px;">
    <div class="slide-num">02 · Executive Summary</div>
    <div class="slide">
      <div style="position:absolute;left:0;top:0;bottom:0;width:4px;background:#2D7D46;z-index:10;"></div>
      [standard slide content]
    </div>
  </div>

</div>
</body>
</html>
```