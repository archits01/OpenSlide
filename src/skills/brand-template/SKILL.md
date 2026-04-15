---
name: brand-template
description: Company slide template control system. Two-bucket architecture — Bucket 1 auto-extracts brand rules from uploaded PPTX (logo, colors, fonts, layout), Bucket 2 stores user-configured rules (density, behavioral, permissions). Together they constrain AI slide generation to stay on-brand.
---

# Company Slide Template Control

When a user uploads a company PPTX template, the system extracts brand rules automatically (Bucket 1) and combines them with user-configured rules (Bucket 2) to constrain slide generation.

## Architecture

```
User uploads company.pptx
         │
         ▼
┌─────────────────────────────┐
│  PPTX Extraction Pipeline   │  Bucket 1: Auto-extracted
│  (pptx_to_html.py)          │
│                              │
│  → Logo + position + size    │
│  → Theme colors + frequency  │
│  → Fonts + sizes + weights   │
│  → Header/footer structure   │
│  → Slide types detected      │
│  → Tables/chart styling      │
│  → Layout grid + safe zones  │
│                              │
│  Output: brand.json          │
└──────────┬──────────────────┘
           │
           │  +
           │
┌──────────┴──────────────────┐
│  User/Admin Configuration    │  Bucket 2: Manual config
│  (brand settings UI)         │
│                              │
│  → Color ratios (60/25/15)   │
│  → Content density rules     │
│  → Image/icon rules          │
│  → Behavioral rules          │
│  → Strictness level          │
│  → Locale settings           │
│  → Access permissions        │
│                              │
│  Output: brand_config.json   │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  Slide Generation           │
│  (agent loop)               │
│                              │
│  System prompt loads:        │
│  • brand.json (what it       │
│    looks like)               │
│  • brand_config.json (what   │
│    rules to follow)          │
│  • LLM Priority Rules       │
│    (conflict resolution)     │
└─────────────────────────────┘
```

## Bucket 1: Auto-Extracted from PPTX

Everything the extraction pipeline detects automatically. No user input needed.

### What's Extracted

| Category | Key Data Points |
|---|---|
| **Logo** | Image file, position (x,y), size (w,h), which slides, orientation |
| **Colors** | Theme colors (accent1-6, dk1/dk2, lt1/lt2), frequency-ranked usage, primary/secondary/background per slide, dark/light mode detection |
| **Typography** | Font families (primary, secondary), sizes by role (title ≥28pt, subtitle ≥22pt, heading ≥18pt, body <18pt), weights, text casing patterns, line spacing |
| **Header/Footer** | Structure (logo + text + divider), footer text, slide numbers, date, legal/confidentiality text, divider lines, repeated elements |
| **Layout** | Aspect ratio (16:9, 4:3), canvas size, shape positions, background fills/gradients/images |
| **Slide Types** | Title, section divider, content, chart, table, closing, agenda — detected via heuristics |
| **Tables** | Header row color, cell borders, padding |
| **Bullets** | Character, color, indent levels, numbering style |

### Color Extraction Detail

Colors are extracted at two levels:
1. **Theme colors** — from `<a:clrScheme>` in slide master XML (accent1-6, dk1, dk2, lt1, lt2)
2. **Actual usage** — frequency scan across all shapes → ranked by occurrence

The most frequent non-black non-white color becomes `primary`. Second most frequent becomes `secondary`.

### Slide Type Detection (Critical)

Without slide type detection, the system can extract styling but can't reason about structure. Detection heuristics:

| Type | Detection Rule |
|---|---|
| Title slide | First slide + large centered text + minimal body |
| Section divider | Single large text, no body, distinct background |
| Content slide | Title + body text + optional image/chart |
| Chart slide | Contains chart/graph graphic frame |
| Table slide | Contains table graphic frame |
| Closing slide | Last slide + "thank you" / "questions" / contact info |
| Agenda slide | Numbered list or section listing |

## Bucket 2: User-Configured Rules

These CANNOT be reliably extracted from a PPTX. They require human input. Stored in `brand_config.json`.

### Configuration Categories

| Category | Key Settings |
|---|---|
| **Color rules** | Color ratios (60/25/15), text vs bg vs accent usage, dark/light preference |
| **Typography rules** | Font fallback stack, title casing, min/max font sizes |
| **Content density** | Max bullets/slide, max words/slide, whitespace density, density per slide type |
| **Image rules** | Stock photos allowed?, AI images allowed?, crop style, borders, aspect ratios |
| **Icon rules** | Approved icon set, style (outline/filled), color rules |
| **Chart rules** | Color sequence, emphasis style, table striping/headers |
| **Layout rules** | Grid system, safe zones, content zones, spacing |
| **Behavioral rules** | Strictness level, can AI create new types?, can AI modify header/footer/logo? |
| **Slide sequencing** | Section dividers required?, max consecutive data slides, agenda placement, closing required |
| **Locale** | Date/number/currency format, language, template version |
| **Permissions** | Override roles, hard-locked vs soft-locked rules, approval requirements |

### Strictness Levels

| Level | What's Locked | Best For |
|---|---|---|
| **strict** | Everything defaults to locked. Nothing changes without explicit permission. | Regulated industries, legal, finance |
| **balanced** (default) | Core brand locked (logo, fonts, header, footer, colors). Layout and density flexible. | Most companies |
| **flexible** | Only logo and legal text locked. Everything else adapts. | Internal decks, drafts, startups |

If `brand_config.json` doesn't exist, default is **balanced**.

## Conflict Resolution

When Bucket 1 (auto-extracted) and Bucket 2 (user-configured) disagree:
- **Bucket 2 always wins** (LLM Priority Rule 9)
- When only Bucket 1 exists, measured values are soft guidance
- When neither exists, AI distributes evenly (usually looks wrong)

## File Structure

```
brand_assets/
├── brand.json              ← Bucket 1: Auto-extracted
├── brand_config.json       ← Bucket 2: User-configured
├── images/                 ← Extracted logos and images
└── template_slides/        ← Individual slide HTML files
```

## Integration

The system prompt loads both files when generating slides for a user who has uploaded a brand template:
- `brand.json` → tells the AI what the template looks like
- `brand_config.json` → tells the AI what rules to follow
- LLM Priority Rules → tells the AI how to resolve conflicts

See `references/llm-priority-rules.md` for the full priority system.
See `references/brand-schema.md` for the complete brand.json schema.
See `references/brand-config-schema.md` for the complete brand_config.json schema.
