# Skill — Advanced ML Presentation Slides

Generate or modify slides for the **Startup Funding Prediction** Advanced ML project deck. 17 slides. Light academic aesthetic. IBM Plex type system. Indigo / amber / emerald / red colour language.

Slides live at: `/Users/architsakri/Desktop/Advanced ML Project/presentation/`

---

## Quick Reference (Read Before Anything Else)

### Design system — non-negotiables
- **1280 × 720 px**, `overflow:hidden`, `background:#E8E8E8` on body
- **3px indigo top bar** (`#4F52C8`) on every slide — first child of `.slide`
- **Standard header** on every content slide: mono slide label left + "Advanced Machine Learning · April 2026" right
- **80px horizontal padding** everywhere — never deviate
- **IBM Plex Sans** for headings, **Inter** for body, **IBM Plex Mono** for labels/code/metadata
- **`position:relative`** on `.slide` (required for watermark absolute positioning)
- **"Made with OpenSlide"** frosted chip watermark, `position:absolute;bottom:16px;right:20px` — every slide

### Colour roles
| Colour | Hex | When |
|---|---|---|
| Indigo | `#4F52C8` | Stage 1, classification, top bar, primary labels |
| Amber | `#D97706` | Stage 2, regression, team accent rule |
| Emerald | `#059669` | Exit / acquired / success / positive findings |
| Red | `#DC2626` | Closed / failure / warnings / errors |
| Surface | `#F7F7F8` | Card backgrounds, table header cells |
| Border | `#EBEBED` | Card borders, dividers |
| Text muted | `#9898A6` | Mono labels, metadata |

### Font sizing cheatsheet
| Element | Size | Font |
|---|---|---|
| Slide label (NN — Name) | 10px | Mono, 500w, uppercase, ls 3px |
| Section heading | 32px | IBM Plex Sans, 700w, ls -1px |
| Hero display (cover/conclusion) | 104px | IBM Plex Sans, 700w, ls -3.5px |
| Card title | 15–20px | IBM Plex Sans, 600–700w |
| Stat number | 28–36px | IBM Plex Sans, 700w |
| Body | 13px | Inter, line-height 1.6–1.7 |
| Mono tag / label | 9–10px | Mono, uppercase, ls 1.5px |

---

## The Deck at a Glance

| File | Slide # | Section | Layout Pattern |
|---|---|---|---|
| 01-cover.html | 1 | Cover | Pattern 1 — Full-Width Cover |
| 02-problem.html | 2 | The Problem | Stat callout + three cards |
| 03-approach.html | 3 | Our Approach | Pattern 3 — Pipeline Flow |
| 04-dataset.html | 4 | The Dataset | Pattern 2 — Stat Strip + Table + Labels |
| 05-eda.html | 5 | Exploratory Analysis | Pattern 4 — Full-Width Chart + Stat Strip |
| 06-features.html | 6 | Feature Engineering | Pattern 5 — Four Cards + Dual Boxes |
| 07-why-separate-pipelines.html | 7 | Design Decision | Pattern 6 — Problem / Fix / Consequence |
| 08-classification-results.html | 8 | Stage 1 Results | Pattern 7 — Three Model Cards |
| 09-feature-importances.html | 9 | Feature Importances | Pattern 8 — Chart + Interpretation |
| 10-regression-results.html | 10 | Stage 2 Results | Pattern 9 — Table + Diverging Bar |
| 11-lasso-deep-dive.html | 11 | Lasso Deep Dive | Pattern 8 — Chart + Interpretation |
| 12-combined-output.html | 12 | Combined Output | Pattern 10 — Ranked Table + Callouts |
| 13-scatter.html | 13 | VC Scatter | Pattern 11 — Full Chart + Reading Guide |
| 14-anthropic-demo.html | 14 | Anthropic Demo | Pattern 12 — Input + Stage Outputs |
| 15-findings.html | 15 | Key Findings | Pattern 13 — Four Finding Cards |
| 16-limitations.html | 16 | Limitations | Pattern 13 — Four Cards (red/grey bars) |
| 17-conclusion.html | 17 | Conclusion | Pattern 1 — Full-Width Conclusion |

