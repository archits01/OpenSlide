# Layout Library — Pitch Deck HTML Slides

Sixteen proven layout patterns. Every slide uses exactly one pattern. Never repeat on consecutive slides.

---

## Layout-Level Quality Fixes (Read First)

These corrections apply to EVERY pattern:

1. **Gap between cards: minimum `16px`** — not 10px. Dense grids look like spreadsheets.
2. **Dark panels always have 3px green top bar** — use `position:absolute;top:0;left:0;right:0;height:3px;background:var(--slide-accent-light);`
3. **All white cards get box-shadow** — never omit: `0 2px 8px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)`
4. **All white cards get 3px green top accent bar** — `height:3px;background:#15803D` as the first child
5. **Card border-radius: `8px`** on main panels, `6px` on secondary elements
6. **Hero stats on dark: 36-44px** — never smaller
7. **Body text: always `line-height:1.5`** — never omit
8. **Content padding: `24px 56px 0 56px`** — consistent with the 56px horizontal rule
9. **Every feature card must have 4 layers**: icon box (32x32) + title + secondary metric box + description. Cards without all 4 look hollow.
10. **Dark panels follow mandatory structure**: accent bar + label + hero stat + accent descriptor. See design-system.md Dark Panel Internal Structure.
11. **Slide title is 28px with `border-left:6px solid #15803D;padding-left:16px`** — creates authority
12. **No emojis anywhere** — use inline SVG icons instead

---

## Pattern Index

| # | Name | Best For | Key Visual |
|---|---|---|---|
| 1 | Cover Slide | Opening slide | 55/45 text+image split with gradient fade |
| 2 | Dark Stat Band + Context Cards | Key metrics landing hard | Full-width dark band + white panels below |
| 3 | Standard Cards Row + Callout | 3 equal-weight topics | Three bordered cards + callout strip |
| 4 | Asymmetric Dark Hero + Stacked Cards | One metric dominates | Large dark panel left + stacked cards right |
| 5 | Dark Equation Banner + Detail Rows | Components combining | A+B+C=D banner + numbered rows |
| 6 | Comparison Table | Us vs. competitors | Table with highlighted column |
| 7 | Before/After Strip + Panels | Transformation story | Before/After boxes + arrow + delta badge |
| 8 | Three Vertical Pillars | Parallel streams | Three columns with watermark numbers |
| 9 | Integration Banner + Panels | Platform capabilities | Component equation + asymmetric panels |
| 10 | Dark Blocks + Timeline + Credibility | Traction proof | Signed deals + expansion timeline |
| 11 | Dark Panel Left + Stacked Right | Scope expansion | Checklist left + expanding panels right |
| 12 | Metrics Sidebar + Bar Chart | Financial projections | Dark metric cards + chart + sensitivity strip |
| 13 | Dark Hero Banner + Three Panels | Investment ask | Hero amount + allocation/risk/profile |
| 14 | 2x2 Sector Grid + Revenue Panel | Market segments | Grid left + numbered streams right |
| 15 | Dark Stat Cards + Growth Bars | 5-year projections | Three dark cards with ramp bars |
| 16 | Dark Ask Blocks + Timeline + Thesis | Closing CTA | Ask blocks + timeline + quote panel |

---

## Pattern 1: Cover Slide

**Use when:** First slide. Sets the visual tone. No standard header/footer/stripe.

**Structure:** 55% left (text), 45% right (hero image flush to edges). 80px gradient fade on left edge of image.

```html
<div style="width:1280px;height:720px;overflow:hidden;display:flex;background:#FFFFFF;font-family:'Plus Jakarta Sans','DM Sans',sans-serif;color:var(--slide-text);position:relative;">
  <!-- Left: Text -->
  <div style="width:55%;height:100%;display:flex;flex-direction:column;justify-content:space-between;padding:48px 56px;">
    <!-- Brand -->
    <span style="font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#94A3B8;">BRAND NAME</span>
    <!-- Title block — vertically centered -->
    <div>
      <h1 style="font-size:48px;font-weight:800;letter-spacing:-1px;line-height:1.1;margin:0 0 16px;">
        The Future of<br><span style="color:var(--slide-accent);">Industry</span>
      </h1>
      <div style="width:56px;height:4px;background:var(--slide-accent);border-radius:2px;margin-bottom:16px;"></div>
      <p style="font-size:16px;font-weight:500;color:#64748B;margin:0;line-height:1.5;max-width:400px;">
        One-line tagline that captures the value proposition clearly.
      </p>
    </div>
    <!-- Attribution -->
    <div style="border-top:1px solid var(--slide-border);padding-top:16px;">
      <p style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1.5px;color:#94A3B8;margin:0 0 4px;">Prepared for</p>
      <p style="font-size:14px;font-weight:500;color:var(--slide-secondary);margin:0;">Investor Name / Date</p>
    </div>
  </div>
  <!-- Right: Image -->
  <div style="width:45%;height:100%;position:relative;overflow:hidden;">
    <img src="[image_url]" style="width:100%;height:100%;object-fit:cover;" alt=""/>
    <!-- Gradient fade -->
    <div style="position:absolute;top:0;left:0;bottom:0;width:80px;background:linear-gradient(to right,#FFFFFF,transparent);"></div>
  </div>
</div>
```

**Never:** Add stats, bullets, or body text to the cover. Center the layout. Use the standard header/stripe/section structure.

---

## Pattern 2: Dark Stat Band + Context Cards

**Use when:** 3-4 key metrics that need to hit hard, plus supporting context.

**Structure:** Full-width dark band with stat cells separated by vertical dividers. Below: 2-3 white context panels.

