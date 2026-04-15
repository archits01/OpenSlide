# brand_config.json Schema — Bucket 2 (User-Configured)

Everything in this file requires human input — it cannot be reliably extracted from a PPTX. Stored alongside brand.json. When Bucket 2 conflicts with Bucket 1, Bucket 2 wins (LLM Priority Rule 9).

## Strictness Level (Meta-Setting)

```json
{
  "strictness": "strict | balanced | flexible"
}
```

| Level | Defaults | Best For |
|---|---|---|
| `strict` | All behavioral rules locked. Nothing changes without permission. | Regulated industries, legal, finance |
| `balanced` | Core brand locked (logo, fonts, header, footer, colors). Layout/density flexible. | Most companies (DEFAULT) |
| `flexible` | Only logo and legal text locked. Everything else adapts. | Internal decks, drafts, startups |

## Color Rules

```json
{
  "color_rules": {
    "color_ratios": { "primary": 0.60, "secondary": 0.25, "accent": 0.15 },
    "color_usage": {
      "text": ["#1a1a2e"],
      "bg": ["#ffffff", "#f8f9fa"],
      "accent": ["#0066FF"]
    },
    "mode": "light | dark | both",
    "special_slide_bg_allowed": false
  }
}
```

## Typography Rules

```json
{
  "typography_rules": {
    "font_fallbacks": {
      "primary": ["Inter", "Helvetica Neue", "sans-serif"],
      "secondary": ["Georgia", "Times New Roman", "serif"]
    },
    "title_casing": "title_case | sentence_case | upper",
    "max_font_size_pt": 44,
    "min_font_size_pt": 14
  }
}
```

## Content Density

```json
{
  "content_density": {
    "max_bullets_per_slide": 5,
    "max_words_per_slide": 40,
    "whitespace_density": "sparse | balanced | dense",
    "density_by_type": {
      "data": "dense",
      "narrative": "sparse",
      "content": "balanced"
    }
  }
}
```

## Image Rules

```json
{
  "image_rules": {
    "stock_photos_allowed": true,
    "ai_images_allowed": false,
    "company_images_only": false,
    "image_crop_style": "rounded_8px | circle | none",
    "image_border": "none | 1px solid #e2e8f0",
    "allowed_image_ratios": ["16:9", "1:1", "4:3"],
    "caption_style": {
      "position": "below",
      "font_size_pt": 10,
      "italic": true
    }
  }
}
```

## Icon & Illustration Rules

```json
{
  "icon_rules": {
    "icon_set": "phosphor | lucide | custom",
    "icon_style": "outline | filled | duotone",
    "icon_color": "primary | monochrome | match_text",
    "illustration_style": "flat | isometric | hand_drawn | none"
  }
}
```

## Chart & Table Rules

```json
{
  "chart_rules": {
    "chart_colors": ["#0066FF", "#FF6B35", "#2ECC71", "#9B59B6"],
    "chart_emphasis": "darken | outline | callout",
    "table_striped": true,
    "table_header": {
      "bg": "#0066FF",
      "text": "#ffffff",
      "bold": true
    }
  }
}
```

## Layout Rules

```json
{
  "layout_rules": {
    "grid": { "columns": 12, "gutter_px": 16, "margin_px": 48 },
    "safe_zone": { "top": 80, "right": 48, "bottom": 64, "left": 48 },
    "content_zones": [
      { "name": "main", "x": 48, "y": 100, "w": 1184, "h": 520 }
    ],
    "title_body_gap_px": 24,
    "body_footer_gap_px": 32
  }
}
```

## Behavioral Rules

```json
{
  "behavioral_rules": {
    "allow_new_slide_types": false,
    "allow_decorative_elements": false,
    "allow_header_footer_changes": false,
    "allow_logo_changes": false,
    "allow_font_changes": false,
    "allow_overlays": false,
    "animations": "none | subtle_fade | allowed"
  }
}
```

## Slide Sequencing Rules

```json
{
  "sequencing_rules": {
    "require_section_dividers": true,
    "max_consecutive_data_slides": 1,
    "max_consecutive_text_slides": 2,
    "agenda_after_title": true,
    "closing_slide_required": true,
    "min_slides_per_section": 2,
    "allowed_sequences": ["title", "agenda", "section*", "closing"]
  }
}
```

## Locale & Versioning

```json
{
  "locale": {
    "date_format": "MMMM YYYY | MM/DD/YYYY | DD.MM.YYYY",
    "number_format": { "thousands": ",", "decimal": "." },
    "currency": { "symbol": "$", "position": "before" },
    "language": "en-US",
    "template_version": "2025-Q2-v3",
    "template_updated": "2025-04-01"
  }
}
```

## Access & Permissions

```json
{
  "permissions": {
    "override_roles": ["brand_admin"],
    "hard_locked": ["logo", "fonts", "header", "footer", "legal_text"],
    "new_type_approval_required": true
  }
}
```

## Default Values When brand_config.json Doesn't Exist

If user hasn't configured anything, the system uses `balanced` strictness:

- Logo: **locked** (never moved, removed, or resized)
- Fonts: **locked** (primary + secondary fonts enforced)
- Header/footer: **locked** (structure preserved exactly)
- Legal text: **locked** (never modified)
- Colors: **soft-guided** (uses Bucket 1 measured ratios)
- Layout: **flexible** (AI can arrange within safe zones)
- Content density: **flexible** (AI decides based on content)
- Images: **stock allowed, AI not allowed**
- Icons: **match template style**
- Sequencing: **soft-guided** (closing slide required, rest flexible)