---

## Project Context (Know This Before Editing)

**What the project does:**
- Two-stage ML pipeline on Crunchbase data (54,294 companies, 1990–2014)
- Stage 1 (Classification): predicts whether a startup will be *acquired or IPO* vs *closed* — LR / SVM / RF
- Stage 2 (Regression): predicts `log(funding_total_usd)` for *exit-predicted* companies only — Ridge / Lasso / ElasticNet

**Key results:**
- Best classifier: SVM, Acquired F1 = 0.761, 69% accuracy
- Best regressor: Lasso (α=0.01), RMSE = 1.4211, R² = 0.357
- Lasso top coefficients: `funding_rounds` +0.438, `founded_year` −0.435, `ind_Biotechnology` +0.174
- Anthropic demo: 86.9% exit probability, $12.9M predicted vs $7.3B actual (model trained on pre-2014 data)

**Critical design decision (slide 07):**
- Label encoding on `market` (industry) caused R² = −33 in regression — fake ordinal values
- Fix: one-hot encoding for Stage 2, label encoding still fine for Stage 1 tree models
- Same slide also covers the 99th-percentile outlier clip on `diff_funding_months` (24,086-month outlier)

**Label construction:**
- `label = 1` (Exit): status == 'acquired' or 'ipo' — ~6,600 companies
- `label = 0` (Closed): status == 'closed' — ~2,200 companies
- Dropped: status == 'operating' — ~45,500 (unknown outcome, unlabelled)

**The scatter plot (slide 13):**
- X-axis: Stage 1 exit probability (0–1)
- Y-axis: Stage 2 predicted log funding
- Blue dots = acquired companies, red dots = closed
- Dashed vertical line at 0.5 = decision boundary
- This is NOT predicted vs actual — it is the joint output space

**Real embedded images (base64 from notebook cells):**
- Cell 19: RF feature importances (989×590px)
- Cell 23: funding distribution histogram (1389×390px)
- Cell 29: Lasso coefficient bar chart (989×490px)
- Cell 35: VC scatter plot (989×690px)

**Team:** Archit Sakri, Varshan Ramasamy, Jaanci Kundana
**Course:** Advanced Machine Learning, April 2026

---

## Slide Shell Template

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=1280">
<title>Startup Funding Prediction — [Title]</title>
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
  <div style="height:3px;background:var(--indigo);flex-shrink:0;"></div>

  <div style="display:flex;align-items:baseline;justify-content:space-between;padding:32px 80px 0;flex-shrink:0;">
    <div>
      <p style="font-family:var(--font-mono);font-size:10px;font-weight:500;color:var(--indigo);text-transform:uppercase;letter-spacing:3px;margin-bottom:8px;">NN &mdash; Section</p>
      <h2 style="font-family:var(--font-head);font-size:32px;font-weight:700;letter-spacing:-1px;color:var(--text);">Headline. <span style="color:var(--indigo);">Accented phrase.</span></h2>
    </div>
    <p style="font-family:var(--font-mono);font-size:10px;color:var(--text-muted);">Advanced Machine Learning &nbsp;&middot;&nbsp; April 2026</p>
  </div>

  <div style="flex:1;display:flex;min-height:0;padding:24px 80px 32px;gap:24px;">
    <!-- content here -->
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

## Watermark Positioning Rules

| Situation | `bottom` value |
|---|---|
| Standard slide (no full-width bottom element) | `16px` |
| Slide with full-width insight bar (~48px) | `56px` |
| Slide with stat strip leaving 28px margin | `2px` |

---

## References

- Design system (colours, typography, CSS vars, slide shell): `references/design-system.md`
- All 13 layout patterns with full HTML snippets: `references/layout-library.md`
- Actual slides: `/Users/architsakri/Desktop/Advanced ML Project/presentation/`