```html
<!-- Inside content area -->
<!-- Dark stat band -->
<div style="background:var(--slide-dark);border-radius:8px;display:flex;align-items:center;position:relative;overflow:hidden;margin-bottom:16px;flex-shrink:0;
            box-shadow:0 4px 12px rgba(0,0,0,0.12);">
  <div style="position:absolute;top:0;left:0;right:0;height:3px;background:var(--slide-accent-light);"></div>
  <!-- Stat 1 -->
  <div style="flex:1;text-align:center;padding:22px 0;">
    <div style="font-size:38px;font-weight:800;color:#FFFFFF;letter-spacing:-1px;">$8.2M</div>
    <div style="font-size:14px;font-weight:600;color:var(--slide-accent-light);margin-top:2px;">ARR</div>
    <div style="font-size:11px;color:#94A3B8;margin-top:4px;">+127% YoY</div>
  </div>
  <div style="width:1px;background:#1E293B;align-self:stretch;margin:14px 0;"></div>
  <!-- Stat 2 -->
  <div style="flex:1;text-align:center;padding:22px 0;">
    <div style="font-size:38px;font-weight:800;color:#FFFFFF;letter-spacing:-1px;">2,400</div>
    <div style="font-size:14px;font-weight:600;color:var(--slide-accent-light);margin-top:2px;">Active Users</div>
    <div style="font-size:11px;color:#94A3B8;margin-top:4px;">+85% QoQ</div>
  </div>
  <div style="width:1px;background:#1E293B;align-self:stretch;margin:14px 0;"></div>
  <!-- Stat 3 -->
  <div style="flex:1;text-align:center;padding:22px 0;">
    <div style="font-size:38px;font-weight:800;color:#FFFFFF;letter-spacing:-1px;">94%</div>
    <div style="font-size:14px;font-weight:600;color:var(--slide-accent-light);margin-top:2px;">Retention</div>
    <div style="font-size:11px;color:#94A3B8;margin-top:4px;">Net Revenue</div>
  </div>
</div>
<!-- Context panels -->
<div style="display:flex;gap:16px;flex:1;min-height:0;">
  <div style="flex:1;border:1px solid var(--slide-border);border-radius:8px;padding:18px 22px;box-shadow:0 2px 8px rgba(0,0,0,0.06),0 1px 3px rgba(0,0,0,0.04);">
    <div style="height:3px;background:var(--slide-accent);border-radius:2px;margin:-18px -22px 14px;width:calc(100% + 44px);"></div>
    <h3 style="font-size:13px;font-weight:700;margin:0 0 8px;">Context Title</h3>
    <p style="font-size:13px;color:var(--slide-secondary);line-height:1.5;margin:0;">Supporting description with key detail.</p>
  </div>
  <!-- Repeat for 2-3 panels -->
</div>
```

---

## Pattern 3: Standard Cards Row + Callout

**Use when:** 3 equal-weight topics with no hierarchy. Use sparingly — max 1-2 per deck.

**Every card MUST have all 4 layers:** icon + title + secondary metric box + description. Cards without all 4 look hollow and generic.

```html
<!-- Inside content area -->
<div style="display:flex;gap:16px;flex:1;min-height:0;">
  <!-- Card with ALL 4 mandatory layers -->
  <div style="flex:1;border:1px solid var(--slide-border);border-radius:8px;overflow:hidden;display:flex;flex-direction:column;
              box-shadow:0 2px 8px rgba(0,0,0,0.06),0 1px 3px rgba(0,0,0,0.04);">
    <div style="height:3px;background:var(--slide-accent);"></div>
    <div style="padding:20px 22px;flex:1;display:flex;flex-direction:column;">
      <!-- Layer 1: Icon box -->
      <div style="width:32px;height:32px;border-radius:6px;display:flex;align-items:center;justify-content:center;background:#F8FAFC;border:1px solid var(--slide-border);margin-bottom:14px;">
        <svg viewBox="0 0 24 24" fill="none" stroke="var(--slide-accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="15" height="15">[icon]</svg>
      </div>
      <!-- Layer 2: Title -->
      <h3 style="font-size:14px;font-weight:700;margin:0 0 8px;">Feature Title</h3>
      <!-- Layer 3: Secondary metric box (MANDATORY) -->
      <div style="background:rgba(21,128,61,0.06);border-radius:6px;padding:7px 12px;margin-bottom:8px;">
        <div style="font-size:11px;color:var(--slide-accent);font-weight:600;">Key stat: 3x faster processing</div>
      </div>
      <!-- Layer 4: Description -->
      <p style="font-size:13px;color:var(--slide-secondary);line-height:1.5;margin:0;">Description of the feature or differentiator.</p>
    </div>
  </div>
  <!-- Repeat for 3 cards — each with ALL 4 layers -->
</div>
```

---

## Pattern 4: Asymmetric Dark Hero Block + Stacked Cards

**Use when:** One metric dominates, with 2-3 supporting stats.

**Structure:** Left ~55% dark hero panel. Right ~45% stacked white cards with green left borders.

```html
<!-- Inside content area -->
<div style="display:flex;gap:16px;flex:1;min-height:0;">
  <!-- Left: Dark hero -->
  <div style="flex:55;background:var(--slide-dark);border-radius:8px;padding:28px 32px;position:relative;overflow:hidden;display:flex;flex-direction:column;justify-content:center;
              box-shadow:0 4px 12px rgba(0,0,0,0.12);">
    <div style="position:absolute;top:0;left:0;right:0;height:3px;background:var(--slide-accent-light);"></div>
    <div style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:2.5px;color:#94A3B8;margin-bottom:16px;">KEY METRIC</div>
    <div style="font-size:44px;font-weight:800;color:#FFFFFF;letter-spacing:-1px;margin-bottom:4px;">$25M</div>
    <div style="font-size:18px;font-weight:600;color:var(--slide-accent-light);margin-bottom:20px;">Total Addressable Market</div>
    <!-- Supporting KPIs at bottom -->
    <div style="display:flex;gap:20px;border-top:1px solid #1E293B;padding-top:16px;margin-top:auto;">
      <div>
        <div style="font-size:20px;font-weight:800;color:#FFFFFF;">$8B</div>
        <div style="font-size:11px;color:#94A3B8;">SAM</div>
      </div>
      <div>
        <div style="font-size:20px;font-weight:800;color:#FFFFFF;">$2.5B</div>
        <div style="font-size:11px;color:#94A3B8;">SOM</div>
      </div>
      <div>
        <div style="font-size:20px;font-weight:800;color:var(--slide-accent-light);">18%</div>
        <div style="font-size:11px;color:#94A3B8;">CAGR</div>
      </div>
    </div>
  </div>
  <!-- Right: Stacked cards -->
  <div style="flex:45;display:flex;flex-direction:column;gap:12px;min-height:0;">
    <div style="flex:1;border-left:3px solid #15803D;background:#FFFFFF;border-radius:0 8px 8px 0;padding:16px 20px;border:1px solid var(--slide-border);border-left:3px solid #15803D;
                box-shadow:0 2px 8px rgba(0,0,0,0.06),0 1px 3px rgba(0,0,0,0.04);">
      <h3 style="font-size:13px;font-weight:700;margin:0 0 6px;">Growth Driver</h3>
      <p style="font-size:13px;color:var(--slide-secondary);line-height:1.5;margin:0;">Supporting context for this metric.</p>
    </div>
    <!-- Repeat for 2-3 stacked cards -->
  </div>
</div>
```

