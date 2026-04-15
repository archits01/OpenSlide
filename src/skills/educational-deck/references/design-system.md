# Design System Reference — Advanced ML Presentation

Visual language for the Startup Funding Prediction slide deck. All slides use exactly these values. Academic ML aesthetic: **IBM Plex Sans** (headings) + **Inter** (body) + **IBM Plex Mono** (labels, code, metadata).

---

## Critical Rules (Read First)

1. **3px indigo top bar on every slide** — `height:3px;background:var(--indigo)` as the very first child of `.slide`. Never omit.
2. **Standard header on every content slide** — mono label left (slide number + section name), "Advanced Machine Learning · April 2026" right. Cover and Conclusion are exempt.
3. **Horizontal padding is always 80px** — `padding:... 80px`. Never 40px, 60px, or 100px.
4. **IBM Plex Mono for all labels, numbers, metadata, code** — never use Inter or IBM Plex Sans for these.
5. **Slide number labels use the format: `NN — Section Name`** — mono, 10px, 500 weight, indigo, uppercase, letter-spacing 3px.
6. **Section headings are 32px IBM Plex Sans, weight 700, letter-spacing -1px** — never smaller, never lighter.
7. **Accent colour on section headings goes on the most important word or phrase only** — e.g. `<span style="color:var(--indigo);">SVM wins on what matters.</span>`
8. **Surface cards use `var(--surface)` background with `var(--border)` border, border-radius 6px** — not 8px, not 4px.
9. **Coloured top bars on finding/result cards are 3px** — emerald for positive findings, indigo for neutral, amber for regression, red for warnings.
10. **Stat chips and metric callouts use `var(--font-mono)` at 11px** — never body font for inline metrics.
11. **Body text is always 13px Inter at line-height 1.6–1.7** — never 12px for readable content.
12. **No emojis anywhere** — use coloured dots (4px border-radius:50%) or coloured bars as visual markers.
13. **`Made with OpenSlide` watermark** — frosted glass chip, position:absolute bottom-right on every slide. See watermark spec below.

---

## Colour Palette

| Role | Variable | Hex | Usage |
|---|---|---|---|
| Background | `--bg` | `#FFFFFF` | Slide background |
| Surface | `--surface` | `#F7F7F8` | Card backgrounds, header cells, secondary panels |
| Border subtle | `--border` | `#EBEBED` | Card borders, table dividers, row separators |
| Border medium | `--border-md` | `#D8D8DC` | Arrows, stronger dividers |
| Indigo | `--indigo` | `#4F52C8` | Primary accent — top bar, Stage 1, labels, links |
| Indigo soft | `--indigo-soft` | `rgba(79,82,200,0.07)` | Indigo card fill, callout backgrounds |
| Amber | `--amber` | `#D97706` | Stage 2 / regression accent |
| Amber soft | `--amber-soft` | `rgba(217,119,6,0.07)` | Amber card fill |
| Emerald | `--emerald` | `#059669` | Success, positive findings, exit labels |
| Emerald soft | `--emerald-soft` | `rgba(5,150,105,0.07)` | Emerald card fill |
| Red | `--red` | `#DC2626` | Failures, warnings, closed labels, errors |
| Text primary | `--text` | `#111118` | Headings, strong labels |
| Text body | `--text-body` | `#52525E` | Descriptive paragraphs |
| Text muted | `--text-muted` | `#9898A6` | Section labels, metadata, timestamps |

### Stage colour logic
- **Stage 1 — Classification** → indigo (`--indigo`, `--indigo-soft`)
- **Stage 2 — Regression** → amber (`--amber`, `--amber-soft`)
- **Positive / exit / success** → emerald
- **Negative / closed / error** → red
- **Neutral / dropped / context** → muted grey

---

## Typography

| Role | Font | Size | Weight | Extra |
|---|---|---|---|---|
| Slide label | IBM Plex Mono | 10px | 500 | uppercase, letter-spacing 3px, indigo |
| Section heading | IBM Plex Sans | 32px | 700 | letter-spacing -1px |
| Hero heading (cover/conclusion) | IBM Plex Sans | 104px | 700 | letter-spacing -3.5px, line-height 0.88 |
| Card title | IBM Plex Sans | 15–20px | 600–700 | letter-spacing -0.5px |
| Stat number | IBM Plex Sans | 28–36px | 700 | letter-spacing -1px |
| Body text | Inter | 13–16px | 400 | line-height 1.6–1.7 |
| Mono label / tag | IBM Plex Mono | 9–10px | 400–500 | uppercase, letter-spacing 1.5px, muted |
| Inline metric chip | IBM Plex Mono | 11px | 400–500 | coloured by stage |
| Metadata / course info | IBM Plex Mono | 10px | 400 | text-muted, right-aligned |

