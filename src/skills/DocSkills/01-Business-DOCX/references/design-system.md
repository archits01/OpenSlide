# Design System — Business Document Pages (816×1056px Portrait)

Complete visual language for professional business documents rendered as HTML pages. SOPs, proposals, reports, memos, handbooks, meeting minutes, cover letters. Every page uses these values without deviation. Clean corporate aesthetic: **Inter only**, no monospace, no decorative elements.

---

## Brand Color Override

The hex values below are **fallback defaults**. For branded documents (e.g., "Create an SOP for Spotify"):
- Set `--page-accent` and `--page-accent-light` in the page's `<style>` block to the brand's colors
- Example: `<style>:root { --page-accent: #1DB954; --page-accent-light: rgba(29,185,84,0.08); }</style>`
- All templates below use CSS vars with fallbacks — brand colors will override automatically
- **Never hardcode `#1B5E7D` directly** — always use `var(--page-accent)` or `var(--page-accent, #1B5E7D)`

---

## ⚠️ Critical Rules (Read First)

1. **Pages are 816×1056px** — US Letter portrait ratio. Not 1280×720. Not A4. Every page is exactly this size.
2. **Page padding is `48px 56px`** — generous margins. Documents need breathing room. Never less than 40px.
3. **Body text is 13px with `line-height: 1.7`** — documents are read closely, not projected. Tighter leading than slides but still generous.
4. **No dark panels or dark backgrounds** — documents are printed. Dark panels waste ink and look wrong on paper. Use borders, rules, and whitespace for hierarchy instead.
5. **Accent color is used sparingly** — only on section borders, heading left-borders, and status indicators. The page should be 95% black/gray text on white.
6. **Tables are the primary data display** — not cards. Documents use proper tables with headers, rows, borders. Cards are for slides.
7. **Headers and footers repeat on every page** — document name, page number, confidentiality. Consistent across the entire document.
8. **Cover page is the ONLY page with special layout** — all content pages follow the same structural grid.
9. **No decorative elements above or below headings** — no pill badges, no colored underlines, no spacer bars. The section heading is ALWAYS: `border-left:5px solid` h1 + subtitle paragraph. Nothing else.
10. **Vertical space budget: ~846px of content per page** — total height 1056px minus 96px padding minus ~64px header/footer minus ~50px heading. If content exceeds this, split into two pages. Never overflow.

---

## CSS Variable Mapping

| Default Hex | CSS Variable | Where to use |
|---|---|---|
| `#FFFFFF` | `var(--page-bg)` | Page background |
| `#1A1A1A` | `var(--page-text)` | Headings, primary text |
| `#1B5E7D` | `var(--page-accent)` | Section borders, heading accents, links |
| `#E8F1F8` | `var(--page-accent-light)` | Callout backgrounds, info panel backgrounds |
| `#4B5563` | `var(--page-secondary)` | Body text |
| `#6B7280` | `var(--page-muted)` | Captions, metadata, labels |
| `#9CA3AF` | `var(--page-subtle)` | Timestamps, fine print, watermarks |
| `#E5E7EB` | `var(--page-border)` | Table borders, horizontal rules, dividers |
| `#F3F4F6` | `var(--page-surface)` | Alternate table rows, callout backgrounds, info boxes |
| `#F9FAFB` | `var(--page-bg-alt)` | Subtle background tint for sections |

