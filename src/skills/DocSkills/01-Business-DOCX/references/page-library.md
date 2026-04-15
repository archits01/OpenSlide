# Page Library — Business Document Pages (816×1056px Portrait)

Eight proven page patterns. Each section of a document maps to one pattern. Documents combine patterns in sequence to form the complete deliverable.

---

## Page-Level Quality Rules (Apply to EVERY pattern)

1. Page padding: `48px 56px` — never less
2. All tables: `border-collapse: collapse; width: 100%`
3. Table header row: `border-bottom: 2px solid #E5E7EB` — visually separates header from data
4. Alternate row backgrounds: `#FFFFFF` / `#F9FAFB`
5. Body text: always `line-height: 1.7`
6. Section heading (h1): always with `border-left: 5px solid` accent
7. Every content page has page header + page footer (cover page excluded)
8. Content fills vertically — use `flex: 1` on the main content area

---

## Pattern Index

| # | Name | Best For | Key Visual |
|---|---|---|---|
| P1 | Cover Page | Document title, metadata | Centered title + metadata table |
| P2 | Prose Section | Purpose, scope, objectives | Heading + paragraphs + bullet lists |
| P3 | Data Table Section | Prerequisites, roles, matrices | Heading + full-width table |
| P4 | Numbered Steps | Procedures, instructions | Step circles + title + description |
| P5 | Checklist Page | Compliance, completion tracking | Grouped checkbox items + signature |
| P6 | Two-Column Layout | Side-by-side info, troubleshooting | Issue/resolution pairs, comparison |
| P7 | Callout + Prose | Warnings, key takeaways, notes | Accent-bordered box + supporting text |
| P8 | Revision History | Document control, sign-off | Compact table + end-of-document marker |

---

## P1: Cover Page

For: first page of every document. No page header/footer. Centered layout.

```html
<div class="page" style="justify-content: space-between; padding: 64px 56px;">

  <!-- Top: spacer -->
  <div style="flex-shrink: 0;"></div>

  <!-- Center: title block -->
  <div style="text-align: center;">
    <div style="width: 60px; height: 4px; background: var(--page-accent, #1B5E7D); border-radius: 2px;
                margin: 0 auto 28px;"></div>
    <h1 style="font-size: 40px; font-weight: 800; color: #1A1A1A;
               letter-spacing: -1px; margin: 0 0 12px; line-height: 1.15;">
      [DOCUMENT_TITLE]
    </h1>
    <p style="font-size: 16px; font-weight: 300; color: #6B7280; margin: 0 0 8px;">
      [DOCUMENT_SUBTITLE]
    </p>
    <div style="height: 1px; background: #E5E7EB; margin: 28px auto; width: 200px;"></div>
  </div>

  <!-- Bottom: metadata table -->
  <div>
    <table style="border-collapse: collapse; width: 420px; margin: 0 auto;">
      <tbody>
        <!-- Row — repeat for each metadata field -->
        <tr>
          <td style="padding: 9px 16px; font-size: 11px; font-weight: 600; color: #9CA3AF;
                     text-transform: uppercase; letter-spacing: 0.8px; width: 150px;
                     background: #F9FAFB; border: 1px solid #E5E7EB;">
            [FIELD_LABEL]
          </td>
          <td style="padding: 9px 16px; font-size: 12px; font-weight: 500; color: #374151;
                     border: 1px solid #E5E7EB;">
            [FIELD_VALUE]
          </td>
        </tr>
        <!-- repeat: Document ID, Version, Effective Date, Department, Prepared By, Approved By, Classification -->
      </tbody>
    </table>
  </div>

</div>
```

**Required metadata fields for each doc type:**

| Doc Type | Required Fields |
|---|---|
| SOP | Document ID, Version, Effective Date, Department, Classification, Prepared By, Approved By, Review Cycle |
| Proposal | Reference, Date, Prepared By, Prepared For, Validity |
| Report | Report ID, Period, Department, Author, Distribution |
| Memo | To, From, Date, Subject, Priority |
| Handbook | Version, Effective Date, Department, Last Reviewed |