---

## Pattern 5: Dark Equation Banner + Horizontal Detail Rows

**Use when:** Showing how components combine (A + B + C = Result).

```html
<!-- Inside content area -->
<!-- Dark equation banner -->
<div style="background:var(--slide-dark);border-radius:8px;padding:20px 28px;display:flex;align-items:center;justify-content:center;gap:16px;position:relative;overflow:hidden;margin-bottom:16px;flex-shrink:0;
            box-shadow:0 4px 12px rgba(0,0,0,0.12);">
  <div style="position:absolute;top:0;left:0;right:0;height:3px;background:var(--slide-accent-light);"></div>
  <!-- Component -->
  <div style="display:flex;align-items:center;gap:10px;">
    <div style="width:36px;height:36px;border-radius:8px;background:#1E293B;display:flex;align-items:center;justify-content:center;">
      <svg viewBox="0 0 24 24" fill="none" stroke="var(--slide-accent-light)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="17" height="17">[icon]</svg>
    </div>
    <span style="font-size:14px;font-weight:700;color:#FFFFFF;">Component A</span>
  </div>
  <!-- Plus operator -->
  <span style="font-size:20px;font-weight:800;color:var(--slide-accent-light);">+</span>
  <!-- Repeat components + operators -->
  <!-- Equals -->
  <span style="font-size:20px;font-weight:800;color:var(--slide-accent-light);">=</span>
  <span style="font-size:16px;font-weight:800;color:#FFFFFF;">Result</span>
</div>
<!-- Numbered detail rows -->
<div style="display:flex;flex-direction:column;gap:10px;flex:1;min-height:0;">
  <div style="display:flex;align-items:center;gap:14px;padding:14px 18px;border:1px solid var(--slide-border);border-radius:8px;
              box-shadow:0 2px 8px rgba(0,0,0,0.06),0 1px 3px rgba(0,0,0,0.04);">
    <div style="width:26px;height:26px;border-radius:6px;background:var(--slide-dark);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:var(--slide-accent-light);flex-shrink:0;">01</div>
    <div style="flex:1;">
      <h3 style="font-size:13px;font-weight:700;margin:0 0 2px;">Row Title</h3>
      <p style="font-size:12px;color:var(--slide-secondary);margin:0;">Description of this component.</p>
    </div>
    <span style="font-size:14px;font-weight:700;color:var(--slide-accent);flex-shrink:0;">$5.2M</span>
  </div>
  <!-- Repeat rows -->
</div>
```

---

## Pattern 6: Comparison Table with Highlighted Column

**Use when:** Comparing your product against competitors on multiple dimensions.

```html
<!-- Inside content area -->
<div style="border:1px solid var(--slide-border);border-radius:8px;overflow:hidden;flex:1;min-height:0;display:flex;flex-direction:column;
            box-shadow:0 2px 8px rgba(0,0,0,0.06),0 1px 3px rgba(0,0,0,0.04);">
  <table style="width:100%;border-collapse:collapse;flex:1;">
    <thead>
      <tr>
        <th style="text-align:left;padding:14px 18px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#94A3B8;background:#F8FAFC;border-bottom:1px solid var(--slide-border);width:25%;">Feature</th>
        <!-- Your column — dark, highlighted -->
        <th style="text-align:center;padding:14px 18px;font-size:12px;font-weight:800;color:#FFFFFF;background:var(--slide-dark);border-bottom:1px solid #1E293B;width:25%;">Your Product</th>
        <th style="text-align:center;padding:14px 18px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#94A3B8;background:#F8FAFC;border-bottom:1px solid var(--slide-border);width:25%;">Competitor A</th>
        <th style="text-align:center;padding:14px 18px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#94A3B8;background:#F8FAFC;border-bottom:1px solid var(--slide-border);width:25%;">Competitor B</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="padding:12px 18px;font-size:13px;font-weight:600;border-bottom:1px solid #F1F5F9;">Feature Name</td>
        <!-- Your column — green indicator -->
        <td style="padding:12px 18px;text-align:center;background:var(--slide-dark);border-bottom:1px solid #1E293B;">
          <div style="width:10px;height:10px;border-radius:50%;background:var(--slide-accent-light);margin:0 auto;"></div>
        </td>
        <td style="padding:12px 18px;text-align:center;border-bottom:1px solid #F1F5F9;">
          <div style="width:10px;height:10px;border-radius:50%;background:#E2E8F0;margin:0 auto;"></div>
        </td>
        <td style="padding:12px 18px;text-align:center;border-bottom:1px solid #F1F5F9;">
          <div style="width:10px;height:10px;border-radius:50%;background:#EF4444;margin:0 auto;"></div>
        </td>
      </tr>
      <!-- Repeat rows. Dot colors: green=#4ADE80 (yes/advantage), gray=#E2E8F0 (partial), red=#EF4444 (no/disadvantage) -->
    </tbody>
  </table>
</div>
<!-- Below table: 2-3 KPI cards -->
<div style="display:flex;gap:16px;margin-top:16px;flex-shrink:0;">
  <div style="flex:1;background:#F8FAFC;border-radius:6px;padding:12px 16px;text-align:center;">
    <div style="font-size:24px;font-weight:800;color:var(--slide-text);letter-spacing:-0.5px;">3x</div>
    <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:#94A3B8;margin-top:2px;">Faster Than Average</div>
  </div>
  <!-- Repeat -->
</div>
```

---

## Pattern 7: Before/After Comparison Strip + Panels

**Use when:** Showing improvement, reduction, or transformation.

