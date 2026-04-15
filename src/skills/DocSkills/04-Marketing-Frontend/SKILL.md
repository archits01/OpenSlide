---
name: doc-marketing
description: >-
  Build visually distinctive 816x1056px HTML marketing and creative documents.
  Each section becomes a separate page via create_page for newsletters, email
  templates, brochures, product sheets, press releases, brand guidelines, social
  media kits, event invitations, and any marketing collateral where visual impact
  matters. Trigger when docsMode is active and the user mentions newsletter, email
  template, brochure, flyer, brand guide, product sheet, press release, social
  media kit, marketing brief, or any creative or marketing document.
---


# Marketing & Creative Document Builder

## Base Design System

This skill inherits the **doc-business page structure** (`01-Business-DOCX/references/`) for page dimensions (816×1056px), HTML shell, headers, footers, and page wrapper. Read that design system first.

This file overrides the **visual tone** — marketing documents are bolder, more colorful, and more expressive than business documents. Everything below replaces or extends the business defaults.

---

## What Changes from Business Docs

| Business docs | Marketing docs |
|---|---|
| Heading: 22px | Hero heading: 36–48px |
| Body: 13px | Body: 14px (more casual reading distance) |
| Accent on heading borders only | Color blocks, hero sections, tinted backgrounds |
| White pages throughout | At least one colored section per page |
| Tables for data | Cards, callouts, and visual blocks |
| Conservative tone | Bold, persuasive, brand-forward |

---

## Color System

