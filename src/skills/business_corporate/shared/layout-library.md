# Layout Library — Executive Business Review HTML Slide Deck

Fourteen proven layout patterns. Every slide uses exactly one pattern. Never repeat on consecutive slides.

---

## Layout-Level Quality Rules (Apply to EVERY pattern)

1. Gap between cards in rows/grids: minimum `16px`
2. Win card gap: `14px` between the 5 win columns
3. KPI grid gap: `18px` between the 3 section columns
4. Narrative section padding: `22px 26px`
5. Risk grid gap: `14px`
6. Header margin-bottom on wins slide: `20px` before win cards
7. All card border-radius: `10px` on main cards, `8px` on utility containers
8. All card shadows present — never omit `box-shadow` on white cards

---

## Pattern Index

| # | Name | Best For | Key Visual |
|---|---|---|---|
| 1 | Two-Panel Dark Cover | Opening slide | Left title + right KPI snapshot |
| 2 | 5-Metric Row + Narrative | Executive summary | 5 equal metric cards + 7/5 narrative split |
| 3 | 3-Column KPI Tables | Full KPI scorecard | 3 section cards with gray top border + miss tinting |
| 4 | SVG Chart + 3-Panel Sidebar | Revenue trend | Annotated bar+line chart + 3 stacked insight panels |
| 5 | Two-Column Bridge + Bars | Root cause analysis | Left waterfall + right margin bars |
| 6 | Win Cards + Accent + Quote Row | Wins and highlights | 5-col win cards (border-bottom green) + quote row |
| 7 | RED Table + 2×2 Risk Grid | Challenges and risks | Dark header table + 2×2 risk cards with padding |
| 8 | Floating Table + Dark Footer | Initiatives dashboard | Floating card rows + dark 12px-radius footer |
| 9 | Status Badge + 7/5 Deep-Dive | Single initiative spotlight | AT RISK pill + analysis left + dark right panel |
| 10 | Plain Header + Table + Donut | Financial statement | No-border h1 + dark header table + donut + cash |
| 11 | RED + 3 Scorecards + Mini Charts | Unit economics | Red header + 3 cards + data table + 2 SVG charts |
| 12 | Segment Cards + Diverging Chart | Segment performance | 3 color-coded cards + diverging bar + insight column |
| 13 | Priority Cards + Dark Panel | Forward priorities | 4 numbered cards + dark enterprise panel |
| 14 | Decision Grid + Avatar Footer | Critical decisions | RED header + 2×2 decision cards + avatar footer |

---

## B1: Two-Panel Dark Cover

For: opening slide — always first, no standard header/footer.

```html
<div style="width:1280px;height:720px;overflow:hidden;display:flex;font-family:'Inter',sans-serif;">
  <!-- LEFT: Title -->
  <div style="width:700px;height:720px;background:#333333;display:flex;flex-direction:column;
              justify-content:space-between;padding:52px 50px;position:relative;flex-shrink:0;">
    <svg style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;" viewBox="0 0 700 720">
      <line x1="0" y1="180" x2="700" y2="180" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>
      <line x1="0" y1="360" x2="700" y2="360" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>
      <line x1="0" y1="540" x2="700" y2="540" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>
      <line x1="175" y1="0" x2="175" y2="720" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
      <line x1="350" y1="0" x2="350" y2="720" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
      <line x1="525" y1="0" x2="525" y2="720" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
    </svg>
    <div style="position:relative;z-index:1;">
      <div style="display:inline-flex;align-items:center;gap:8px;border:1px solid rgba(255,255,255,0.14);padding:5px 14px;border-radius:4px;margin-bottom:28px;">
        <div style="width:6px;height:6px;border-radius:50%;background:#2D7D46;flex-shrink:0;"></div>
        <span style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2.5px;color:rgba(255,255,255,0.45);">[PERIOD_BADGE]</span>
      </div>
      <div style="width:48px;height:5px;background:#2D7D46;border-radius:2px;margin-bottom:24px;"></div>
      <h1 style="font-size:68px;font-weight:800;line-height:1.04;letter-spacing:-2px;margin:0 0 22px;color:#fff;">
        [HEADLINE]<br><span style="color:rgba(255,255,255,0.78);">[HEADLINE_LINE2]</span>
      </h1>
      <p style="font-size:14px;font-weight:300;letter-spacing:2.5px;text-transform:uppercase;color:rgba(255,255,255,0.42);margin:0;">[SUBTITLE]</p>
    </div>
    <div style="border-top:1px solid rgba(255,255,255,0.12);padding-top:20px;position:relative;z-index:1;">
      <p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:rgba(255,255,255,0.3);margin:0 0 6px;">Presented by</p>
      <p style="font-size:16px;font-weight:500;margin:0;color:rgba(255,255,255,0.82);">[PRESENTER_NAMES]</p>
    </div>
  </div>
  <!-- RIGHT: KPI Snapshot -->
  <div style="flex:1;height:720px;background:#1c2030;display:flex;flex-direction:column;padding:40px 36px;">
    <div style="margin-bottom:22px;">
      <p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:3px;color:rgba(255,255,255,0.28);margin:0 0 8px;">[SNAPSHOT_LABEL]</p>
      <div style="width:28px;height:2px;background:#2D7D46;border-radius:1px;"></div>
    </div>
    <!-- KPI row — repeat for each item -->
    <div style="display:flex;justify-content:space-between;align-items:center;padding:14px 0;border-bottom:1px solid rgba(255,255,255,0.07);">
      <span style="font-size:12px;color:rgba(255,255,255,0.55);">[KPI_LABEL]</span>
      <div style="text-align:right;">
        <div style="font-size:18px;font-weight:700;color:#fff;">[KPI_VALUE]</div>
        <div style="font-size:11px;color:#FCA5A5;">[KPI_DELTA]</div>
      </div>
    </div>
    <!-- repeat for each item -->
    <div style="flex:1;display:flex;align-items:center;margin-top:16px;">
      <div style="width:100%;background:rgba(192,80,77,0.1);border:1px solid rgba(192,80,77,0.25);border-radius:8px;padding:14px 18px;display:flex;align-items:center;justify-content:space-between;">
        <div>
          <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:rgba(255,255,255,0.35);margin-bottom:4px;">Overall Status</div>
          <div style="font-size:15px;font-weight:700;color:#fff;">[STATUS_TEXT]</div>
        </div>
        <div style="display:flex;gap:6px;">
          <div style="width:10px;height:10px;border-radius:50%;background:#C0504D;"></div>
          <div style="width:10px;height:10px;border-radius:50%;background:#D97706;"></div>
          <div style="width:10px;height:10px;border-radius:50%;background:#2D7D46;"></div>
        </div>
      </div>
    </div>
    <div style="margin-top:16px;padding-top:14px;border-top:1px solid rgba(255,255,255,0.07);">
      <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:3px;color:rgba(255,255,255,0.18);">[CONFIDENTIALITY_LABEL]</div>
    </div>
  </div>
</div>
```