```html
<!-- Inside content area -->
<!-- Before/After strip -->
<div style="display:flex;align-items:center;gap:16px;margin-bottom:16px;flex-shrink:0;">
  <!-- Before -->
  <div style="flex:1;background:#F8FAFC;border:1px solid var(--slide-border);border-radius:8px;padding:18px 22px;">
    <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1.5px;color:#94A3B8;margin-bottom:6px;">BEFORE</div>
    <div style="font-size:28px;font-weight:800;color:var(--slide-text);letter-spacing:-0.5px;">45 min</div>
    <div style="font-size:12px;color:var(--slide-secondary);margin-top:4px;">Average processing time</div>
  </div>
  <!-- Arrow -->
  <svg viewBox="0 0 24 24" fill="none" stroke="var(--slide-accent)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="28" height="28" style="flex-shrink:0;">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
  <!-- After (dark) -->
  <div style="flex:1;background:var(--slide-dark);border-radius:8px;padding:18px 22px;position:relative;overflow:hidden;">
    <div style="position:absolute;top:0;left:0;right:0;height:3px;background:var(--slide-accent-light);"></div>
    <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1.5px;color:#94A3B8;margin-bottom:6px;">AFTER</div>
    <div style="font-size:28px;font-weight:800;color:#FFFFFF;letter-spacing:-0.5px;">2 min</div>
    <div style="font-size:12px;color:#94A3B8;margin-top:4px;">With our solution</div>
  </div>
  <!-- Delta badge -->
  <div style="background:rgba(21,128,61,0.1);border:1px solid rgba(21,128,61,0.25);border-radius:6px;padding:8px 14px;text-align:center;flex-shrink:0;">
    <div style="font-size:18px;font-weight:800;color:var(--slide-accent);">96%</div>
    <div style="font-size:10px;font-weight:600;color:var(--slide-accent);text-transform:uppercase;">Faster</div>
  </div>
</div>
<!-- Supporting panels below -->
<div style="display:flex;gap:16px;flex:1;min-height:0;">
  <div style="flex:1;border:1px solid var(--slide-border);border-radius:8px;padding:18px 22px;box-shadow:0 2px 8px rgba(0,0,0,0.06),0 1px 3px rgba(0,0,0,0.04);">
    <h3 style="font-size:13px;font-weight:700;margin:0 0 8px;">How It Works</h3>
    <p style="font-size:13px;color:var(--slide-secondary);line-height:1.5;margin:0;">Explanation of the transformation.</p>
  </div>
</div>
```

---

## Pattern 8: Three Vertical Pillar Columns

**Use when:** Three parallel workstreams, pillars, or strategic components.

```html
<!-- Inside content area -->
<div style="display:flex;gap:0;flex:1;min-height:0;">
  <!-- Column 1 -->
  <div style="flex:1;padding:0 20px;position:relative;">
    <!-- Watermark number -->
    <div style="font-size:72px;font-weight:800;color:rgba(15,23,42,0.04);position:absolute;top:-10px;right:10px;line-height:1;">01</div>
    <!-- Icon -->
    <div style="width:36px;height:36px;border-radius:8px;background:var(--slide-dark);display:flex;align-items:center;justify-content:center;margin-bottom:14px;">
      <svg viewBox="0 0 24 24" fill="none" stroke="var(--slide-accent-light)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="17" height="17">[icon]</svg>
    </div>
    <h3 style="font-size:15px;font-weight:700;margin:0 0 8px;">Pillar Title</h3>
    <p style="font-size:13px;color:var(--slide-secondary);line-height:1.5;margin:0 0 12px;">Description of this strategic pillar.</p>
    <span style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:1.5px;color:var(--slide-accent);background:rgba(21,128,61,0.08);padding:4px 10px;border-radius:4px;">CATEGORY</span>
  </div>
  <!-- Divider -->
  <div style="width:1px;background:#E2E8F0;margin:0 0;"></div>
  <!-- Repeat columns 2 & 3 -->
</div>
<!-- Synthesis bar -->
<div style="background:var(--slide-dark);border-radius:8px;padding:14px 22px;margin-top:16px;flex-shrink:0;position:relative;overflow:hidden;
            box-shadow:0 4px 12px rgba(0,0,0,0.12);">
  <div style="position:absolute;top:0;left:0;right:0;height:3px;background:var(--slide-accent-light);"></div>
  <p style="font-size:13px;color:#FFFFFF;font-weight:500;margin:0;text-align:center;">
    Synthesis statement — how these three pillars <strong style="color:var(--slide-accent-light);">work together</strong>.
  </p>
</div>
```

---

## Pattern 9: Integration Banner + Asymmetric Panels

**Use when:** Showing how multiple capabilities integrate into one platform.

**Structure:** Dark component banner at top (like equation). Three panels below with asymmetric widths — center panel dark (key differentiator), side panels white.

```html
<!-- Inside content area -->
<!-- Dark integration banner -->
<div style="background:var(--slide-dark);border-radius:8px;padding:18px 28px;display:flex;align-items:center;justify-content:center;gap:14px;position:relative;overflow:hidden;margin-bottom:16px;flex-shrink:0;
            box-shadow:0 4px 12px rgba(0,0,0,0.12);">
  <div style="position:absolute;top:0;left:0;right:0;height:3px;background:var(--slide-accent-light);"></div>
  <div style="display:flex;align-items:center;gap:8px;">
    <div style="width:30px;height:30px;border-radius:6px;background:#1E293B;display:flex;align-items:center;justify-content:center;">
      <svg viewBox="0 0 24 24" fill="none" stroke="var(--slide-accent-light)" stroke-width="2" width="14" height="14" stroke-linecap="round" stroke-linejoin="round">[icon]</svg>
    </div>
    <span style="font-size:13px;font-weight:700;color:#FFFFFF;">Module A</span>
  </div>
  <span style="font-size:18px;font-weight:800;color:var(--slide-accent-light);">+</span>
  <!-- Repeat modules -->
</div>
<!-- Three panels: 1:1.2:1 ratio -->
<div style="display:flex;gap:16px;flex:1;min-height:0;">
  <!-- Left panel (white) -->
  <div style="flex:1;border:1px solid var(--slide-border);border-radius:8px;padding:18px 20px;box-shadow:0 2px 8px rgba(0,0,0,0.06),0 1px 3px rgba(0,0,0,0.04);">
    <h3 style="font-size:13px;font-weight:700;margin:0 0 10px;">Capability A</h3>
    <!-- Detail rows -->
    <div style="display:flex;flex-direction:column;gap:8px;">
      <div style="display:flex;align-items:center;gap:8px;">
        <div style="width:18px;height:18px;border-radius:4px;background:rgba(21,128,61,0.12);display:flex;align-items:center;justify-content:center;">
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--slide-accent)" stroke-width="2.5" width="10" height="10" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <span style="font-size:12px;color:var(--slide-secondary);">Feature detail</span>
      </div>
    </div>
  </div>
  <!-- Center panel (dark — key differentiator) -->
  <div style="flex:1.2;background:var(--slide-dark);border-radius:8px;padding:18px 20px;position:relative;overflow:hidden;
              box-shadow:0 4px 12px rgba(0,0,0,0.12);">
    <div style="position:absolute;top:0;left:0;right:0;height:3px;background:var(--slide-accent-light);"></div>
    <h3 style="font-size:13px;font-weight:700;color:var(--slide-accent-light);margin:0 0 10px;">Core Differentiator</h3>
    <p style="font-size:13px;color:#CBD5E1;line-height:1.5;margin:0;">What makes this unique.</p>
  </div>
  <!-- Right panel (white) -->
  <div style="flex:1;border:1px solid var(--slide-border);border-radius:8px;padding:18px 20px;box-shadow:0 2px 8px rgba(0,0,0,0.06),0 1px 3px rgba(0,0,0,0.04);">
    <h3 style="font-size:13px;font-weight:700;margin:0 0 10px;">Capability C</h3>
    <p style="font-size:13px;color:var(--slide-secondary);line-height:1.5;margin:0;">Description.</p>
  </div>
</div>
```

