# Layout Library — Advanced ML Presentation

Twelve layout patterns used across the 17-slide deck. Each pattern maps to one or more actual slides. Use the pattern that fits the content — do not force content into a pattern that doesn't suit it.

---

## Pattern Index

| # | Name | Best For | Slides Used |
|---|---|---|---|
| 1 | Full-Width Cover / Conclusion | Opening and closing slides | 01-cover, 17-conclusion |
| 2 | Stat Strip + Feature Table + Label Cards | Dataset overview | 04-dataset |
| 3 | Pipeline Flow Diagram | System architecture, multi-stage process | 03-approach |
| 4 | Full-Width Chart + Stat Strip | EDA / distribution analysis | 05-eda |
| 5 | Four Feature Cards + Dual Pipeline Boxes | Feature engineering breakdown | 06-features |
| 6 | Three-Column Problem / Fix / Consequence | Design decisions, before/after | 07-why-separate-pipelines |
| 7 | Three Equal Model Cards + Insight Panel | Model comparison (classification) | 08-classification-results |
| 8 | Chart Left + Interpretation Panel Right | Feature importance, coefficient plots | 09-feature-importances, 11-lasso-deep-dive |
| 9 | Comparison Table + Diverging Bar Chart | Regression model comparison | 10-regression-results |
| 10 | Ranked Table + Callout Cards | Top-N output with annotation | 12-combined-output |
| 11 | Full-Width Embedded Chart + Reading Guide | Scatter / joint output visualisation | 13-scatter |
| 12 | Input Profile + Stage Outputs + Interpretation | Single example walkthrough / demo | 14-anthropic-demo |
| 13 | Four Finding Cards (coloured top bars) | Key findings, takeaways, limitations | 15-findings, 16-limitations |

---

## Pattern 1: Full-Width Cover / Conclusion

**Use when:** Opening or closing slide. No standard header. Full vertical flex, large display type.

**Structure:** 3px top bar → flex column with `justify-content:space-between` → top label → centre title block → bottom row (team left, course info right).

```html
<div class="slide">
  <div style="height:3px;background:var(--indigo);flex-shrink:0;"></div>

  <div style="flex:1;display:flex;flex-direction:column;justify-content:space-between;padding:52px 80px 56px;">

    <p style="font-family:var(--font-mono);font-size:10px;font-weight:500;color:var(--indigo);text-transform:uppercase;letter-spacing:3px;">NN &mdash; Section</p>

    <div>
      <p style="font-family:var(--font-mono);font-size:10px;font-weight:500;color:var(--indigo);text-transform:uppercase;letter-spacing:3px;margin-bottom:24px;">Supervised Learning</p>
      <h1 style="font-family:var(--font-head);font-weight:700;color:var(--text);letter-spacing:-3.5px;line-height:0.88;margin-bottom:36px;">
        <span style="font-size:104px;display:block;">Line one</span>
        <span style="font-size:104px;display:block;">Line two</span>
        <span style="font-size:104px;display:block;color:var(--indigo);">Accented word.</span>
      </h1>
      <p style="font-family:var(--font-body);font-size:16px;color:var(--text-body);line-height:1.7;max-width:680px;">Supporting sentence.</p>
    </div>

    <div style="display:flex;align-items:flex-end;justify-content:space-between;">
      <div>
        <div style="width:28px;height:2px;background:var(--amber);margin-bottom:16px;"></div>
        <p style="font-family:var(--font-body);font-size:13px;color:var(--text);font-weight:500;line-height:2;">
          Name 1<br>Name 2<br>Name 3
        </p>
      </div>
      <p style="font-family:var(--font-mono);font-size:10px;color:var(--text-muted);text-align:right;">Advanced Machine Learning &nbsp;&middot;&nbsp; April 2026</p>
    </div>

  </div>
</div>
```

**Never:** Add a standard header. Use body text larger than 16px. Put content in all four corners simultaneously.

---

## Pattern 2: Stat Strip + Feature Table + Label Cards