---

## B2: 5-Metric Row + Narrative

For: executive summary — top 5 KPIs with status + narrative + forward outlook.

Structure: 5 equal metric cards (UNIFORM `#333333` top border) + below: `7fr/5fr` grid.

One metric card (the most critical miss) gets dark background: value→`#fff`, delta→`#FCA5A5`, label→`rgba(255,255,255,0.55)`.

```html
<!-- Metric card (white) — repeat for each item -->
<div style="flex:1;background:#fff;border-top:4px solid #333333;border-radius:10px;padding:16px 18px;
            box-shadow:0 2px 8px rgba(0,0,0,0.08),0 1px 3px rgba(0,0,0,0.05);">
  <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#9CA3AF;margin-bottom:8px;">[METRIC_LABEL]</div>
  <div style="font-size:32px;font-weight:800;color:#333333;letter-spacing:-0.5px;line-height:1;">[METRIC_VALUE]</div>
  <div style="font-size:11px;font-weight:700;color:#C0504D;margin-top:4px;">[METRIC_DELTA]</div>
</div>
<!-- repeat for each item -->

<!-- Narrative section -->
<div style="background:#fff;padding:22px 26px;border-radius:10px;flex:1;
            display:grid;grid-template-columns:7fr 5fr;gap:30px;min-height:0;
            box-shadow:0 2px 8px rgba(0,0,0,0.08),0 1px 3px rgba(0,0,0,0.05);">
  <!-- Left: Executive Narrative -->
  <div>
    <h3 style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;
               color:#9CA3AF;margin:0 0 16px;display:flex;align-items:center;gap:8px;">
      [DOCUMENT_ICON_SVG_13PX] Executive Narrative
    </h3>
    <div style="display:flex;flex-direction:column;gap:14px;">
      <!-- Bullet: red=miss, amber=risk, green=win — repeat for each item -->
      <div style="display:flex;align-items:flex-start;gap:10px;">
        <div style="width:9px;height:9px;border-radius:50%;background:#C0504D;flex-shrink:0;margin-top:4px;"></div>
        <p style="font-size:13px;line-height:1.55;margin:0;color:#374151;"><strong>[BULLET_LABEL]:</strong> [BULLET_TEXT]</p>
      </div>
      <!-- repeat for each item -->
    </div>
  </div>
  <!-- Right: Outlook -->
  <div style="border-left:1px solid #F3F4F6;padding-left:26px;display:flex;flex-direction:column;gap:14px;">
    <h3 style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#9CA3AF;margin:0;">[OUTLOOK_LABEL]</h3>
    <div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
        <span style="font-size:13px;color:#6B7280;">[BAR_LABEL]</span>
        <span style="font-size:13px;font-weight:700;color:#2D7D46;">[BAR_VALUE]</span>
      </div>
      <div style="background:#F3F4F6;height:6px;border-radius:999px;overflow:hidden;">
        <div style="background:#2D7D46;height:6px;width:80%;border-radius:999px;"></div>
      </div>
    </div>
    <div style="border-left:3px solid #2D7D46;padding-left:12px;">
      <p style="font-size:12px;color:#6B7280;font-style:italic;line-height:1.65;margin:0;">"[QUOTE_TEXT]"</p>
    </div>
    <div style="display:flex;gap:0;border-top:1px solid #F3F4F6;padding-top:14px;">
      <div style="flex:1;text-align:center;">
        <p style="font-size:24px;font-weight:800;color:#333333;margin:0 0 3px;letter-spacing:-0.5px;">[STAT_NUMBER]</p>
        <p style="font-size:10px;text-transform:uppercase;font-weight:700;color:#9CA3AF;margin:0;">[STAT_LABEL]</p>
      </div>
      <div style="flex:1;text-align:center;border-left:1px solid #F3F4F6;">
        <p style="font-size:24px;font-weight:800;color:#333333;margin:0 0 3px;letter-spacing:-0.5px;">[STAT_NUMBER]</p>
        <p style="font-size:10px;text-transform:uppercase;font-weight:700;color:#9CA3AF;margin:0;">[STAT_LABEL]</p>
      </div>
    </div>
    <div style="display:flex;gap:8px;border-top:1px solid #F3F4F6;padding-top:12px;">
      <div style="flex:1;background:#FEE2E2;border-radius:6px;padding:8px;text-align:center;">
        <div style="font-size:20px;font-weight:800;color:#C0504D;">[COUNT]</div>
        <div style="font-size:9px;font-weight:700;text-transform:uppercase;color:#9CA3AF;margin-top:2px;">KPIs Miss</div>
      </div>
      <div style="flex:1;background:#FEF3C7;border-radius:6px;padding:8px;text-align:center;">
        <div style="font-size:20px;font-weight:800;color:#D97706;">[COUNT]</div>
        <div style="font-size:9px;font-weight:700;text-transform:uppercase;color:#9CA3AF;margin-top:2px;">Near Target</div>
      </div>
      <div style="flex:1;background:#D1FAE5;border-radius:6px;padding:8px;text-align:center;">
        <div style="font-size:20px;font-weight:800;color:#2D7D46;">[COUNT]</div>
        <div style="font-size:9px;font-weight:700;text-transform:uppercase;color:#9CA3AF;margin-top:2px;">On Track</div>
      </div>
    </div>
  </div>
</div>
```

---

## B3: 3-Column KPI Tables

For: full KPI scorecard — 3 domains, 5 KPIs each.

