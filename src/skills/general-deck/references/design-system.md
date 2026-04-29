# Design System Reference — Pitch Deck HTML Slides

Complete visual language for pitch deck and startup presentations. Every slide uses these values without deviation. Professional startup aesthetic: **Plus Jakarta Sans** (headings) + **DM Sans** (body), slate-900 dark panels, green accents.

---

## ⚠️ Critical Corrections (Read First)

These rules override any prior intuition. Derived from analysis of reference-quality pitch deck originals:

1. **Dark panels ALWAYS have a 3px green top bar** (`position:absolute;top:0;left:0;right:0;height:3px;background:#4ADE80`) — not optional. Without it, dark panels look like unmarked boxes floating on white.
2. **Hero stats on dark panels are 36-44px** — not 18-20px. The whole point of a dark panel is to make one number dominate. Small stats on dark backgrounds look lost.
3. **The 6px left accent stripe is on EVERY content slide** — never omit it. It's the visual signature of this design system.
4. **Horizontal padding is 56px on both sides** — not 40px or 48px. This creates the spacious, premium feel that separates a polished deck from a cramped one.
5. **Cover slide: image fades into white via 80px gradient** — not a hard edge. The fade creates visual continuity between the text and image halves.
6. **Standard Cards Row (3 identical cards) is the most generic layout** — use maximum 1-2 times per deck. If every slide is three cards in a row, the deck looks templated.
7. **Callout strips at the bottom always have a green left border** — never plain text floating at the bottom of a slide.
8. **One dark panel per slide maximum** — multiple dark panels compete for attention and create visual noise.
9. **Green accent text on dark panels is `#4ADE80`** — not `#15803D`. The lighter green provides sufficient contrast on slate-900 backgrounds. Using the darker green on dark backgrounds fails WCAG AA.
10. **Every content slide MUST have exactly one dark anchor element** — either a dark panel, dark stat band, dark footer, or synthesis bar. All-white slides look like unfinished drafts. The dark element creates visual weight and hierarchy.
11. **Slide title is 28px with `border-left:6px solid #15803D;padding-left:16px`** — this left-border echoes the 6px stripe and gives the title authority. Without it, the title floats without a visual anchor.
12. **Every white card gets a 3px green top accent bar** — `<div style="height:3px;background:var(--slide-accent);"></div>` as the first child inside the card. This adds visual richness and ties cards to the overall green accent system.
13. **Every feature/stat card must have 4 layers**: icon box + title + secondary metric box + description. Cards with only a title and description look flat and underdeveloped. The secondary metric box (green-tinted, 11px) adds the depth that separates premium from generic.

---

## Color Palette

| Role | Hex | Usage |
|---|---|---|
| Background | `#FFFFFF` | Slide background |
| Surface | `#F8FAFC` | Subtle step-up, section label backgrounds, icon boxes |
| Primary dark (slate-900) | `#0F172A` | Dark panels, hero blocks, stat bands |
| Secondary dark (slate-800) | `#1E293B` | Inner dark dividers, secondary dark elements |
| Accent (green-700) | `#15803D` | On light: labels, borders, accent text, left stripe |
| Accent on dark (green-400) | `#4ADE80` | On dark: accent text, numbers, top bars, indicators |
| Border | `#E2E8F0` | Card borders, dividers, table lines |
| Border subtle | `#F1F5F9` | Row dividers, inner section borders |
| Text primary | `#0F172A` | Headings, bold labels |
| Text body | `#475569` | Body text, descriptions |
| Text muted | `#64748B` | Secondary labels, subtitles |
| Text subtle | `#94A3B8` | Metadata, brand name, section labels |

### CSS Variable Mapping (CRITICAL — use these in all slide HTML)

Every color above has a corresponding CSS variable set by `set_theme`. **Always use the CSS variable in slide HTML, not the raw hex.** The hex values above are defaults — themes change them.

| Default Hex | CSS Variable | Where to use |
|---|---|---|
| `#FFFFFF` | `var(--slide-bg)` | Slide background, card backgrounds |
| `#0F172A` | `var(--slide-text)` | Headings, primary text |
| `#15803D` | `var(--slide-accent)` | On light: accents, stripes, borders, labels |
| `#475569` | `var(--slide-secondary)` | Body text, muted text |
| `#0F172A` | `var(--slide-dark)` | Dark panel backgrounds |
| `#4ADE80` | `var(--slide-accent-light)` | On dark: accent text, numbers, top bars |
| `#E2E8F0` | `var(--slide-border)` | Card borders, dividers, table lines |