---

## P2: Prose Section

For: purpose, scope, objectives, executive summaries, background context. The most common page pattern — pure text with optional bullet lists.

```html
<!-- Page header (see design-system.md) -->
[PAGE_HEADER]

<!-- Section heading -->
<h1 style="font-size: 22px; font-weight: 700; color: #1A1A1A;
           border-left: 5px solid var(--page-accent, #1B5E7D); padding-left: 14px;
           margin: 0 0 6px;">
  [SECTION_NUMBER]. [SECTION_TITLE]
</h1>
<p style="font-size: 13px; font-weight: 300; color: #6B7280;
          margin: 0 0 20px; padding-left: 19px;">
  [SECTION_SUBTITLE]
</p>

<!-- Prose content -->
<div style="flex: 1;">
  <p style="font-size: 13px; color: #4B5563; line-height: 1.7; margin: 0 0 16px;">
    [PARAGRAPH_TEXT — 2-4 sentences per paragraph. Dense enough to be informative,
     short enough to scan. Break into multiple paragraphs for readability.]
  </p>

  <!-- Optional: bullet list within prose -->
  <ul style="margin: 12px 0 16px; padding: 0; list-style: none;">
    <li style="font-size: 13px; color: #4B5563; line-height: 1.7;
               padding: 4px 0 4px 20px; position: relative;">
      <span style="position: absolute; left: 0; color: var(--page-accent, #1B5E7D); font-weight: 700;">•</span>
      [BULLET_ITEM — complete sentence, not a fragment]
    </li>
    <!-- repeat -->
  </ul>

  <p style="font-size: 13px; color: #4B5563; line-height: 1.7; margin: 0 0 16px;">
    [CONTINUATION_PARAGRAPH]
  </p>

  <!-- Optional: out-of-scope note -->
  <div style="background: #F9FAFB; border-radius: 6px; padding: 14px 18px; margin: 16px 0;">
    <p style="font-size: 12px; color: #6B7280; line-height: 1.6; margin: 0;">
      <strong style="color: #374151;">Out of scope:</strong> [EXCLUSIONS]
    </p>
  </div>
</div>

<!-- Page footer (see design-system.md) -->
[PAGE_FOOTER]
```

---

## P3: Data Table Section

For: prerequisites, roles & responsibilities, comparison matrices, requirement tables. Full-width table as primary content.

```html
[PAGE_HEADER]

<h1 style="font-size: 22px; font-weight: 700; color: #1A1A1A;
           border-left: 5px solid var(--page-accent, #1B5E7D); padding-left: 14px;
           margin: 0 0 6px;">
  [SECTION_NUMBER]. [SECTION_TITLE]
</h1>
<p style="font-size: 13px; font-weight: 300; color: #6B7280;
          margin: 0 0 16px; padding-left: 19px;">
  [SECTION_SUBTITLE]
</p>

<div style="flex: 1;">
  <!-- Optional intro paragraph -->
  <p style="font-size: 13px; color: #4B5563; line-height: 1.7; margin: 0 0 14px;">
    [INTRO_TEXT]
  </p>

  <table style="width: 100%; border-collapse: collapse;">
    <thead>
      <tr style="border-bottom: 2px solid #E5E7EB;">
        <th style="padding: 10px 14px; font-size: 11px; font-weight: 700;
                   text-transform: uppercase; letter-spacing: 0.8px; color: #6B7280;
                   text-align: left; width: [COL_WIDTH];">
          [COLUMN_HEADER]
        </th>
        <!-- repeat for each column -->
      </tr>
    </thead>
    <tbody>
      <tr style="background: #FFFFFF; border-bottom: 1px solid #F3F4F6;">
        <td style="padding: 10px 14px; font-size: 12px; color: #4B5563;
                   line-height: 1.5; vertical-align: top;">
          [CELL_CONTENT]
        </td>
        <!-- repeat for each column -->
      </tr>
      <tr style="background: #F9FAFB; border-bottom: 1px solid #F3F4F6;">
        <td style="padding: 10px 14px; font-size: 12px; color: #4B5563;
                   line-height: 1.5; vertical-align: top;">
          [CELL_CONTENT]
        </td>
        <!-- repeat -->
      </tr>
      <!-- repeat rows, alternating bg -->
    </tbody>
  </table>
</div>

[PAGE_FOOTER]
```