---

## Pattern 10: Dark Blocks + Timeline + Credibility Strip

**Use when:** Proving traction with signed deals + showing expansion plan.

```html
<!-- Inside content area -->
<!-- Two dark traction blocks -->
<div style="display:flex;gap:16px;margin-bottom:16px;flex-shrink:0;">
  <div style="flex:1;background:var(--slide-dark);border-radius:8px;padding:18px 22px;position:relative;overflow:hidden;
              box-shadow:0 4px 12px rgba(0,0,0,0.12);">
    <div style="position:absolute;top:0;left:0;right:0;height:3px;background:var(--slide-accent-light);"></div>
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;">
      <h3 style="font-size:14px;font-weight:700;color:#FFFFFF;margin:0;">Customer Name</h3>
      <span style="background:rgba(74,222,128,0.15);color:var(--slide-accent-light);font-size:10px;font-weight:700;padding:3px 10px;border-radius:4px;text-transform:uppercase;">SIGNED</span>
    </div>
    <div style="font-size:24px;font-weight:800;color:#FFFFFF;margin-bottom:4px;">$1.2M</div>
    <div style="font-size:12px;color:#94A3B8;">3-year enterprise contract</div>
  </div>
  <!-- Repeat second block -->
</div>
<!-- Horizontal timeline -->
<div style="display:flex;align-items:center;gap:0;margin-bottom:16px;flex-shrink:0;padding:0 20px;">
  <!-- Step 1 -->
  <div style="display:flex;flex-direction:column;align-items:center;flex-shrink:0;">
    <div style="width:28px;height:28px;border-radius:50%;background:var(--slide-accent);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:#FFFFFF;">1</div>
    <div style="font-size:11px;font-weight:600;color:var(--slide-text);margin-top:6px;">Q1 2026</div>
    <div style="font-size:10px;color:#94A3B8;margin-top:2px;">Launch</div>
  </div>
  <div style="flex:1;height:2px;background:#E2E8F0;"></div>
  <!-- Repeat steps 2-4 -->
</div>
<!-- Credibility panels -->
<div style="display:flex;gap:16px;flex:1;min-height:0;">
  <div style="flex:1;border:1px solid var(--slide-border);border-radius:8px;padding:16px 20px;box-shadow:0 2px 8px rgba(0,0,0,0.06),0 1px 3px rgba(0,0,0,0.04);">
    <h3 style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1.5px;color:#94A3B8;margin:0 0 8px;">Track Record</h3>
    <p style="font-size:13px;color:var(--slide-secondary);line-height:1.5;margin:0;">Relevant experience and credibility.</p>
  </div>
</div>
```

---

## Pattern 11: Dark Panel Left + Stacked Panels Right

**Use when:** Widening scope — policy foundation, strategic alignment, global positioning.

```html
<!-- Inside content area -->
<div style="display:flex;gap:16px;flex:1;min-height:0;">
  <!-- Left: Dark checklist (~40% width) -->
  <div style="flex:4;background:var(--slide-dark);border-radius:8px;padding:22px 24px;position:relative;overflow:hidden;display:flex;flex-direction:column;
              box-shadow:0 4px 12px rgba(0,0,0,0.12);">
    <div style="position:absolute;top:0;left:0;right:0;height:3px;background:var(--slide-accent-light);"></div>
    <h3 style="font-size:13px;font-weight:700;color:var(--slide-accent-light);text-transform:uppercase;letter-spacing:1.5px;margin:0 0 16px;">Foundation</h3>
    <!-- Check items -->
    <div style="display:flex;flex-direction:column;gap:10px;">
      <div style="display:flex;align-items:flex-start;gap:10px;">
        <div style="width:20px;height:20px;border-radius:5px;background:rgba(74,222,128,0.15);display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px;">
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--slide-accent-light)" stroke-width="2.5" width="11" height="11" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <span style="font-size:13px;color:#CBD5E1;line-height:1.5;">Checklist item description</span>
      </div>
      <!-- Repeat items -->
    </div>
  </div>
  <!-- Right: Two stacked white panels (~60% width) -->
  <div style="flex:6;display:flex;flex-direction:column;gap:14px;min-height:0;">
    <div style="flex:1;border:1px solid var(--slide-border);border-radius:8px;padding:18px 22px;box-shadow:0 2px 8px rgba(0,0,0,0.06),0 1px 3px rgba(0,0,0,0.04);">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
        <div style="width:32px;height:32px;border-radius:6px;background:#F8FAFC;border:1px solid var(--slide-border);display:flex;align-items:center;justify-content:center;">
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--slide-accent)" stroke-width="2" width="15" height="15" stroke-linecap="round" stroke-linejoin="round">[icon]</svg>
        </div>
        <h3 style="font-size:14px;font-weight:700;margin:0;">Panel Title</h3>
      </div>
      <p style="font-size:13px;color:var(--slide-secondary);line-height:1.5;margin:0;">Content with details.</p>
    </div>
    <!-- Second panel -->
    <div style="flex:1;border:1px solid var(--slide-border);border-radius:8px;padding:18px 22px;box-shadow:0 2px 8px rgba(0,0,0,0.06),0 1px 3px rgba(0,0,0,0.04);">
      <h3 style="font-size:14px;font-weight:700;margin:0 0 10px;">Second Panel</h3>
      <p style="font-size:13px;color:var(--slide-secondary);line-height:1.5;margin:0;">Wider scope content.</p>
    </div>
  </div>
</div>
```

---

## Pattern 12: Metrics Sidebar + Bar Chart

**Use when:** Financial projections, revenue ramp, time-series data.

**Structure:** Left 280px: 3 dark metric cards. Right flex:1: chart panel + optional sensitivity strip.