```html
<!-- KPI grid: 3 columns, gap 18px -->
<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:18px;flex:1;min-height:0;">

  <!-- Section card — GRAY top border, NOT colored — repeat for each item -->
  <div style="background:#fff;border-top:4px solid #E5E7EB;border-radius:10px;
              padding:18px 20px;display:flex;flex-direction:column;
              box-shadow:0 2px 8px rgba(0,0,0,0.08),0 1px 3px rgba(0,0,0,0.05);">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;">
      <div style="width:10px;height:10px;border-radius:50%;background:#C0504D;flex-shrink:0;"></div>
      [DOMAIN_ICON_SVG_15PX]
      <span style="font-size:16px;font-weight:700;color:#374151;">[DOMAIN_NAME]</span>
      <span style="margin-left:auto;font-size:10px;color:#C0504D;font-weight:700;">[MISS_COUNT] · [NEAR_COUNT]</span>
    </div>
    <table style="width:100%;border-collapse:collapse;">
      <thead>
        <tr>
          <th style="font-size:10px;text-transform:uppercase;letter-spacing:0.8px;color:#9CA3AF;padding-bottom:7px;border-bottom:1px solid #E5E7EB;text-align:left;font-weight:700;">Metric</th>
          <th style="font-size:10px;text-transform:uppercase;letter-spacing:0.8px;color:#9CA3AF;padding-bottom:7px;border-bottom:1px solid #E5E7EB;text-align:left;font-weight:700;">Actual</th>
          <th style="font-size:10px;text-transform:uppercase;letter-spacing:0.8px;color:#9CA3AF;padding-bottom:7px;border-bottom:1px solid #E5E7EB;text-align:left;font-weight:700;">Target</th>
          <th style="font-size:10px;text-transform:uppercase;letter-spacing:0.8px;color:#9CA3AF;padding-bottom:7px;border-bottom:1px solid #E5E7EB;text-align:left;font-weight:700;">Δ</th>
        </tr>
      </thead>
      <tbody>
        <!-- miss row — repeat for each item -->
        <tr style="background:#FFF5F5;">
          <td style="padding:8px 0;border-bottom:1px solid #F9FAFB;font-size:12px;vertical-align:middle;">[METRIC_NAME]</td>
          <td style="padding:8px 0;border-bottom:1px solid #F9FAFB;font-size:12px;vertical-align:middle;">[ACTUAL]</td>
          <td style="padding:8px 0;border-bottom:1px solid #F9FAFB;font-size:12px;vertical-align:middle;">[TARGET]</td>
          <td style="padding:8px 0;border-bottom:1px solid #F9FAFB;font-size:12px;vertical-align:middle;color:#C0504D;font-weight:700;">[DELTA]</td>
        </tr>
        <!-- repeat for each item (near=FFFDF0, good=F0FFF4) -->
      </tbody>
    </table>
  </div>
  <!-- repeat for each item -->

</div>

<!-- Footer -->
<footer style="margin-top:14px;background:#fff;border-radius:8px;border-left:4px solid #333333;
               padding:11px 18px;display:flex;justify-content:space-between;align-items:center;
               flex-shrink:0;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
  <div style="display:flex;gap:22px;">
    <div style="display:flex;align-items:center;gap:6px;"><span style="width:9px;height:9px;border-radius:50%;background:#2D7D46;"></span><span style="font-size:11px;font-weight:600;text-transform:uppercase;color:#6B7280;">Meeting Target</span></div>
    <div style="display:flex;align-items:center;gap:6px;"><span style="width:9px;height:9px;border-radius:50%;background:#D97706;"></span><span style="font-size:11px;font-weight:600;text-transform:uppercase;color:#6B7280;">Near / At Risk</span></div>
    <div style="display:flex;align-items:center;gap:6px;"><span style="width:9px;height:9px;border-radius:50%;background:#C0504D;"></span><span style="font-size:11px;font-weight:600;text-transform:uppercase;color:#6B7280;">Missing Target</span></div>
  </div>
  <div style="font-size:12px;font-weight:500;color:#9CA3AF;">Total: [TOTAL] | <span style="color:#C0504D;font-weight:700;">[ATTENTION_TEXT]</span></div>
</footer>
```

---

## B4: SVG Chart + 3-Panel Sidebar

For: revenue or metric trend — annotated bar+line chart + insight panels.

Structure: `9fr / 3fr` grid. Top sidebar panel gets `#333333` dark background.

```html
<div style="display:grid;grid-template-columns:9fr 3fr;gap:18px;flex:1;min-height:0;">

  <!-- Chart area -->
  <div style="background:#fff;padding:20px 22px;border-radius:10px;display:flex;flex-direction:column;min-height:0;
              box-shadow:0 2px 8px rgba(0,0,0,0.08),0 1px 3px rgba(0,0,0,0.05);">
    <!-- Legend row -->
    <div style="display:flex;gap:20px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:12px;">
      <div style="display:flex;align-items:center;gap:6px;"><span style="width:14px;height:14px;background:#4B5563;border-radius:2px;"></span>[LEGEND_1]</div>
      <div style="display:flex;align-items:center;gap:6px;"><span style="width:14px;height:3px;background:#2D7D46;"></span>[LEGEND_2]</div>
      <div style="display:flex;align-items:center;gap:6px;"><span style="width:14px;height:14px;background:#2D7D46;border-radius:2px;"></span>[LEGEND_3]</div>
    </div>
    [SVG_CHART]
  </div>

  <!-- Sidebar: 3 stacked panels -->
  <div style="display:flex;flex-direction:column;gap:12px;min-height:0;">

    <!-- Panel 1: Dark (Key Momentum) -->
    <div style="background:#333333;border-radius:10px;padding:16px;flex:1;min-height:0;
                box-shadow:0 2px 8px rgba(0,0,0,0.12);">
      <h3 style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#2D7D46;margin:0 0 10px;">[PANEL_1_LABEL]</h3>
      <p style="font-size:20px;font-weight:700;margin:0 0 8px;color:#fff;">[PANEL_1_HEADLINE]</p>
      <p style="font-size:12px;color:rgba(255,255,255,0.65);line-height:1.55;margin:0 0 10px;">[PANEL_1_DESCRIPTION]</p>
      <div style="display:flex;align-items:center;gap:6px;color:#2D7D46;font-weight:700;font-size:12px;">[ACTIVITY_ICON_SVG] [PANEL_1_STAT]</div>
    </div>

    <!-- Panel 2: White (Monthly Split) -->
    <div style="background:#fff;border-radius:10px;padding:14px 16px;flex:1;min-height:0;
                box-shadow:0 2px 8px rgba(0,0,0,0.08),0 1px 3px rgba(0,0,0,0.05);">
      [PANEL_2_CONTENT]
    </div>

    <!-- Panel 3: Light gray (Summary) -->
    <div style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:10px;padding:14px 16px;flex-shrink:0;
                box-shadow:0 1px 3px rgba(0,0,0,0.04);">
      [PANEL_3_CONTENT]
    </div>

  </div>
</div>
```

---

## B5: Two-Column Bridge + Bars

