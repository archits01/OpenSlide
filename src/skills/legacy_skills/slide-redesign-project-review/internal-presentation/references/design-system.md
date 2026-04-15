# Design System — Engineering HTML Slide Deck Builder

Complete visual language for technical/engineering presentation decks. Every slide uses these values. Never deviate.

---

## ⚠️ Critical Corrections (Read First)

Derived from forensic analysis of reference-quality Skyworks engineering originals:

1. **Task/action cards use `border-radius: 2px`** — NOT 4px or 6px. The ultra-tight radius signals technical precision. Any rounder and it looks like a marketing deck.
2. **Dark boxes (analysis panels, timelines) use `border-radius: 6px`** — NOT 4px. Rounder than task cards, visually distinct.
3. **The CSS shell must include `.code-inline`, `.info-panel`, `.section-label`, and `.avatar`** — these components appear on nearly every slide but are missing from most drafts.
4. **Owner badge is MANDATORY on every task card** — not optional. Every task must show who owns it.
5. **Task cards are always 4 layers**: icon → title+owner → description with `<code>` → metadata row. If any layer is missing, the card looks incomplete.
6. **Incident slides drop bottom padding** (`padding:34px 40px 0`) so the dark footer bar reaches the slide edge flush.
7. **Incident dark footers use `border-radius:4px 4px 0 0`** — rounded top, flat bottom.
8. **Neutral info panels use gray dashed border** (`border:1px dashed var(--slide-border)`) — distinct from the red dashed `.failure` marker.
9. **Matrix improved rows**: `background:rgba(220,252,231,0.2)`, lowered rows: `background:rgba(254,226,226,0.2)`.
10. **Section labels above content columns** always use JetBrains Mono + small SVG icon + `#A0AEC0` color.

---

## CSS Variable Mapping (CRITICAL — use these in all slide HTML)

Every color below has a corresponding CSS variable set by `set_theme`. **Always use the CSS variable in slide HTML, not the raw hex.** The hex values are defaults — themes change them.

| Default Hex | CSS Variable | Where to use |
|---|---|---|
| `#F8F9FA` | `var(--slide-bg)` | Slide background |
| `#1A202C` | `var(--slide-text)` | Headings, primary text |
| `#D35400` | `var(--slide-accent)` | On light: accent, warnings, high-priority |
| `#4A5568` | `var(--slide-secondary)` | Body text, descriptions |
| `#1A202C` | `var(--slide-dark)` | Dark panels, terminal blocks, headers |
| `#D35400` | `var(--slide-accent-light)` | On dark: accent indicators |
| `#E2E8F0` | `var(--slide-border)` | Card borders, dividers, table lines |

