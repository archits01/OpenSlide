# brand.json Schema — Bucket 1 (Auto-Extracted)

Everything in this file is extracted automatically from the uploaded PPTX template. No user input needed.

## Logo & Brand Mark

```json
{
  "logo": {
    "image_file": "images/logo.png",
    "position": { "x_px": 36, "y_px": 24 },
    "size": { "width_px": 140, "height_px": 44 },
    "clear_space_px": 16,
    "orientation": "horizontal | stacked",
    "company_name_lockup": "Acme Corp",
    "appears_on": "all | cover_only"
  }
}
```

## Colors

```json
{
  "colors": {
    "theme": {
      "accent1": "#0066FF",
      "accent2": "#FF6B35",
      "accent3": "#2ECC71",
      "accent4": "#9B59B6",
      "accent5": "#F1C40F",
      "accent6": "#E74C3C",
      "dk1": "#1a1a2e",
      "dk2": "#2d2d44",
      "lt1": "#ffffff",
      "lt2": "#f8f9fa"
    },
    "usage_frequency": [
      { "color": "#0066FF", "count": 47, "percentage": 0.38 },
      { "color": "#1a1a2e", "count": 23, "percentage": 0.19 }
    ],
    "primary": "#0066FF",
    "secondary": "#1a1a2e",
    "backgrounds": ["#ffffff", "#f8f9fa", "#1a1a2e"],
    "mode": "light | dark",
    "color_ratios_measured": {
      "primary_pct": 0.58,
      "secondary_pct": 0.24,
      "accent_pct": 0.18
    }
  }
}
```

## Typography

```json
{
  "typography": {
    "primary_font": "Inter",
    "secondary_font": "Georgia",
    "sizes_by_role": {
      "title": { "min_pt": 32, "max_pt": 44, "typical_pt": 36 },
      "subtitle": { "min_pt": 22, "max_pt": 28, "typical_pt": 24 },
      "heading": { "min_pt": 18, "max_pt": 22, "typical_pt": 20 },
      "body": { "min_pt": 14, "max_pt": 18, "typical_pt": 16 },
      "caption": { "min_pt": 10, "max_pt": 12, "typical_pt": 11 }
    },
    "weights": {
      "title": 700,
      "subtitle": 500,
      "heading": 600,
      "body": 400,
      "caption": 400
    },
    "title_color": "#1a1a2e",
    "body_color": "#4a4a5a",
    "casing_patterns": {
      "title": "title_case | sentence_case | upper",
      "heading": "sentence_case"
    },
    "line_spacing": 1.5
  }
}
```

## Header & Footer

```json
{
  "header": {
    "elements": [
      { "type": "logo", "position": "top-left" },
      { "type": "text", "content": "CONFIDENTIAL", "position": "top-right" },
      { "type": "divider", "color": "#e2e8f0", "weight_px": 1, "y_px": 72 }
    ],
    "html_template": "<div style='position:absolute;top:24px;left:36px'>...</div>"
  },
  "footer": {
    "elements": [
      { "type": "legal_text", "content": "© 2025 Acme Corp. Confidential.", "position": "bottom-left" },
      { "type": "page_number", "format": "Page {n}", "position": "bottom-right" },
      { "type": "date", "format": "auto", "position": "bottom-center" }
    ],
    "html_template": "<div style='position:absolute;bottom:24px;left:36px'>...</div>",
    "font": "Inter",
    "font_size_pt": 10,
    "color": "#999999",
    "page_number_format": "Page {n} | {n}/{total} | {n}"
  }
}
```

## Layout & Structure

```json
{
  "layout": {
    "aspect_ratio": "16:9",
    "canvas": { "width_px": 1280, "height_px": 720 },
    "backgrounds": [
      { "slide_index": 0, "type": "solid", "color": "#1a1a2e" },
      { "slide_index": 1, "type": "gradient", "stops": ["#ffffff", "#f8f9fa"] },
      { "slide_index": 2, "type": "image", "file": "images/bg_texture.png" }
    ]
  }
}
```

## Slide Types Detected

```json
{
  "slide_types": [
    {
      "type": "title",
      "slide_indices": [0],
      "detection_confidence": 0.95,
      "characteristics": {
        "has_large_centered_text": true,
        "has_minimal_body": true,
        "distinct_background": true
      }
    },
    {
      "type": "content",
      "slide_indices": [1, 3, 5, 7],
      "detection_confidence": 0.88,
      "characteristics": {
        "has_title": true,
        "has_body_text": true,
        "has_optional_image": true
      }
    },
    {
      "type": "section_divider",
      "slide_indices": [2, 6],
      "detection_confidence": 0.82
    },
    {
      "type": "chart",
      "slide_indices": [4],
      "detection_confidence": 0.97
    },
    {
      "type": "closing",
      "slide_indices": [9],
      "detection_confidence": 0.90
    }
  ]
}
```

## Tables & Charts Styling

```json
{
  "tables": {
    "header_row_color": "#0066FF",
    "header_text_color": "#ffffff",
    "cell_borders": { "color": "#e2e8f0", "weight_px": 1 },
    "cell_padding_px": 8,
    "striped": true,
    "stripe_color": "#f8f9fa"
  }
}
```

## Bullets & Lists

```json
{
  "bullets": {
    "character": "•",
    "color": "#0066FF",
    "indent_levels": [
      { "level": 0, "indent_px": 20, "font_size_pt": 16 },
      { "level": 1, "indent_px": 40, "font_size_pt": 14 },
      { "level": 2, "indent_px": 60, "font_size_pt": 12 }
    ],
    "numbering_style": "1. | a) | i."
  }
}
```