For: root cause analysis — revenue waterfall left + margin compression bars right.

Header uses `border-left: 6px solid #333333; padding-left: 16px`. Structure: `1fr / 1fr` grid.

```html
<!-- Left: Waterfall bridge -->
<div style="background:#fff;padding:18px 22px;border-radius:10px;flex:1;display:flex;flex-direction:column;min-height:0;
            box-shadow:0 2px 8px rgba(0,0,0,0.08),0 1px 3px rgba(0,0,0,0.05);">
  <!-- Bridge row — repeat for each item -->
  <div style="display:flex;align-items:center;padding:8px 0;border-bottom:1px solid #F9FAFB;gap:10px;">
    <span style="font-size:12px;font-weight:600;min-width:180px;flex-shrink:0;">[BRIDGE_LABEL]</span>
    <div style="flex:1;background:#F3F4F6;height:9px;border-radius:3px;overflow:hidden;">
      <div style="background:#FECACA;height:9px;width:[PCT]%;border-radius:3px;"></div>
    </div>
    <span style="font-size:13px;font-weight:700;min-width:60px;text-align:right;color:#C0504D;">[BRIDGE_VALUE]</span>
  </div>
  <!-- repeat for each item -->
  <div style="background:#FEF2F2;border-radius:8px;padding:12px 16px;display:flex;justify-content:space-between;align-items:center;margin-top:14px;">
    <span style="font-size:13px;font-weight:700;">Net Revenue Impact</span>
    <span style="font-size:18px;font-weight:800;color:#C0504D;">[NET_IMPACT]</span>
  </div>
</div>

<!-- Leading indicators (below bridge on left) -->
<div style="background:#fff;border-radius:10px;padding:14px 18px;margin-top:12px;flex-shrink:0;
            box-shadow:0 2px 8px rgba(0,0,0,0.06);">
  <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#9CA3AF;display:flex;align-items:center;gap:6px;margin-bottom:12px;">
    [FUNNEL_ICON_SVG] Leading Indicators
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
    <!-- repeat for each item -->
    <div style="text-align:center;padding:10px;background:#F0FDF4;border-radius:8px;">
      <div style="font-size:24px;font-weight:700;color:#2D7D46;">[STAT_NUMBER]</div>
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;color:#9CA3AF;letter-spacing:0.5px;margin-top:2px;">[STAT_LABEL]</div>
    </div>
    <!-- repeat for each item -->
  </div>
</div>

<!-- Right: Margin compression bars -->
<div style="background:#fff;padding:18px 22px;border-radius:10px;flex:1;display:flex;flex-direction:column;
            box-shadow:0 2px 8px rgba(0,0,0,0.08),0 1px 3px rgba(0,0,0,0.05);">
  <!-- Driver row — repeat for each item -->
  <div style="margin-bottom:18px;">
    <div style="display:flex;justify-content:space-between;margin-bottom:7px;">
      <div>
        <div style="font-size:13px;font-weight:600;">[DRIVER_NAME]</div>
        <div style="font-size:11px;color:#9CA3AF;">[DRIVER_CAUSE]</div>
      </div>
      <span style="font-size:15px;font-weight:700;color:#C0504D;">[DRIVER_IMPACT]</span>
    </div>
    <div style="background:#F3F4F6;height:10px;border-radius:999px;overflow:hidden;">
      <div style="background:#C0504D;height:10px;width:[PCT]%;border-radius:999px;"></div>
    </div>
    <div style="font-size:10px;color:#9CA3AF;margin-top:4px;">[PCT_LABEL]</div>
  </div>
  <!-- repeat for each item -->
  <div style="margin-top:auto;border-top:1px solid #F3F4F6;padding-top:16px;">
    <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;background:#F0FDF4;border-radius:8px;border:1px solid #D1FAE5;">
      <div style="display:flex;align-items:center;gap:10px;">
        [CHECK_CIRCLE_SVG_GREEN]
        <div>
          <p style="font-size:13px;font-weight:700;color:#14532D;margin:0 0 2px;">[OFFSET_LABEL]</p>
          <p style="font-size:11px;color:#2D7D46;margin:0;">[OFFSET_DESC]</p>
        </div>
      </div>
      <span style="font-size:15px;font-weight:700;color:#2D7D46;">[OFFSET_VALUE]</span>
    </div>
  </div>
  <p style="font-size:12px;color:#6B7280;font-style:italic;line-height:1.65;margin:14px 0 0;border-top:1px solid #F3F4F6;padding-top:14px;">"[QUOTE_TEXT]"</p>
</div>
```

---

## B6: Win Cards + Accent Block + Quote Row

For: quarterly wins, success highlights.

Header `margin-bottom: 20px`. Win cards: `border-bottom: 6px solid #2D7D46; border-radius: 10px 10px 0 0`.

```html
<!-- 5-col win card grid, gap 14px -->
<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:14px;flex-shrink:0;margin-bottom:14px;">

  <!-- Win card — repeat for each item -->
  <div style="background:#fff;border-bottom:6px solid #2D7D46;border-radius:10px 10px 0 0;padding:18px;display:flex;flex-direction:column;
              box-shadow:0 2px 8px rgba(0,0,0,0.08),0 1px 3px rgba(0,0,0,0.05);">
    <div style="margin-bottom:12px;">[ICON_SVG_22PX_GREEN]</div>
    <h2 style="font-size:15px;font-weight:700;line-height:1.35;margin:0 0 auto;">[WIN_TITLE]</h2>
    <div style="margin-top:16px;">
      <p style="font-size:28px;font-weight:800;color:#2D7D46;margin:0 0 2px;letter-spacing:-0.5px;">[WIN_METRIC]</p>
      <p style="font-size:10px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 10px;">[WIN_METRIC_LABEL]</p>
      <div style="background:#F0FDF4;border-radius:6px;padding:7px 10px;margin-bottom:10px;">
        <div style="font-size:11px;color:#2D7D46;font-weight:600;">[WIN_DETAIL]</div>
      </div>
      <p style="font-size:12px;color:#6B7280;line-height:1.55;margin:0;">[WIN_DESCRIPTION]</p>
    </div>
  </div>
  <!-- repeat for each item -->

</div>

<!-- Bottom row: 1fr/4fr grid -->
<div style="display:grid;grid-template-columns:1fr 4fr;gap:16px;background:#fff;padding:18px 22px;border-radius:10px;flex:1;min-height:0;align-items:center;
            box-shadow:0 2px 8px rgba(0,0,0,0.08),0 1px 3px rgba(0,0,0,0.05);">
  <!-- Green accent block -->
  <div style="background:#2D7D46;border-radius:8px;height:100%;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:4px;padding:14px;">
    <div style="font-size:28px;font-weight:800;color:#fff;">[ACCENT_STAT]</div>
    <div style="font-size:9px;font-weight:700;text-transform:uppercase;color:rgba(255,255,255,0.7);letter-spacing:1px;text-align:center;">[ACCENT_LABEL]</div>
  </div>
  <!-- Quote / summary -->
  <div>[QUOTE_CONTENT]</div>
</div>
```