**Hard-coded OK (don't change with theme):** box-shadow rgba values, font imports, semantic status colors (`#27AE60` success, `#C0392B` critical, `#D69E2E` warning), `#A0AEC0` metadata text, `#F1F5F9` code backgrounds.

---

## Color Palette

| Role | Hex | Usage |
|---|---|---|
| Background | `#F8F9FA` | Slide background (near-white, slightly cool) |
| Surface | `#FFFFFF` | Card/panel backgrounds |
| Primary dark | `#1A202C` | Headers, dark panels, terminal blocks, thick borders |
| Accent (orange) | `#D35400` | Primary accent — warnings, high-priority indicators |
| Success / OK | `#27AE60` | Deployed states, resolved incidents, positive metrics |
| Critical / Error | `#C0392B` | Critical bugs, failure states, error indicators |
| Warning / High | `#D69E2E` | Amber warnings, at-risk states |
| Border | `#E2E8F0` | Card borders, dividers, table lines |
| Code bg | `#F1F5F9` | Inline code background, owner badges |
| Text primary | `#1A202C` | Headings, bold labels |
| Text body | `#4A5568` | Body text, descriptions |
| Text muted | `#64748B` | Secondary body text, owner badge text |
| Text subtle | `#A0AEC0` | Metadata, timestamps, mono labels, section labels |
| Terminal background | `#1A202C` | Dark code/terminal blocks |
| Terminal green | `#68D391` | OK status in terminal output |
| Terminal yellow | `#F6E05E` | WARN status in terminal output |
| Failure bg | `rgba(192,57,43,0.04)` | Light red tint for failure panels |

### Color Usage Rules

**On light backgrounds (`#F8F9FA` / `#FFFFFF`):**
- Headings: `#1A202C`
- Body text: `#4A5568`
- Muted/meta: `#64748B` or `#A0AEC0`
- Borders: `var(--slide-border)`

**On dark backgrounds (`#1A202C`):**
- Primary text: `var(--slide-border)`
- Muted text: `#718096` or `#4A5568`
- Timeline labels (mono): `#718096`
- Terminal output: `#68D391` (green), `#F6E05E` (yellow)

**Status pills/badges:**
- Deployed/Resolved: `#DCFCE7` bg, `#166534` text
- In Review / In Progress: `#FEF3C7` bg, `#92400E` text
- Open / Error: `#FEE2E2` bg, `#991B1B` text
- Scheduled: `#EFF6FF` bg, `#1D4ED8` text

---

## Typography

| Element | Font | Size | Weight | Color | Notes |
|---|---|---|---|---|---|
| Cover title | Inter | 60–64px | 700 | `#1A202C` | `letter-spacing:-2px` |
| Cover title accent | Inter | 60–64px | 700 | `#D35400` | Part of title |
| Slide title (h1) | Inter | 28px | 700 | `#1A202C` | `letter-spacing:-0.5px` |
| Section subtitle (p) | JetBrains Mono | 11px | 400–500 | `#718096` | Uppercase, `letter-spacing:2px` |
| Header badge | JetBrains Mono | 11px | 700 | varies | Small colored bg |
| Task card title (h3) | Inter | 15px | 700 | `#1A202C` | Main task title |
| Action card title | Inter | 13px | 700 | `#1A202C` | Smaller action items |
| Body text | Inter | 12–13px | 400 | `#4A5568` | `line-height:1.5` |
| Section label | JetBrains Mono | 10px | 700 | `#A0AEC0` | Uppercase, `letter-spacing:1px` |
| Owner badge | JetBrains Mono | 10px | 500 | `#64748B` | `background:#F1F5F9`, `border-radius:3px` |
| Inline code | JetBrains Mono | 11px | 400 | `#C0392B` | `background:#F1F5F9`, `border-radius:2px` |
| Deadline label | JetBrains Mono | 10px | 400 | `#A0AEC0` | Always mono |
| Status label | JetBrains Mono | 10px | 500–700 | varies | Mono, colored |
| Terminal text | JetBrains Mono | 11–12px | 400 | `#68D391` | Dark bg |
| Protocol tag | JetBrains Mono | 10–11px | 700 | `#4A5568` | `background:#EDF2F7`, uppercase |

**Rules:**
- Never below **11px** for any visible text
- **JetBrains Mono** for: file paths, timestamps, status labels, owner badges, section labels, protocol tags, code, terminal output, ALL metadata
- **Inter** for: headings, body descriptions, metric values, card titles
- Slide titles use `Inter 28px 700` with `letter-spacing:-0.5px`

---

## Structural Constants

### Standard Slide Container
```css
html, body { margin: 0; padding: 0; overflow: hidden; width: 1280px; height: 720px; }
* { box-sizing: border-box; }
.slide {
  width: 1280px; height: 720px; overflow: hidden;
  background: var(--slide-bg, #F8F9FA);
  display: flex; flex-direction: column;
  font-family: 'Inter', sans-serif; color: var(--slide-text, #1A202C);
  padding: 36px 40px;
}
```

### Incident/Footer-Flush Variant (bottom padding = 0)
```css
.slide { padding: 34px 40px 0; }
/* Used on incident slides so dark footer reaches slide edge exactly */
```

### Space Budget (standard — 36px padding)
| Element | Height |
|---|---|
| Padding top | 36px |
| Standard header (h1+subtitle+border+margin) | ~80px |
| Bottom padding | 36px |
| Standard footer | ~44px (with margin) |
| **Content zone** | **~524px** |

### Space Budget (footer-flush — 34px top, 0px bottom)
| Element | Height |
|---|---|
| Padding top | 34px |
| Header | ~76px |
| Dark footer (flush) | ~52px + 10px margin |
| **Content zone** | **~548px** |

### NO Left Accent Stripe
Engineering slides have **no left accent stripe**. The visual anchor is the `border-bottom: 2px solid var(--slide-dark, #1A202C)` header border. This is a fundamental aesthetic difference from the business deck.

---

## Standard Header
```html
<header class="slide-header">
  <div class="slide-title-block">
    <h1>Action Items: Performance Mitigation</h1>
    <p class="slide-subtitle">Execution Roadmap: Post-Incident Remediation</p>
  </div>
  <div style="display:flex;align-items:center;gap:8px;">
    <span style="font-size:11px;font-weight:700;text-transform:uppercase;color:#A0AEC0;">Status:</span>
    <span class="badge-amber">IN PROGRESS</span>
  </div>
</header>
```

---

## Combined File HTML Shell

```html
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>

/* DECK SHELL */
html, body { margin: 0; padding: 0; background: #0f1623; }
* { box-sizing: border-box; }
.deck { width: 1280px; margin: 0 auto; padding: 32px 0; }
.slide-wrapper { margin-bottom: 24px; }
.slide-num { font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 600;
             color: #334155; letter-spacing: 1.5px; text-transform: uppercase;
             margin-bottom: 8px; padding-left: 4px; }

/* SLIDE RESET */
.slide { width: 1280px; height: 720px; overflow: hidden; background: #F8F9FA;
         display: flex; flex-direction: column; font-family: 'Inter', sans-serif;
         color: #1A202C; padding: 36px 40px; }

/* TYPOGRAPHY */
.mono { font-family: 'JetBrains Mono', monospace; }

/* STANDARD HEADER */
.slide-header { border-bottom: 2px solid #1A202C; padding-bottom: 12px;
                display: flex; justify-content: space-between; align-items: flex-end;
                flex-shrink: 0; margin-bottom: 18px; }
.slide-title-block h1 { font-size: 28px; font-weight: 700; letter-spacing: -0.5px; margin: 0 0 2px; }
.slide-subtitle { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #718096;
                  text-transform: uppercase; letter-spacing: 2px; margin: 0; }

/* HEADER BADGES */
.badge-green  { font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 700;
                background: #27AE60; color: #fff; padding: 3px 10px; border-radius: 3px; }
.badge-red    { background: #FEE2E2; color: #991B1B; font-family: 'JetBrains Mono', monospace;
                font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 3px; }
.badge-amber  { background: #FEF3C7; color: #92400E; font-family: 'JetBrains Mono', monospace;
                font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 3px; }
.badge-gray   { background: var(--slide-border); color: #4A5568; font-family: 'JetBrains Mono', monospace;
                font-size: 11px; padding: 3px 8px; border-radius: 3px; }

/* PROTOCOL TAGS */
.ptag { font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 700;
        padding: 2px 8px; border-radius: 3px; background: #EDF2F7; color: #4A5568;
        text-transform: uppercase; display: inline-block; }

/* FAILURE / INFO PANEL BORDERS */
.failure   { border: 1px dashed #C0392B !important; background: rgba(192,57,43,0.04) !important; }
.info-panel { border: 1px dashed var(--slide-border); border-radius: 4px; background: #fff; }
/* Use .failure for error/broken states. Use .info-panel for success criteria, neutral info boxes. */

/* INLINE CODE */
code, .code-inline {
  font-family: 'JetBrains Mono', monospace;
  background: #F1F5F9;
  padding: 1px 5px;
  border-radius: 2px;
  font-size: 11px;
  color: #1A202C;
}

/* CARD PATTERNS */
/* General white card with border */
.card { background: #fff; border: 1px solid var(--slide-border); border-radius: 4px; }

/* TASK CARDS (border-radius: 2px — engineering precision) */
.task-card {
  background: #fff;
  border: 1px solid var(--slide-border);
  border-left: 4px solid #2D3436;   /* default: near-black */
  border-radius: 2px;               /* NOT 4px — this is intentional */
  padding: 14px 16px;
  display: flex;
  gap: 16px;
  align-items: flex-start;
}
.task-card-r { border-left-color: #C0392B; }   /* red: critical/blocking */
.task-card-o { border-left-color: #D35400; }   /* orange: high-priority */
.task-card-g { border-left-color: #CBD5E0; }   /* gray: low-priority/recurring */
.task-card-gr { border-left-color: #27AE60; }  /* green: complete/good */

/* ACTION CARDS (Pattern 15 — smaller version of task card) */
.action-card {
  background: #fff;
  border: 1px solid var(--slide-border);
  border-left: 4px solid #2D3436;
  border-radius: 2px;
  padding: 10px 14px;
}

/* OWNER BADGE (mandatory on every task card) */
.owner-badge {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  font-weight: 500;
  background: #F1F5F9;
  color: #64748B;
  padding: 2px 8px;
  border-radius: 3px;
  flex-shrink: 0;
}

/* SECTION LABEL (above content columns — mono uppercase with icon) */
.section-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  font-weight: 700;
  color: #A0AEC0;
  text-transform: uppercase;
  letter-spacing: 1px;
  flex-shrink: 0;
}

/* STEP NUMBER BADGE */
.step-num { background: #1A202C; color: #fff; width: 22px; height: 22px;
            border-radius: 50%; display: flex; align-items: center; justify-content: center;
            font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 700;
            flex-shrink: 0; }

/* STATUS PILLS */
.s-deployed { font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 700;
              text-transform: uppercase; padding: 2px 8px; border-radius: 3px;
              background: #DCFCE7; color: #166534; }
.s-review   { background: #FEF3C7; color: #92400E; font-family: 'JetBrains Mono', monospace;
              font-size: 10px; font-weight: 700; text-transform: uppercase; padding: 2px 8px; border-radius: 3px; }
.s-open     { background: #FEE2E2; color: #991B1B; font-family: 'JetBrains Mono', monospace;
              font-size: 10px; font-weight: 700; text-transform: uppercase; padding: 2px 8px; border-radius: 3px; }
.s-sched    { background: #EFF6FF; color: #1D4ED8; font-family: 'JetBrains Mono', monospace;
              font-size: 10px; font-weight: 700; text-transform: uppercase; padding: 2px 8px; border-radius: 3px; }

/* DARK BOX — border-radius: 6px (NOT 4px) */
.dark-box { background: #1A202C; color: #fff; border-radius: 6px; padding: 18px; flex-shrink: 0; }

/* AVATAR (engineering style — small, mono font, gray bg) */
.avatar {
  width: 26px; height: 26px;
  border-radius: 50%;
  background: var(--slide-border);
  display: flex; align-items: center; justify-content: center;
  font-size: 10px; font-weight: 700; color: #4A5568;
  flex-shrink: 0;
  font-family: 'JetBrains Mono', monospace;
}

/* META BOX (incident cards — duration/impact metrics) */
.meta-box { background: var(--slide-bg); padding: 10px 12px; border-radius: 3px; }

/* INCIDENT CARDS */
.inc-card { background: #fff; border-left: 4px solid #C0392B; padding: 16px 18px;
            display: flex; flex-direction: column; flex: 1; }
.inc-card-o { border-left-color: #D35400; }

/* FOOTER */
.slide-footer { flex-shrink: 0; border-top: 1px solid var(--slide-border); padding-top: 10px; margin-top: 10px;
                display: flex; justify-content: space-between; align-items: center;
                font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #A0AEC0; }

/* INCIDENT DARK FOOTER — border-radius: 4px 4px 0 0 (flat bottom = flush to slide edge) */
.incident-footer {
  background: #1A202C; color: #fff;
  padding: 14px 20px;
  display: flex; align-items: center; gap: 24px;
  flex-shrink: 0; margin-top: 10px;
  border-radius: 4px 4px 0 0;   /* flat bottom — extends to slide edge */
}

/* MATRIX TABLE */
.matrix-row { display: grid; border-bottom: 1px solid #F1F5F9; padding: 12px 18px; align-items: center; }
.matrix-row:last-child { border-bottom: none; }
/* Direction-based row tints */
.matrix-improved { background: rgba(220,252,231,0.2); }
.matrix-lowered  { background: rgba(254,226,226,0.2); }
/* neutral rows: no background */

/* PRIORITY TABLE ROWS */
.prow { border-bottom: 1px solid #F1F5F9; }
.prow:nth-child(even) { background: #FBFBFC; }
.prow:last-child { border-bottom: none; }

/* SPRINT GOAL BANNER */
.sprint-goal {
  padding: 12px 16px;
  background: rgba(39,174,96,0.05);
  border: 1px solid rgba(39,174,96,0.2);
  border-radius: 4px;
  display: flex; align-items: center; gap: 16px;
  margin-bottom: 14px; flex-shrink: 0;
}
.sprint-goal-icon {
  background: #27AE60; color: #fff;
  padding: 10px; border-radius: 4px; flex-shrink: 0;
}

/* LAYOUT UTILITIES */
.flex-1 { flex: 1; min-width: 0; }
.min-h-0 { min-height: 0; }
.flex-col { display: flex; flex-direction: column; }
.flex-shrink-0 { flex-shrink: 0; }

/* LAYOUT-SPECIFIC CSS — add per pattern from layout-library.md */

</style>
</head>
<body>
<div class="deck">

  <!-- STANDARD SLIDE TEMPLATE:
  <div class="slide-wrapper">
    <div class="slide-num">01 · Cover</div>
    <div class="slide">
      <header class="slide-header">
        <div class="slide-title-block">
          <h1>Slide Title</h1>
          <p class="slide-subtitle">MONO SUBTITLE UPPERCASE</p>
        </div>
        <span class="badge-green">STATUS: OK</span>
      </header>
      [LAYOUT CONTENT — see layout-library.md]
      <footer class="slide-footer">
        <span class="mono">Ref: ADR-XXX</span>
        <span class="mono">Confidential - Engineering Internal</span>
      </footer>
    </div>
  </div>
  -->

  <!-- INCIDENT SLIDE TEMPLATE (bottom padding = 0):
  <div class="slide-wrapper">
    <div class="slide-num">13 · Incident Post-Mortems</div>
    <div class="slide" style="padding:34px 40px 0;">
      <header class="slide-header">...</header>
      [INCIDENT CARD GRID]
      <div class="incident-footer">
        [3-col mitigation grid]
      </div>
    </div>
  </div>
  -->

</div>
</body>
</html>
```

---

## Component Patterns

### Task Card — 4-Layer Anatomy (MANDATORY STRUCTURE)

Every task card has exactly 4 layers. Missing any layer = incomplete card.

```html
<div class="task-card">
  <!-- LAYER 1: Domain SVG icon — 20px, color matches left border, flex-shrink:0, margin-top:2px -->
  <svg viewBox="0 0 24 24" fill="none" stroke="var(--slide-secondary)" stroke-width="2"
       stroke-linecap="round" stroke-linejoin="round" width="20" height="20"
       style="flex-shrink:0;margin-top:2px;">
    [icon paths]
  </svg>

  <!-- Card body -->
  <div style="flex:1;">
    <!-- LAYER 2: Title row — title LEFT, owner badge RIGHT — always flex justify-content:space-between -->
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
      <h3 style="font-size:15px;font-weight:700;margin:0;">Confirm Index Coverage</h3>
      <span class="owner-badge">DBA</span>   <!-- MANDATORY — never omit -->
    </div>

    <!-- LAYER 3: Description — 12px Inter, color:#64748B, line-height:1.5 -->
    <!-- May include <code> for technical terms -->
    <p style="font-size:12px;color:#64748B;margin:0 0 8px;line-height:1.5;">
      Audit all profile queries to ensure composite index
      <code>(user_id, last_login)</code>
      is utilized across all shards.
    </p>

    <!-- LAYER 4: Metadata row — calendar icon + deadline + status indicator -->
    <!-- All text in JetBrains Mono, font-size:10px -->
    <div style="display:flex;align-items:center;gap:16px;">
      <!-- Deadline: calendar SVG (11px, #A0AEC0) + date text -->
      <div style="display:flex;align-items:center;gap:5px;" class="mono">
        [calendar svg 11px]
        <span style="font-size:10px;color:#A0AEC0;">Deadline: Apr 07</span>
      </div>
      <!-- Status: contextual icon + status text -->
      <div style="display:flex;align-items:center;gap:5px;">
        [check svg 11px green]
        <span class="mono" style="font-size:10px;color:#27AE60;">Scheduled</span>
      </div>
      <!-- OR for in-progress: -->
      <span class="mono" style="font-size:10px;color:#D35400;">In Development</span>
      <!-- OR for recurring: -->
      <span class="mono" style="font-size:10px;color:#A0AEC0;">∞ Recurring</span>
    </div>
  </div>
</div>
```

### Section Label (above content columns)

```html
<!-- With list icon: -->
<div class="section-label">
  <svg viewBox="0 0 24 24" fill="none" stroke="var(--slide-secondary)" stroke-width="2"
       stroke-linecap="round" stroke-linejoin="round" width="13" height="13">
    <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
    <line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/>
    <line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
  Priority Backlog
</div>

<!-- With arrow icon: -->
<div class="section-label">
  <svg viewBox="0 0 24 24" fill="none" stroke="var(--slide-secondary)" stroke-width="2"
       stroke-linecap="round" stroke-linejoin="round" width="13" height="13">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
  Immediate Follow-ups
</div>
```

### Vertical Timeline (inside dark box)

```html
<div class="dark-box" style="flex:1;">
  <div class="mono" style="font-size:10px;color:#4A5568;text-transform:uppercase;margin-bottom:20px;">
    Implementation Timeline
  </div>
  <!-- Container: position:relative is REQUIRED for the absolute-positioned dots -->
  <div style="border-left:1px solid rgba(255,255,255,0.08);padding-left:20px;
              display:flex;flex-direction:column;gap:28px;position:relative;">

    <!-- Timeline item -->
    <div style="display:flex;gap:12px;align-items:flex-start;">
      <!-- Dot: position:absolute;left:-7px (half of 12px dot = 7px offset from the 1px line) -->
      <div style="width:12px;height:12px;border-radius:50%;background:#fff;
                  flex-shrink:0;margin-top:2px;position:absolute;left:-7px;"></div>
      <div>
        <div class="mono" style="font-size:10px;color:#718096;">APR 07</div>
        <div style="font-size:13px;font-weight:700;color:#fff;">Index Audit Finish</div>
      </div>
    </div>

    <!-- In-progress dot: amber -->
    <div style="display:flex;gap:12px;align-items:flex-start;">
      <div style="width:12px;height:12px;border-radius:50%;background:#F59E0B;
                  flex-shrink:0;margin-top:2px;position:absolute;left:-7px;"></div>
      <div>
        <div class="mono" style="font-size:10px;color:#718096;">APR 10</div>
        <div style="font-size:13px;font-weight:700;color:#fff;">Cache Strategy Rollout</div>
      </div>
    </div>

    <!-- Upcoming dot: gray -->
    <div style="display:flex;gap:12px;align-items:flex-start;">
      <div style="width:12px;height:12px;border-radius:50%;background:#4A5568;
                  flex-shrink:0;margin-top:2px;position:absolute;left:-7px;"></div>
      <div>
        <div class="mono" style="font-size:10px;color:#718096;">ONGOING</div>
        <div style="font-size:13px;font-weight:700;color:#fff;">Ops Monitoring Phase</div>
      </div>
    </div>

  </div>
</div>
```

**Timeline dot color guide:**
- `#fff` — complete
- `#F59E0B` — in progress / pending
- `#4A5568` — upcoming / not started
- `#27AE60` — resolved / done

### Info Panel (neutral dashed — gray border)

```html
<!-- For success criteria, targets, non-critical information -->
<div class="info-panel" style="padding:16px;">
  <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
    [info circle svg 13px #A0AEC0]
    <span class="mono" style="font-size:10px;font-weight:700;text-transform:uppercase;color:#4A5568;">
      Success Metrics
    </span>
  </div>
  <div style="display:flex;flex-direction:column;gap:10px;">
    <div style="display:flex;align-items:flex-start;gap:8px;">
      <span style="color:#27AE60;font-size:14px;flex-shrink:0;line-height:1.2;">●</span>
      <span style="font-size:12px;color:#4A5568;">Target p95 latency: <strong>&lt;150ms</strong></span>
    </div>
  </div>
</div>
```

### Horizontal Timeline (incident cards)

```html
<div style="position:relative;height:56px;margin-bottom:12px;flex-shrink:0;">
  <!-- Timeline track line -->
  <div style="position:absolute;top:10px;left:6px;right:6px;height:2px;background:#FECACA;"></div>
  <!-- Red = auth incident, Orange (#FFEDD5) = payment incident -->

  <!-- Dot 1 (left — detection) -->
  <div style="position:absolute;top:4px;left:0;width:12px;height:12px;border-radius:50%;background:#C0392B;"></div>
  <div style="position:absolute;top:22px;left:0;text-align:left;">
    <div class="mono" style="font-size:10px;color:#718096;white-space:nowrap;">09:15 AM</div>
    <div style="font-size:9px;font-weight:700;color:var(--slide-secondary);text-transform:uppercase;">Detected</div>
  </div>

  <!-- Dot 2 (center — peak) — slightly larger -->
  <div style="position:absolute;top:2px;left:calc(50% - 8px);width:16px;height:16px;border-radius:50%;background:#9B1C1C;"></div>
  <div style="position:absolute;top:22px;left:calc(50%);transform:translateX(-50%);text-align:center;">
    <div class="mono" style="font-size:10px;color:#C0392B;white-space:nowrap;">09:30 AM</div>
    <div style="font-size:9px;font-weight:700;color:#C0392B;text-transform:uppercase;">Peak Impact</div>
  </div>

  <!-- Dot 3 (right — resolved) — green -->
  <div style="position:absolute;top:4px;right:0;width:12px;height:12px;border-radius:50%;background:#27AE60;"></div>
  <div style="position:absolute;top:22px;right:0;text-align:right;">
    <div class="mono" style="font-size:10px;color:#27AE60;white-space:nowrap;">09:45 AM</div>
    <div style="font-size:9px;font-weight:700;color:#27AE60;text-transform:uppercase;">Resolved</div>
  </div>
</div>
```

**Timeline track color by incident type:**
- Auth/Red incident: `background:#FECACA`
- Payment/Orange incident: `background:#FFEDD5`
- Neutral: `background:var(--slide-border)`

### Resolution Card (inside incident card)

```html
<div style="background:#F0FFF4;border:1px solid #C6F6D5;padding:10px 12px;border-radius:4px;margin-top:auto;">
  <div class="mono" style="font-size:10px;font-weight:700;text-transform:uppercase;color:#276749;margin-bottom:4px;">
    Resolution Strategy
  </div>
  <p style="font-size:11px;color:#2F855A;margin:0;line-height:1.5;">
    Rolled back to stable version; implemented <strong>Circuit Breaker</strong> & fallback auth mechanism.
  </p>
</div>
```

---

## SVG Chart Recipes

### Donut Chart
```
r=48, center=(75,75), circumference=2π×48=301.59
Segment X%: stroke-dasharray="X*3.0159, 301.59"
Next segment offset: stroke-dashoffset="-sum_of_prior_dasharray_values"
Both: transform="rotate(-90 75 75)"
stroke-width: 16–18px
viewBox: "0 0 150 150"
```

### Terminal Block (JSON/code output)
```html
<div style="background:#1A202C;border-radius:6px;padding:16px;font-family:'JetBrains Mono',monospace;font-size:12px;line-height:1.7;">
  <div style="color:#68D391;">✓ All checks passed</div>
  <div style="color:#F6E05E;">⚠ Warning: 2 items pending review</div>
  <div style="color:var(--slide-border);">Total: 15 items processed</div>
</div>
```

### Progress Bar
```html
<div style="background:var(--slide-border);height:6px;border-radius:999px;overflow:hidden;">
  <div style="width:[N]%;height:6px;background:#27AE60;border-radius:999px;"></div>
</div>
```

### Mini Bar Chart (SVG)
```
viewBox: 0 0 200 130
Y baseline: y=110, chart height=80
Scale = chart_height / value_range
Bars: fill=#2D7D46 (good), fill=#C0392B (bad/latest negative)
Dashed reference line for benchmarks
```

---

## SVG Icon Reference

Always inline SVG. Never Font Awesome, Heroicons CDN, or any external icon library.

```html
<!-- Database -->
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3"/></svg>

<!-- Bolt/Cache/Speed -->
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>

<!-- Activity/Monitoring -->
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>

<!-- Shield/Auth -->
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>

<!-- CPU/Infrastructure -->
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><rect x="6" y="6" width="12" height="12" rx="1"/><line x1="9" y1="3" x2="9" y2="6"/><line x1="15" y1="3" x2="15" y2="6"/><line x1="9" y1="18" x2="9" y2="21"/><line x1="15" y1="18" x2="15" y2="21"/><line x1="3" y1="9" x2="6" y2="9"/><line x1="3" y1="15" x2="6" y2="15"/><line x1="18" y1="9" x2="21" y2="9"/><line x1="18" y1="15" x2="21" y2="15"/></svg>

<!-- Shuffle/Kafka/Events -->
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/></svg>

<!-- Warning Triangle -->
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="13" height="13"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>

<!-- Calendar (11px for metadata rows) -->
<svg viewBox="0 0 24 24" fill="none" stroke="#A0AEC0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="11" height="11"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>

<!-- Check circle (11px for scheduled status) -->
<svg viewBox="0 0 24 24" fill="none" stroke="#27AE60" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="11" height="11"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>

<!-- Clock (11px for recurring) -->
<svg viewBox="0 0 24 24" fill="none" stroke="#A0AEC0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="11" height="11"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>

<!-- Route/API Gateway -->
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><circle cx="5" cy="12" r="2"/><circle cx="19" cy="5" r="2"/><circle cx="19" cy="19" r="2"/><line x1="7" y1="11" x2="17" y2="6"/><line x1="7" y1="13" x2="17" y2="18"/></svg>

<!-- Target/Sprint -->
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>

<!-- Rotate-left/Rollback -->
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="13" height="13"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>

<!-- List (section label) -->
<svg viewBox="0 0 24 24" fill="none" stroke="var(--slide-secondary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="13" height="13"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>

<!-- Arrow right (section label) -->
<svg viewBox="0 0 24 24" fill="none" stroke="var(--slide-secondary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="13" height="13"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>

<!-- Info circle -->
<svg viewBox="0 0 24 24" fill="none" stroke="#A0AEC0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="13" height="13"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
```

---

## Critical Rules

1. `html, body` must always have `margin:0; padding:0; overflow:hidden`
2. Every `.slide` is exactly **1280×720px** with `overflow:hidden`
3. **No left accent stripe** — the visual anchor is `border-bottom:2px solid #1A202C` on the header
4. **No Tailwind CSS** — pure CSS only
5. **No Font Awesome / external icon libs** — inline SVG paths only
6. **No echarts, chart.js, or JS chart libs** — CSS bars or SVG only
7. **No compress-body** — never use `transform:scale()`
8. **No external images** — geometric shapes or text-based indicators only
9. JetBrains Mono is **essential** for ALL metadata, labels, paths, status text — non-negotiable
10. Cover is the **only** exception to the standard header/border structure
11. Dark boxes use `border-radius:6px` — task cards use `border-radius:2px` — never swap these
12. Failure panels use `border:1px dashed #C0392B` — info panels use `border:1px dashed var(--slide-border)` — never use solid red borders
13. **Every task card must have an owner badge** — no exceptions
14. Incident slides use `padding:34px 40px 0` — incident dark footers use `border-radius:4px 4px 0 0`