# Design System — Legal Documents (816×1056px Portrait)

Visual language for legal documents: contracts, NDAs, agreements, terms, policies. Maximally conservative — no color blocks, no design flourishes. Precision, hierarchy, and readability are the only goals.

---

## Core Principle

Legal documents look like legal documents. They don't look like marketing brochures or business reports. The aesthetic is: **dense, numbered, monochrome, formal.** Every pixel of visual embellishment you add undermines the document's perceived authority.

---

## CSS Variables

| Default Hex | CSS Variable | Usage |
|---|---|---|
| `#FFFFFF` | `var(--page-bg)` | Page background |
| `#111111` | `var(--page-text)` | All text — legal docs are near-black |
| `#1A1A1A` | `var(--page-heading)` | Article headings |
| `#333333` | `var(--page-secondary)` | Body text |
| `#666666` | `var(--page-muted)` | Footer, page numbers |
| `#999999` | `var(--page-subtle)` | Metadata labels |
| `#CCCCCC` | `var(--page-border)` | Signature lines, dividers |
| `#F5F5F5` | `var(--page-surface)` | Recital background (optional) |

**No accent colors.** Legal documents are black and white. The only color exception is the AI-generated disclaimer, which uses a subtle gray background.

---

## Typography

| Element | Size | Weight | Style | Notes |
|---|---|---|---|---|
| Document title | 22px | 700 | normal | Centered, all caps |
| Party header | 14px | 400 | normal | Centered, below title |
| Article heading | 14px | 700 | normal | ALL CAPS, numbered: `1. DEFINITIONS` |
| Section heading | 13px | 700 | normal | Numbered: `1.1 Confidential Information` |
| Body text | 12px | 400 | normal | `line-height: 1.8` — legal needs extra leading |
| Defined term (first use) | 12px | 700 | normal | Bold: **"Confidential Information"** |
| Recital (WHEREAS) | 12px | 400 | italic | `WHEREAS` in caps, rest italic |
| Sub-clause | 12px | 400 | normal | Indented with (a), (b), (c) |
| Signature name | 13px | 700 | normal | Below signature line |
| Signature title | 12px | 400 | normal | Below name |
| Footer | 10px | 400 | normal | `color: #666666` |
| AI disclaimer | 11px | 400 | italic | Gray background box |

**Line height is 1.8 for body text** — more than business docs (1.7). Legal text is denser and needs more breathing room per line.

---

## Numbering System

```
ARTICLE 1. DEFINITIONS                          ← All caps, 14px bold
  1.1 "Confidential Information" means...        ← 13px bold heading, 12px body
    1.1.1 Any technical, financial...            ← 12px body, indented
      (a) trade secrets;                         ← 12px, further indented
      (b) business plans;
      (c) customer lists.
  1.2 "Disclosing Party" means...

ARTICLE 2. OBLIGATIONS OF RECEIVING PARTY
  2.1 The Receiving Party shall...
```

**Indentation levels:**
| Level | Indent | Example |
|---|---|---|
| Article | 0px | `ARTICLE 1. DEFINITIONS` |
| Section | 0px (number provides indent) | `1.1 Confidential Information...` |
| Subsection | 24px | `1.1.1 Any technical...` |
| Sub-clause | 48px | `(a) trade secrets;` |

---

## Component Patterns

### Document Title Block
```html
<div style="text-align:center;margin-bottom:32px;">
  <h1 style="font-size:22px;font-weight:700;text-transform:uppercase;letter-spacing:1px;
             color:#111;margin:0 0 8px;">
    [DOCUMENT_TYPE]
  </h1>
  <div style="height:2px;background:#111;width:80px;margin:0 auto 16px;"></div>
  <p style="font-size:14px;color:#333;margin:0;">
    This [document type] is entered into as of [DATE]
  </p>
  <p style="font-size:13px;color:#333;margin:8px 0 0;font-weight:700;">
    Between
  </p>
  <p style="font-size:13px;color:#333;margin:4px 0;">
    [PARTY_A_FULL_NAME] ("<strong>Party A</strong>")
  </p>
  <p style="font-size:13px;color:#333;margin:4px 0;">and</p>
  <p style="font-size:13px;color:#333;margin:4px 0;">
    [PARTY_B_FULL_NAME] ("<strong>Party B</strong>")
  </p>
</div>
```