---

## B7: RED Table + 2×2 Risk Grid

For: challenges and critical risks. Slide stripe: `#C0504D`.

```html
<!-- Challenge table -->
<div style="background:#fff;border-radius:10px;overflow:hidden;flex-shrink:0;margin-bottom:14px;
            box-shadow:0 2px 8px rgba(0,0,0,0.08),0 1px 3px rgba(0,0,0,0.05);">
  <table style="width:100%;border-collapse:collapse;">
    <thead style="background:#333333;">
      <tr>
        <th style="color:rgba(255,255,255,0.6);font-size:10px;text-transform:uppercase;letter-spacing:1px;padding:10px 18px;font-weight:700;text-align:left;">Area</th>
        <th style="color:rgba(255,255,255,0.6);font-size:10px;text-transform:uppercase;letter-spacing:1px;padding:10px 18px;font-weight:700;text-align:left;">Metric / Miss</th>
        <th style="color:rgba(255,255,255,0.6);font-size:10px;text-transform:uppercase;letter-spacing:1px;padding:10px 18px;font-weight:700;text-align:left;">Severity</th>
        <th style="color:rgba(255,255,255,0.6);font-size:10px;text-transform:uppercase;letter-spacing:1px;padding:10px 18px;font-weight:700;text-align:left;">Owner</th>
      </tr>
    </thead>
    <tbody>
      <!-- miss row — repeat for each item -->
      <tr style="background:#FFF5F5;">
        <td style="padding:10px 18px;font-size:13px;vertical-align:middle;border-bottom:1px solid #FEE2E2;">[AREA]</td>
        <td style="padding:10px 18px;font-size:13px;vertical-align:middle;border-bottom:1px solid #FEE2E2;color:#C0504D;font-weight:700;">[METRIC_MISS]</td>
        <td style="padding:10px 18px;font-size:13px;vertical-align:middle;border-bottom:1px solid #FEE2E2;">[SEVERITY_PILL]</td>
        <td style="padding:10px 18px;font-size:13px;vertical-align:middle;border-bottom:1px solid #FEE2E2;">[OWNER]</td>
      </tr>
      <!-- repeat for each item (near=FFFDF0/FEF3C7) -->
    </tbody>
  </table>
</div>

<!-- 2×2 risk grid, gap 14px -->
<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;flex:1;min-height:0;">
  <!-- Risk card — repeat for each item (padding: 18px 20px) -->
  <div style="background:#fff;border-radius:10px;padding:18px 20px;
              box-shadow:0 2px 8px rgba(0,0,0,0.08),0 1px 3px rgba(0,0,0,0.05);">
    [RISK_CARD_CONTENT]
  </div>
  <!-- repeat for each item -->
</div>
```

---

## B8: Floating Table + Dark Footer

For: strategic initiatives dashboard.

```html
<!-- Floating initiatives table -->
<table style="width:100%;border-collapse:separate;border-spacing:0 8px;">
  <thead>
    <tr>
      <th style="text-align:left;padding:4px 18px;color:#9CA3AF;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">[COL_HEADER]</th>
      <!-- repeat for each item -->
    </tr>
  </thead>
  <tbody>
    <!-- Row — repeat for each item -->
    <tr>
      <td style="background:#fff;padding:12px 18px;font-size:13px;vertical-align:middle;border-radius:8px 0 0 8px;box-shadow:0 1px 4px rgba(0,0,0,0.06);">[INITIATIVE_NAME]</td>
      <td style="background:#fff;padding:12px 18px;font-size:13px;vertical-align:middle;box-shadow:0 1px 4px rgba(0,0,0,0.06);">[STATUS_PILL]</td>
      <td style="background:#fff;padding:12px 18px;font-size:13px;vertical-align:middle;box-shadow:0 1px 4px rgba(0,0,0,0.06);">[PROGRESS_BAR]</td>
      <td style="background:#fff;padding:12px 18px;font-size:13px;vertical-align:middle;border-radius:0 8px 8px 0;box-shadow:0 1px 4px rgba(0,0,0,0.06);">[OWNER]</td>
    </tr>
    <!-- repeat for each item -->
  </tbody>
</table>

<!-- Dark footer — 12px radius -->
<footer style="flex-shrink:0;background:#333333;color:#fff;border-radius:12px;
               padding:14px 22px;margin-top:10px;display:flex;align-items:center;
               justify-content:space-between;box-shadow:0 4px 12px rgba(0,0,0,0.15);">
  <div style="display:flex;align-items:center;gap:24px;">
    <div>
      <p style="font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#6B7280;font-weight:700;margin:0 0 7px;">Portfolio Health</p>
      <div style="display:flex;align-items:center;gap:16px;font-size:12px;font-weight:500;">
        <span style="display:flex;align-items:center;gap:5px;"><span style="width:8px;height:8px;border-radius:50%;background:#10B981;"></span>[STATUS_LABEL]</span>
        <!-- repeat for each item -->
      </div>
    </div>
    <div style="width:1px;height:36px;background:rgba(255,255,255,0.15);"></div>
    <div>
      <p style="font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#6B7280;font-weight:700;margin:0 0 7px;">Execution Confidence</p>
      <div style="display:flex;align-items:center;gap:10px;">
        <span style="font-size:22px;font-weight:700;">[CONFIDENCE_PCT]</span>
        <div style="width:110px;background:rgba(255,255,255,0.1);height:6px;border-radius:999px;overflow:hidden;">
          <div style="background:#2D7D46;height:6px;width:[PCT]%;border-radius:999px;"></div>
        </div>
      </div>
    </div>
  </div>
  <p style="font-size:12px;font-weight:300;color:#D1D5DB;line-height:1.6;margin:0;font-style:italic;max-width:240px;text-align:right;">"[QUOTE_TEXT]"</p>
</footer>
```

---

## B9: Status Badge Header + 7/5 Deep-Dive

For: single initiative spotlight with AT RISK or ON TRACK status pill.