**Column width guidelines:**

| Table Type | Column Layout |
|---|---|
| Prerequisites (3 col) | `60px` # / `auto` Description / `120px` Owner |
| Roles (2 col) | `160px` Role / `auto` Responsibilities |
| Comparison (4 col) | `60px` # / `180px` Item / `auto` Description / `120px` Timeline |
| Expected outputs (3 col) | `50px` # / `auto` Outcome / `180px` Evidence |

---

## P4: Numbered Steps

For: procedures, step-by-step instructions, processes. Each step has a numbered circle, title, and description with optional metadata.

```html
[PAGE_HEADER]

<h1 style="font-size: 22px; font-weight: 700; color: #1A1A1A;
           border-left: 5px solid var(--page-accent, #1B5E7D); padding-left: 14px;
           margin: 0 0 6px;">
  [SECTION_NUMBER]. [SECTION_TITLE]
</h1>
<p style="font-size: 13px; font-weight: 300; color: #6B7280;
          margin: 0 0 20px; padding-left: 19px;">
  [SECTION_SUBTITLE]
</p>

<div style="flex: 1;">
  <!-- Optional: day/phase grouping header -->
  <h2 style="font-size: 14px; font-weight: 700; color: var(--page-accent, #1B5E7D);
             margin: 0 0 16px; padding: 8px 14px;
             background: var(--page-accent-light, #E8F1F8); border-radius: 4px;">
    [PHASE_LABEL — e.g., "Day 1 — Arrival & Orientation"]
  </h2>

  <!-- Step block — repeat for each step -->
  <div style="display: flex; gap: 14px; align-items: flex-start; margin-bottom: 20px;">
    <div style="width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0;
                background: var(--page-accent, #1B5E7D); color: #fff; font-size: 13px; font-weight: 700;
                display: flex; align-items: center; justify-content: center;">
      [STEP_NUM]
    </div>
    <div style="flex: 1; padding-top: 2px;">
      <h3 style="font-size: 14px; font-weight: 600; color: #1A1A1A; margin: 0 0 6px;">
        [STEP_TITLE]
      </h3>
      <p style="font-size: 13px; color: #4B5563; line-height: 1.7; margin: 0 0 8px;">
        [STEP_DESCRIPTION — detailed enough to follow without asking questions]
      </p>
      <!-- Optional: step metadata -->
      <div style="display: flex; flex-wrap: wrap; gap: 16px; margin-top: 6px;">
        <p style="font-size: 12px; color: #6B7280; margin: 0;">
          <strong style="color: #374151;">Owner:</strong> [OWNER]
        </p>
        <p style="font-size: 12px; color: #6B7280; margin: 0;">
          <strong style="color: #374151;">Duration:</strong> [DURATION]
        </p>
      </div>
      <!-- Optional: verification line -->
      <p style="font-size: 12px; color: #6B7280; margin: 6px 0 0;">
        <strong style="color: #374151;">Verification:</strong> [VERIFICATION_METHOD]
      </p>
    </div>
  </div>
  <!-- repeat for each step -->
</div>

[PAGE_FOOTER]
```

**Step density per page:** 3–4 detailed steps (with metadata) or 5–6 brief steps. If more steps are needed, continue on the next page with a new phase header.

---

## P5: Checklist Page

For: compliance checklists, completion tracking, onboarding verification. Groups of checkbox items with optional signature blocks.