**Use when:** Introducing a dataset — top-level numbers, then field-level detail and label construction side by side.

**Structure:** Horizontal stat strip (4 cells) → two-column row: feature table left (180px key column + description), label cards right (coloured left-border cards).

```html
<!-- Stat strip -->
<div style="display:flex;gap:0;margin:24px 80px 0;border:1px solid var(--border);border-radius:6px;overflow:hidden;flex-shrink:0;">
  <div style="flex:1;padding:18px 24px;border-right:1px solid var(--border);">
    <p style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1.5px;margin-bottom:6px;">Label</p>
    <p style="font-family:var(--font-head);font-size:28px;font-weight:700;letter-spacing:-1px;color:var(--text);">54,294</p>
  </div>
  <!-- repeat for each stat, last one omits border-right -->
</div>

<!-- Feature table (left) -->
<div style="flex:1;border:1px solid var(--border);border-radius:6px;overflow:hidden;">
  <div style="display:grid;grid-template-columns:180px 1fr;border-bottom:1px solid var(--border);">
    <div style="padding:11px 16px;border-right:1px solid var(--border);background:var(--surface);">
      <span style="font-family:var(--font-mono);font-size:11px;color:var(--text);">field_name</span>
    </div>
    <div style="padding:11px 16px;">
      <span style="font-family:var(--font-body);font-size:12px;color:var(--text-body);">Description of what this field contains.</span>
    </div>
  </div>
  <!-- repeat rows, last row omits border-bottom -->
</div>

<!-- Label card (right panel) -->
<div style="border:1px solid var(--border);border-radius:6px;overflow:hidden;border-left:3px solid var(--emerald);">
  <div style="padding:14px 16px;">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
      <span style="font-family:var(--font-mono);font-size:10px;font-weight:500;color:var(--emerald);">label = 1 · Exit</span>
      <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-muted);">~6,600</span>
    </div>
    <p style="font-family:var(--font-mono);font-size:11px;color:var(--text-body);">status == <span style="color:var(--emerald);">'acquired'</span> or <span style="color:var(--emerald);">'ipo'</span></p>
  </div>
</div>
```

---

## Pattern 3: Pipeline Flow Diagram

**Use when:** Showing a multi-stage system — inputs flowing through stages to an output.

**Structure:** Horizontal flex row: Input node → arrow → Stage 1 node (indigo border) → arrow + label → Stage 2 node (amber border) → arrow → Output node (emerald left border). Bottom insight bar optional.

**Arrow markup:**
```html
<div style="flex:1;display:flex;align-items:center;justify-content:center;position:relative;min-width:32px;">
  <div style="width:100%;height:1px;background:var(--border-md);"></div>
  <div style="position:absolute;right:0;width:0;height:0;border-top:5px solid transparent;border-bottom:5px solid transparent;border-left:7px solid var(--border-md);"></div>
</div>
```

**Stage 1 node (indigo):**
```html
<div style="width:230px;border:2px solid var(--indigo);background:var(--indigo-soft);padding:18px 18px 20px;border-radius:6px;flex-shrink:0;">
  <p style="font-family:var(--font-mono);font-size:9px;text-transform:uppercase;letter-spacing:1.5px;color:var(--indigo);margin-bottom:10px;">Stage 1 — Classification</p>
  <p style="font-family:var(--font-head);font-size:15px;font-weight:600;color:var(--text);margin-bottom:14px;">Will it exit successfully?</p>
  <!-- model list items: 4px dot + mono text -->
  <div style="margin-top:14px;padding-top:12px;border-top:1px solid rgba(79,82,200,0.15);">
    <p style="font-family:var(--font-mono);font-size:10px;color:var(--text-muted);">→ P(acquired or IPO) per startup</p>
  </div>
</div>
```

**Bottom insight bar:**
```html
<div style="border-top:1px solid var(--border);background:var(--surface);padding:14px 80px;display:flex;align-items:center;gap:10px;flex-shrink:0;">
  <div style="width:4px;height:4px;border-radius:50%;background:var(--indigo);flex-shrink:0;"></div>
  <p style="font-family:var(--font-body);font-size:13px;color:var(--text-body);">Insight text.</p>
</div>
```