```html
<!-- Header with badge -->
<header style="display:flex;justify-content:space-between;align-items:flex-start;flex-shrink:0;margin-bottom:14px;">
  <div>
    <h1 style="font-size:28px;font-weight:700;border-left:8px solid #333333;padding-left:13px;margin:0 0 4px;">[INITIATIVE_TITLE]</h1>
    <p style="font-size:13px;font-weight:300;color:#6B7280;margin:0 0 0 21px;">[INITIATIVE_SUBTITLE]</p>
  </div>
  <div style="background:#FEF3C7;color:#92400E;border:1px solid #F59E0B;padding:7px 20px;border-radius:999px;font-weight:700;font-size:13px;display:flex;align-items:center;gap:8px;flex-shrink:0;">
    [WARNING_ICON_SVG] [STATUS_TEXT]
  </div>
</header>

<!-- 7fr/5fr main grid -->
<div style="display:grid;grid-template-columns:7fr 5fr;gap:18px;flex:1;min-height:0;">

  <!-- Left column -->
  <div style="display:flex;flex-direction:column;min-height:0;">
    <!-- Strategic objective card -->
    <div style="background:#fff;border-radius:10px;padding:18px 22px;margin-bottom:14px;flex-shrink:0;
                box-shadow:0 2px 8px rgba(0,0,0,0.08),0 1px 3px rgba(0,0,0,0.05);">
      <h3 style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#9CA3AF;margin:0 0 14px;">Strategic Objective</h3>
      <p style="font-size:20px;font-weight:300;line-height:1.4;color:#374151;margin:0 0 14px;">[OBJECTIVE_TEXT]</p>
      <div style="display:flex;align-items:center;gap:12px;">
        <div style="background:#F3F4F6;border-radius:6px;padding:8px 12px;text-align:center;flex-shrink:0;">
          <div style="font-size:18px;font-weight:800;">[CURRENT_VALUE]</div>
          <div style="font-size:9px;color:#9CA3AF;text-transform:uppercase;">Current</div>
        </div>
        <div style="flex:1;position:relative;">
          <div style="background:#E5E7EB;height:8px;border-radius:999px;overflow:hidden;">
            <div style="background:#333333;height:8px;width:[PCT]%;border-radius:999px;"></div>
          </div>
          <div style="position:absolute;left:calc([PCT]% + 2px);top:-3px;width:1.5px;height:14px;background:#2D7D46;"></div>
        </div>
        <div style="background:#D1FAE5;border-radius:6px;padding:8px 12px;text-align:center;flex-shrink:0;">
          <div style="font-size:18px;font-weight:800;color:#2D7D46;">[TARGET_VALUE]</div>
          <div style="font-size:9px;color:#9CA3AF;text-transform:uppercase;">Target</div>
        </div>
      </div>
    </div>
    <!-- Progress + Blockers 2-col sub-grid -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;flex:1;min-height:0;">
      [PROGRESS_CARD]
      [BLOCKERS_CARD]
    </div>
  </div>

  <!-- Right: Dark panel -->
  <div style="background:#333333;border-radius:10px;padding:20px 22px;height:100%;
              box-shadow:0 4px 12px rgba(0,0,0,0.15);">
    <div style="font-size:10px;text-transform:uppercase;letter-spacing:2.5px;color:rgba(255,255,255,0.35);margin-bottom:16px;">[PANEL_TITLE]</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px;">
      <!-- Stat box — repeat for each item -->
      <div style="background:rgba(255,255,255,0.06);border-radius:6px;padding:12px;">
        <div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:rgba(255,255,255,0.35);margin-bottom:4px;">[STAT_LABEL]</div>
        <div style="font-size:20px;font-weight:700;color:#fff;">[STAT_VALUE]</div>
      </div>
      <!-- repeat for each item -->
    </div>
    [VERTICAL_TAG_ROW]
    [NUMBERED_RECOVERY_PLAN]
  </div>

</div>
```

---

## B10: Plain Header + Table + Cash + Donut

For: financial statement — P&L, cash position, revenue mix. No header border. `7fr/5fr` grid.

```html
<!-- Left (7fr) -->
<div style="display:flex;flex-direction:column;min-height:0;">

  <!-- Income table -->
  <div style="background:#fff;border-radius:10px;overflow:hidden;margin-bottom:14px;
              box-shadow:0 2px 8px rgba(0,0,0,0.08),0 1px 3px rgba(0,0,0,0.05);">
    <div style="background:#333333;display:grid;grid-template-columns:2.8fr 1fr 1fr 0.9fr;padding:10px 18px;">
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;color:rgba(255,255,255,0.55);">Line Item</div>
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;color:rgba(255,255,255,0.55);text-align:right;">[COL_1]</div>
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;color:rgba(255,255,255,0.55);text-align:right;">[COL_2]</div>
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;color:rgba(255,255,255,0.55);text-align:right;">YoY</div>
    </div>
    <!-- Row — repeat for each item (alternate #fff / #F9FAFB; Gross Profit: #F3F4F6 + border-bottom:2px solid #E5E7EB) -->
    <div style="display:grid;grid-template-columns:2.8fr 1fr 1fr 0.9fr;padding:9px 18px;background:#fff;border-bottom:1px solid #F9FAFB;">
      <div style="font-size:13px;font-weight:600;">[LINE_ITEM]</div>
      <div style="font-size:13px;text-align:right;">[VALUE_1]</div>
      <div style="font-size:13px;text-align:right;">[VALUE_2]</div>
      <div style="font-size:13px;text-align:right;color:#2D7D46;font-weight:600;">[YOY]</div>
    </div>
    <!-- repeat for each item -->
  </div>

  <!-- Financial risk mini cards — 2 col, border-left:4px solid #C0504D -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
    [RISK_MINI_CARDS]
  </div>

</div>

<!-- Right (5fr) -->
<div style="display:flex;flex-direction:column;min-height:0;">

  <!-- Cash metrics: 2-col grid -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;">
    <!-- Cash on Hand — border-left:4px solid #333333 -->
    [CASH_ON_HAND_CARD]
    <!-- Burn Rate — border-left:4px solid #333333 -->
    [BURN_RATE_CARD]
    <!-- Runway — grid-column:1/-1, includes progress bar + "Healthy" badge -->
    [RUNWAY_CARD]
  </div>

  <!-- Revenue mix donut -->
  <div style="flex:1;background:#fff;border-radius:10px;padding:16px;display:flex;flex-direction:column;
              box-shadow:0 2px 8px rgba(0,0,0,0.08),0 1px 3px rgba(0,0,0,0.05);">
    <h3 style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#9CA3AF;text-align:center;margin:0 0 14px;">[DONUT_TITLE]</h3>
    [SVG_DONUT_AND_LEGEND]
  </div>

</div>
```