```html
[PAGE_HEADER]

<h1 style="font-size: 22px; font-weight: 700; color: #1A1A1A;
           border-left: 5px solid var(--page-accent, #1B5E7D); padding-left: 14px;
           margin: 0 0 6px;">
  [SECTION_NUMBER]. [SECTION_TITLE]
</h1>
<p style="font-size: 13px; font-weight: 300; color: #6B7280;
          margin: 0 0 16px; padding-left: 19px;">
  [SECTION_SUBTITLE]
</p>

<div style="flex: 1;">
  <!-- Optional: fill-in fields -->
  <div style="display: flex; gap: 24px; margin-bottom: 20px;">
    <p style="font-size: 12px; color: #4B5563; margin: 0;">
      <strong style="color: #1A1A1A;">Employee Name:</strong>
      <span style="border-bottom: 1px solid #D1D5DB; display: inline-block; width: 180px; margin-left: 8px;"></span>
    </p>
    <p style="font-size: 12px; color: #4B5563; margin: 0;">
      <strong style="color: #1A1A1A;">Employee ID:</strong>
      <span style="border-bottom: 1px solid #D1D5DB; display: inline-block; width: 120px; margin-left: 8px;"></span>
    </p>
  </div>

  <!-- Group header -->
  <h2 style="font-size: 14px; font-weight: 700; color: var(--page-accent, #1B5E7D);
             margin: 20px 0 12px; padding: 6px 12px;
             background: var(--page-accent-light, #E8F1F8); border-radius: 4px;">
    [GROUP_LABEL — e.g., "Pre-Arrival (Day 0)"]
  </h2>

  <!-- Checkbox items — repeat -->
  <div style="display: flex; gap: 10px; align-items: flex-start; padding: 8px 0;
              border-bottom: 1px solid #F3F4F6;">
    <div style="width: 16px; height: 16px; border: 2px solid #D1D5DB; border-radius: 3px;
                flex-shrink: 0; margin-top: 1px;"></div>
    <span style="font-size: 13px; color: #4B5563; line-height: 1.5;">
      [CHECKLIST_ITEM — reference code + description]
    </span>
  </div>
  <!-- repeat for each item -->

  <!-- Repeat group headers + items for each phase -->

  <!-- Signature block at bottom -->
  <div style="margin-top: 28px; padding-top: 16px; border-top: 2px solid #E5E7EB;">
    <div style="display: flex; gap: 48px;">
      <div>
        <p style="font-size: 11px; font-weight: 600; color: #9CA3AF;
                  text-transform: uppercase; letter-spacing: 0.8px; margin: 0 0 20px;">
          [SIGNATORY_ROLE]
        </p>
        <div style="border-bottom: 1px solid #D1D5DB; width: 180px; margin-bottom: 5px;"></div>
        <p style="font-size: 10px; color: #9CA3AF; margin: 0;">Signature / Date</p>
      </div>
      <!-- repeat for each signatory -->
    </div>
  </div>
</div>

[PAGE_FOOTER]
```

**Checklist density:** 8–12 items per group. 2–3 groups per page maximum. If more groups are needed, continue on a new page.

---

## P6: Two-Column Layout

For: troubleshooting tables (issue / resolution), side-by-side comparison, FAQ-style Q&A. Uses a table or grid to pair related content.