**Hard-coded (don't theme):** status reds `#C0504D`, ambers `#D97706`, greens `#2D7D46`, box-shadow values.

---

## Color Palette

| Role | Hex | Usage |
|---|---|---|
| Background | `#FFFFFF` | Page background — always white (printable) |
| Text primary | `#1A1A1A` | Headings, bold labels, key data |
| Text body | `#4B5563` | Paragraphs, descriptions, table cells |
| Text muted | `#6B7280` | Subtitles, secondary labels |
| Text subtle | `#9CA3AF` | Metadata, timestamps, footer text |
| Accent | `#1B5E7D` | Heading left-border, section accent, links |
| Accent light | `#E8F1F8` | Callout box backgrounds, info panels |
| Border | `#E5E7EB` | Table borders, horizontal rules, card outlines |
| Surface | `#F3F4F6` | Alternate table rows, metadata boxes |
| Surface light | `#F9FAFB` | Subtle section backgrounds |
| Status green | `#2D7D46` | Completed, approved, on-track |
| Status red | `#C0504D` | Overdue, critical, rejected |
| Status amber | `#D97706` | At-risk, pending, warning |

### Status Colors — Text and Badge Only

| Status | Text | Badge bg | Badge text |
|---|---|---|---|
| Critical / Overdue | `#C0504D` | `#FEE2E2` | `#991B1B` |
| Warning / Pending | `#D97706` | `#FEF3C7` | `#92400E` |
| Good / Complete | `#2D7D46` | `#D1FAE5` | `#065F46` |
| Neutral / Info | `#6B7280` | `#F3F4F6` | `#374151` |

---

## Typography

**Single font: Inter only.**
Import: `https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap`

| Element | Size | Weight | Color | Notes |
|---|---|---|---|---|
| Cover title | 36–42px | 800 | `#1A1A1A` | `letter-spacing: -1px` |
| Cover subtitle | 16px | 300 | `#6B7280` | Below title |
| Page h1 (section heading) | 22px | 700 | `#1A1A1A` | With left border accent |
| Page h2 (subsection) | 16px | 700 | `#1A1A1A` | |
| Page h3 (minor heading) | 14px | 600 | `#374151` | |
| Body text | 13px | 400 | `#4B5563` | `line-height: 1.7` always |
| Body text emphasis | 13px | 600 | `#1A1A1A` | For inline bold |
| Table header | 11px | 700 | `#6B7280` | `text-transform: uppercase; letter-spacing: 0.8px` |
| Table cell | 12px | 400 | `#4B5563` | `line-height: 1.5` |
| Metadata label | 11px | 600 | `#9CA3AF` | `text-transform: uppercase; letter-spacing: 1px` |
| Metadata value | 12px | 500 | `#374151` | |
| Checklist item | 13px | 400 | `#4B5563` | With checkbox prefix |
| Numbered step | 13px | 400 | `#4B5563` | With step number circle |
| Footer text | 9px | 600 | `#9CA3AF` | `text-transform: uppercase; letter-spacing: 1.5px` |
| Page number | 10px | 600 | `#9CA3AF` | Right-aligned in footer |
| Callout text | 13px | 500 | `var(--page-accent, #1B5E7D)` | Inside accent-bordered box |

**Hard rules:**
- Never below 9px (footer only at 9px; everything else ≥ 11px)
- Body text ALWAYS has explicit `line-height: 1.7`
- Table cells ALWAYS have explicit `line-height: 1.5`
- Uppercase labels ALWAYS have `letter-spacing ≥ 0.8px`

---

## Structural Constants

### Page Container
```css
html, body { margin: 0; padding: 0; overflow: hidden; width: 816px; height: 1056px; }
* { box-sizing: border-box; }
.page {
  width: 816px; height: 1056px; overflow: hidden;
  background: var(--page-bg, #FFFFFF);
  font-family: 'Inter', sans-serif;
  color: var(--page-text, #1A1A1A);
  padding: 48px 56px;
  display: flex; flex-direction: column;
  position: relative;
}
/* Cover ONLY: different padding, centered layout */
```

### Space Budget (per page)
| Element | Height |
|---|---|
| Padding top + bottom (48px each) | 96px |
| Header bar (doc title + page number) | ~28px + 12px margin |
| Section heading (h1 22px + gap) | ~36px |
| Footer (confidential + page num) | ~24px + 12px margin |
| **Content zone** | **~848px** |

### Horizontal Rules
```html
<!-- Section divider — used between major sections on same page -->
<div style="height: 1px; background: #E5E7EB; margin: 24px 0;"></div>

<!-- Heavy divider — used below cover page metadata -->
<div style="height: 3px; background: var(--page-accent, #1B5E7D); margin: 20px 0; width: 60px;"></div>

<!-- Subtle divider — between subsections -->
<div style="height: 1px; background: #F3F4F6; margin: 16px 0;"></div>
```

### Section Heading (h1) — Every Content Page
```html
<h1 style="font-size: 22px; font-weight: 700; color: #1A1A1A;
           border-left: 5px solid var(--page-accent, #1B5E7D);
           padding-left: 14px; margin: 0 0 6px;">
  Section Title
</h1>
<p style="font-size: 13px; font-weight: 300; color: #6B7280;
          margin: 0 0 20px; padding-left: 19px;">
  Brief description of this section's purpose.
</p>
```

### Subsection Heading (h2)
```html
<h2 style="font-size: 16px; font-weight: 700; color: #1A1A1A;
           margin: 24px 0 10px; padding-bottom: 6px;
           border-bottom: 1px solid #E5E7EB;">
  Subsection Title
</h2>
```

---

## Component Patterns

### Metadata Table (Cover Page + Document Properties)
```html
<table style="border-collapse: collapse; width: 380px; margin-top: 24px;">
  <tbody>
    <tr>
      <td style="padding: 8px 14px; font-size: 11px; font-weight: 600; color: #9CA3AF;
                 text-transform: uppercase; letter-spacing: 0.8px; width: 140px;
                 background: #F9FAFB; border: 1px solid #E5E7EB;">
        Document ID
      </td>
      <td style="padding: 8px 14px; font-size: 12px; font-weight: 500; color: #374151;
                 border: 1px solid #E5E7EB;">
        SOP-HR-OB-2026-001
      </td>
    </tr>
  </tbody>
</table>
```

### Data Table (Standard — Most Common Component)
```html
<table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
  <thead>
    <tr style="border-bottom: 2px solid #E5E7EB;">
      <th style="padding: 10px 14px; font-size: 11px; font-weight: 700;
                 text-transform: uppercase; letter-spacing: 0.8px; color: #6B7280;
                 text-align: left;">
        Column Header
      </th>
    </tr>
  </thead>
  <tbody>
    <!-- Alternate row backgrounds: #FFFFFF / #F9FAFB -->
    <tr style="background: #FFFFFF; border-bottom: 1px solid #F3F4F6;">
      <td style="padding: 10px 14px; font-size: 12px; color: #4B5563;
                 line-height: 1.5; vertical-align: top;">
        Cell content
      </td>
    </tr>
    <tr style="background: #F9FAFB; border-bottom: 1px solid #F3F4F6;">
      <td style="padding: 10px 14px; font-size: 12px; color: #4B5563;
                 line-height: 1.5; vertical-align: top;">
        Cell content
      </td>
    </tr>
  </tbody>
</table>
```

### Numbered Step Block
```html
<div style="display: flex; gap: 14px; align-items: flex-start; margin-bottom: 18px;">
  <div style="width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0;
              background: var(--page-accent, #1B5E7D); color: #fff; font-size: 13px; font-weight: 700;
              display: flex; align-items: center; justify-content: center;">
    1
  </div>
  <div style="flex: 1; padding-top: 3px;">
    <h3 style="font-size: 14px; font-weight: 600; color: #1A1A1A; margin: 0 0 4px;">
      Step Title
    </h3>
    <p style="font-size: 13px; color: #4B5563; line-height: 1.7; margin: 0;">
      Step description with enough detail to follow without asking questions.
    </p>
  </div>
</div>
```

### Checklist Item
```html
<div style="display: flex; gap: 10px; align-items: flex-start; padding: 8px 0;
            border-bottom: 1px solid #F3F4F6;">
  <div style="width: 18px; height: 18px; border: 2px solid #D1D5DB; border-radius: 3px;
              flex-shrink: 0; margin-top: 1px;"></div>
  <span style="font-size: 13px; color: #4B5563; line-height: 1.5;">
    Checklist item description — actionable and specific.
  </span>
</div>
```

### Callout Box (Info / Warning / Success)
```html
<!-- Info callout -->
<div style="background: var(--page-accent-light, #E8F1F8); border-left: 4px solid var(--page-accent, #1B5E7D);
            border-radius: 0 6px 6px 0; padding: 14px 18px; margin: 16px 0;">
  <p style="font-size: 13px; font-weight: 500; color: var(--page-accent, #1B5E7D);
            line-height: 1.6; margin: 0;">
    <strong>Note:</strong> Important information the reader should be aware of.
  </p>
</div>

<!-- Warning callout -->
<div style="background: #FEF3C7; border-left: 4px solid #D97706;
            border-radius: 0 6px 6px 0; padding: 14px 18px; margin: 16px 0;">
  <p style="font-size: 13px; font-weight: 500; color: #92400E;
            line-height: 1.6; margin: 0;">
    <strong>Warning:</strong> This action cannot be undone.
  </p>
</div>

<!-- Critical callout -->
<div style="background: #FEE2E2; border-left: 4px solid #C0504D;
            border-radius: 0 6px 6px 0; padding: 14px 18px; margin: 16px 0;">
  <p style="font-size: 13px; font-weight: 500; color: #991B1B;
            line-height: 1.6; margin: 0;">
    <strong>Critical:</strong> Compliance requirement — must be completed before Day 1.
  </p>
</div>
```

### Bold Label + Value (Inline Metadata)
```html
<p style="font-size: 13px; color: #4B5563; line-height: 1.7; margin: 0 0 8px;">
  <strong style="color: #1A1A1A;">Owner:</strong> HR Operations
</p>
<p style="font-size: 13px; color: #4B5563; line-height: 1.7; margin: 0 0 8px;">
  <strong style="color: #1A1A1A;">Duration:</strong> 45 minutes
</p>
<p style="font-size: 13px; color: #4B5563; line-height: 1.7; margin: 0 0 8px;">
  <strong style="color: #1A1A1A;">Verification:</strong> Automated provisioning report emailed to HR Ops.
</p>
```

### Signature Block
```html
<div style="margin-top: 32px; padding-top: 20px; border-top: 2px solid #E5E7EB;">
  <div style="display: flex; gap: 48px;">
    <div style="flex: 1;">
      <p style="font-size: 11px; font-weight: 600; color: #9CA3AF;
                text-transform: uppercase; letter-spacing: 0.8px; margin: 0 0 24px;">
        Verified by (HR Ops)
      </p>
      <div style="border-bottom: 1px solid #D1D5DB; width: 200px; margin-bottom: 6px;"></div>
      <p style="font-size: 11px; color: #9CA3AF; margin: 0;">Signature / Date</p>
    </div>
    <div style="flex: 1;">
      <p style="font-size: 11px; font-weight: 600; color: #9CA3AF;
                text-transform: uppercase; letter-spacing: 0.8px; margin: 0 0 24px;">
        Approved by (Manager)
      </p>
      <div style="border-bottom: 1px solid #D1D5DB; width: 200px; margin-bottom: 6px;"></div>
      <p style="font-size: 11px; color: #9CA3AF; margin: 0;">Signature / Date</p>
    </div>
  </div>
</div>
```

### Progress Indicator (Inline)
```html
<div style="display: flex; align-items: center; gap: 8px; margin: 8px 0;">
  <div style="flex: 1; background: #E5E7EB; height: 6px; border-radius: 999px; overflow: hidden;">
    <div style="background: var(--page-accent, #1B5E7D); height: 6px; width: 72%; border-radius: 999px;"></div>
  </div>
  <span style="font-size: 11px; font-weight: 600; color: var(--page-accent, #1B5E7D); min-width: 32px; text-align: right;">72%</span>
</div>
```

### Bullet List (Standard)
```html
<ul style="margin: 10px 0; padding: 0; list-style: none;">
  <li style="font-size: 13px; color: #4B5563; line-height: 1.7;
             padding: 4px 0 4px 20px; position: relative;">
    <span style="position: absolute; left: 0; color: var(--page-accent, #1B5E7D); font-weight: 700;">•</span>
    Bullet item text with complete, actionable detail.
  </li>
</ul>
```

---

## Page Header (Repeats on Every Content Page)
```html
<div style="display: flex; justify-content: space-between; align-items: center;
            padding-bottom: 12px; border-bottom: 1px solid #E5E7EB;
            margin-bottom: 20px; flex-shrink: 0;">
  <span style="font-size: 11px; font-weight: 600; color: var(--page-accent, #1B5E7D);
               letter-spacing: 0.5px;">
    SOP-HR-OB-2026-001
  </span>
  <span style="font-size: 10px; font-weight: 500; color: #9CA3AF;">
    New Employee Onboarding: Internal Tools & Workflow
  </span>
</div>
```

## Page Footer (Repeats on Every Content Page)

The canvas defines `.page-footer` globally, with:
`margin-top:auto` (pins to page bottom), flex layout with space-between, top border, 9px uppercase left span, 10px right span for page number. Just emit:

```html
<div class="page-footer">
  <span>Confidential — Internal Use Only</span>
  <span>Page 3</span>
</div>
```

Do NOT re-declare the styles inline — it adds noise and can conflict with the global class.

---

## Per-Page HTML Template

Each `create_page` call receives this HTML as the `content` parameter. Do NOT include `<!DOCTYPE>`, `<html>`, `<head>`, or `<body>` — the canvas handles the outer document. Just the inner content:

```html
<!-- Font import (include on every page) -->
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">

<div style="font-family:'Inter',sans-serif;color:#1A1A1A;padding:48px 56px;
            display:flex;flex-direction:column;height:100%;position:relative;">

  <!-- Page header (NOT on cover page) -->
  <div style="display:flex;justify-content:space-between;align-items:center;
              padding-bottom:12px;border-bottom:1px solid #E5E7EB;
              margin-bottom:20px;flex-shrink:0;">
    <span style="font-size:11px;font-weight:600;color:var(--page-accent, #1B5E7D);letter-spacing:0.5px;">
      [DOC_ID]
    </span>
    <span style="font-size:10px;font-weight:500;color:#9CA3AF;">
      [DOC_TITLE_SHORT]
    </span>
  </div>

  <!-- Section heading + content zone -->
  [SECTION CONTENT using page patterns P1–P8]

  <!-- Page footer (NOT on cover page) -->
  <div style="display:flex;justify-content:space-between;align-items:center;
              padding-top:12px;border-top:1px solid #E5E7EB;
              margin-top:auto;flex-shrink:0;">
    <span style="font-size:9px;font-weight:600;color:#9CA3AF;
                 text-transform:uppercase;letter-spacing:1.5px;">
      Confidential — Internal Use Only
    </span>
    <span style="font-size:10px;font-weight:600;color:#9CA3AF;">
      Page [N]
    </span>
  </div>
</div>
```

**Critical:** Each page is a separate `create_page` tool call. Never build a combined HTML file. Never save to the filesystem. Never call `present_files`.

---

## Anti-Patterns (Never Do These)

| What | Why |
|---|---|
| Dark background panels | Documents are printed — dark panels waste ink and look wrong |
| Cards with box-shadow as primary layout | Documents use tables, lists, and prose — cards are for slides |
| Font size below 9px | Unreadable when printed |
| Missing `line-height` on body text | Dense text becomes unreadable. Always `1.7` for body, `1.5` for tables |
| Gradient backgrounds | Print inconsistently, look unprofessional |
| External image URLs | Break in sandboxed environments |
| Icon libraries (Font Awesome, etc.) | Use inline SVG or Unicode only |
| Tailwind CSS classes | Won't resolve without CDN |
| Decorative borders on every element | Documents should feel clean and minimal — borders on tables and dividers only |
| Color-coded everything | Documents use color sparingly — accent on headings, status colors on badges/text only |
| Landscape orientation | Business documents are portrait — 816×1056px |
| Monospace fonts | Only Inter. Exception: code snippets in technical docs |
