# Design System — Sales & Marketing Presentations

An energetic, brand-forward, conversion-optimized design language for pitch decks, product launches, campaign reviews, and customer-facing presentations. Visual-first, outcome-driven, and built to persuade.

---

## ⚠️ Critical Rules (MUST follow — no exceptions)

1. **Every non-cover slide has left accent stripe**: `position:absolute;top:0;left:0;width:5px;height:100%;background:var(--slide-accent)` — never omit
2. **Cover slides are bold and brand-forward**: full bleed color panels, large typography (48–54px), clear value proposition — no stripe, no standard header on covers
3. **Social proof elements get elevated treatment**: customer logos and testimonials always have generous padding (20px+), visible box-shadow, clean white background — never crammed
4. **Stats and outcomes are the heroes**: big numbers (52–60px/800) paired with context label (uppercase/14px/600/accent) and a baseline comparison — numbers without context are not allowed
5. **Product screenshots**: subtle `box-shadow: 0 8px 24px rgba(0,0,0,0.12)`, `border-radius: 8px` — never flat, never naked
6. **Testimonial quotes**: large quotation mark (60–80px, accent color), italicized quote text (18–20px), clear name + title + company attribution
7. **CTA slides are single-focal-point**: one bold headline, maximum one supporting line, two buttons side by side (primary filled, secondary outline) — no bullets, no charts, no noise
8. **Competitive comparison tables**: always show preferred option with highlighted column (accent left border + accent-tinted header cell) — make the recommendation visually obvious
9. **Never cramped — use 52px horizontal padding**: content starts at `left: 57px` (52px + 5px stripe), right: 52px — sales decks need breathing room
10. **Conversion-focused hierarchy**: structure every deck as pain → solution → proof → ask — the order matters

---

## Color Palette

| Role | Hex | CSS Variable |
|---|---|---|
| Background | #FFFFFF | var(--slide-bg) |
| Surface (card bg) | #F9FAFB | — |
| Dark | #111827 | var(--slide-dark) |
| Accent (violet-600) | #7C3AED | var(--slide-accent) |
| Accent on dark (violet-300) | #C4B5FD | var(--slide-accent-light) |
| Border | #E5E7EB | var(--slide-border) |
| Text primary | #111827 | var(--slide-text) |
| Text body | #4B5563 | var(--slide-secondary) |
| Text muted | #9CA3AF | — |
| Green (positive / results) | #059669 | — |
| Red | #DC2626 | — |
| Blue (info/neutral) | #2563EB | — |

---

## CSS Variable Mapping

| CSS Variable | Hex Value | Usage |
|---|---|---|
| var(--slide-bg) | #FFFFFF | Slide background |
| var(--slide-text) | #111827 | All primary headings and text |
| var(--slide-accent) | #7C3AED | Accent stripe, highlights, CTAs, feature icons |
| var(--slide-secondary) | #4B5563 | Body text, section labels |
| var(--slide-dark) | #111827 | Dark panels, CTA backgrounds, table headers |
| var(--slide-accent-light) | #C4B5FD | Accent on dark backgrounds, section labels on dark |
| var(--slide-border) | #E5E7EB | Card borders, dividers, row separators |

---

## Typography