---

## B11: RED + 3 Scorecards + Data Table + 2 Mini Charts

For: unit economics, efficiency metrics. Slide stripe: `#C0504D`.

```html
<!-- 3 scorecards row, gap 16px -->
<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;flex-shrink:0;margin-bottom:14px;">

  <!-- Scorecard — colored top border by status — repeat for each item -->
  <div style="background:#fff;border-top:4px solid #C0504D;border-radius:10px;padding:16px 18px;
              box-shadow:0 2px 8px rgba(0,0,0,0.08),0 1px 3px rgba(0,0,0,0.05);">
    <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#9CA3AF;margin-bottom:8px;">[SCORECARD_LABEL]</div>
    <div style="display:flex;align-items:flex-end;gap:10px;margin-bottom:8px;">
      <div style="font-size:42px;font-weight:800;color:#C0504D;line-height:1;letter-spacing:-1px;">[SCORECARD_VALUE]</div>
      <div style="margin-bottom:4px;">
        <div style="font-size:11px;font-weight:700;color:#C0504D;">[SCORECARD_STATUS]</div>
        <div style="font-size:10px;color:#9CA3AF;">[SCORECARD_CONTEXT]</div>
      </div>
    </div>
    <div style="background:#F3F4F6;height:5px;border-radius:999px;overflow:hidden;position:relative;">
      <div style="background:#C0504D;height:5px;width:[PCT]%;border-radius:999px;"></div>
    </div>
    <div style="position:relative;height:12px;margin-bottom:4px;">
      <div style="position:absolute;left:[TARGET_PCT]%;width:1.5px;height:11px;background:#333333;top:0;"></div>
    </div>
    <p style="font-size:11px;color:#9CA3AF;margin:0;line-height:1.5;">[SCORECARD_NOTE]</p>
  </div>
  <!-- repeat for each item (neutral: border-top:4px solid #9CA3AF) -->

</div>

<!-- Main data grid: 5fr/3fr/3fr, gap 14px -->
<div style="display:grid;grid-template-columns:5fr 3fr 3fr;gap:14px;flex:1;min-height:0;">
  [DATA_TABLE]
  [MINI_CHART_1]
  [MINI_CHART_2]
</div>

<!-- Dark insight footer bar -->
<div style="flex-shrink:0;background:#333333;border-radius:12px;padding:12px 22px;margin-top:12px;
            display:flex;align-items:center;justify-content:space-between;
            box-shadow:0 4px 12px rgba(0,0,0,0.15);">
  <div style="display:flex;align-items:center;gap:12px;">
    [WARNING_ICON_SVG_AMBER]
    <p style="font-size:13px;color:#D1D5DB;margin:0;"><strong style="color:#fff;">[PRIORITY_LABEL]</strong> [INSIGHT_TEXT]</p>
  </div>
</div>
```

---

## B12: 3 Segment Cards + Diverging Chart + Insight Column

For: customer segment, vertical, or cohort performance comparison.

```html
<!-- 3 segment cards, gap 16px -->
<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;flex-shrink:0;margin-bottom:14px;">

  <!-- Segment card — colored top border by performance — repeat for each item -->
  <!-- Green=outperformed, Red=underperformed, Gray=stable -->
  <div style="background:#fff;border-top:4px solid #2D7D46;border-radius:10px;padding:16px 20px;
              box-shadow:0 2px 8px rgba(0,0,0,0.08),0 1px 3px rgba(0,0,0,0.05);">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;">
      <div>
        <h2 style="font-size:18px;font-weight:700;color:#2D7D46;margin:0 0 2px;">[SEGMENT_NAME]</h2>
        <p style="font-size:10px;font-weight:700;text-transform:uppercase;color:#9CA3AF;letter-spacing:1px;margin:0;">[SEGMENT_TIER]</p>
      </div>
      <span style="background:#D1FAE5;color:#2D7D46;font-size:10px;font-weight:700;text-transform:uppercase;padding:3px 8px;border-radius:4px;">[PERFORMANCE_PILL]</span>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:12px;">
      <!-- Metric cell — repeat for each item -->
      <div style="background:#F9FAFB;border-radius:6px;padding:8px 6px;text-align:center;">
        <div style="font-size:15px;font-weight:800;color:#2D7D46;">[METRIC_VALUE]</div>
        <div style="font-size:9px;color:#9CA3AF;text-transform:uppercase;margin-top:2px;">[METRIC_LABEL]</div>
      </div>
      <!-- repeat for each item -->
    </div>
  </div>
  <!-- repeat for each item -->

</div>

<!-- Bottom: 5fr/4fr grid -->
<div style="display:grid;grid-template-columns:5fr 4fr;gap:16px;flex:1;min-height:0;">
  [DIVERGING_CHART_CARD]

  <!-- Insight column -->
  <div style="background:#fff;border-radius:10px;padding:18px 20px;display:flex;flex-direction:column;gap:14px;
              box-shadow:0 2px 8px rgba(0,0,0,0.08),0 1px 3px rgba(0,0,0,0.05);">
    <h3 style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#9CA3AF;margin:0;">Segment Insights</h3>
    <!-- Insight item — repeat for each item -->
    <div style="border-left:4px solid #2D7D46;padding-left:12px;">
      [CHECK_ICON_SVG]
      <p style="font-size:12px;color:#374151;line-height:1.55;margin:0;"><strong>[SEGMENT_LABEL]:</strong> [INSIGHT_TEXT]</p>
    </div>
    <!-- repeat for each item -->
  </div>
</div>
```

---

## B13: Priority Cards + Dark Enterprise Panel

For: forward priorities, Q2/Q3 action plan. Structure: `7fr/5fr` grid.