---

## Pattern 4: Full-Width Chart + Stat Strip

**Use when:** The chart IS the story. Real base64 image spans full width, stat strip below provides context.

**Structure:** Chart image fills most of the vertical space (object-fit:contain). Stat strip is a bordered flex row pinned to the bottom with `align-items:flex-end`.

```html
<!-- Chart area -->
<div style="flex:1;display:flex;align-items:center;justify-content:center;padding:16px 80px 0;min-height:0;">
  <img src="data:image/png;base64,{BASE64}" style="max-width:100%;max-height:100%;object-fit:contain;border-radius:4px;display:block;" alt="Chart description">
</div>

<!-- Stat strip -->
<div style="flex:1;display:flex;align-items:flex-end;padding:0 80px 28px;">
  <div style="display:flex;gap:0;border:1px solid var(--border);border-radius:6px;overflow:hidden;width:100%;">
    <div style="flex:1;padding:14px 20px;border-right:1px solid var(--border);">
      <p style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted);margin-bottom:4px;">LABEL</p>
      <p style="font-family:var(--font-body);font-size:12px;color:var(--text-body);line-height:1.5;">Stat content.</p>
    </div>
    <!-- repeat cells, last omits border-right -->
  </div>
</div>
```

---

## Pattern 5: Four Feature Cards + Dual Pipeline Boxes

**Use when:** Listing engineered features and showing how they feed into each pipeline stage differently.

**Structure:** Top row — 4 equal feature cards (mono field name + description + example value). Bottom row — 2 pipeline boxes (classification left, regression right) with colour-coded borders.

**Feature card:**
```html
<div style="flex:1;border:1px solid var(--border);border-radius:6px;padding:16px 18px;display:flex;flex-direction:column;gap:10px;background:var(--surface);">
  <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1.5px;">feature</span>
  <p style="font-family:var(--font-mono);font-size:12px;color:var(--text);">field_name</p>
  <p style="font-family:var(--font-body);font-size:12px;color:var(--text-body);line-height:1.5;flex:1;">What this captures and why it matters.</p>
  <div style="padding:8px 10px;background:var(--bg);border:1px solid var(--border);border-radius:4px;">
    <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-muted);">Example: value or range</span>
  </div>
</div>
```

---

## Pattern 6: Three-Column Problem / Fix / Consequence

**Use when:** Showing a design decision — what went wrong, what the fix was, what the measurable impact was.

**Structure:** Three equal flex columns. Left: red-tinted problem panel. Middle: emerald-tinted fix panel. Right: narrow consequence panel (tall bordered box with before/after stat + note).

```html
<div style="flex:1;display:flex;flex-direction:column;gap:12px;">
  <p style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1.5px;">The problem</p>
  <div style="border:1px solid rgba(220,38,38,0.25);border-radius:6px;background:rgba(220,38,38,0.03);padding:18px 20px;">
    <!-- content -->
  </div>
</div>

<!-- Right consequence panel -->
<div style="width:280px;flex-shrink:0;border:1px solid var(--border);border-radius:6px;overflow:hidden;">
  <div style="padding:16px 18px;border-bottom:1px solid var(--border);background:var(--surface);">
    <p style="font-family:var(--font-mono);font-size:10px;color:var(--text-muted);margin-bottom:6px;">BEFORE</p>
    <p style="font-family:var(--font-head);font-size:36px;font-weight:700;color:var(--red);letter-spacing:-1px;">R² = −33</p>
  </div>
  <div style="padding:16px 18px;">
    <p style="font-family:var(--font-mono);font-size:10px;color:var(--text-muted);margin-bottom:6px;">AFTER</p>
    <p style="font-family:var(--font-head);font-size:36px;font-weight:700;color:var(--emerald);letter-spacing:-1px;">R² = 0.357</p>
  </div>
</div>
```