```html
<!-- Inside content area -->
<div style="display:flex;gap:16px;flex:1;min-height:0;">
  <!-- Left: Metrics sidebar -->
  <div style="width:280px;display:flex;flex-direction:column;gap:12px;flex-shrink:0;">
    <!-- Dark metric card -->
    <div style="background:var(--slide-dark);border-radius:8px;padding:16px 20px;position:relative;overflow:hidden;flex:1;
                box-shadow:0 4px 12px rgba(0,0,0,0.12);">
      <div style="position:absolute;top:0;left:0;right:0;height:3px;background:var(--slide-accent-light);"></div>
      <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:2px;color:#94A3B8;margin-bottom:8px;">Revenue FY26</div>
      <div style="font-size:28px;font-weight:800;color:#FFFFFF;letter-spacing:-0.5px;">$12.5M</div>
      <div style="font-size:12px;font-weight:600;color:var(--slide-accent-light);margin-top:4px;">+85% YoY</div>
    </div>
    <!-- Repeat 2 more metric cards -->
  </div>
  <!-- Right: Chart panel -->
  <div style="flex:1;display:flex;flex-direction:column;gap:12px;min-height:0;">
    <div style="flex:1;border:1px solid var(--slide-border);border-radius:8px;padding:18px 22px;display:flex;flex-direction:column;
                box-shadow:0 2px 8px rgba(0,0,0,0.06),0 1px 3px rgba(0,0,0,0.04);">
      <!-- Chart legend -->
      <div style="display:flex;gap:20px;font-size:11px;font-weight:600;margin-bottom:14px;">
        <div style="display:flex;align-items:center;gap:6px;"><span style="width:14px;height:14px;background:var(--slide-accent);border-radius:2px;"></span><span style="color:var(--slide-secondary);">Revenue</span></div>
        <div style="display:flex;align-items:center;gap:6px;"><span style="width:14px;height:14px;background:#E2E8F0;border-radius:2px;"></span><span style="color:var(--slide-secondary);">EBITDA</span></div>
      </div>
      <!-- Bar chart area — use height calculation formula from design-system.md -->
      <div style="flex:1;position:relative;display:flex;align-items:flex-end;gap:24px;padding-left:44px;padding-bottom:24px;">
        <!-- Y-axis, gridlines, bar groups per design-system.md chart template -->
        [bars calculated using: height = (value / max_value) * container_height]
      </div>
    </div>
    <!-- Sensitivity strip (optional) -->
    <div style="background:var(--slide-dark);border-radius:8px;padding:12px 18px;display:flex;gap:0;position:relative;overflow:hidden;flex-shrink:0;
                box-shadow:0 4px 12px rgba(0,0,0,0.12);">
      <div style="position:absolute;top:0;left:0;right:0;height:3px;background:var(--slide-accent-light);"></div>
      <div style="flex:1;text-align:center;padding:4px 0;">
        <div style="font-size:10px;color:#94A3B8;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Bear</div>
        <div style="font-size:16px;font-weight:800;color:#FFFFFF;">3.5x</div>
      </div>
      <div style="width:1px;background:#1E293B;margin:0 8px;"></div>
      <div style="flex:1;text-align:center;padding:4px 0;">
        <div style="font-size:10px;color:var(--slide-accent-light);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Base</div>
        <div style="font-size:16px;font-weight:800;color:var(--slide-accent-light);">5.0x</div>
      </div>
      <div style="width:1px;background:#1E293B;margin:0 8px;"></div>
      <div style="flex:1;text-align:center;padding:4px 0;">
        <div style="font-size:10px;color:#94A3B8;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Bull</div>
        <div style="font-size:16px;font-weight:800;color:#FFFFFF;">7.0x</div>
      </div>
    </div>
  </div>
</div>
```

---

## Pattern 13: Dark Hero Banner + Three Panels

**Use when:** Investment ask, key request, or a slide where one number dominates.

```html
<!-- Inside content area -->
<!-- Dark hero banner -->
<div style="background:var(--slide-dark);border-radius:8px;padding:22px 28px;display:flex;align-items:center;position:relative;overflow:hidden;margin-bottom:16px;flex-shrink:0;
            box-shadow:0 4px 12px rgba(0,0,0,0.12);">
  <div style="position:absolute;top:0;left:0;right:0;height:3px;background:var(--slide-accent-light);"></div>
  <!-- Hero amount -->
  <div style="flex-shrink:0;margin-right:32px;">
    <div style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:2.5px;color:#94A3B8;margin-bottom:6px;">RAISING</div>
    <div style="font-size:44px;font-weight:800;color:#FFFFFF;letter-spacing:-1px;">$5M</div>
    <div style="font-size:14px;font-weight:600;color:var(--slide-accent-light);">Series A</div>
  </div>
  <!-- KPI cells separated by dividers -->
  <div style="display:flex;flex:1;gap:0;">
    <div style="width:1px;background:#1E293B;align-self:stretch;margin:0 20px;"></div>
    <div style="flex:1;text-align:center;">
      <div style="font-size:20px;font-weight:800;color:#FFFFFF;">18 mo</div>
      <div style="font-size:11px;color:#94A3B8;margin-top:2px;">Runway</div>
    </div>
    <div style="width:1px;background:#1E293B;align-self:stretch;margin:0 20px;"></div>
    <div style="flex:1;text-align:center;">
      <div style="font-size:20px;font-weight:800;color:#FFFFFF;">$50M</div>
      <div style="font-size:11px;color:#94A3B8;margin-top:2px;">Target ARR</div>
    </div>
  </div>
</div>
<!-- Three panels -->
<div style="display:flex;gap:16px;flex:1;min-height:0;">
  <!-- Use of funds (with allocation bars) -->
  <div style="flex:1;border:1px solid var(--slide-border);border-radius:8px;padding:18px 20px;display:flex;flex-direction:column;
              box-shadow:0 2px 8px rgba(0,0,0,0.06),0 1px 3px rgba(0,0,0,0.04);">
    <h3 style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1.5px;color:#94A3B8;margin:0 0 14px;">Use of Funds</h3>
    <!-- Allocation row -->
    <div style="margin-bottom:12px;">
      <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
        <span style="font-size:12px;font-weight:600;">Engineering</span>
        <span style="font-size:12px;font-weight:700;color:var(--slide-accent);">45%</span>
      </div>
      <div style="background:#F1F5F9;height:6px;border-radius:3px;overflow:hidden;">
        <div style="background:var(--slide-accent);height:6px;width:45%;border-radius:3px;"></div>
      </div>
    </div>
    <!-- Repeat allocation rows -->
  </div>
  <!-- Risk mitigants -->
  <div style="flex:1;border:1px solid var(--slide-border);border-radius:8px;padding:18px 20px;
              box-shadow:0 2px 8px rgba(0,0,0,0.06),0 1px 3px rgba(0,0,0,0.04);">
    <h3 style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1.5px;color:#94A3B8;margin:0 0 14px;">Risk Mitigants</h3>
    <div style="display:flex;flex-direction:column;gap:8px;">
      <div style="display:flex;align-items:flex-start;gap:8px;">
        <div style="width:18px;height:18px;border-radius:4px;background:rgba(21,128,61,0.12);display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px;">
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--slide-accent)" stroke-width="2.5" width="10" height="10" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <span style="font-size:12px;color:var(--slide-secondary);line-height:1.5;">Risk mitigant description</span>
      </div>
    </div>
  </div>
  <!-- Investor profile -->
  <div style="flex:1;border:1px solid var(--slide-border);border-radius:8px;padding:18px 20px;
              box-shadow:0 2px 8px rgba(0,0,0,0.06),0 1px 3px rgba(0,0,0,0.04);">
    <h3 style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1.5px;color:#94A3B8;margin:0 0 14px;">Ideal Partner</h3>
    <p style="font-size:13px;color:var(--slide-secondary);line-height:1.5;margin:0;">Description of ideal investor profile.</p>
  </div>
</div>
```