**Hard-coded OK (don't change with theme):**
- Box-shadow rgba values
- Font imports
- `#F8FAFC` surface backgrounds (subtle, theme-neutral)
- `#94A3B8` metadata text (structural gray)
- `#1E293B` inner dark panel elements (derive from dark)

### Color Usage Rules

**On light backgrounds (#FFFFFF / #F8FAFC):**
- Headings: `#0F172A`
- Body text: `#475569`
- Borders: `#E2E8F0`
- Accent text/labels: `#15803D`
- Check marks, positive indicators: `#15803D`

**On dark panels (#0F172A):**
- Primary text: `#FFFFFF`
- Secondary text: `#94A3B8` or `#CBD5E1`
- Accent text/numbers: `#4ADE80`
- Internal dividers: `#1E293B`
- Accent bars/indicators: `#4ADE80`

**Never use:**
- Gradients on text or backgrounds
- Opacity-based hex like `#15803D15` (use `rgba()` or solid colors)
- More than two colors on any single element
- Radial background glows
- Tailwind utility classes (use pure inline CSS)

---

## Typography

**Dual font: Plus Jakarta Sans (headings) + DM Sans (body)**
Import: `https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=DM+Sans:wght@400;500;600&display=swap`

| Element | Font | Size | Weight | Color | Tracking |
|---|---|---|---|---|---|
| Cover title | Plus Jakarta | 48px | 800 | `#0F172A` | -1px |
| Slide title | Plus Jakarta | 28px | 800 | `#0F172A` | -0.5px, border-left:6px |
| Brand name | Plus Jakarta | 14px | 700 | `#94A3B8` | 2px (uppercase) |
| Panel title | Plus Jakarta | 13-14px | 700 | `#0F172A` | — |
| Hero stat (on dark) | Plus Jakarta | 36-44px | 800 | `#FFFFFF` | -1px |
| Hero stat (on light) | Plus Jakarta | 32-44px | 800 | `#0F172A` | -0.5px |
| Stat unit/suffix | Plus Jakarta | 16-20px | 600 | `#4ADE80` (dark) / `#15803D` (light) | — |
| Section label | DM Sans | 12px | 600 | `#15803D` | 2.5px (uppercase) |
| Header tag | DM Sans | 13px | 500 | `#64748B` | — |
| Body text | DM Sans | 13-14px | 400-500 | `#475569` | — |
| Detail/metadata | DM Sans | 11-12px | 500-600 | `#94A3B8` | — |

**Hard rules:**
- Never go below 11px for anything visible
- Headings: negative letter-spacing (-0.3px to -1px) for density
- Labels: positive letter-spacing (1.5-2.5px) with uppercase for distinction
- Bold = 700, Extra Bold = 800 — use 800 only for hero stats and slide titles
- Max line width for body text: ~500px
- Body text always has explicit `line-height: 1.5`

---

## Structural Constants

### Slide Container
```css
html, body { margin: 0; padding: 0; overflow: hidden; width: 1280px; height: 720px; }
* { box-sizing: border-box; }
.slide {
  width: 1280px; height: 720px; overflow: hidden;
  background: #FFFFFF; position: relative;
  display: flex; flex-direction: column;
  font-family: 'Plus Jakarta Sans', 'DM Sans', sans-serif;
  color: #0F172A;
}
/* Cover ONLY: no standard padding, uses its own asymmetric layout */
```

### Space Budget
| Element | Height |
|---|---|
| Header top padding | 32px |
| Header row (brand 14px + tag 13px) | ~18px |
| Header divider margin + 1px | ~21px |
| Section label + title + bottom gap | ~50px |
| Callout footer + margin | ~42px |
| Bottom padding | 24px |
| **Content zone (standard)** | **~533px** |
| **Content zone (no callout, light footer)** | **~555px** |

### Card Elevation — Apply to All White Cards
```css
/* Standard card */
box-shadow: 0 2px 8px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04);

/* Dark panel */
box-shadow: 0 4px 12px rgba(0,0,0,0.12);

/* Floating table rows — lighter */
box-shadow: 0 1px 4px rgba(0,0,0,0.05);
```

### Card Border Radius
```css
border-radius: 8px;   /* Standard: dark panels, light panels, cards */
border-radius: 10px;  /* Cover image area, large hero blocks */
border-radius: 6px;   /* Callout, icon boxes, secondary panels */
border-radius: 4px;   /* Badges, tags, small pills */
```

### Left Accent Stripe (6px — every content slide)
```html
<div style="position:absolute;left:0;top:0;bottom:0;width:6px;background:var(--slide-accent);z-index:2;"></div>
```

### Header Row
```html
<div style="padding:32px 56px 0 56px;display:flex;justify-content:space-between;align-items:flex-start;flex-shrink:0;">
  <span style="font-family:'Plus Jakarta Sans',sans-serif;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#94A3B8;">BRAND NAME</span>
  <span style="font-family:'DM Sans',sans-serif;font-size:13px;font-weight:500;color:#64748B;">Investor Pitch · 2026</span>
</div>
```

### Header Divider
```html
<div style="margin:20px 56px 0 56px;height:1px;background:#E2E8F0;"></div>
```

### Section Header
```html
<div style="padding:24px 56px 0 56px;flex-shrink:0;">
  <div style="font-family:'DM Sans',sans-serif;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:2.5px;color:var(--slide-accent);margin-bottom:10px;">SECTION LABEL</div>
  <h1 style="font-family:'Plus Jakarta Sans',sans-serif;font-size:28px;font-weight:800;letter-spacing:-0.5px;margin:0;color:#0F172A;border-left:6px solid #15803D;padding-left:16px;">Slide Title Here</h1>
</div>
```

The `border-left:6px solid #15803D` on h1 creates a strong visual anchor matching the left stripe. This is what gives business-grade decks their authoritative look. The 28px size (up from 24px) ensures the title commands the slide.

---

## Standard Slide Shell

Every content slide follows this structure. The cover slide (Pattern 1) uses its own layout.

```html
<div style="width:1280px;height:720px;overflow:hidden;background:var(--slide-bg);position:relative;display:flex;flex-direction:column;font-family:'Plus Jakarta Sans','DM Sans',sans-serif;color:var(--slide-text);">
  <!-- 6px left stripe -->
  <div style="position:absolute;left:0;top:0;bottom:0;width:6px;background:var(--slide-accent);z-index:2;"></div>

  <!-- Header -->
  <div style="padding:32px 56px 0 56px;display:flex;justify-content:space-between;align-items:flex-start;flex-shrink:0;">
    <span style="font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#94A3B8;">BRAND</span>
    <span style="font-size:13px;font-weight:500;color:var(--slide-secondary);">Investor Pitch · 2026</span>
  </div>

  <!-- Divider -->
  <div style="margin:20px 56px 0 56px;height:1px;background:var(--slide-border);"></div>

  <!-- Section + Title -->
  <div style="padding:24px 56px 0 56px;flex-shrink:0;">
    <div style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:2.5px;color:var(--slide-accent);margin-bottom:10px;">SECTION</div>
    <h1 style="font-size:28px;font-weight:800;letter-spacing:-0.5px;margin:0;border-left:6px solid var(--slide-accent);padding-left:16px;">Title</h1>
  </div>

  <!-- Content area — varies per layout pattern -->
  <div style="padding:24px 56px 0 56px;flex:1;min-height:0;display:flex;flex-direction:column;">
    [LAYOUT CONTENT — from layout-library.md]
  </div>

  <!-- Callout footer -->
  <div style="padding:0 56px 24px 56px;flex-shrink:0;">
    <div style="border-left:3px solid var(--slide-accent);padding:10px 18px;background:#F8FAFC;border-radius:0 6px 6px 0;">
      <p style="font-size:13px;color:var(--slide-secondary);font-weight:500;margin:0;line-height:1.5;">
        Key takeaway — <strong style="color:var(--slide-accent);">insight highlighted</strong> in accent.
      </p>
    </div>
  </div>
</div>
```

---

## Component Patterns

### Dark Panel (the most important component)

ONE per slide maximum. Always has 3px green top bar.

```html
<div style="background:var(--slide-dark);border-radius:8px;padding:20px 24px;position:relative;overflow:hidden;
            box-shadow:0 4px 12px rgba(0,0,0,0.12);">
  <!-- 3px green top bar — ALWAYS present -->
  <div style="position:absolute;top:0;left:0;right:0;height:3px;background:var(--slide-accent-light);"></div>

  <div style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:2.5px;color:#94A3B8;margin-bottom:12px;">LABEL</div>
  <div style="font-size:40px;font-weight:800;color:#FFFFFF;letter-spacing:-1px;margin-bottom:4px;">$25M</div>
  <div style="font-size:16px;font-weight:600;color:var(--slide-accent-light);">+127% YoY</div>
</div>
```

### Light Panel
```html
<div style="border:1px solid var(--slide-border);border-radius:8px;overflow:hidden;
            box-shadow:0 2px 8px rgba(0,0,0,0.06),0 1px 3px rgba(0,0,0,0.04);">
  <!-- Optional 3px accent top bar -->
  <div style="height:3px;background:var(--slide-accent);"></div>
  <div style="padding:18px 22px;">
    <h3 style="font-size:13px;font-weight:700;margin:0 0 8px;color:#0F172A;">Panel Title</h3>
    <p style="font-size:13px;color:#475569;line-height:1.5;margin:0;">Description text.</p>
  </div>
</div>
```

### Stat Cell (for dark stat bands)
```html
<!-- Inside a dark band, cells separated by vertical dividers -->
<div style="flex:1;text-align:center;padding:18px 0;">
  <div style="font-size:38px;font-weight:800;color:#FFFFFF;letter-spacing:-1px;margin-bottom:2px;">$8.2M</div>
  <div style="font-size:16px;font-weight:600;color:var(--slide-accent-light);margin-bottom:4px;">ARR</div>
  <div style="font-size:11px;color:#94A3B8;">+45% YoY</div>
</div>
<!-- Vertical divider between cells -->
<div style="width:1px;background:#1E293B;align-self:stretch;margin:12px 0;"></div>
```

### Callout Strip
```html
<div style="border-left:3px solid #15803D;padding:10px 18px;background:#F8FAFC;border-radius:0 6px 6px 0;">
  <p style="font-size:13px;color:#475569;font-weight:500;margin:0;line-height:1.5;">
    Key insight — <strong style="color:var(--slide-accent);">highlighted fact</strong> draws attention.
  </p>
</div>
```

### Icon Container (on light)
```html
<div style="width:32px;height:32px;border-radius:6px;display:flex;align-items:center;justify-content:center;background:#F8FAFC;border:1px solid var(--slide-border);">
  <svg viewBox="0 0 24 24" fill="none" stroke="var(--slide-accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="15" height="15">
    [icon path]
  </svg>
</div>
```

### Icon Container (on dark)
```html
<div style="width:36px;height:36px;border-radius:8px;display:flex;align-items:center;justify-content:center;background:#1E293B;">
  <svg viewBox="0 0 24 24" fill="none" stroke="var(--slide-accent-light)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="17" height="17">
    [icon path]
  </svg>
</div>
```

### Check Badge
```html
<div style="width:22px;height:22px;border-radius:5px;display:flex;align-items:center;justify-content:center;background:rgba(21,128,61,0.12);border:1px solid rgba(21,128,61,0.25);">
  <svg viewBox="0 0 24 24" fill="none" stroke="var(--slide-accent)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="12" height="12">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
</div>
```

### Numbered Badge
```html
<div style="width:26px;height:26px;border-radius:6px;display:flex;align-items:center;justify-content:center;background:var(--slide-dark);font-family:'Plus Jakarta Sans',sans-serif;font-size:12px;font-weight:800;color:var(--slide-accent-light);">01</div>
```

### Secondary Metric Box (MANDATORY inside feature/stat cards)

Every feature card, traction card, or stat card MUST include a secondary context box. Cards without these look hollow and underdeveloped.

```html
<!-- Green variant (positive context — inside white cards) -->
<div style="background:rgba(21,128,61,0.06);border-radius:6px;padding:7px 12px;margin-bottom:10px;">
  <div style="font-size:11px;color:var(--slide-accent);font-weight:600;">3-year contract · Enterprise vertical</div>
</div>

<!-- Neutral variant (supporting data) -->
<div style="background:#F8FAFC;border-radius:6px;padding:7px 12px;margin-bottom:10px;">
  <div style="font-size:11px;color:#475569;font-weight:600;">Launched Q3 2025 · 12 enterprise customers</div>
</div>

<!-- Dark variant (inside dark panels) -->
<div style="background:#1E293B;border-radius:6px;padding:7px 12px;margin-bottom:10px;">
  <div style="font-size:11px;color:var(--slide-accent-light);font-weight:600;">+127% QoQ · $2.4M pipeline</div>
</div>
```

---

## Header Badge Patterns

Status pills and badges in the header row signal slide context at a glance. Place them to the right of the header tag.

```html
<!-- Growth badge (green) -->
<span style="background:rgba(21,128,61,0.1);color:var(--slide-accent);padding:5px 14px;border-radius:4px;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;flex-shrink:0;">
  Series A · 2026
</span>

<!-- Metric highlight badge -->
<div style="display:flex;gap:8px;flex-shrink:0;">
  <span style="background:rgba(21,128,61,0.1);color:var(--slide-accent);font-size:11px;font-weight:700;padding:5px 13px;border-radius:4px;text-transform:uppercase;">ARR $8.2M</span>
  <span style="background:rgba(15,23,42,0.08);color:#0F172A;font-size:11px;font-weight:700;padding:5px 13px;border-radius:4px;text-transform:uppercase;">+127% YoY</span>
</div>

<!-- Warning/risk badge (amber) -->
<div style="background:#FEF3C7;color:#92400E;border:1px solid #F59E0B;padding:5px 16px;border-radius:999px;font-size:11px;font-weight:700;display:flex;align-items:center;gap:6px;flex-shrink:0;">
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="12" height="12"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
  EARLY STAGE
</div>
```

---

## Dark Panel Variants

Not all dark panels should look identical. Use these variants for visual variety across the deck:

| Variant | Background | Accent bar | Use when |
|---|---|---|---|
| Standard | `#0F172A` | `#4ADE80` 3px | Hero stats, key metrics |
| Deep | `#020617` (slate-950) | `#4ADE80` 3px | The Ask, closing thesis |
| Warm dark | `#1E293B` (slate-800) | `#4ADE80` 3px | Secondary panels, sidebar |

```html
<!-- Deep variant (for The Ask / closing) -->
<div style="background:#020617;border-radius:8px;padding:22px 26px;position:relative;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.2);">
  <div style="position:absolute;top:0;left:0;right:0;height:3px;background:var(--slide-accent-light);"></div>
  [content]
</div>

<!-- Warm dark variant (secondary panels) -->
<div style="background:#1E293B;border-radius:8px;padding:18px 22px;position:relative;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.1);">
  <div style="position:absolute;top:0;left:0;right:0;height:3px;background:var(--slide-accent-light);"></div>
  [content]
</div>
```

---

## Dark Panel Internal Structure (MANDATORY)

Every dark panel must follow this layered structure. Missing layers make panels look flat.

```html
<div style="background:var(--slide-dark);border-radius:8px;padding:22px 26px;position:relative;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 4px 12px rgba(0,0,0,0.12);">
  <!-- Layer 1: Accent bar (ALWAYS) -->
  <div style="position:absolute;top:0;left:0;right:0;height:3px;background:var(--slide-accent-light);"></div>

  <!-- Layer 2: Section label (uppercase, subtle) -->
  <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:2.5px;color:#94A3B8;margin-bottom:12px;">METRIC LABEL</div>

  <!-- Layer 3: Hero stat (36-44px, white) -->
  <div style="font-size:40px;font-weight:800;color:#FFFFFF;letter-spacing:-1px;margin-bottom:4px;">$25M</div>

  <!-- Layer 4: Accent descriptor (green) -->
  <div style="font-size:16px;font-weight:600;color:var(--slide-accent-light);margin-bottom:16px;">Total Addressable Market</div>

  <!-- Layer 5: Supporting KPIs (border-top divider, optional) -->
  <div style="display:flex;gap:20px;border-top:1px solid #1E293B;padding-top:14px;margin-top:auto;">
    <div>
      <div style="font-size:18px;font-weight:800;color:#FFFFFF;">$8B</div>
      <div style="font-size:10px;color:#94A3B8;margin-top:2px;">SAM</div>
    </div>
    <div>
      <div style="font-size:18px;font-weight:800;color:var(--slide-accent-light);">18%</div>
      <div style="font-size:10px;color:#94A3B8;margin-top:2px;">CAGR</div>
    </div>
  </div>

  <!-- Layer 6: Secondary metric box (optional) -->
  <div style="background:#1E293B;border-radius:6px;padding:7px 12px;margin-top:12px;">
    <div style="font-size:11px;color:var(--slide-accent-light);font-weight:600;">Growing 3x faster than market</div>
  </div>
</div>
```

Skip layers 5-6 when the panel is small or space-constrained. Never skip layers 1-4.

---

## Icon Placement Rules

Icons aren't decoration — they're visual anchors that guide the eye. Follow these placement rules:

1. **Every feature card**: Icon box (32x32) as the first element before the title
2. **Every dark panel**: Icon box (36x36, dark variant) next to or above the label
3. **Every section label**: 13px icon inline before the label text
4. **Every callout**: No icon (the green left border IS the visual anchor)
5. **Equation/integration banners**: Icon box inside each component node
6. **Timeline nodes**: Numbered circles replace icons

```html
<!-- Feature card with mandatory icon -->
<div style="border:1px solid var(--slide-border);border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06),0 1px 3px rgba(0,0,0,0.04);">
  <div style="height:3px;background:var(--slide-accent);"></div>
  <div style="padding:18px 22px;">
    <!-- Icon FIRST — always -->
    <div style="width:32px;height:32px;border-radius:6px;display:flex;align-items:center;justify-content:center;background:#F8FAFC;border:1px solid var(--slide-border);margin-bottom:12px;">
      <svg viewBox="0 0 24 24" fill="none" stroke="var(--slide-accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="15" height="15">[icon]</svg>
    </div>
    <!-- Title -->
    <h3 style="font-size:14px;font-weight:700;margin:0 0 6px;">Feature Title</h3>
    <!-- Secondary metric box (MANDATORY) -->
    <div style="background:rgba(21,128,61,0.06);border-radius:6px;padding:7px 12px;margin-bottom:8px;">
      <div style="font-size:11px;color:var(--slide-accent);font-weight:600;">Key stat or context</div>
    </div>
    <!-- Description -->
    <p style="font-size:13px;color:#475569;line-height:1.5;margin:0;">Body text.</p>
  </div>
</div>
```

White cards without both an icon AND a secondary metric box look incomplete. Always include both.

---

## Footer Variants

### Callout Footer (preferred — most content slides)
```html
<div style="padding:0 56px 24px 56px;flex-shrink:0;">
  <div style="border-left:3px solid #15803D;padding:10px 18px;background:#F8FAFC;border-radius:0 6px 6px 0;">
    <p style="font-size:13px;color:#475569;font-weight:500;margin:0;line-height:1.5;">
      Takeaway — <strong style="color:var(--slide-accent);">key insight</strong>.
    </p>
  </div>
</div>
```

### Light Footer (fallback)
```html
<div style="padding:0 56px 24px 56px;flex-shrink:0;">
  <div style="border-top:1px solid var(--slide-border);padding-top:10px;display:flex;justify-content:space-between;align-items:center;">
    <span style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#94A3B8;">Company Name</span>
    <span style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#94A3B8;">Confidential</span>
  </div>
</div>
```

### Dark Footer Bar (closing/CTA slides)
```html
<div style="padding:0 56px 24px 56px;flex-shrink:0;">
  <div style="background:var(--slide-dark);border-radius:8px;padding:14px 22px;position:relative;overflow:hidden;display:flex;align-items:center;justify-content:space-between;box-shadow:0 4px 12px rgba(0,0,0,0.12);">
    <div style="position:absolute;top:0;left:0;right:0;height:3px;background:var(--slide-accent-light);"></div>
    [dark footer content — quote, contact info, etc.]
  </div>
</div>
```

### Per-Pattern Footer Assignment

| Pattern | Footer Type | Why |
|---|---|---|
| 1 (Cover) | None | Cover has its own attribution |
| 2 (Stat Band) | Callout | Summarize what stats mean |
| 3 (Cards Row) | Callout | "So what" for the three features |
| 4 (Hero Block) | Callout | Contextualize the dominant metric |
| 5 (Equation) | Callout | What the combination enables |
| 6 (Comparison) | Callout | Your key advantage |
| 7 (Before/After) | Callout | Quantify the transformation |
| 8 (Pillars) | Dark footer (synthesis bar replaces) | Already built into pattern |
| 9 (Integration) | Callout | Platform thesis |
| 10 (Traction) | Callout | Why this matters for investors |
| 11 (Checklist + Panels) | Callout | Key takeaway |
| 12 (Chart) | Callout | Financial thesis statement |
| 13 (The Ask) | Callout | Why this is the right moment |
| 14 (Sector Grid) | Callout | Market positioning |
| 15 (Growth Bars) | Light footer | Clean close to projections |
| 16 (Closing CTA) | Dark footer (thesis panel replaces) | Already built into pattern |

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
    <span style="font-size:10px;color:#94A3B8;font-family:'DM Sans',sans-serif;">$15M</span>
    <span style="font-size:10px;color:#94A3B8;font-family:'DM Sans',sans-serif;">$10M</span>
    <span style="font-size:10px;color:#94A3B8;font-family:'DM Sans',sans-serif;">$5M</span>
    <span style="font-size:10px;color:#94A3B8;font-family:'DM Sans',sans-serif;">$0</span>
  </div>
  <!-- Gridlines -->
  <div style="position:absolute;left:40px;right:0;top:0;height:1px;background:#F1F5F9;"></div>
  <div style="position:absolute;left:40px;right:0;top:33%;height:1px;background:#F1F5F9;"></div>
  <div style="position:absolute;left:40px;right:0;top:66%;height:1px;background:#F1F5F9;"></div>
  <!-- Repeat this bar group per category -->
  <div style="display:flex;align-items:flex-end;gap:4px;flex:1;justify-content:center;position:relative;">
    <div style="width:18px;background:#E2E8F0;border-radius:3px 3px 0 0;height:100px;"></div>
    <div style="width:18px;background:var(--slide-accent);border-radius:3px 3px 0 0;height:150px;"></div>
    <div style="position:absolute;bottom:-20px;font-size:10px;color:#94A3B8;text-align:center;width:100%;">2024</div>
  </div>
</div>
```

Bar colors: Primary = `var(--slide-accent)`, Secondary/comparison = `#E2E8F0`, Negative = `#EF4444`.

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
  <!-- Donut SVG — 200x200, larger and clearer than old 130x130 -->
  <svg viewBox="0 0 200 200" width="200" height="200">
    <!-- Segment 1: 55% = 224.6, offset=0 -->
    <circle cx="100" cy="100" r="65" fill="none" stroke="var(--slide-accent)" stroke-width="28"
      stroke-dasharray="224.6 408.4" stroke-dashoffset="0" transform="rotate(-90 100 100)"/>
    <!-- Segment 2: 25% = 102.1, offset=-224.6 -->
    <circle cx="100" cy="100" r="65" fill="none" stroke="#0F172A" stroke-width="28"
      stroke-dasharray="102.1 408.4" stroke-dashoffset="-224.6" transform="rotate(-90 100 100)"/>
    <!-- Segment 3: 20% = 81.7, offset=-326.7 -->
    <circle cx="100" cy="100" r="65" fill="none" stroke="#E2E8F0" stroke-width="28"
      stroke-dasharray="81.7 408.4" stroke-dashoffset="-326.7" transform="rotate(-90 100 100)"/>
    <!-- Center label -->
    <text x="100" y="94" text-anchor="middle" font-family="DM Sans,sans-serif" font-size="12" fill="#94A3B8">Total</text>
    <text x="100" y="114" text-anchor="middle" font-family="Plus Jakarta Sans,sans-serif" font-size="24" font-weight="800" fill="#0F172A">$50M</text>
  </svg>
  <!-- Legend — ALWAYS include this, never skip -->
  <div style="display:flex;flex-direction:column;gap:12px;">
    <div style="display:flex;align-items:center;gap:10px;">
      <div style="width:12px;height:12px;border-radius:3px;background:var(--slide-accent);flex-shrink:0;"></div>
      <span style="font-size:14px;font-weight:600;color:#0F172A;">SaaS Revenue</span>
      <span style="font-size:14px;color:#94A3B8;margin-left:auto;">55%</span>
    </div>
    <div style="display:flex;align-items:center;gap:10px;">
      <div style="width:12px;height:12px;border-radius:3px;background:#0F172A;flex-shrink:0;"></div>
      <span style="font-size:14px;font-weight:600;color:#0F172A;">Services</span>
      <span style="font-size:14px;color:#94A3B8;margin-left:auto;">25%</span>
    </div>
    <div style="display:flex;align-items:center;gap:10px;">
      <div style="width:12px;height:12px;border-radius:3px;background:#E2E8F0;flex-shrink:0;"></div>
      <span style="font-size:14px;font-weight:600;color:#0F172A;">Other</span>
      <span style="font-size:14px;color:#94A3B8;margin-left:auto;">20%</span>
    </div>
  </div>
</div>
```

Donut colors: Use `var(--slide-accent)` for largest segment, `#0F172A` for second, `#E2E8F0` for third. Max 4-5 segments — if more, group small ones as "Other".

### 3. Line Chart

**Point Calculation:**
```
chart_width=500, chart_height=180, padding_left=44, padding_bottom=24
x = padding_left + index * (chart_width / (num_points - 1))
y = chart_height - (value / max_value) * (chart_height - padding_bottom)

Example: 5 data points, max=$20M, point[2]=$12M
  x = 44 + 2 * (500 / 4) = 294
  y = 180 - (12/20) * 156 = 86.4
```

```html
<div style="position:relative;height:200px;padding-left:44px;">
  <!-- Y-axis labels -->
  <div style="position:absolute;left:0;top:0;bottom:24px;display:flex;flex-direction:column;justify-content:space-between;">
    <span style="font-size:10px;color:#94A3B8;">$20M</span>
    <span style="font-size:10px;color:#94A3B8;">$10M</span>
    <span style="font-size:10px;color:#94A3B8;">$0</span>
  </div>
  <!-- Gridlines -->
  <div style="position:absolute;left:40px;right:0;top:0;height:1px;background:#F1F5F9;"></div>
  <div style="position:absolute;left:40px;right:0;top:50%;height:1px;background:#F1F5F9;"></div>
  <!-- SVG line + dots -->
  <svg viewBox="0 0 520 180" width="100%" height="176" style="position:absolute;left:40px;top:0;">
    <!-- Area fill (optional — subtle gradient under the line) -->
    <polygon points="0,180 0,126 130,90 260,54 390,36 500,18 500,180"
      fill="var(--slide-accent)" opacity="0.06"/>
    <!-- Line -->
    <polyline points="0,126 130,90 260,54 390,36 500,18"
      fill="none" stroke="var(--slide-accent)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    <!-- Data point dots -->
    <circle cx="0" cy="126" r="4" fill="var(--slide-accent)"/>
    <circle cx="130" cy="90" r="4" fill="var(--slide-accent)"/>
    <circle cx="260" cy="54" r="4" fill="var(--slide-accent)"/>
    <circle cx="390" cy="36" r="4" fill="var(--slide-accent)"/>
    <circle cx="500" cy="18" r="4" fill="var(--slide-accent)"/>
  </svg>
  <!-- X-axis labels -->
  <div style="position:absolute;bottom:0;left:44px;right:0;display:flex;justify-content:space-between;">
    <span style="font-size:10px;color:#94A3B8;">2020</span>
    <span style="font-size:10px;color:#94A3B8;">2021</span>
    <span style="font-size:10px;color:#94A3B8;">2022</span>
    <span style="font-size:10px;color:#94A3B8;">2023</span>
    <span style="font-size:10px;color:#94A3B8;">2024</span>
  </div>
</div>
```

Line colors: Primary = `var(--slide-accent)`, Secondary line = `#94A3B8` (dashed: `stroke-dasharray="6,4"`).

### 4. Horizontal Bar Chart

**Width Calculation:** `bar_width = (value / max_value) * 100%`

```html
<div style="display:flex;flex-direction:column;gap:14px;">
  <!-- Repeat per item -->
  <div style="display:flex;align-items:center;gap:12px;">
    <span style="font-size:13px;font-weight:600;color:#0F172A;width:100px;text-align:right;flex-shrink:0;">United States</span>
    <div style="flex:1;background:#F1F5F9;border-radius:6px;height:26px;overflow:hidden;">
      <div style="height:100%;width:85%;background:var(--slide-accent);border-radius:6px;display:flex;align-items:center;justify-content:flex-end;padding-right:8px;">
        <span style="font-size:11px;font-weight:700;color:#FFFFFF;">$42.5M</span>
      </div>
    </div>
  </div>
  <div style="display:flex;align-items:center;gap:12px;">
    <span style="font-size:13px;font-weight:600;color:#0F172A;width:100px;text-align:right;flex-shrink:0;">Europe</span>
    <div style="flex:1;background:#F1F5F9;border-radius:6px;height:26px;overflow:hidden;">
      <div style="height:100%;width:52%;background:var(--slide-accent);border-radius:6px;display:flex;align-items:center;justify-content:flex-end;padding-right:8px;">
        <span style="font-size:11px;font-weight:700;color:#FFFFFF;">$26.0M</span>
      </div>
    </div>
  </div>
  <div style="display:flex;align-items:center;gap:12px;">
    <span style="font-size:13px;font-weight:600;color:#0F172A;width:100px;text-align:right;flex-shrink:0;">APAC</span>
    <div style="flex:1;background:#F1F5F9;border-radius:6px;height:26px;overflow:hidden;">
      <div style="height:100%;width:30%;background:#94A3B8;border-radius:6px;display:flex;align-items:center;justify-content:flex-end;padding-right:8px;">
        <span style="font-size:11px;font-weight:700;color:#FFFFFF;">$15.0M</span>
      </div>
    </div>
  </div>
</div>
```

Bar colors: Top item = `var(--slide-accent)`, remaining = `#94A3B8`. Highlight a specific bar with `var(--slide-accent)` to draw attention.

---

## SVG Icons

Always use inline SVGs with `viewBox="0 0 24 24"`, `fill="none"`, `stroke="currentColor"`, `stroke-linecap="round"`, `stroke-linejoin="round"`. Never use external icon libraries.

```html
<!-- Checkmark -->
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>

<!-- Globe -->
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>

<!-- Shield -->
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>

<!-- Target -->
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>

<!-- Trending Up -->
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>

<!-- Dollar -->
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>

<!-- Users -->
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>

<!-- Zap -->
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>

<!-- Trophy -->
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg>

<!-- Rocket -->
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>

<!-- Layers -->
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z"/><path d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12"/><path d="M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17"/></svg>

<!-- Mail -->
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"/><rect x="2" y="4" width="20" height="16" rx="2"/></svg>

<!-- Bar chart -->
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>

<!-- Award -->
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>

<!-- Map Pin -->
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>

<!-- Server -->
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="8" x="2" y="2" rx="2" ry="2"/><rect width="20" height="8" x="2" y="14" rx="2" ry="2"/></svg>

<!-- Arrow Right -->
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
```