### Recital Block (WHEREAS)
```html
<div style="background:#F5F5F5;border-radius:4px;padding:16px 20px;margin:16px 0 24px;">
  <p style="font-size:12px;color:#333;line-height:1.8;margin:0 0 10px;font-style:italic;">
    <strong style="font-style:normal;">WHEREAS,</strong> [RECITAL_TEXT];
  </p>
  <p style="font-size:12px;color:#333;line-height:1.8;margin:0 0 10px;font-style:italic;">
    <strong style="font-style:normal;">WHEREAS,</strong> [RECITAL_TEXT];
  </p>
  <p style="font-size:12px;color:#333;line-height:1.8;margin:0;font-style:italic;">
    <strong style="font-style:normal;">NOW, THEREFORE,</strong> in consideration of the mutual covenants herein, the Parties agree as follows:
  </p>
</div>
```

### Article Heading
```html
<h2 style="font-size:14px;font-weight:700;text-transform:uppercase;color:#1A1A1A;
           margin:28px 0 12px;padding-top:12px;border-top:1px solid #E5E7EB;">
  ARTICLE [N]. [TITLE]
</h2>
```

### Section with Body
```html
<div style="margin-bottom:16px;">
  <p style="font-size:12px;color:#333;line-height:1.8;margin:0;">
    <strong>[N.N]</strong> [SECTION_TEXT with <strong>Defined Terms</strong> in bold]
  </p>
</div>
```

### Sub-clause List
```html
<div style="padding-left:48px;margin:8px 0 16px;">
  <p style="font-size:12px;color:#333;line-height:1.8;margin:0 0 4px;">
    (a) [SUB_CLAUSE_TEXT];
  </p>
  <p style="font-size:12px;color:#333;line-height:1.8;margin:0 0 4px;">
    (b) [SUB_CLAUSE_TEXT]; and
  </p>
  <p style="font-size:12px;color:#333;line-height:1.8;margin:0;">
    (c) [SUB_CLAUSE_TEXT].
  </p>
</div>
```

### Signature Block (per party)
```html
<div style="margin-top:40px;">
  <p style="font-size:12px;color:#333;margin:0 0 24px;line-height:1.8;">
    <strong>IN WITNESS WHEREOF,</strong> the Parties have executed this Agreement as of the date first written above.
  </p>
  <div style="display:flex;gap:64px;">
    <div style="flex:1;">
      <p style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;
                color:#999;margin:0 0 28px;">[PARTY_A_SHORT_NAME]</p>
      <div style="border-bottom:1px solid #CCC;width:220px;margin-bottom:6px;"></div>
      <p style="font-size:12px;color:#333;margin:0;">Signature</p>
      <p style="font-size:13px;font-weight:700;color:#111;margin:12px 0 2px;">Name: ___________________</p>
      <p style="font-size:12px;color:#333;margin:0 0 2px;">Title: ___________________</p>
      <p style="font-size:12px;color:#333;margin:0;">Date: ___________________</p>
    </div>
    <div style="flex:1;">
      <p style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;
                color:#999;margin:0 0 28px;">[PARTY_B_SHORT_NAME]</p>
      <div style="border-bottom:1px solid #CCC;width:220px;margin-bottom:6px;"></div>
      <p style="font-size:12px;color:#333;margin:0;">Signature</p>
      <p style="font-size:13px;font-weight:700;color:#111;margin:12px 0 2px;">Name: ___________________</p>
      <p style="font-size:12px;color:#333;margin:0 0 2px;">Title: ___________________</p>
      <p style="font-size:12px;color:#333;margin:0;">Date: ___________________</p>
    </div>
  </div>
</div>
```

### AI Disclaimer
```html
<div style="background:#F5F5F5;border:1px solid #E5E7EB;border-radius:4px;padding:12px 16px;margin:24px 0;">
  <p style="font-size:11px;color:#666;line-height:1.6;margin:0;font-style:italic;">
    <strong style="font-style:normal;">Disclaimer:</strong> This document was generated by an AI assistant and is provided as a template only. It does not constitute legal advice. All parties should have this document reviewed by a qualified legal professional before execution.
  </p>
</div>
```

---

## Anti-Patterns

| What | Why |
|---|---|
| Color accents or brand colors | Legal documents are black and white |
| Decorative borders or boxes | Undermines perceived authority |
| Sans-serif headings with colored borders | Legal uses conservative, monochrome typography |
| Inconsistent numbering | Destroys cross-reference integrity |
| Missing defined terms | Creates ambiguity — every key term must be defined |
| Signature block without date/title fields | Legally incomplete |
| No governing law clause | Document is unenforceable without jurisdiction |
| Missing AI disclaimer | Required for AI-generated legal content |