```html
<!-- 7fr/5fr grid -->
<div style="display:grid;grid-template-columns:7fr 5fr;gap:18px;flex:1;min-height:0;">

  <!-- Left: priority cards stack -->
  <div style="display:flex;flex-direction:column;gap:12px;min-height:0;">
    <!-- Priority card — repeat for each item -->
    <div style="background:#fff;border-radius:10px;padding:16px 20px;display:flex;align-items:flex-start;gap:14px;flex:1;
                box-shadow:0 2px 8px rgba(0,0,0,0.08),0 1px 3px rgba(0,0,0,0.05);">
      <div style="width:32px;height:32px;background:#333333;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800;color:#fff;flex-shrink:0;">[PRIORITY_NUM]</div>
      <div style="flex:1;">
        <h3 style="font-size:15px;font-weight:700;margin:0 0 4px;">[PRIORITY_TITLE]</h3>
        <p style="font-size:12px;color:#6B7280;line-height:1.55;margin:0 0 10px;">[PRIORITY_DESC]</p>
        [PRIORITY_METRICS_OR_TAGS]
      </div>
    </div>
    <!-- repeat for each item -->
  </div>

  <!-- Right: dark enterprise panel + quote card -->
  <div style="display:flex;flex-direction:column;gap:12px;min-height:0;">

    <div style="background:#333333;border-radius:10px;padding:20px 24px;flex:1;
                box-shadow:0 4px 12px rgba(0,0,0,0.15);">
      <div style="font-size:10px;text-transform:uppercase;letter-spacing:2.5px;color:rgba(255,255,255,0.35);margin-bottom:14px;">[PANEL_LABEL]</div>
      <div style="font-size:40px;font-weight:800;color:#2D7D46;letter-spacing:-1px;margin-bottom:14px;">[PANEL_TARGET]</div>
      <div style="border-top:1px solid rgba(255,255,255,0.08);padding-top:14px;display:flex;flex-direction:column;gap:10px;">
        <!-- Numbered action item — repeat for each item -->
        <div style="display:flex;align-items:flex-start;gap:10px;">
          <div style="width:22px;height:22px;background:rgba(255,255,255,0.08);border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:#fff;flex-shrink:0;">[NUM]</div>
          <div>
            <div style="font-size:12px;font-weight:700;color:#fff;margin-bottom:2px;">[ACTION_TITLE]</div>
            <div style="font-size:11px;color:rgba(255,255,255,0.5);line-height:1.45;">[ACTION_DESC]</div>
          </div>
        </div>
        <!-- repeat for each item -->
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:14px;border-top:1px solid rgba(255,255,255,0.08);padding-top:14px;">
        <!-- Stat — repeat for each item -->
        <div style="text-align:center;">
          <div style="font-size:16px;font-weight:800;color:#fff;">[STAT_VALUE]</div>
          <div style="font-size:9px;text-transform:uppercase;color:rgba(255,255,255,0.35);margin-top:2px;">[STAT_LABEL]</div>
        </div>
        <!-- repeat for each item -->
      </div>
    </div>

    <!-- Quote card -->
    <div style="background:#fff;border-radius:8px;padding:14px 18px;border-left:5px solid #2D7D46;flex-shrink:0;
                box-shadow:0 2px 8px rgba(0,0,0,0.06);">
      <p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#9CA3AF;margin:0 0 8px;">Leadership Commitment</p>
      <p style="font-size:12px;color:#374151;font-style:italic;line-height:1.65;margin:0;">"[QUOTE_TEXT]"</p>
    </div>

  </div>
</div>
```

---

## B14: Decision Grid + Avatar Footer

For: critical decisions requiring executive approval. Slide stripe: `#C0504D`.

```html
<!-- 2×2 decision card grid, gap 16px -->
<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;flex:1;min-height:0;">
  <!-- Decision card — repeat for each item -->
  <!-- Urgent deadline pill: background:#C0504D; color:#fff -->
  <div style="background:#fff;border-radius:10px;padding:18px 20px;display:flex;flex-direction:column;
              box-shadow:0 2px 8px rgba(0,0,0,0.08),0 1px 3px rgba(0,0,0,0.05);">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;">
      <h3 style="font-size:15px;font-weight:700;margin:0;">[DECISION_TITLE]</h3>
      <span style="background:#C0504D;color:#fff;font-size:10px;font-weight:700;padding:3px 10px;border-radius:999px;flex-shrink:0;">[DEADLINE]</span>
    </div>
    <p style="font-size:12px;color:#6B7280;line-height:1.55;margin:0 0 12px;">[DECISION_CONTEXT]</p>
    [DECISION_OPTIONS_OR_IMPACT]
  </div>
  <!-- repeat for each item -->
</div>

<!-- Avatar footer -->
<footer style="flex-shrink:0;background:#333333;border-radius:12px;padding:14px 22px;
               margin-top:12px;display:flex;align-items:center;justify-content:space-between;
               box-shadow:0 4px 12px rgba(0,0,0,0.15);">
  <div>
    <p style="font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#6B7280;font-weight:700;margin:0 0 6px;">Decision Session</p>
    <p style="font-size:14px;font-weight:700;color:#fff;margin:0;">[SESSION_DATE_AND_CONTEXT]</p>
  </div>
  [OVERLAPPING_AVATAR_CIRCLES]
</footer>
```

---

## Layout Selection Guide

| Content | Pattern | Avoid |
|---|---|---|
| Opening / cover | 1 | — |
| 5 headline KPIs + narrative | 2 | 3 (too dense) |
| Full KPI scorecard | 3 | 2 (not enough KPIs) |
| Revenue/metric trend | 4 | 11 (wrong chart type) |
| Root cause bridge | 5 | 4 (no waterfall needed) |
| Wins / achievements | 6 | 7 (wrong tone) |
| Challenges / risks | 7 | 6 (wrong tone) |
| Initiative tracking | 8 | 3 (wrong structure) |
| Strategy deep-dive | 9 | 8 (wrong depth) |
| Financial statement | 10 | 11 (different structure) |
| Unit economics | 11 | 10 (different chart type) |
| Segment comparison | 12 | 3 (not KPI tables) |
| Forward priorities | 13 | 8 (different purpose) |
| Decisions needed | 14 | 13 (different CTA) |

## Variety Rules

- Never repeat same pattern on consecutive slides
- Patterns 5 and 7 (both left-dominant): never adjacent
- Patterns 3 and 11 (both table-heavy): never adjacent
- Pattern 1 is always first. Pattern 14 is always last if present.
- Standard 14-slide QBR uses each pattern exactly once: 1→2→3→4→5→6→7→8→9→10→11→12→13→14

## Sales Proposal Arc (9 slides)

| Slide | Content | Pattern |
|---|---|---|
| 01 | Cover | 1 |
| 02 | Their Challenge | 2 |
| 03 | Our Solution | 4 |
| 04 | Key Benefits | 5 |
| 05 | Case Study | 6 |
| 06 | How It Works | 8 |
| 07 | Pricing / ROI | 10 |
| 08 | Why Us | 13 |
| 09 | Next Steps / CTA | 14 |