---

## Pattern 7: Three Equal Model Cards + Insight Panel

**Use when:** Comparing 3 ML models side by side. One card is highlighted (double border, coloured).

**Structure:** Three bordered model cards (surface header + metric bars). Below: a muted insight callout explaining the key takeaway.

**Model card:**
```html
<div style="flex:1;border:1px solid var(--border);border-radius:6px;display:flex;flex-direction:column;overflow:hidden;">
  <!-- highlighted variant: border:2px solid var(--indigo) -->
  <div style="padding:16px 20px;border-bottom:1px solid var(--border);background:var(--surface);">
    <p style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1.5px;margin-bottom:4px;">Role label</p>
    <p style="font-family:var(--font-head);font-size:16px;font-weight:600;color:var(--text);">Model Name</p>
  </div>
  <div style="padding:20px;display:flex;flex-direction:column;gap:16px;flex:1;">
    <!-- metric row -->
    <div>
      <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
        <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-muted);">Acquired F1</span>
        <span style="font-family:var(--font-mono);font-size:12px;font-weight:600;color:var(--indigo);">0.761</span>
      </div>
      <div style="height:6px;background:var(--border);border-radius:3px;overflow:hidden;">
        <div style="height:100%;width:76.1%;background:var(--indigo);border-radius:3px;"></div>
      </div>
    </div>
  </div>
</div>
```

---

## Pattern 8: Chart Left + Interpretation Panel Right

**Use when:** A real notebook chart needs contextual annotation — feature importances, coefficient plots.

**Structure:** ~60% left for the embedded chart image (contained within a bordered area or flush). ~40% right for interpretation panel with finding bullets.

```html
<div style="flex:1;display:flex;min-height:0;padding:20px 80px 32px;gap:28px;">

  <!-- Chart: 60% -->
  <div style="flex:3;border:1px solid var(--border);border-radius:6px;overflow:hidden;display:flex;align-items:center;justify-content:center;background:var(--bg);padding:16px;">
    <img src="data:image/png;base64,{BASE64}" style="max-width:100%;max-height:100%;object-fit:contain;" alt="Chart">
  </div>

  <!-- Interpretation: 40% -->
  <div style="flex:2;display:flex;flex-direction:column;gap:12px;">
    <p style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1.5px;">What this tells us</p>
    <!-- finding card -->
    <div style="border:1px solid var(--border);border-radius:6px;padding:14px 16px;">
      <p style="font-family:var(--font-mono);font-size:10px;color:var(--indigo);margin-bottom:6px;">Feature name — coefficient or % importance</p>
      <p style="font-family:var(--font-body);font-size:13px;color:var(--text-body);line-height:1.6;">Interpretation in plain language.</p>
    </div>
  </div>

</div>
```

---

## Pattern 9: Comparison Table + Diverging Bar Chart

**Use when:** Comparing 3 regression models on RMSE + R², and showing top coefficients visually.

**Structure:** Left ~45%: bordered comparison table with a highlighted "best" row in amber. Right ~55%: hand-coded diverging bar chart (positive indigo right, negative red left, zero-centred).

**Table row (highlighted):**
```html
<div style="display:grid;grid-template-columns:180px 1fr 1fr;background:var(--amber-soft);border-bottom:1px solid var(--border);">
  <div style="padding:12px 16px;border-right:1px solid var(--border);display:flex;align-items:center;gap:8px;">
    <span style="font-family:var(--font-mono);font-size:12px;font-weight:600;color:var(--text);">Lasso</span>
    <span style="font-family:var(--font-mono);font-size:9px;color:var(--amber);border:1px solid rgba(217,119,6,0.3);border-radius:3px;padding:1px 5px;">best</span>
  </div>
  <div style="padding:12px 16px;border-right:1px solid var(--border);">
    <span style="font-family:var(--font-mono);font-size:13px;font-weight:600;color:var(--text);">1.4211</span>
  </div>
  <div style="padding:12px 16px;">
    <span style="font-family:var(--font-mono);font-size:13px;font-weight:600;color:var(--emerald);">0.3571</span>
  </div>
</div>
```

