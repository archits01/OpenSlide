---
name: doc-business
description: >-
  Build professional 816x1056px HTML business document pages. Each section
  becomes a separate page created via the create_page tool. Designed for SOPs,
  proposals, reports, memos, handbooks, meeting minutes, cover letters, case
  studies, white papers, onboarding docs, and any structured business document
  where clarity and professionalism are non-negotiable. Trigger when the user
  says write an SOP, create a report, draft a proposal, write a memo, make a
  handbook, create meeting minutes, or provides business content and asks for a
  professional document. Uses a clean corporate design system with Inter, teal,
  and charcoal defaults. 8 proven page patterns ensure every document is
  well-structured, scannable, and print-ready.
---


# Business Document Page Builder

## Before You Start

Read both reference files **in order** before writing any content:
1. `references/design-system.md` — Colors, typography, component patterns, structural constants
2. `references/page-library.md` — All 8 page patterns with HTML templates, doc-type mappings

**Do not begin building until you have read both files.** The quality checklist in Step 7 references specific values from these files.

---

## How This Works

You have two tools:

1. **`create_outline`** — Call this FIRST. Produces a structured section plan the user can approve before any pages are written.
2. **`create_page`** — Call this ONCE PER SECTION after the outline is approved. Each call creates one 816×1056px page in the document canvas.

**Never generate a single combined HTML file. Never save to the filesystem. Never call present_files.** Each section = one `create_page` call = one page rendered in the canvas.

---

## Full Pipeline

### Step 1: Analyze the Content

Extract from user's input:
- **Document type** — SOP, proposal, report, memo, handbook, meeting minutes, cover letter, case study
- **Subject / title** — what the document is about
- **Audience** — internal team, external client, board, regulatory
- **Key data** — any numbers, metrics, dates, names, requirements
- **Sections needed** — determine from content + doc type conventions

### Step 2: Call create_outline

Call `create_outline` with the document title and a sections array. Each section needs:
- `index` — zero-based
- `title` — section heading (e.g., "1. Purpose", "5. Procedure — Day 1")
- `type` — one of: `cover`, `body`, `table`, `steps`, `checklist`, `two_column`, `callout`, `reference`
- `key_points` — specific details this section will cover

Use the **Document Type → Pattern Mapping** from page-library.md to determine the right sections and types.

**Wait for user approval before proceeding.**

### Step 3: Assign Page Patterns

For each section in the approved outline, the `type` field determines the page pattern:

| Outline type | Pattern | Visual |
|---|---|---|
| `cover` | P1 — Cover Page | Centered title + metadata table |
| `body` | P2 — Prose Section | Heading + paragraphs + bullets |
| `table` | P3 — Data Table | Full-width table with headers |
| `steps` | P4 — Numbered Steps | Step circles + title + description + metadata |
| `checklist` | P5 — Checklist Page | Grouped checkbox items + signature blocks |
| `two_column` | P6 — Two-Column | Issue/cause/resolution pairs |
| `callout` | P7 — Callout + Prose | Accent-bordered box + supporting text |
| `reference` | P8 — Revision History | Compact table + end marker |

### Step 4: Generate Pages

For each section in the outline, call `create_page` with:
- `title` — the section title from the outline
- `content` — the HTML for this page (see below)
- `layout` — the type from the outline

**Page HTML structure** — every `create_page` content must follow this template:

```html
<!-- Google Fonts import -->
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">

<div style="font-family:'Inter',sans-serif;color:#1A1A1A;padding:48px 56px;
            display:flex;flex-direction:column;height:100%;position:relative;">

  <!-- Page header (every content page — NOT on cover) -->
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

  <!-- Section heading -->
  <h1 style="font-size:22px;font-weight:700;color:#1A1A1A;
             border-left:5px solid var(--page-accent, #1B5E7D);padding-left:14px;
             margin:0 0 6px;">
    [N]. [SECTION_TITLE]
  </h1>
  <p style="font-size:13px;font-weight:300;color:#6B7280;
            margin:0 0 20px;padding-left:19px;">
    [SECTION_SUBTITLE]
  </p>

  <!-- Content zone -->
  <div style="flex:1;">
    [PAGE PATTERN CONTENT from page-library.md]
  </div>

  <!-- Page footer (every content page — NOT on cover) -->
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

**Cover page (P1)** uses a different structure — no header/footer, centered layout. See page-library.md P1 pattern.

**Generate pages sequentially** — call `create_page` for section 0, then section 1, then section 2, etc. One call per section. Do NOT batch them.

### Step 5: Content Density Rules (CRITICAL — prevents overflow)

- **Prose (P2):** 3–5 paragraphs per page. Each paragraph 2–4 sentences.
- **Tables (P3):** Maximum 5 rows per page for troubleshooting/two-column tables. Maximum 8 rows for simple data tables. If more, split into "(continued)" pages.
- **Steps (P4):** Maximum 3 detailed steps per page (with owner/duration metadata). If you have 5+ steps, split across 2 pages.
- **Checklists (P5):** Maximum 6 items per column. Maximum 2 groups per page. If more, split into "(continued)" pages. Always include signature block after checklist items.
- **Two-column (P6):** Maximum 4–5 rows per page. Each row = issue/cause/resolution triplet.
- **Callout (P7):** Maximum 4 card/term blocks per page. If more, convert to a simple table instead of cards, or split across pages.
- **If content overflows:** Split into two `create_page` calls. Add "(continued)" to the title. NEVER compress font sizes or squeeze spacing to fit — split instead.
- **If content is short:** That's fine — the footer sticks to the bottom via `margin-top:auto`.
- **Page container must use `overflow: hidden`** — content that exceeds 1056px height gets silently clipped. The agent must prevent this by following density limits above.

### Step 5b: Spacing Rules (exact values — do not deviate)

- **Gap between page header and section heading:** `margin-bottom: 20px` on header. Never more.
- **Gap between section heading and first content:** `margin: 0 0 6px` on h1, `margin: 0 0 20px` on subtitle. No extra decorative elements between heading and content.
- **Step block vertical spacing:** `margin-bottom: 18px` between steps. Not 28–30px.
- **Table row vertical padding:** `padding: 9px 14px` on cells. Not 14–16px.
- **Owner/status badges:** Use ONE consistent style — `display:inline-block; padding:3px 10px; border-radius:4px; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.8px; background:var(--page-accent-light, #E8F1F8); color:var(--page-accent, #1B5E7D)`. Do NOT mix pill shapes, sizes, or colors across pages.
- **Warning/error text:** Always `color: #C0504D`. Never orange-red or other reds.
- **Subsection headings:** Always `font-size:16px; font-weight:600; color:#1A1A1A; margin:16px 0 8px`. No border-left on subsections — only the main section h1 gets the left border.

### Step 6: Content Writing Rules

- **Tone:** Professional, clear, direct. Active voice. No filler.
- **Structure:** Front-load key info. First sentence = key point.
- **Specificity:** Names, dates, numbers, deadlines. "Within 5 working days" not "promptly."
- **Completeness:** Each section self-contained — reader can follow without asking questions.

### Step 7: Quality Checklist

Apply per page as you generate. Every "no" is a defect — call `update_page` to fix.

**Layout:**
- [ ] Content uses Inter font family
- [ ] Padding is `48px 56px`
- [ ] Page header present (not on cover)
- [ ] Page footer present (not on cover)
- [ ] Section heading is 22px with 5px left border accent

**Typography:**
- [ ] No text below 9px (footer only at 9px; body ≥ 11px)
- [ ] Body text has explicit `line-height: 1.7`
- [ ] Table cells have explicit `line-height: 1.5`
- [ ] Uppercase labels have `letter-spacing ≥ 0.8px`

**Tables:**
- [ ] `width: 100%; border-collapse: collapse`
- [ ] Header rows: `border-bottom: 2px solid #E5E7EB`
- [ ] Alternating rows: `#FFFFFF` / `#F9FAFB`
- [ ] Cell padding: `10px 14px` minimum

**Components:**
- [ ] Steps have: circle → title → description
- [ ] Checklist items have: checkbox → complete description
- [ ] Callouts have: accent left-border → text
- [ ] Metadata uses: uppercase label (gray bg) → value
- [ ] Signature blocks have: role → line → date

**Content:**
- [ ] Cover page has all required metadata fields for this doc type
- [ ] Every section has numbered heading
- [ ] Last page is revision history (P8)
- [ ] Page numbers sequential
- [ ] Doc ID/title consistent across headers

**Anti-patterns (NONE of these should appear):**
- [ ] No combined HTML file — each section is a separate `create_page` call
- [ ] No filesystem paths or `present_files` calls
- [ ] No dark background panels (printable)
- [ ] No card layouts with box-shadow (use tables)
- [ ] No gradient backgrounds
- [ ] No Tailwind CSS
- [ ] No pill badges or tag elements above headings (e.g., no "DAY 5" pill — put phase info in the subtitle)
- [ ] No decorative underlines below headings (the 5px left-border IS the accent — no extra colored bars)
- [ ] No heading font-size above 22px on content pages (cover only goes larger)
- [ ] No font-weight 800 on content pages (700 max — 800 is for cover title only)
- [ ] No margin-bottom above 20px on any heading element
- [ ] No decorative spacing elements (colored bars, dividers, spacers between heading and content)

**Vertical space budget (CRITICAL — prevents overflow):**
- Page height: 1056px. Padding top+bottom: 96px. Header+footer: ~64px. **Content zone: ~896px.**
- Section heading + subtitle: ~50px max. That leaves ~846px for actual content.
- If your content is close to filling the page, CUT — do not compress font sizes or spacing.
- Split into two `create_page` calls rather than overflowing. Add "(continued)" to the second page title.
- The heading pattern is ALWAYS: `border-left:5px solid` h1 + subtitle paragraph. Nothing else above or between.
- [ ] No Font Awesome or external icons
- [ ] No external image URLs
- [ ] No JS chart libraries
- [ ] No monospace fonts

---

## Content → Pattern Mapping (Quick Reference)

| Content | Pattern | Outline type |
|---|---|---|
| Document title + metadata | P1 — Cover Page | `cover` |
| Purpose, scope, background | P2 — Prose | `body` |
| Prerequisites, roles, data | P3 — Data Table | `table` |
| Procedures, instructions | P4 — Numbered Steps | `steps` |
| Compliance, verification | P5 — Checklist | `checklist` |
| Troubleshooting, FAQ | P6 — Two-Column | `two_column` |
| Terms, warnings, takeaways | P7 — Callout + Prose | `callout` |
| Version control, end | P8 — Revision History | `reference` |

---

## Skill Files

```
SKILL.md                         ← You are here
references/design-system.md     ← Colors, typography, components, structural constants
references/page-library.md      ← 8 page patterns with HTML templates, doc-type mappings
```