Default palette (override with user's brand when known):

| Role | Hex | CSS Variable |
|---|---|---|
| Text | `#111827` | `var(--page-text)` |
| Accent (primary brand) | `#4F46E5` | `var(--page-accent)` |
| Accent tint | `#EEF2FF` | `var(--page-accent-light)` |
| Body text | `#4B5563` | `var(--page-secondary)` |
| Muted | `#6B7280` | `var(--page-muted)` |
| Border | `#E5E7EB` | `var(--page-border)` |
| Surface | `#F3F4F6` | `var(--page-surface)` |

**Always adapt to the user's brand.** If they mention a company, product, or color, use it as the accent. The default indigo is a fallback, not a mandate.

---

## Typography

| Element | Size | Weight | Notes |
|---|---|---|---|
| Hero heading | 36–48px | 800 | `letter-spacing: -1.5px; line-height: 1.1` |
| Section heading | 24–28px | 700 | `letter-spacing: -0.5px` |
| Subheading | 16–18px | 600 | |
| Body text | 14px | 400 | `line-height: 1.7` |
| Caption | 12px | 400 | Muted color |
| CTA text | 14px | 700 | Uppercase, `letter-spacing: 1px` |
| Eyebrow label | 11px | 700 | Uppercase, `letter-spacing: 2px`, accent color |

---

## Component Library

### Hero Header Block
```html
<div style="background:var(--page-accent,#4F46E5);border-radius:12px;padding:40px 36px;margin-bottom:24px;color:#fff;">
  <p style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:rgba(255,255,255,0.6);margin:0 0 12px;">[EYEBROW]</p>
  <h1 style="font-size:36px;font-weight:800;line-height:1.15;letter-spacing:-1px;margin:0 0 12px;color:#fff;">[HEADLINE]</h1>
  <p style="font-size:15px;font-weight:300;color:rgba(255,255,255,0.8);line-height:1.6;margin:0;max-width:500px;">[SUBLINE]</p>
</div>
```

### CTA Button
```html
<a style="display:inline-flex;align-items:center;gap:8px;background:var(--page-accent,#4F46E5);color:#fff;padding:14px 28px;border-radius:8px;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:1px;text-decoration:none;">[CTA_TEXT] →</a>
```

### Feature Card
```html
<div style="border:1px solid #E5E7EB;border-radius:10px;padding:24px;margin-bottom:16px;">
  <div style="width:40px;height:40px;background:var(--page-accent-light,#EEF2FF);border-radius:8px;display:flex;align-items:center;justify-content:center;margin-bottom:14px;">
    [ICON_SVG_20PX]
  </div>
  <h3 style="font-size:16px;font-weight:700;color:#111827;margin:0 0 6px;">[TITLE]</h3>
  <p style="font-size:13px;color:#4B5563;line-height:1.6;margin:0;">[DESC]</p>
</div>
```

### Feature Grid (2 or 3 columns)
```html
<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:16px;margin:20px 0;">
  [FEATURE_CARDS]
</div>
```

### Testimonial Block
```html
<div style="background:#F9FAFB;border-radius:10px;padding:24px 28px;margin:20px 0;">
  <p style="font-size:15px;color:#374151;line-height:1.7;font-style:italic;margin:0 0 14px;">"[QUOTE]"</p>
  <div style="display:flex;align-items:center;gap:10px;">
    <div style="width:36px;height:36px;border-radius:50%;background:var(--page-accent,#4F46E5);color:#fff;font-size:14px;font-weight:700;display:flex;align-items:center;justify-content:center;">[INITIAL]</div>
    <div>
      <p style="font-size:13px;font-weight:600;color:#111827;margin:0;">[NAME]</p>
      <p style="font-size:11px;color:#9CA3AF;margin:0;">[TITLE]</p>
    </div>
  </div>
</div>
```

### Stat Callout Row
```html
<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin:20px 0;">
  <div style="text-align:center;padding:20px 16px;background:#F9FAFB;border-radius:8px;">
    <p style="font-size:32px;font-weight:800;color:var(--page-accent,#4F46E5);margin:0;letter-spacing:-1px;">[STAT]</p>
    <p style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;color:#9CA3AF;margin:6px 0 0;">[LABEL]</p>
  </div>
</div>
```

### Article Block (for newsletters)
```html
<div style="padding:20px 0;border-bottom:1px solid #E5E7EB;">
  <p style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:var(--page-accent,#4F46E5);margin:0 0 8px;">[CATEGORY]</p>
  <h2 style="font-size:20px;font-weight:700;color:#111827;margin:0 0 8px;line-height:1.3;">[ARTICLE_TITLE]</h2>
  <p style="font-size:14px;color:#4B5563;line-height:1.7;margin:0;">[ARTICLE_BODY]</p>
</div>
```

### Brand Color Swatch (for brand guidelines)
```html
<div style="display:flex;gap:12px;margin:16px 0;">
  <div>
    <div style="width:64px;height:64px;border-radius:8px;background:[HEX];border:1px solid #E5E7EB;"></div>
    <p style="font-size:11px;font-weight:600;color:#1A1A1A;margin:6px 0 0;">[NAME]</p>
    <p style="font-size:10px;color:#9CA3AF;margin:2px 0 0;">[HEX]</p>
  </div>
</div>
```

### Contact / Footer Block
```html
<div style="background:#111827;border-radius:10px;padding:28px 32px;margin-top:24px;color:#fff;">
  <h3 style="font-size:16px;font-weight:700;margin:0 0 12px;color:#fff;">[CTA_HEADING]</h3>
  <p style="font-size:13px;color:rgba(255,255,255,0.7);line-height:1.6;margin:0 0 16px;">[CTA_BODY]</p>
  <a style="display:inline-flex;padding:12px 24px;background:var(--page-accent,#4F46E5);color:#fff;border-radius:6px;font-size:13px;font-weight:700;text-decoration:none;">[BUTTON_TEXT]</a>
</div>
```

---

## Document Type → Structure Guide

| Doc Type | Pages | Flow |
|---|---|---|
| Newsletter | 2–6 | Hero header → Article blocks → Stat callout → CTA footer |
| Product sheet | 1–2 | Hero → Feature grid → Stats → Comparison table → CTA |
| Brochure | 2–4 | Hero → Features → Testimonial → Stats → CTA |
| Press release | 1–2 | Hero (headline + dateline) → Body paragraphs → Boilerplate → Contact |
| Brand guide | 4–10 | Hero cover → Logo rules → Color swatches → Typography → Usage examples |
| Social media kit | 2–4 | Platform specs table → Copy templates → Hashtags → Guidelines |
| Event invitation | 1 | Hero → Event details → Schedule → RSVP CTA |

---

## Key Rules

- **Every page needs at least one visual focal point** — hero block, stat callout, colored section, or testimonial. All-white text pages are business docs, not marketing.
- **End every document with a CTA** — what should the reader do next?
- **Adapt the accent color** to the user's brand. Don't default to indigo if they gave you brand context.
- **Marketing body text is 14px** not 13px — slightly larger for more casual reading.
- **Use the business page wrapper** (816×1056, page header, footer) but override the heading border style with the hero block on the first page.

---

## Anti-Patterns

| What | Why |
|---|---|
| All-white pages | Marketing needs color — at least one tinted/accent section per page |
| Body text ≤12px | Too small for marketing — 14px minimum |
| Dense data tables | Use cards, stats, and callouts instead |
| No CTA | Every marketing doc ends with a call to action |
| Generic colors when brand is known | Always adapt to the user's brand |
| Business-doc heading style (left-border) | Use hero blocks and eyebrow labels instead |