---

## Pattern 14: 2x2 Sector Grid + Revenue Panel

**Use when:** Showing impact across multiple sectors with a revenue/growth story.

```html
<!-- Inside content area -->
<div style="display:flex;gap:16px;flex:1;min-height:0;">
  <!-- Left: 2x2 grid (flex:3) -->
  <div style="flex:3;display:grid;grid-template-columns:1fr 1fr;gap:14px;">
    <div style="border:1px solid var(--slide-border);border-radius:8px;padding:16px 18px;display:flex;flex-direction:column;
                box-shadow:0 2px 8px rgba(0,0,0,0.06),0 1px 3px rgba(0,0,0,0.04);">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
        <div style="width:28px;height:28px;border-radius:6px;background:#F8FAFC;border:1px solid var(--slide-border);display:flex;align-items:center;justify-content:center;">
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--slide-accent)" stroke-width="2" width="13" height="13" stroke-linecap="round" stroke-linejoin="round">[icon]</svg>
        </div>
        <h3 style="font-size:13px;font-weight:700;margin:0;">Sector Name</h3>
      </div>
      <div style="font-size:22px;font-weight:800;color:var(--slide-text);margin-bottom:4px;">$2.4M</div>
      <p style="font-size:12px;color:var(--slide-secondary);line-height:1.5;margin:0;">Market opportunity description.</p>
    </div>
    <!-- Repeat 3 more grid cells -->
  </div>
  <!-- Right: Revenue panel (flex:2) -->
  <div style="flex:2;border:1px solid var(--slide-border);border-radius:8px;padding:18px 22px;display:flex;flex-direction:column;
              box-shadow:0 2px 8px rgba(0,0,0,0.06),0 1px 3px rgba(0,0,0,0.04);">
    <h3 style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1.5px;color:#94A3B8;margin:0 0 14px;">Revenue Streams</h3>
    <!-- Numbered revenue items -->
    <div style="display:flex;flex-direction:column;gap:12px;flex:1;">
      <div style="display:flex;align-items:flex-start;gap:10px;">
        <div style="width:22px;height:22px;border-radius:5px;background:var(--slide-dark);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;color:var(--slide-accent-light);flex-shrink:0;">1</div>
        <div>
          <div style="font-size:13px;font-weight:700;margin-bottom:2px;">Stream Name</div>
          <div style="font-size:12px;color:var(--slide-secondary);">Description — $X.XM potential</div>
        </div>
      </div>
      <!-- Repeat streams -->
    </div>
    <!-- Talent callout -->
    <div style="border-left:3px solid #15803D;padding:10px 14px;background:#F8FAFC;border-radius:0 6px 6px 0;margin-top:auto;">
      <p style="font-size:12px;color:var(--slide-secondary);font-weight:500;margin:0;">Key hiring or talent note.</p>
    </div>
  </div>
</div>
```

---

## Pattern 15: Dark Stat Cards with Growth Ramp Bars

**Use when:** Showing 5-year projections with trajectory visualization.

```html
<!-- Inside content area -->
<!-- Three dark stat cards -->
<div style="display:flex;gap:16px;margin-bottom:16px;flex-shrink:0;">
  <div style="flex:1;background:var(--slide-dark);border-radius:8px;padding:20px 22px;position:relative;overflow:hidden;display:flex;flex-direction:column;
              box-shadow:0 4px 12px rgba(0,0,0,0.12);">
    <div style="position:absolute;top:0;left:0;right:0;height:3px;background:var(--slide-accent-light);"></div>
    <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:2px;color:#94A3B8;margin-bottom:8px;">Metric Label</div>
    <div style="font-size:32px;font-weight:800;color:#FFFFFF;letter-spacing:-0.5px;margin-bottom:4px;">$50M</div>
    <p style="font-size:12px;color:#94A3B8;line-height:1.5;margin:0 0 14px;">By Year 5 at current trajectory.</p>
    <!-- Growth ramp bar -->
    <div style="margin-top:auto;">
      <div style="background:#1E293B;height:8px;border-radius:4px;overflow:hidden;">
        <div style="height:8px;border-radius:4px;background:linear-gradient(90deg,#15803D,#4ADE80);width:65%;"></div>
      </div>
      <div style="display:flex;justify-content:space-between;margin-top:4px;">
        <span style="font-size:10px;color:#94A3B8;">Y1</span>
        <span style="font-size:10px;color:var(--slide-accent-light);font-weight:600;">Y5</span>
      </div>
    </div>
  </div>
  <!-- Repeat 2 more cards -->
</div>
<!-- Below: Assumptions + callout -->
<div style="display:flex;gap:16px;flex:1;min-height:0;">
  <div style="flex:1;border:1px solid var(--slide-border);border-radius:8px;padding:18px 22px;box-shadow:0 2px 8px rgba(0,0,0,0.06),0 1px 3px rgba(0,0,0,0.04);">
    <h3 style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1.5px;color:#94A3B8;margin:0 0 12px;">Key Assumptions</h3>
    <div style="display:flex;flex-direction:column;gap:6px;">
      <div style="display:flex;align-items:center;gap:8px;">
        <div style="width:6px;height:6px;border-radius:50%;background:var(--slide-accent);flex-shrink:0;"></div>
        <span style="font-size:12px;color:var(--slide-secondary);">Assumption detail</span>
      </div>
    </div>
  </div>
  <div style="flex:1;border-left:3px solid #15803D;padding:16px 20px;background:#F8FAFC;border-radius:0 8px 8px 0;">
    <p style="font-size:14px;color:var(--slide-secondary);font-style:italic;line-height:1.6;margin:0;">
      "Market sizing quote or thesis statement that supports the projections."
    </p>
  </div>
</div>
```