```html
[PAGE_HEADER]

<h1 style="font-size: 22px; font-weight: 700; color: #1A1A1A;
           border-left: 5px solid var(--page-accent, #1B5E7D); padding-left: 14px;
           margin: 0 0 6px;">
  [SECTION_NUMBER]. [SECTION_TITLE]
</h1>
<p style="font-size: 13px; font-weight: 300; color: #6B7280;
          margin: 0 0 16px; padding-left: 19px;">
  [SECTION_SUBTITLE]
</p>

<div style="flex: 1;">
  <table style="width: 100%; border-collapse: collapse;">
    <thead>
      <tr style="border-bottom: 2px solid #E5E7EB;">
        <th style="padding: 10px 14px; font-size: 11px; font-weight: 700;
                   text-transform: uppercase; letter-spacing: 0.8px; color: #6B7280;
                   text-align: left; width: 35%;">
          [LEFT_HEADER — e.g., "Issue"]
        </th>
        <th style="padding: 10px 14px; font-size: 11px; font-weight: 700;
                   text-transform: uppercase; letter-spacing: 0.8px; color: #6B7280;
                   text-align: left; width: 35%;">
          [MIDDLE_HEADER — e.g., "Likely Cause"]
        </th>
        <th style="padding: 10px 14px; font-size: 11px; font-weight: 700;
                   text-transform: uppercase; letter-spacing: 0.8px; color: #6B7280;
                   text-align: left; width: 30%;">
          [RIGHT_HEADER — e.g., "Resolution"]
        </th>
      </tr>
    </thead>
    <tbody>
      <tr style="background: #FFFFFF; border-bottom: 1px solid #F3F4F6;">
        <td style="padding: 10px 14px; font-size: 12px; color: #1A1A1A;
                   font-weight: 600; line-height: 1.5; vertical-align: top;">
          [ISSUE]
        </td>
        <td style="padding: 10px 14px; font-size: 12px; color: #4B5563;
                   line-height: 1.5; vertical-align: top;">
          [CAUSE]
        </td>
        <td style="padding: 10px 14px; font-size: 12px; color: #4B5563;
                   line-height: 1.5; vertical-align: top;">
          [RESOLUTION]
        </td>
      </tr>
      <!-- repeat, alternating bg -->
    </tbody>
  </table>

  <!-- Optional: escalation note below table -->
  <div style="background: #FEF3C7; border-left: 4px solid #D97706;
              border-radius: 0 6px 6px 0; padding: 12px 16px; margin-top: 16px;">
    <p style="font-size: 12px; font-weight: 500; color: #92400E;
              line-height: 1.6; margin: 0;">
      <strong>Escalation:</strong> [ESCALATION_INSTRUCTIONS]
    </p>
  </div>
</div>

[PAGE_FOOTER]
```

---

## P7: Callout + Prose

For: important notices, terms & conditions, key takeaways, compliance notes. Combines accent-bordered callout boxes with supporting prose.

```html
[PAGE_HEADER]

<h1 style="font-size: 22px; font-weight: 700; color: #1A1A1A;
           border-left: 5px solid var(--page-accent, #1B5E7D); padding-left: 14px;
           margin: 0 0 6px;">
  [SECTION_NUMBER]. [SECTION_TITLE]
</h1>

<div style="flex: 1;">
  <!-- Key terms / conditions as bold-label pairs -->
  <div style="margin-bottom: 20px;">
    <p style="font-size: 13px; color: #4B5563; line-height: 1.7; margin: 0 0 10px;">
      <strong style="color: #1A1A1A;">[TERM_LABEL]:</strong> [TERM_VALUE]
    </p>
    <!-- repeat for each term -->
  </div>

  <!-- Important callout -->
  <div style="background: var(--page-accent-light, #E8F1F8); border-left: 4px solid var(--page-accent, #1B5E7D);
              border-radius: 0 6px 6px 0; padding: 16px 20px; margin: 20px 0;">
    <p style="font-size: 13px; font-weight: 500; color: var(--page-accent, #1B5E7D);
              line-height: 1.65; margin: 0;">
      [CALLOUT_TEXT — key takeaway, compliance note, or critical instruction]
    </p>
  </div>

  <!-- Supporting prose -->
  <p style="font-size: 13px; color: #4B5563; line-height: 1.7; margin: 16px 0;">
    [SUPPORTING_TEXT]
  </p>
</div>

[PAGE_FOOTER]
```

---

## P8: Revision History + End-of-Document

For: always the last page. Document control metadata, revision log, and end marker.