### Google Fonts import (every slide)
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:ital,wght@0,300;0,400;0,600;0,700;1,300;1,400&family=IBM+Plex+Mono:wght@400;500&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
```

---

## Slide Shell

Every slide starts with this exact shell:

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=1280">
<title>Startup Funding Prediction — [Slide Title]</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:ital,wght@0,300;0,400;0,600;0,700;1,300;1,400&family=IBM+Plex+Mono:wght@400;500&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: 1280px; height: 720px; overflow: hidden; background: #E8E8E8; }
  :root {
    --bg: #FFFFFF; --surface: #F7F7F8; --border: #EBEBED; --border-md: #D8D8DC;
    --indigo: #4F52C8; --indigo-soft: rgba(79,82,200,0.07);
    --amber: #D97706; --amber-soft: rgba(217,119,6,0.07);
    --emerald: #059669; --emerald-soft: rgba(5,150,105,0.07);
    --red: #DC2626;
    --text: #111118; --text-body: #52525E; --text-muted: #9898A6;
    --font-head: 'IBM Plex Sans', sans-serif;
    --font-body: 'Inter', sans-serif;
    --font-mono: 'IBM Plex Mono', monospace;
  }
  .slide { width:1280px; height:720px; overflow:hidden; background:var(--bg); display:flex; flex-direction:column; font-family:var(--font-body); color:var(--text); position:relative; }
</style>
</head>
<body>
<div class="slide">

  <!-- 3px top bar -->
  <div style="height:3px;background:var(--indigo);flex-shrink:0;"></div>

  <!-- Standard header -->
  <div style="display:flex;align-items:baseline;justify-content:space-between;padding:32px 80px 0;flex-shrink:0;">
    <div>
      <p style="font-family:var(--font-mono);font-size:10px;font-weight:500;color:var(--indigo);text-transform:uppercase;letter-spacing:3px;margin-bottom:8px;">NN — Section Name</p>
      <h2 style="font-family:var(--font-head);font-size:32px;font-weight:700;letter-spacing:-1px;color:var(--text);">Slide headline. <span style="color:var(--indigo);">Key phrase accented.</span></h2>
    </div>
    <p style="font-family:var(--font-mono);font-size:10px;color:var(--text-muted);">Advanced Machine Learning &nbsp;&middot;&nbsp; April 2026</p>
  </div>

  <!-- Content area -->
  <div style="flex:1;display:flex;min-height:0;padding:24px 80px 32px;gap:24px;">
    <!-- patterns go here -->
  </div>

  <!-- OpenSlides watermark -->
  <div style="position:absolute;bottom:16px;right:20px;pointer-events:none;z-index:99;">
    <div style="display:inline-flex;align-items:center;padding:5px 10px;border-radius:20px;background:rgba(255,255,255,0.72);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(194,24,91,0.18);box-shadow:0 1px 8px rgba(0,0,0,0.06);">
      <span style="font-family:'Inter',sans-serif;font-size:10px;letter-spacing:-0.01em;"><span style="font-weight:400;color:#9898A6;">Made with </span><span style="font-weight:400;color:#C2185B;">Open</span><span style="font-weight:700;color:#C2185B;">Slide</span></span>
    </div>
  </div>

</div>
</body>
</html>
```

---

## Watermark Spec

Frosted glass pill, absolute positioned bottom-right. If a full-width bottom bar occupies the lower area, raise `bottom` to clear it (e.g. `bottom:56px` when a ~48px insight bar is present, `bottom:2px` when a 28px-margin stat strip is present).

```html
<div style="position:absolute;bottom:16px;right:20px;pointer-events:none;z-index:99;">
  <div style="display:inline-flex;align-items:center;padding:5px 10px;border-radius:20px;background:rgba(255,255,255,0.72);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(194,24,91,0.18);box-shadow:0 1px 8px rgba(0,0,0,0.06);">
    <span style="font-family:'Inter',sans-serif;font-size:10px;letter-spacing:-0.01em;"><span style="font-weight:400;color:#9898A6;">Made with </span><span style="font-weight:400;color:#C2185B;">Open</span><span style="font-weight:700;color:#C2185B;">Slide</span></span>
  </div>
</div>
```