**Font**: Inter via Google Fonts on every single slide HTML.

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
```

### Type Scale

| Element | Size | Weight | Color | Notes |
|---|---|---|---|---|
| Cover headline | 48–54px | 800 | var(--slide-text) or #FFFFFF | letter-spacing -0.5px |
| Slide title | 28px | 700 | var(--slide-text) | padding-left:16px with stripe |
| Section label | 11px | 600 | var(--slide-secondary) | uppercase, 2px tracking |
| Card title | 15–16px | 700 | var(--slide-text) | inside feature/benefit cards |
| Body text | 14px | 400–500 | var(--slide-secondary) | line-height 1.6 |
| Stat hero | 52–60px | 800 | var(--slide-accent) | always paired with label |
| Stat label | 14px | 600 | var(--slide-secondary) | uppercase, stat context |
| Testimonial quote | 18–20px | 500 | var(--slide-text) | italic |
| Badge / pill | 11px | 600 | varies | border-radius 100px |
| CTA button | 14px | 600 | #FFFFFF or var(--slide-accent) | primary/outline pair |
| Table header | 11px | 600 | #FFFFFF | uppercase, dark bg row |

---

## Spacing System

| Token | Value | Usage |
|---|---|---|
| Slide padding top/bottom | 28px | outer slide margin |
| Slide padding left | 57px | 52px gutter + 5px stripe |
| Slide padding right | 52px | outer right margin |
| Card padding | 20px 22px | inner padding for feature/stat cards |
| Card gap | 20px | gap between cards — more generous than corporate |
| Logo strip height | 64px | customer logo rows |
| Border-radius (cards) | 12px | slightly rounder than corporate |
| Border-radius (inner) | 8px | badges, buttons, icon boxes |
| Border-radius (pills) | 100px | status badges, tags |
| CTA button padding | 10px 28px | primary action buttons |

---

## Layout Principles

- **Visual contrast over uniformity**: alternate light/dark zones within a slide to create energy and draw the eye
- **Big numbers first**: lead with the outcome stat, then explain — reverse the standard paragraph order
- **Proof at every stage**: testimonials, logos, and case studies should appear after every major claim
- **White space is confidence**: resist filling every pixel — generous margins signal brand quality
- **Hero + support structure**: one dominant visual element per slide, supporting elements complement (never compete)

---

## Component Patterns

### Hero Stat Card
```
background:#FFFFFF; border-radius:12px; padding:22px 24px;
box-shadow:0 4px 16px rgba(0,0,0,0.08); border:1px solid var(--slide-border)
```
- Label: 11px/600/uppercase/var(--slide-secondary) or var(--slide-accent)
- Number: 52–60px/800/var(--slide-accent)
- Context: 13px/var(--slide-secondary)
- Trend: 12px/600/#059669 or #DC2626 with ↑↓

### Feature/Benefit Card
```
background:#FFFFFF; border-radius:12px; padding:20px 22px;
box-shadow:0 2px 12px rgba(0,0,0,0.06); border:1px solid var(--slide-border)
```
- Icon box: 36×36px, border-radius 8px, background var(--slide-accent), white icon
- Title: 15px/700/var(--slide-text)
- Body: 13px/400/var(--slide-secondary)
- Outcome: 13px/600/var(--slide-accent)

### CTA Button (Primary)
```
background:var(--slide-accent); color:#FFFFFF; padding:10px 28px;
border-radius:8px; font-size:14px; font-weight:600; border:none
```

### CTA Button (Secondary / Outline)
```
background:transparent; color:#FFFFFF; padding:10px 28px;
border-radius:8px; font-size:14px; font-weight:600; border:2px solid rgba(255,255,255,0.4)
```

### Logo Strip
```
background:#FFFFFF; border-radius:8px; padding:12px 20px;
border:1px solid var(--slide-border); display:flex; align-items:center; justify-content:center
```
- Logo placeholder: grayscale appearance, consistent height 28px, opacity 0.6

### Testimonial Card
```
background:#FFFFFF; border-radius:12px; padding:24px 28px;
box-shadow:0 4px 16px rgba(0,0,0,0.08); border:1px solid var(--slide-border)
```
- Quotation mark: 60–70px/var(--slide-accent), positioned top-left
- Quote: 18px/500/italic/var(--slide-text)
- Attribution: name 13px/700, title+company 12px/var(--slide-secondary)

### Dark Panel
```
background:var(--slide-dark); border-radius:12px; padding:28px 32px; position:relative
```
- 3px top accent-light bar mandatory
- Text: #FFFFFF primary, var(--slide-accent-light) labels

---

## Narrative Structure

Every sales/marketing deck must follow this sequence — apply pattern selection to reinforce the story arc:

1. **Cover** (Pattern 1) — brand + hook
2. **Problem/Pain** (Pattern 2) — empathy + urgency
3. **Solution** (Pattern 3) — features → benefits → outcomes
4. **Social Proof** (Pattern 4 or 6) — logos + testimonials + case studies
5. **Results/ROI** (Pattern 5) — quantified impact
6. **Competitive** (Pattern 7, optional) — why us
7. **Pricing/Offer** (Pattern 9, optional)
8. **CTA** (Pattern 12) — single ask, clear next step

---

## Do / Don't

| Do | Don't |
|---|---|
| Lead with outcome stats | Lead with feature lists |
| Pair every number with context | Show percentages without a baseline |
| Use accent stripe on all non-cover slides | Omit the stripe |
| Generous padding (52px sides) | Cramped layouts with 20px gutters |
| Italic testimonial quotes | Quote in regular weight |
| Testimonial attribution: name + title + company | Name only |
| Bold accent on social proof | Flat gray logos |
| Single CTA per CTA slide | Multiple competing CTAs |
| Show competitive data with highlighted winner | Neutral comparison with no recommendation |