---

## Pattern 10: Ranked Table + Callout Cards

**Use when:** Showing the model's top-N output as a ranked list, with annotation cards explaining specific entries.

**Structure:** Left ~55%: bordered table with rank, company name, exit probability bar, predicted funding. Right ~45%: 3–4 stacked annotation cards (emerald / red / amber tinted).

---

## Pattern 11: Full-Width Embedded Chart + Reading Guide

**Use when:** A 2D scatter or joint plot is the primary content and needs a reading guide.

**Structure:** Left ~65%: embedded chart flush in a bordered container. Right ~35%: reading guide — axis definitions, colour legend, decision boundary explanation.

```html
<!-- Reading guide entry -->
<div style="display:flex;align-items:flex-start;gap:10px;">
  <div style="width:10px;height:10px;border-radius:50%;background:#2563EB;flex-shrink:0;margin-top:2px;"></div>
  <div>
    <p style="font-family:var(--font-mono);font-size:10px;color:var(--text);margin-bottom:2px;">Acquired companies</p>
    <p style="font-family:var(--font-body);font-size:12px;color:var(--text-body);line-height:1.5;">Explanation of what the colour means in context.</p>
  </div>
</div>
```

---

## Pattern 12: Input Profile + Stage Outputs + Interpretation

**Use when:** Walking through a single real-world example end-to-end through the two-stage pipeline.

**Structure:** Left ~30%: input card (company profile, actual values). Middle ~30%: two stage output cards (Stage 1 with large probability, Stage 2 with predicted amount). Right ~40%: tall interpretation panel with three annotated findings.

**Stage output card:**
```html
<div style="border:2px solid var(--emerald);background:var(--emerald-soft);border-radius:6px;padding:20px 22px;">
  <p style="font-family:var(--font-mono);font-size:9px;color:var(--emerald);text-transform:uppercase;letter-spacing:1.5px;margin-bottom:12px;">Stage 1 — Classification</p>
  <p style="font-family:var(--font-head);font-size:48px;font-weight:700;color:var(--emerald);letter-spacing:-2px;line-height:1;">86.9%</p>
  <p style="font-family:var(--font-mono);font-size:10px;color:var(--text-muted);margin-top:4px;">exit probability</p>
</div>
```

---

## Pattern 13: Four Finding Cards (coloured top bars)

**Use when:** Presenting 4 key findings, limitations, or future directions. Each card is self-contained and equal weight.

**Structure:** Four equal-flex bordered cards in a row. Each has a 3px coloured top bar, a mono "Finding NN" label, a bold 20px headline, body text, and a coloured chip with the key metric or tag.

**Card:**
```html
<div style="flex:1;border:1px solid var(--border);border-radius:6px;display:flex;flex-direction:column;overflow:hidden;">
  <div style="height:3px;background:var(--emerald);flex-shrink:0;"></div>
  <div style="padding:20px 22px;flex:1;display:flex;flex-direction:column;gap:12px;">
    <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1.5px;">Finding 01</span>
    <p style="font-family:var(--font-head);font-size:20px;font-weight:700;letter-spacing:-0.5px;color:var(--text);line-height:1.2;">Headline of this finding</p>
    <p style="font-family:var(--font-body);font-size:13px;color:var(--text-body);line-height:1.7;flex:1;">Detail explaining what the model learned and why it matters.</p>
    <div style="padding:10px 12px;background:var(--emerald-soft);border-radius:4px;">
      <p style="font-family:var(--font-mono);font-size:11px;color:var(--emerald);">Key metric = value</p>
    </div>
  </div>
</div>
```

**Top bar colours by finding type:**
- Positive / correct result → `var(--emerald)`
- Stage 1 / classification insight → `var(--indigo)`
- Stage 2 / regression insight → `var(--amber)`
- Warning / limitation → `var(--red)`
- Future direction → `var(--border-md)` (neutral grey)