---

## Pattern 16: Dark Ask Blocks + Horizontal Timeline + Thesis

**Use when:** Closing slide with specific requests + timeline + thesis statement.

```html
<!-- Inside content area -->
<!-- Three ask blocks -->
<div style="display:flex;gap:16px;margin-bottom:16px;flex-shrink:0;">
  <div style="flex:1;background:var(--slide-dark);border-radius:8px;padding:18px 20px;position:relative;overflow:hidden;display:flex;flex-direction:column;align-items:center;text-align:center;
              box-shadow:0 4px 12px rgba(0,0,0,0.12);">
    <div style="position:absolute;top:0;left:0;right:0;height:3px;background:var(--slide-accent-light);"></div>
    <div style="width:36px;height:36px;border-radius:8px;background:#1E293B;display:flex;align-items:center;justify-content:center;margin-bottom:12px;">
      <svg viewBox="0 0 24 24" fill="none" stroke="var(--slide-accent-light)" stroke-width="2" width="17" height="17" stroke-linecap="round" stroke-linejoin="round">[icon]</svg>
    </div>
    <h3 style="font-size:14px;font-weight:700;color:#FFFFFF;margin:0 0 6px;">Ask Title</h3>
    <p style="font-size:12px;color:#94A3B8;line-height:1.5;margin:0;">What you need from investors.</p>
  </div>
  <!-- Repeat 2 more blocks -->
</div>
<!-- Horizontal timeline -->
<div style="display:flex;align-items:center;padding:0 28px;margin-bottom:16px;flex-shrink:0;">
  <div style="display:flex;flex-direction:column;align-items:center;flex-shrink:0;">
    <div style="width:28px;height:28px;border-radius:50%;background:var(--slide-accent);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:#FFFFFF;">1</div>
    <div style="font-size:11px;font-weight:600;color:var(--slide-text);margin-top:6px;">Q2 2026</div>
  </div>
  <div style="flex:1;height:2px;background:#E2E8F0;"></div>
  <div style="display:flex;flex-direction:column;align-items:center;flex-shrink:0;">
    <div style="width:28px;height:28px;border-radius:50%;background:#E2E8F0;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:var(--slide-secondary);">2</div>
    <div style="font-size:11px;font-weight:600;color:var(--slide-text);margin-top:6px;">Q3 2026</div>
  </div>
  <div style="flex:1;height:2px;background:#E2E8F0;"></div>
  <div style="display:flex;flex-direction:column;align-items:center;flex-shrink:0;">
    <div style="background:rgba(21,128,61,0.1);border:1px solid rgba(21,128,61,0.25);border-radius:6px;padding:4px 12px;">
      <span style="font-size:11px;font-weight:700;color:var(--slide-accent);">TARGET</span>
    </div>
    <div style="font-size:11px;font-weight:600;color:var(--slide-text);margin-top:6px;">Q4 2026</div>
  </div>
</div>
<!-- Thesis + contact -->
<div style="display:flex;gap:16px;flex:1;min-height:0;">
  <!-- Thesis panel (dark) -->
  <div style="flex:2;background:var(--slide-dark);border-radius:8px;padding:20px 24px;position:relative;overflow:hidden;display:flex;flex-direction:column;justify-content:center;
              box-shadow:0 4px 12px rgba(0,0,0,0.12);">
    <div style="position:absolute;top:0;left:0;right:0;height:3px;background:var(--slide-accent-light);"></div>
    <p style="font-size:16px;color:#FFFFFF;font-style:italic;line-height:1.6;margin:0 0 14px;">
      "Closing thesis statement — why this is the investment to make."
    </p>
    <div style="display:flex;gap:8px;flex-wrap:wrap;">
      <span style="background:#1E293B;color:var(--slide-accent-light);font-size:10px;font-weight:700;padding:4px 10px;border-radius:4px;text-transform:uppercase;">Benefit 1</span>
      <span style="background:#1E293B;color:var(--slide-accent-light);font-size:10px;font-weight:700;padding:4px 10px;border-radius:4px;text-transform:uppercase;">Benefit 2</span>
    </div>
  </div>
  <!-- Contact panel -->
  <div style="flex:1;border:1px solid var(--slide-border);border-radius:8px;padding:20px 22px;display:flex;flex-direction:column;justify-content:center;
              box-shadow:0 2px 8px rgba(0,0,0,0.06),0 1px 3px rgba(0,0,0,0.04);">
    <h3 style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1.5px;color:#94A3B8;margin:0 0 12px;">Contact</h3>
    <div style="font-size:14px;font-weight:700;margin-bottom:4px;">Founder Name</div>
    <div style="font-size:12px;color:var(--slide-secondary);margin-bottom:2px;">founder@company.com</div>
    <div style="font-size:12px;color:var(--slide-secondary);">+1 (555) 000-0000</div>
  </div>
</div>
```

---

## Choosing a Layout

When you receive a slide, ask yourself:

1. **What's the ONE thing this slide needs to communicate?** — That determines the hero element
2. **How many distinct info blocks are there?** — 2-3 = panels, 4+ = grid or rows
3. **Is there a natural comparison?** — Pattern 6 (table) or 7 (before/after)
4. **Is there a natural sequence?** — Pattern 10 or 16 (timeline)
5. **Is there a mathematical relationship?** — Pattern 5 (equation)
6. **Is this financial?** — Pattern 12 (must include chart)
7. **What layout did the PREVIOUS slide use?** — Use something different

## Variety Tracking

For a 10-slide pitch deck, aim for this distribution:
- 1 cover slide (Pattern 1)
- 2-3 dark stat/hero layouts (Patterns 2, 4, 13)
- 2-3 panel/card layouts (Patterns 3, 8, 11)
- 1 comparison or transformation (Pattern 6 or 7)
- 1 financial/chart layout (Pattern 12 or 15)
- 1 closing CTA (Pattern 16)

Never use the same pattern more than twice in a deck, and never consecutively.