```html
[PAGE_HEADER]

<h1 style="font-size: 22px; font-weight: 700; color: #1A1A1A;
           border-left: 5px solid var(--page-accent, #1B5E7D); padding-left: 14px;
           margin: 0 0 20px;">
  Revision History
</h1>

<div style="flex: 1;">
  <table style="width: 100%; border-collapse: collapse;">
    <thead>
      <tr style="border-bottom: 2px solid #E5E7EB;">
        <th style="padding: 10px 14px; font-size: 11px; font-weight: 700;
                   text-transform: uppercase; letter-spacing: 0.8px; color: #6B7280;
                   text-align: left; width: 80px;">Version</th>
        <th style="padding: 10px 14px; font-size: 11px; font-weight: 700;
                   text-transform: uppercase; letter-spacing: 0.8px; color: #6B7280;
                   text-align: left; width: 110px;">Date</th>
        <th style="padding: 10px 14px; font-size: 11px; font-weight: 700;
                   text-transform: uppercase; letter-spacing: 0.8px; color: #6B7280;
                   text-align: left; width: 140px;">Author</th>
        <th style="padding: 10px 14px; font-size: 11px; font-weight: 700;
                   text-transform: uppercase; letter-spacing: 0.8px; color: #6B7280;
                   text-align: left;">Changes</th>
      </tr>
    </thead>
    <tbody>
      <tr style="background: #FFFFFF; border-bottom: 1px solid #F3F4F6;">
        <td style="padding: 10px 14px; font-size: 12px; color: #4B5563;">1.0</td>
        <td style="padding: 10px 14px; font-size: 12px; color: #4B5563;">[DATE]</td>
        <td style="padding: 10px 14px; font-size: 12px; color: #4B5563;">[AUTHOR]</td>
        <td style="padding: 10px 14px; font-size: 12px; color: #4B5563;">Initial release.</td>
      </tr>
    </tbody>
  </table>

  <!-- End-of-document marker -->
  <div style="text-align: center; margin-top: 48px;">
    <p style="font-size: 12px; font-weight: 400; color: #9CA3AF; font-style: italic;">
      — End of Document —
    </p>
  </div>
</div>

[PAGE_FOOTER]
```

---

## Document Type → Pattern Mapping

### SOP (Standard Operating Procedure)
| Page | Content | Pattern |
|---|---|---|
| Cover | Title, metadata | P1 |
| 1 | Purpose | P2 |
| 2 | Scope | P2 |
| 3 | Prerequisites | P3 |
| 4 | Roles & Responsibilities | P3 |
| 5–7 | Step-by-Step Procedure | P4 (multiple pages) |
| 8 | Expected Outputs | P3 |
| 9 | Troubleshooting | P6 |
| 10 | Compliance Checklist | P5 |
| 11 | Revision History | P8 |

### Business Proposal
| Page | Content | Pattern |
|---|---|---|
| Cover | Title, metadata | P1 |
| 1 | Executive Summary | P2 |
| 2 | Objective | P2 + bullet list |
| 3 | Scope of Work | P3 (phase table) |
| 4 | Investment Summary | P3 (cost table) |
| 5 | Key Deliverables | P2 + bullet list |
| 6 | Terms & Conditions | P7 (callout + terms) |
| 7 | Next Steps + Signature | P5 (action items + sign-off) |

### Internal Report
| Page | Content | Pattern |
|---|---|---|
| Cover | Title, metadata | P1 |
| 1 | Executive Summary | P2 |
| 2 | Methodology | P2 |
| 3 | Findings | P3 (data table) |
| 4 | Analysis | P2 + P7 (callouts) |
| 5 | Recommendations | P4 (numbered actions) |
| 6 | Appendix / Revision | P8 |

### Memo
| Page | Content | Pattern |
|---|---|---|
| Cover | To/From/Date/Subject header | P1 (simplified) |
| 1 | Body | P2 + P7 |
| 2 | Action Items | P4 or P5 |

---

## Variety Rules

- Never use the same pattern on consecutive pages (except P4 for multi-page procedures)
- P1 is always first
- P8 is always last
- P5 (checklist) appears at most once per document
- P2 (prose) is the most common — but always break it up with P3 or P4 between prose sections
