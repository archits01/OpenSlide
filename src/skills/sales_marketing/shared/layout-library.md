# Layout Library — Sales & Marketing Presentations

Twelve proven patterns for pitch decks, product launches, campaign reviews, and customer-facing presentations. Every slide uses exactly one pattern. Follow the pain → solution → proof → ask narrative order.

## ⚠️ Layout Rules (Apply to EVERY pattern)
1. Left accent stripe on ALL non-cover slides: `position:absolute;top:0;left:0;width:5px;height:100%;background:var(--slide-accent)` — NEVER omit
2. Content starts at padding-left:57px (52px + 5px stripe), padding-right:52px
3. Dark panels MUST have 3px accent-light top bar
4. Stat cards need box-shadow — never flat on white backgrounds
5. All card border-radius: 12px main, 8px inner
6. Font import in every slide: Inter from Google Fonts
7. Slide title: 28px/700, padding-left:16px
8. Section label above title: 11px/600/uppercase/2px tracking/var(--slide-secondary)
9. Testimonial quotes always italic, always have attribution
10. CTAs are pill/rounded buttons — never plain text links

## Pattern Index

| # | Name | Best For | Key Visual |
|---|---|---|---|
| 1 | Sales/Marketing Cover | Opening slide | Split panel, brand-forward |
| 2 | Problem / Pain Point | Establishing urgency | Hero stat + 3 pain cards |
| 3 | Solution Overview | Product/service intro | 3 feature cards + synthesis bar |
| 4 | Social Proof — Logos + Testimonial | Building trust | Logo strip + testimonial card |
| 5 | Results / ROI Stats | Quantifying impact | 3 large stat cards + dark footer |
| 6 | Case Study | Deep-dive proof | Dark/light split, stats + quote |
| 7 | Competitive Comparison | Why us | Full table, highlighted column |
| 8 | Product Demo / Screenshot | Feature walkthrough | Screenshot + callout cards |
| 9 | Pricing / Tiers | Packaging, offers | 3-tier cards, recommended middle |
| 10 | Customer Journey / Funnel | Lifecycle, stages | Horizontal funnel with metrics |
| 11 | Campaign / Channel Breakdown | Marketing reporting | Dark hero + channel allocation |
| 12 | Call to Action | Close / next steps | Dark full-bleed, centered CTA |

---

## Pattern 1: Sales/Marketing Cover

No standard header. Left panel 55% with headline. Right panel 45% solid accent with dot grid.

```html
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: 1280px; height: 720px; overflow: hidden; font-family: 'Inter', sans-serif; background: var(--slide-bg, #FFFFFF); color: var(--slide-text, #111827); display: flex; }
</style>
</head>
<body>
<!-- Left Panel -->
<div style="width:55%;height:100%;padding:64px 52px 52px 64px;display:flex;flex-direction:column;justify-content:space-between;background:var(--slide-bg,#FFFFFF);">
  <div>
    <div style="font-size:12px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:var(--slide-accent,#7C3AED);margin-bottom:28px;">NEXUS PLATFORM · ENTERPRISE PITCH</div>
    <div style="font-size:50px;font-weight:800;line-height:1.1;color:var(--slide-text,#111827);margin-bottom:20px;letter-spacing:-0.5px;">Close More Deals.<br>Faster. With Less<br>Effort.</div>
    <div style="font-size:16px;font-weight:500;color:#6B7280;line-height:1.5;max-width:400px;">The AI-powered sales platform that helps revenue teams hit quota consistently — without adding headcount.</div>
  </div>
  <div>
    <div style="height:1px;background:var(--slide-border,#E5E7EB);margin-bottom:18px;"></div>
    <div style="font-size:13px;color:#6B7280;margin-bottom:4px;">Prepared for</div>
    <div style="font-size:14px;font-weight:700;color:var(--slide-text,#111827);">Vantage Industrial Group · April 10, 2026</div>
    <div style="font-size:12px;color:#9CA3AF;margin-top:3px;">Marcus Lee, Account Executive · marcus@nexusplatform.com</div>
  </div>
</div>
<!-- Right Panel -->
<div style="width:45%;height:100%;background:var(--slide-accent,#7C3AED);position:relative;display:flex;align-items:center;justify-content:center;overflow:hidden;">
  <!-- Dot grid overlay -->
  <svg style="position:absolute;inset:0;width:100%;height:100%;opacity:0.15;" xmlns="http://www.w3.org/2000/svg">
    <defs><pattern id="dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.5" fill="#FFFFFF"/></pattern></defs>
    <rect width="100%" height="100%" fill="url(#dots)"/>
  </svg>
  <!-- Center content -->
  <div style="position:relative;text-align:center;padding:40px;">
    <div style="width:80px;height:80px;border-radius:20px;background:rgba(255,255,255,0.15);display:flex;align-items:center;justify-content:center;margin:0 auto 24px;">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
    </div>
    <div style="font-size:13px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.7);margin-bottom:12px;">TRUSTED BY</div>
    <div style="font-size:40px;font-weight:800;color:#FFFFFF;line-height:1;margin-bottom:8px;">4,200+</div>
    <div style="font-size:14px;color:rgba(255,255,255,0.8);margin-bottom:28px;">revenue teams worldwide</div>
    <div style="display:flex;gap:24px;justify-content:center;">
      <div style="text-align:center;">
        <div style="font-size:24px;font-weight:800;color:#FFFFFF;">$1.8B</div>
        <div style="font-size:11px;color:rgba(255,255,255,0.6);margin-top:2px;">pipeline managed</div>
      </div>
      <div style="width:1px;background:rgba(255,255,255,0.2);"></div>
      <div style="text-align:center;">
        <div style="font-size:24px;font-weight:800;color:#FFFFFF;">34%</div>
        <div style="font-size:11px;color:rgba(255,255,255,0.6);margin-top:2px;">avg win rate lift</div>
      </div>
    </div>
  </div>
</div>
</body>
</html>
```

---

## Pattern 2: Problem / Pain Point

Standard header. Hero stat at top. Three pain point cards with icon, title, description, and impact metric.

```html
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: 1280px; height: 720px; overflow: hidden; font-family: 'Inter', sans-serif; background: var(--slide-bg, #FFFFFF); color: var(--slide-text, #111827); position: relative; }
</style>
</head>
<body>
<div style="position:absolute;top:0;left:0;width:5px;height:100%;background:var(--slide-accent,#7C3AED);"></div>
<div style="padding:28px 52px 0 57px;">
  <div style="font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:var(--slide-secondary,#4B5563);margin-bottom:6px;">THE CHALLENGE · ENTERPRISE SALES</div>
  <div style="font-size:28px;font-weight:700;color:var(--slide-text,#111827);padding-left:16px;">Your Reps Are Leaving Money on the Table</div>
</div>
<div style="margin:14px 52px 0 57px;height:1px;background:var(--slide-border,#E5E7EB);"></div>
<!-- Hero Stat Banner -->
<div style="margin:16px 52px 0 57px;background:#FDF4FF;border-radius:10px;padding:16px 24px;border:1px solid rgba(124,58,237,0.15);display:flex;align-items:center;gap:24px;">
  <div style="font-size:42px;font-weight:800;color:var(--slide-accent,#7C3AED);line-height:1;">67%</div>
  <div>
    <div style="font-size:14px;font-weight:600;color:var(--slide-text,#111827);">of enterprise sales reps miss quota every quarter</div>
    <div style="font-size:12px;color:#6B7280;margin-top:3px;">Gartner Sales Performance Report, 2025 · 1,400+ enterprise sales leaders surveyed</div>
  </div>
  <div style="margin-left:auto;text-align:right;">
    <div style="font-size:24px;font-weight:800;color:#DC2626;">$420B</div>
    <div style="font-size:11px;color:#6B7280;">revenue left uncaptured annually</div>
  </div>
</div>
<!-- Pain Cards -->
<div style="display:flex;gap:20px;padding:16px 52px 0 57px;">
  <!-- Pain 1 -->
  <div style="flex:1;background:#FFFFFF;border-radius:12px;padding:20px 22px;box-shadow:0 4px 16px rgba(0,0,0,0.08);border:1px solid var(--slide-border,#E5E7EB);">
    <div style="width:36px;height:36px;border-radius:8px;background:rgba(220,38,38,0.1);display:flex;align-items:center;justify-content:center;margin-bottom:12px;">
      <span style="font-size:18px;">⚠</span>
    </div>
    <div style="font-size:14px;font-weight:700;color:var(--slide-text,#111827);margin-bottom:8px;">No Deal Visibility</div>
    <div style="font-size:12px;color:var(--slide-secondary,#4B5563);line-height:1.6;margin-bottom:12px;">Managers fly blind — they can't see which deals are stuck, which reps need coaching, or where pipeline will fall short until it's too late.</div>
    <div style="background:rgba(220,38,38,0.06);border-radius:6px;padding:8px 12px;">
      <span style="font-size:12px;font-weight:600;color:#DC2626;">Impact: 23% of deals lost to "no decision" due to late detection</span>
    </div>
  </div>
  <!-- Pain 2 -->
  <div style="flex:1;background:#FFFFFF;border-radius:12px;padding:20px 22px;box-shadow:0 4px 16px rgba(0,0,0,0.08);border:1px solid var(--slide-border,#E5E7EB);">
    <div style="width:36px;height:36px;border-radius:8px;background:rgba(220,38,38,0.1);display:flex;align-items:center;justify-content:center;margin-bottom:12px;">
      <span style="font-size:18px;">⚠</span>
    </div>
    <div style="font-size:14px;font-weight:700;color:var(--slide-text,#111827);margin-bottom:8px;">Manual CRM Updates</div>
    <div style="font-size:12px;color:var(--slide-secondary,#4B5563);line-height:1.6;margin-bottom:12px;">Reps spend 3.2 hours per day on data entry instead of selling. CRM data is stale, incomplete, and unreliable — making forecasting a guessing game.</div>
    <div style="background:rgba(220,38,38,0.06);border-radius:6px;padding:8px 12px;">
      <span style="font-size:12px;font-weight:600;color:#DC2626;">Impact: $68,000 per rep per year in wasted selling time</span>
    </div>
  </div>
  <!-- Pain 3 -->
  <div style="flex:1;background:#FFFFFF;border-radius:12px;padding:20px 22px;box-shadow:0 4px 16px rgba(0,0,0,0.08);border:1px solid var(--slide-border,#E5E7EB);">
    <div style="width:36px;height:36px;border-radius:8px;background:rgba(220,38,38,0.1);display:flex;align-items:center;justify-content:center;margin-bottom:12px;">
      <span style="font-size:18px;">⚠</span>
    </div>
    <div style="font-size:14px;font-weight:700;color:var(--slide-text,#111827);margin-bottom:8px;">Inconsistent Coaching</div>
    <div style="font-size:12px;color:var(--slide-secondary,#4B5563);line-height:1.6;margin-bottom:12px;">Top performers are 4× more productive than the bottom quartile — but managers lack the data to replicate winning behaviors across the full team.</div>
    <div style="background:rgba(220,38,38,0.06);border-radius:6px;padding:8px 12px;">
      <span style="font-size:12px;font-weight:600;color:#DC2626;">Impact: 40% performance gap between top and average reps</span>
    </div>
  </div>
</div>
<!-- Dark Footer -->
<div style="position:absolute;bottom:0;left:0;right:0;height:44px;background:var(--slide-dark,#111827);display:flex;align-items:center;padding:0 57px;">
  <span style="font-size:12px;font-weight:500;color:#FFFFFF;">The result: missed quarters, high rep turnover, and a forecast that leadership can't trust</span>
</div>
</body>
</html>
```

---

## Pattern 3: Solution Overview

Standard header. Three feature/benefit cards with icon, name, description, outcome. Dark synthesis bar.

```html
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: 1280px; height: 720px; overflow: hidden; font-family: 'Inter', sans-serif; background: var(--slide-bg, #FFFFFF); color: var(--slide-text, #111827); position: relative; }
</style>
</head>
<body>
<div style="position:absolute;top:0;left:0;width:5px;height:100%;background:var(--slide-accent,#7C3AED);"></div>
<div style="padding:28px 52px 0 57px;">
  <div style="font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:var(--slide-secondary,#4B5563);margin-bottom:6px;">THE NEXUS PLATFORM · HOW IT WORKS</div>
  <div style="font-size:28px;font-weight:700;color:var(--slide-text,#111827);padding-left:16px;">Three Capabilities That Change Everything</div>
</div>
<div style="margin:14px 52px 0 57px;height:1px;background:var(--slide-border,#E5E7EB);"></div>
<!-- Feature Cards -->
<div style="display:flex;gap:20px;padding:20px 52px 0 57px;height:calc(100% - 110px - 44px);">
  <!-- Feature 1 -->
  <div style="flex:1;background:#FFFFFF;border-radius:12px;padding:22px 24px;box-shadow:0 4px 16px rgba(0,0,0,0.08);border:1px solid var(--slide-border,#E5E7EB);display:flex;flex-direction:column;">
    <div style="width:40px;height:40px;border-radius:10px;background:var(--slide-accent,#7C3AED);display:flex;align-items:center;justify-content:center;margin-bottom:14px;">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
    </div>
    <div style="font-size:16px;font-weight:700;color:var(--slide-text,#111827);margin-bottom:8px;">AI Deal Intelligence</div>
    <div style="font-size:13px;color:var(--slide-secondary,#4B5563);line-height:1.6;margin-bottom:14px;flex:1;">Nexus analyzes every email, call, and meeting to score deal health in real time. Know which deals need attention before they go cold — with specific next-action recommendations for every rep.</div>
    <div style="background:#F5F3FF;border-radius:8px;padding:10px 14px;border-left:3px solid var(--slide-accent,#7C3AED);">
      <div style="font-size:12px;font-weight:600;color:var(--slide-accent,#7C3AED);">Outcome: 34% improvement in win rate</div>
      <div style="font-size:11px;color:#6B7280;margin-top:2px;">Average across 240+ enterprise deployments</div>
    </div>
  </div>
  <!-- Feature 2 -->
  <div style="flex:1;background:#FFFFFF;border-radius:12px;padding:22px 24px;box-shadow:0 4px 16px rgba(0,0,0,0.08);border:1px solid var(--slide-border,#E5E7EB);display:flex;flex-direction:column;">
    <div style="width:40px;height:40px;border-radius:10px;background:var(--slide-accent,#7C3AED);display:flex;align-items:center;justify-content:center;margin-bottom:14px;">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
    </div>
    <div style="font-size:16px;font-weight:700;color:var(--slide-text,#111827);margin-bottom:8px;">Automated CRM Capture</div>
    <div style="font-size:13px;color:var(--slide-secondary,#4B5563);line-height:1.6;margin-bottom:14px;flex:1;">Zero manual data entry. Nexus automatically logs all customer interactions, updates deal stages, and flags stale opportunities — so reps spend their time selling, not typing.</div>
    <div style="background:#F5F3FF;border-radius:8px;padding:10px 14px;border-left:3px solid var(--slide-accent,#7C3AED);">
      <div style="font-size:12px;font-weight:600;color:var(--slide-accent,#7C3AED);">Outcome: 3.2 hrs/rep/day recovered for selling</div>
      <div style="font-size:11px;color:#6B7280;margin-top:2px;">Verified via activity tracking across 18,000+ reps</div>
    </div>
  </div>
  <!-- Feature 3 -->
  <div style="flex:1;background:#FFFFFF;border-radius:12px;padding:22px 24px;box-shadow:0 4px 16px rgba(0,0,0,0.08);border:1px solid var(--slide-border,#E5E7EB);display:flex;flex-direction:column;">
    <div style="width:40px;height:40px;border-radius:10px;background:var(--slide-accent,#7C3AED);display:flex;align-items:center;justify-content:center;margin-bottom:14px;">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
    </div>
    <div style="font-size:16px;font-weight:700;color:var(--slide-text,#111827);margin-bottom:8px;">Coaching at Scale</div>
    <div style="font-size:13px;color:var(--slide-secondary,#4B5563);line-height:1.6;margin-bottom:14px;flex:1;">AI-powered call scoring surfaces coaching moments for every rep, every week. Replicate your top performer behaviors across your entire team — without managers listening to every call.</div>
    <div style="background:#F5F3FF;border-radius:8px;padding:10px 14px;border-left:3px solid var(--slide-accent,#7C3AED);">
      <div style="font-size:12px;font-weight:600;color:var(--slide-accent,#7C3AED);">Outcome: 28% faster ramp for new hires</div>
      <div style="font-size:11px;color:#6B7280;margin-top:2px;">Median ramp time reduced from 7 to 5 months</div>
    </div>
  </div>
</div>
<!-- Dark Footer -->
<div style="position:absolute;bottom:0;left:0;right:0;height:44px;background:var(--slide-dark,#111827);display:flex;align-items:center;padding:0 57px;">
  <span style="font-size:12px;font-weight:500;color:#FFFFFF;">Result: teams using all three capabilities see an average 41% increase in revenue per rep within 6 months</span>
</div>
</body>
</html>
```

---

## Pattern 4: Social Proof — Logos + Testimonial

Standard header. Top row: 5 customer logos. Bottom: large testimonial card.

```html
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: 1280px; height: 720px; overflow: hidden; font-family: 'Inter', sans-serif; background: var(--slide-bg, #FFFFFF); color: var(--slide-text, #111827); position: relative; }
</style>
</head>
<body>
<div style="position:absolute;top:0;left:0;width:5px;height:100%;background:var(--slide-accent,#7C3AED);"></div>
<div style="padding:28px 52px 0 57px;">
  <div style="font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:var(--slide-secondary,#4B5563);margin-bottom:6px;">SOCIAL PROOF · TRUSTED BY LEADERS</div>
  <div style="font-size:28px;font-weight:700;color:var(--slide-text,#111827);padding-left:16px;">Join 4,200+ Revenue Teams Already Winning</div>
</div>
<div style="margin:14px 52px 0 57px;height:1px;background:var(--slide-border,#E5E7EB);"></div>
<!-- Logo Strip -->
<div style="display:flex;gap:12px;padding:16px 52px 0 57px;">
  <div style="flex:1;background:#FFFFFF;border-radius:8px;padding:14px 20px;border:1px solid var(--slide-border,#E5E7EB);display:flex;align-items:center;justify-content:center;height:60px;box-shadow:0 1px 4px rgba(0,0,0,0.05);">
    <span style="font-size:15px;font-weight:800;color:#9CA3AF;letter-spacing:-0.5px;">VANTAGE</span>
  </div>
  <div style="flex:1;background:#FFFFFF;border-radius:8px;padding:14px 20px;border:1px solid var(--slide-border,#E5E7EB);display:flex;align-items:center;justify-content:center;height:60px;box-shadow:0 1px 4px rgba(0,0,0,0.05);">
    <span style="font-size:15px;font-weight:800;color:#9CA3AF;letter-spacing:-0.5px;">MERIDIAN</span>
  </div>
  <div style="flex:1;background:#FFFFFF;border-radius:8px;padding:14px 20px;border:1px solid var(--slide-border,#E5E7EB);display:flex;align-items:center;justify-content:center;height:60px;box-shadow:0 1px 4px rgba(0,0,0,0.05);">
    <span style="font-size:15px;font-weight:800;color:#9CA3AF;letter-spacing:-0.5px;">STRATA&nbsp;CO</span>
  </div>
  <div style="flex:1;background:#FFFFFF;border-radius:8px;padding:14px 20px;border:1px solid var(--slide-border,#E5E7EB);display:flex;align-items:center;justify-content:center;height:60px;box-shadow:0 1px 4px rgba(0,0,0,0.05);">
    <span style="font-size:15px;font-weight:800;color:#9CA3AF;letter-spacing:-0.5px;">APEX&nbsp;LABS</span>
  </div>
  <div style="flex:1;background:#FFFFFF;border-radius:8px;padding:14px 20px;border:1px solid var(--slide-border,#E5E7EB);display:flex;align-items:center;justify-content:center;height:60px;box-shadow:0 1px 4px rgba(0,0,0,0.05);">
    <span style="font-size:15px;font-weight:800;color:#9CA3AF;letter-spacing:-0.5px;">PRISM&nbsp;AI</span>
  </div>
</div>
<!-- Testimonial -->
<div style="padding:14px 52px 0 57px;">
  <div style="background:#FFFFFF;border-radius:12px;padding:28px 32px;box-shadow:0 4px 16px rgba(0,0,0,0.08);border:1px solid var(--slide-border,#E5E7EB);position:relative;">
    <div style="position:absolute;top:16px;left:24px;font-size:72px;font-weight:800;color:var(--slide-accent,#7C3AED);opacity:0.2;line-height:1;font-family:Georgia,serif;">"</div>
    <div style="padding-left:48px;">
      <div style="font-size:18px;font-weight:500;font-style:italic;color:var(--slide-text,#111827);line-height:1.65;margin-bottom:20px;">"We piloted Nexus with 12 reps in Q3 and saw win rates jump from 18% to 27% in 60 days. The deal intelligence feature alone paid for the entire platform in the first month. We've since rolled it out to 180 reps globally — it's now the core of how we run sales."</div>
      <div style="display:flex;align-items:center;gap:14px;">
        <div style="width:44px;height:44px;border-radius:50%;background:rgba(124,58,237,0.1);border:2px solid var(--slide-accent,#7C3AED);display:flex;align-items:center;justify-content:center;">
          <span style="font-size:16px;font-weight:700;color:var(--slide-accent,#7C3AED);">KT</span>
        </div>
        <div>
          <div style="font-size:13px;font-weight:700;color:var(--slide-text,#111827);">Karen Torres</div>
          <div style="font-size:12px;color:var(--slide-secondary,#4B5563);">VP of Revenue Operations · Strata Co</div>
        </div>
        <div style="margin-left:auto;display:flex;gap:20px;">
          <div style="text-align:center;">
            <div style="font-size:20px;font-weight:800;color:var(--slide-accent,#7C3AED);">18% → 27%</div>
            <div style="font-size:10px;color:#9CA3AF;text-transform:uppercase;letter-spacing:1px;">Win Rate</div>
          </div>
          <div style="text-align:center;">
            <div style="font-size:20px;font-weight:800;color:#059669;">60 days</div>
            <div style="font-size:10px;color:#9CA3AF;text-transform:uppercase;letter-spacing:1px;">Time to Value</div>
          </div>
          <div style="text-align:center;">
            <div style="font-size:20px;font-weight:800;color:var(--slide-accent,#7C3AED);">180 seats</div>
            <div style="font-size:10px;color:#9CA3AF;text-transform:uppercase;letter-spacing:1px;">Full Rollout</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
<!-- Dark Footer -->
<div style="position:absolute;bottom:0;left:0;right:0;height:44px;background:var(--slide-dark,#111827);display:flex;align-items:center;padding:0 57px;">
  <span style="font-size:12px;font-weight:500;color:#FFFFFF;">4,200+ customers · G2 Leader 8 quarters in a row · 4.8/5 average rating from 1,240+ reviews</span>
</div>
</body>
</html>
```

---

## Pattern 5: Results / ROI Stats

Standard header. Three large stat cards. Dark footer with attribution.

```html
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: 1280px; height: 720px; overflow: hidden; font-family: 'Inter', sans-serif; background: var(--slide-bg, #FFFFFF); color: var(--slide-text, #111827); position: relative; }
</style>
</head>
<body>
<div style="position:absolute;top:0;left:0;width:5px;height:100%;background:var(--slide-accent,#7C3AED);"></div>
<div style="padding:28px 52px 0 57px;">
  <div style="font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:var(--slide-secondary,#4B5563);margin-bottom:6px;">CUSTOMER RESULTS · PROVEN IMPACT</div>
  <div style="font-size:28px;font-weight:700;color:var(--slide-text,#111827);padding-left:16px;">What Teams Achieve With Nexus</div>
</div>
<div style="margin:14px 52px 0 57px;height:1px;background:var(--slide-border,#E5E7EB);"></div>
<!-- Stat Cards -->
<div style="display:flex;gap:20px;padding:20px 52px 0 57px;">
  <!-- Stat 1 -->
  <div style="flex:1;background:#FFFFFF;border-radius:12px;padding:28px 26px;box-shadow:0 4px 16px rgba(0,0,0,0.08);border:1px solid var(--slide-border,#E5E7EB);text-align:center;">
    <div style="font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:var(--slide-accent,#7C3AED);margin-bottom:12px;">WIN RATE IMPROVEMENT</div>
    <div style="font-size:56px;font-weight:800;color:var(--slide-accent,#7C3AED);line-height:1;margin-bottom:10px;">+34%</div>
    <div style="font-size:13px;color:var(--slide-secondary,#4B5563);line-height:1.5;margin-bottom:14px;">Average improvement in deal win rate within the first 6 months of deployment across enterprise accounts</div>
    <div style="font-size:11px;font-weight:600;color:#059669;">↑ From 19% to 25% average industry baseline</div>
  </div>
  <!-- Stat 2 -->
  <div style="flex:1;background:#FFFFFF;border-radius:12px;padding:28px 26px;box-shadow:0 4px 16px rgba(0,0,0,0.08);border:1px solid var(--slide-border,#E5E7EB);text-align:center;">
    <div style="font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:var(--slide-accent,#7C3AED);margin-bottom:12px;">REVENUE PER REP</div>
    <div style="font-size:56px;font-weight:800;color:var(--slide-accent,#7C3AED);line-height:1;margin-bottom:10px;">+41%</div>
    <div style="font-size:13px;color:var(--slide-secondary,#4B5563);line-height:1.5;margin-bottom:14px;">Increase in annual revenue generated per sales rep after full Nexus deployment — without adding headcount</div>
    <div style="font-size:11px;font-weight:600;color:#059669;">↑ Average team quota attainment 94% vs. 71% baseline</div>
  </div>
  <!-- Stat 3 -->
  <div style="flex:1;background:#FFFFFF;border-radius:12px;padding:28px 26px;box-shadow:0 4px 16px rgba(0,0,0,0.08);border:1px solid var(--slide-border,#E5E7EB);text-align:center;">
    <div style="font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:var(--slide-accent,#7C3AED);margin-bottom:12px;">RAMP TIME REDUCTION</div>
    <div style="font-size:56px;font-weight:800;color:var(--slide-accent,#7C3AED);line-height:1;margin-bottom:10px;">-28%</div>
    <div style="font-size:13px;color:var(--slide-secondary,#4B5563);line-height:1.5;margin-bottom:14px;">Reduction in time-to-productivity for new hires — from average 7 months to 5 months with AI coaching</div>
    <div style="font-size:11px;font-weight:600;color:#059669;">↑ New hire attainment at 90 days: 68% vs. 44% average</div>
  </div>
</div>
<!-- Supporting Row -->
<div style="display:flex;gap:16px;padding:16px 52px 0 57px;">
  <div style="flex:1;background:#F9FAFB;border-radius:8px;padding:12px 16px;border:1px solid var(--slide-border,#E5E7EB);text-align:center;">
    <div style="font-size:20px;font-weight:800;color:var(--slide-text,#111827);">8.2×</div>
    <div style="font-size:11px;color:#6B7280;margin-top:3px;">Avg ROI in year 1</div>
  </div>
  <div style="flex:1;background:#F9FAFB;border-radius:8px;padding:12px 16px;border:1px solid var(--slide-border,#E5E7EB);text-align:center;">
    <div style="font-size:20px;font-weight:800;color:var(--slide-text,#111827);">4.2 mo</div>
    <div style="font-size:11px;color:#6B7280;margin-top:3px;">Avg payback period</div>
  </div>
  <div style="flex:1;background:#F9FAFB;border-radius:8px;padding:12px 16px;border:1px solid var(--slide-border,#E5E7EB);text-align:center;">
    <div style="font-size:20px;font-weight:800;color:var(--slide-text,#111827);">96%</div>
    <div style="font-size:11px;color:#6B7280;margin-top:3px;">Customer renewal rate</div>
  </div>
  <div style="flex:1;background:#F9FAFB;border-radius:8px;padding:12px 16px;border:1px solid var(--slide-border,#E5E7EB);text-align:center;">
    <div style="font-size:20px;font-weight:800;color:var(--slide-text,#111827);">240+</div>
    <div style="font-size:11px;color:#6B7280;margin-top:3px;">Enterprise deployments</div>
  </div>
</div>
<!-- Dark Footer -->
<div style="position:absolute;bottom:0;left:0;right:0;height:44px;background:var(--slide-dark,#111827);display:flex;align-items:center;padding:0 57px;">
  <span style="font-size:12px;font-weight:500;color:#FFFFFF;">Average results across 240+ enterprise customers · Jan 2024 – Mar 2026 cohort · Minimum 6-month deployment</span>
</div>
</body>
</html>
```

---

## Pattern 6: Case Study

Standard header. Left 50% dark panel with challenge/solution. Right 50% white with stats + quote.

```html
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: 1280px; height: 720px; overflow: hidden; font-family: 'Inter', sans-serif; background: var(--slide-bg, #FFFFFF); color: var(--slide-text, #111827); position: relative; }
</style>
</head>
<body>
<div style="position:absolute;top:0;left:0;width:5px;height:100%;background:var(--slide-accent,#7C3AED);"></div>
<div style="padding:28px 52px 0 57px;">
  <div style="font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:var(--slide-secondary,#4B5563);margin-bottom:6px;">CASE STUDY · ENTERPRISE</div>
  <div style="font-size:28px;font-weight:700;color:var(--slide-text,#111827);padding-left:16px;">How Apex Labs Doubled Their Win Rate in 90 Days</div>
</div>
<div style="margin:14px 52px 0 57px;height:1px;background:var(--slide-border,#E5E7EB);"></div>
<!-- Body Split -->
<div style="display:flex;gap:16px;padding:16px 52px 0 57px;height:calc(100% - 108px - 44px);">
  <!-- Left Dark Panel -->
  <div style="width:50%;background:var(--slide-dark,#111827);border-radius:12px;padding:24px 24px;position:relative;overflow:hidden;">
    <div style="position:absolute;top:0;left:0;right:0;height:3px;background:var(--slide-accent-light,#C4B5FD);"></div>
    <div style="font-size:16px;font-weight:700;color:var(--slide-accent-light,#C4B5FD);margin-bottom:16px;">Apex Labs · 320 reps · B2B SaaS</div>
    <div style="font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:#9CA3AF;margin-bottom:8px;">The Challenge</div>
    <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:18px;">
      <div style="display:flex;gap:10px;align-items:flex-start;font-size:12px;color:#D1D5DB;line-height:1.5;"><span style="color:#DC2626;font-weight:700;margin-top:1px;">✗</span><span>Win rate stagnant at 16% for 8 consecutive quarters</span></div>
      <div style="display:flex;gap:10px;align-items:flex-start;font-size:12px;color:#D1D5DB;line-height:1.5;"><span style="color:#DC2626;font-weight:700;margin-top:1px;">✗</span><span>Reps spending 3+ hrs/day on CRM admin — missing follow-ups</span></div>
      <div style="display:flex;gap:10px;align-items:flex-start;font-size:12px;color:#D1D5DB;line-height:1.5;"><span style="color:#DC2626;font-weight:700;margin-top:1px;">✗</span><span>No visibility into why deals were being lost — pattern unknown</span></div>
    </div>
    <div style="font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:#9CA3AF;margin-bottom:8px;">The Solution</div>
    <div style="display:flex;flex-direction:column;gap:6px;">
      <div style="display:flex;gap:10px;align-items:flex-start;font-size:12px;color:#D1D5DB;line-height:1.5;"><span style="color:#059669;font-weight:700;margin-top:1px;">✓</span><span>Deployed Nexus AI Deal Intelligence across all 320 reps</span></div>
      <div style="display:flex;gap:10px;align-items:flex-start;font-size:12px;color:#D1D5DB;line-height:1.5;"><span style="color:#059669;font-weight:700;margin-top:1px;">✓</span><span>Enabled automated CRM capture — zero manual data entry</span></div>
      <div style="display:flex;gap:10px;align-items:flex-start;font-size:12px;color:#D1D5DB;line-height:1.5;"><span style="color:#059669;font-weight:700;margin-top:1px;">✓</span><span>Weekly AI coaching reports for 24 frontline managers</span></div>
    </div>
  </div>
  <!-- Right White Panel -->
  <div style="width:50%;display:flex;flex-direction:column;gap:12px;">
    <!-- Stats -->
    <div style="display:flex;gap:12px;">
      <div style="flex:1;background:#FFFFFF;border-radius:10px;padding:14px 16px;box-shadow:0 2px 12px rgba(0,0,0,0.07);border:1px solid var(--slide-border,#E5E7EB);text-align:center;">
        <div style="font-size:28px;font-weight:800;color:var(--slide-accent,#7C3AED);">16% → 32%</div>
        <div style="font-size:10px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:#9CA3AF;margin-top:4px;">Win Rate</div>
        <div style="font-size:11px;color:#059669;margin-top:3px;">↑ Doubled in 90 days</div>
      </div>
      <div style="flex:1;background:#FFFFFF;border-radius:10px;padding:14px 16px;box-shadow:0 2px 12px rgba(0,0,0,0.07);border:1px solid var(--slide-border,#E5E7EB);text-align:center;">
        <div style="font-size:28px;font-weight:800;color:var(--slide-accent,#7C3AED);">$18M</div>
        <div style="font-size:10px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:#9CA3AF;margin-top:4px;">Added ARR (Yr 1)</div>
        <div style="font-size:11px;color:#059669;margin-top:3px;">↑ Above plan by $6.2M</div>
      </div>
      <div style="flex:1;background:#FFFFFF;border-radius:10px;padding:14px 16px;box-shadow:0 2px 12px rgba(0,0,0,0.07);border:1px solid var(--slide-border,#E5E7EB);text-align:center;">
        <div style="font-size:28px;font-weight:800;color:var(--slide-accent,#7C3AED);">14×</div>
        <div style="font-size:10px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:#9CA3AF;margin-top:4px;">ROI Year 1</div>
        <div style="font-size:11px;color:#059669;margin-top:3px;">↑ Payback in 3.1 months</div>
      </div>
    </div>
    <!-- Testimonial Quote -->
    <div style="background:#F9FAFB;border-radius:10px;padding:16px 18px;border:1px solid var(--slide-border,#E5E7EB);flex:1;position:relative;">
      <div style="font-size:40px;line-height:1;color:var(--slide-accent,#7C3AED);opacity:0.3;position:absolute;top:10px;left:14px;font-family:Georgia,serif;">"</div>
      <div style="padding-left:28px;padding-top:4px;">
        <div style="font-size:13px;font-weight:500;font-style:italic;color:var(--slide-text,#111827);line-height:1.6;margin-bottom:10px;">"Nexus gave our managers eyes they never had before. We could see deal health in real time and coach to the right behaviors. Doubling our win rate in one quarter is something we hadn't achieved in 8 years of trying."</div>
        <div style="font-size:12px;font-weight:700;color:var(--slide-text,#111827);">David Park</div>
        <div style="font-size:11px;color:var(--slide-secondary,#4B5563);">Chief Revenue Officer · Apex Labs</div>
      </div>
    </div>
  </div>
</div>
<!-- Dark Footer -->
<div style="position:absolute;bottom:0;left:0;right:0;height:44px;background:var(--slide-dark,#111827);display:flex;align-items:center;padding:0 57px;">
  <span style="font-size:12px;font-weight:500;color:#FFFFFF;">Full case study available on request · Apex Labs is one of 12 companies to exceed 2× win rate improvement</span>
</div>
</body>
</html>
```

---

## Pattern 7: Competitive Comparison

Standard header. Full table with highlighted "Us" column.

```html
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: 1280px; height: 720px; overflow: hidden; font-family: 'Inter', sans-serif; background: var(--slide-bg, #FFFFFF); color: var(--slide-text, #111827); position: relative; }
</style>
</head>
<body>
<div style="position:absolute;top:0;left:0;width:5px;height:100%;background:var(--slide-accent,#7C3AED);"></div>
<div style="padding:28px 52px 0 57px;">
  <div style="font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:var(--slide-secondary,#4B5563);margin-bottom:6px;">COMPETITIVE LANDSCAPE · WHY NEXUS</div>
  <div style="font-size:28px;font-weight:700;color:var(--slide-text,#111827);padding-left:16px;">How We Compare</div>
</div>
<div style="margin:12px 52px 0 57px;height:1px;background:var(--slide-border,#E5E7EB);"></div>
<div style="padding:12px 52px 0 57px;">
  <table style="width:100%;border-collapse:collapse;font-size:12px;">
    <thead>
      <tr style="background:var(--slide-dark,#111827);">
        <th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:600;color:#FFFFFF;text-transform:uppercase;letter-spacing:1px;width:26%;">Feature</th>
        <th style="padding:10px 16px;text-align:center;font-size:11px;font-weight:600;color:var(--slide-accent-light,#C4B5FD);text-transform:uppercase;letter-spacing:1px;width:18.5%;border-left:2px solid var(--slide-accent,#7C3AED);">Nexus ★ Recommended</th>
        <th style="padding:10px 16px;text-align:center;font-size:11px;font-weight:600;color:#FFFFFF;text-transform:uppercase;letter-spacing:1px;width:18.5%;">Salesforce AI</th>
        <th style="padding:10px 16px;text-align:center;font-size:11px;font-weight:600;color:#FFFFFF;text-transform:uppercase;letter-spacing:1px;width:18.5%;">Clari</th>
        <th style="padding:10px 16px;text-align:center;font-size:11px;font-weight:600;color:#FFFFFF;text-transform:uppercase;letter-spacing:1px;width:18.5%;">Gong</th>
      </tr>
    </thead>
    <tbody>
      <tr style="background:#FFFFFF;">
        <td style="padding:9px 16px;font-weight:500;">AI Deal Scoring (real-time)</td>
        <td style="padding:9px 16px;text-align:center;font-weight:600;color:#059669;border-left:2px solid var(--slide-accent,#7C3AED);background:rgba(124,58,237,0.03);">✓ Native</td>
        <td style="padding:9px 16px;text-align:center;color:#D97706;">Partial (add-on)</td>
        <td style="padding:9px 16px;text-align:center;color:#059669;">✓</td>
        <td style="padding:9px 16px;text-align:center;color:#DC2626;">✗</td>
      </tr>
      <tr style="background:#F9FAFB;">
        <td style="padding:9px 16px;font-weight:500;">Automated CRM Data Capture</td>
        <td style="padding:9px 16px;text-align:center;font-weight:600;color:#059669;border-left:2px solid var(--slide-accent,#7C3AED);background:rgba(124,58,237,0.03);">✓ Full-auto</td>
        <td style="padding:9px 16px;text-align:center;color:#D97706;">Partial</td>
        <td style="padding:9px 16px;text-align:center;color:#DC2626;">✗</td>
        <td style="padding:9px 16px;text-align:center;color:#059669;">✓</td>
      </tr>
      <tr style="background:#FFFFFF;">
        <td style="padding:9px 16px;font-weight:500;">AI Coaching at Scale</td>
        <td style="padding:9px 16px;text-align:center;font-weight:600;color:#059669;border-left:2px solid var(--slide-accent,#7C3AED);background:rgba(124,58,237,0.03);">✓ Built-in</td>
        <td style="padding:9px 16px;text-align:center;color:#DC2626;">✗</td>
        <td style="padding:9px 16px;text-align:center;color:#DC2626;">✗</td>
        <td style="padding:9px 16px;text-align:center;color:#059669;">✓</td>
      </tr>
      <tr style="background:#F9FAFB;">
        <td style="padding:9px 16px;font-weight:500;">Revenue Forecasting</td>
        <td style="padding:9px 16px;text-align:center;font-weight:600;color:#059669;border-left:2px solid var(--slide-accent,#7C3AED);background:rgba(124,58,237,0.03);">✓ 94% accuracy</td>
        <td style="padding:9px 16px;text-align:center;color:#059669;">✓ 88% accuracy</td>
        <td style="padding:9px 16px;text-align:center;color:#059669;">✓ 91% accuracy</td>
        <td style="padding:9px 16px;text-align:center;color:#DC2626;">✗</td>
      </tr>
      <tr style="background:#FFFFFF;">
        <td style="padding:9px 16px;font-weight:500;">Avg Implementation Time</td>
        <td style="padding:9px 16px;text-align:center;font-weight:600;color:#059669;border-left:2px solid var(--slide-accent,#7C3AED);background:rgba(124,58,237,0.03);">2 weeks</td>
        <td style="padding:9px 16px;text-align:center;color:#D97706;">12+ weeks</td>
        <td style="padding:9px 16px;text-align:center;color:#D97706;">6–8 weeks</td>
        <td style="padding:9px 16px;text-align:center;color:#D97706;">4–6 weeks</td>
      </tr>
      <tr style="background:#F9FAFB;">
        <td style="padding:9px 16px;font-weight:500;">Pricing (per seat / month)</td>
        <td style="padding:9px 16px;text-align:center;font-weight:600;color:#059669;border-left:2px solid var(--slide-accent,#7C3AED);background:rgba(124,58,237,0.03);">$95</td>
        <td style="padding:9px 16px;text-align:center;color:#6B7280;">$185+</td>
        <td style="padding:9px 16px;text-align:center;color:#6B7280;">$140</td>
        <td style="padding:9px 16px;text-align:center;color:#6B7280;">$125</td>
      </tr>
      <tr style="background:#FFFFFF;">
        <td style="padding:9px 16px;font-weight:500;">G2 Rating</td>
        <td style="padding:9px 16px;text-align:center;font-weight:600;color:#059669;border-left:2px solid var(--slide-accent,#7C3AED);background:rgba(124,58,237,0.03);">4.8/5.0</td>
        <td style="padding:9px 16px;text-align:center;color:#6B7280;">4.1/5.0</td>
        <td style="padding:9px 16px;text-align:center;color:#6B7280;">4.4/5.0</td>
        <td style="padding:9px 16px;text-align:center;color:#6B7280;">4.6/5.0</td>
      </tr>
    </tbody>
  </table>
</div>
<!-- Dark Footer -->
<div style="position:absolute;bottom:0;left:0;right:0;height:44px;background:var(--slide-dark,#111827);display:flex;align-items:center;padding:0 57px;">
  <span style="font-size:12px;font-weight:500;color:#FFFFFF;">Nexus is the only platform combining deal intelligence, automated capture, and coaching in a single product at half the cost</span>
</div>
</body>
</html>
```

---

## Pattern 8: Product Demo / Screenshot

Standard header. Left 55% screenshot placeholder. Right 45% numbered callout cards.

```html
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: 1280px; height: 720px; overflow: hidden; font-family: 'Inter', sans-serif; background: var(--slide-bg, #FFFFFF); color: var(--slide-text, #111827); position: relative; }
</style>
</head>
<body>
<div style="position:absolute;top:0;left:0;width:5px;height:100%;background:var(--slide-accent,#7C3AED);"></div>
<div style="padding:28px 52px 0 57px;">
  <div style="font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:var(--slide-secondary,#4B5563);margin-bottom:6px;">PRODUCT DEMO · DEAL INTELLIGENCE</div>
  <div style="font-size:28px;font-weight:700;color:var(--slide-text,#111827);padding-left:16px;">See Your Pipeline in a Whole New Way</div>
</div>
<div style="margin:14px 52px 0 57px;height:1px;background:var(--slide-border,#E5E7EB);"></div>
<!-- Body -->
<div style="display:flex;gap:20px;padding:16px 52px 0 57px;height:calc(100% - 108px - 44px);">
  <!-- Screenshot Placeholder -->
  <div style="width:55%;background:#F3F4F6;border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,0.12);overflow:hidden;position:relative;">
    <!-- Fake browser chrome -->
    <div style="background:#E5E7EB;padding:8px 12px;display:flex;align-items:center;gap:6px;">
      <div style="width:10px;height:10px;border-radius:50%;background:#DC2626;"></div>
      <div style="width:10px;height:10px;border-radius:50%;background:#D97706;"></div>
      <div style="width:10px;height:10px;border-radius:50%;background:#059669;"></div>
      <div style="flex:1;background:#FFFFFF;border-radius:4px;height:18px;margin-left:8px;display:flex;align-items:center;padding:0 8px;">
        <span style="font-size:9px;color:#9CA3AF;">app.nexusplatform.com/pipeline</span>
      </div>
    </div>
    <!-- Mock UI content -->
    <div style="padding:16px;background:#FFFFFF;height:100%;">
      <div style="font-size:11px;font-weight:600;color:#374151;margin-bottom:10px;">Pipeline Health Overview · Q2 2026</div>
      <div style="display:flex;flex-direction:column;gap:6px;">
        <div style="background:#F9FAFB;border-radius:6px;padding:8px 12px;border:1px solid #E5E7EB;display:flex;align-items:center;gap:8px;">
          <div style="width:6px;height:6px;border-radius:50%;background:#059669;"></div>
          <span style="font-size:10px;font-weight:500;flex:1;">Accenture — Enterprise Suite Renewal</span>
          <span style="font-size:10px;color:#059669;font-weight:600;">Score: 94</span>
          <span style="font-size:10px;color:#6B7280;">$840K · Close: May 15</span>
        </div>
        <div style="background:#F9FAFB;border-radius:6px;padding:8px 12px;border:1px solid #E5E7EB;display:flex;align-items:center;gap:8px;">
          <div style="width:6px;height:6px;border-radius:50%;background:#D97706;"></div>
          <span style="font-size:10px;font-weight:500;flex:1;">Deloitte — New Platform Expansion</span>
          <span style="font-size:10px;color:#D97706;font-weight:600;">Score: 61</span>
          <span style="font-size:10px;color:#6B7280;">$1.2M · Close: Jun 30</span>
        </div>
        <div style="background:#F9FAFB;border-radius:6px;padding:8px 12px;border:1px solid #E5E7EB;display:flex;align-items:center;gap:8px;">
          <div style="width:6px;height:6px;border-radius:50%;background:#DC2626;"></div>
          <span style="font-size:10px;font-weight:500;flex:1;">KPMG — Pro Services Upsell</span>
          <span style="font-size:10px;color:#DC2626;font-weight:600;">Score: 28 ⚠</span>
          <span style="font-size:10px;color:#6B7280;">$380K · Close: Apr 28</span>
        </div>
        <div style="background:#F9FAFB;border-radius:6px;padding:8px 12px;border:1px solid #E5E7EB;display:flex;align-items:center;gap:8px;">
          <div style="width:6px;height:6px;border-radius:50%;background:#059669;"></div>
          <span style="font-size:10px;font-weight:500;flex:1;">EY — Global License Agreement</span>
          <span style="font-size:10px;color:#059669;font-weight:600;">Score: 88</span>
          <span style="font-size:10px;color:#6B7280;">$2.1M · Close: May 31</span>
        </div>
      </div>
      <div style="margin-top:10px;padding:8px 12px;background:rgba(124,58,237,0.06);border-radius:6px;border:1px solid rgba(124,58,237,0.15);">
        <div style="font-size:9px;font-weight:600;color:var(--slide-accent,#7C3AED);margin-bottom:3px;">AI RECOMMENDATION</div>
        <div style="font-size:10px;color:#374151;">KPMG deal at risk — no buyer engagement in 11 days. Suggest: executive outreach from VP Sales this week.</div>
      </div>
    </div>
  </div>
  <!-- Callout Cards Right -->
  <div style="flex:1;display:flex;flex-direction:column;gap:14px;justify-content:center;">
    <div style="background:#FFFFFF;border-radius:12px;padding:16px 18px;box-shadow:0 2px 12px rgba(0,0,0,0.07);border:1px solid var(--slide-border,#E5E7EB);display:flex;gap:14px;align-items:flex-start;">
      <div style="width:28px;height:28px;border-radius:50%;background:var(--slide-accent,#7C3AED);display:flex;align-items:center;justify-content:center;flex-shrink:0;"><span style="font-size:13px;font-weight:700;color:#FFFFFF;">1</span></div>
      <div>
        <div style="font-size:13px;font-weight:700;color:var(--slide-text,#111827);margin-bottom:4px;">Real-Time Deal Health Scores</div>
        <div style="font-size:12px;color:var(--slide-secondary,#4B5563);line-height:1.5;">Every deal scored 0–100 in real time based on engagement, stakeholder activity, and competitive signals — no manual updates needed.</div>
      </div>
    </div>
    <div style="background:#FFFFFF;border-radius:12px;padding:16px 18px;box-shadow:0 2px 12px rgba(0,0,0,0.07);border:1px solid var(--slide-border,#E5E7EB);display:flex;gap:14px;align-items:flex-start;">
      <div style="width:28px;height:28px;border-radius:50%;background:var(--slide-accent,#7C3AED);display:flex;align-items:center;justify-content:center;flex-shrink:0;"><span style="font-size:13px;font-weight:700;color:#FFFFFF;">2</span></div>
      <div>
        <div style="font-size:13px;font-weight:700;color:var(--slide-text,#111827);margin-bottom:4px;">Proactive Risk Alerts</div>
        <div style="font-size:12px;color:var(--slide-secondary,#4B5563);line-height:1.5;">Nexus alerts you the moment a deal shows warning signs — ghosting, champion change, or competitive mention — with a specific recommended action.</div>
      </div>
    </div>
    <div style="background:#FFFFFF;border-radius:12px;padding:16px 18px;box-shadow:0 2px 12px rgba(0,0,0,0.07);border:1px solid var(--slide-border,#E5E7EB);display:flex;gap:14px;align-items:flex-start;">
      <div style="width:28px;height:28px;border-radius:50%;background:var(--slide-accent,#7C3AED);display:flex;align-items:center;justify-content:center;flex-shrink:0;"><span style="font-size:13px;font-weight:700;color:#FFFFFF;">3</span></div>
      <div>
        <div style="font-size:13px;font-weight:700;color:var(--slide-text,#111827);margin-bottom:4px;">One-Click CRM Sync</div>
        <div style="font-size:12px;color:var(--slide-secondary,#4B5563);line-height:1.5;">All deal activity — emails, calls, meetings — automatically logged to Salesforce, HubSpot, or any CRM. Data stays accurate without reps touching it.</div>
      </div>
    </div>
  </div>
</div>
<!-- Dark Footer -->
<div style="position:absolute;bottom:0;left:0;right:0;height:44px;background:var(--slide-dark,#111827);display:flex;align-items:center;padding:0 57px;">
  <span style="font-size:12px;font-weight:500;color:#FFFFFF;">Live demo available — see your actual pipeline data in Nexus within 24 hours with our free pilot program</span>
</div>
</body>
</html>
```

---

## Pattern 9: Pricing / Tiers

Standard header. Three pricing tier cards. Middle card recommended/elevated.

```html
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: 1280px; height: 720px; overflow: hidden; font-family: 'Inter', sans-serif; background: var(--slide-bg, #FFFFFF); color: var(--slide-text, #111827); position: relative; }
</style>
</head>
<body>
<div style="position:absolute;top:0;left:0;width:5px;height:100%;background:var(--slide-accent,#7C3AED);"></div>
<div style="padding:28px 52px 0 57px;">
  <div style="font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:var(--slide-secondary,#4B5563);margin-bottom:6px;">PRICING · SIMPLE &amp; TRANSPARENT</div>
  <div style="font-size:28px;font-weight:700;color:var(--slide-text,#111827);padding-left:16px;">Choose Your Plan</div>
</div>
<div style="margin:14px 52px 0 57px;height:1px;background:var(--slide-border,#E5E7EB);"></div>
<!-- Pricing Cards -->
<div style="display:flex;gap:16px;padding:18px 52px 0 57px;align-items:flex-start;">
  <!-- Starter -->
  <div style="flex:1;background:#FFFFFF;border-radius:12px;padding:22px 22px;box-shadow:0 2px 8px rgba(0,0,0,0.06);border:1px solid var(--slide-border,#E5E7EB);">
    <div style="font-size:14px;font-weight:700;color:var(--slide-text,#111827);margin-bottom:4px;">Starter</div>
    <div style="font-size:12px;color:#6B7280;margin-bottom:16px;">For growing sales teams</div>
    <div style="display:flex;align-items:baseline;gap:4px;margin-bottom:4px;">
      <span style="font-size:36px;font-weight:800;color:var(--slide-text,#111827);">$65</span>
      <span style="font-size:13px;color:#6B7280;">/seat/mo</span>
    </div>
    <div style="font-size:11px;color:#9CA3AF;margin-bottom:16px;">billed annually · min 10 seats</div>
    <div style="display:flex;flex-direction:column;gap:7px;margin-bottom:18px;font-size:12px;color:var(--slide-secondary,#4B5563);line-height:1.4;">
      <div style="display:flex;gap:8px;"><span style="color:#059669;">✓</span><span>AI deal health scoring</span></div>
      <div style="display:flex;gap:8px;"><span style="color:#059669;">✓</span><span>Automated CRM capture</span></div>
      <div style="display:flex;gap:8px;"><span style="color:#059669;">✓</span><span>Pipeline dashboard</span></div>
      <div style="display:flex;gap:8px;"><span style="color:#9CA3AF;">—</span><span style="color:#9CA3AF;">AI coaching reports</span></div>
      <div style="display:flex;gap:8px;"><span style="color:#9CA3AF;">—</span><span style="color:#9CA3AF;">Forecasting module</span></div>
    </div>
    <div style="background:#F3F4F6;border-radius:8px;padding:9px 14px;text-align:center;font-size:13px;font-weight:600;color:#374151;">Get Started</div>
  </div>
  <!-- Professional (Recommended) -->
  <div style="flex:1;background:#FFFFFF;border-radius:12px;padding:22px 22px;box-shadow:0 8px 28px rgba(124,58,237,0.18);border:2px solid var(--slide-accent,#7C3AED);position:relative;margin-top:-8px;">
    <div style="position:absolute;top:-3px;left:0;right:0;height:3px;background:var(--slide-accent,#7C3AED);border-radius:12px 12px 0 0;"></div>
    <div style="position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:var(--slide-accent,#7C3AED);color:#FFFFFF;font-size:10px;font-weight:700;padding:3px 12px;border-radius:100px;letter-spacing:1px;white-space:nowrap;">MOST POPULAR</div>
    <div style="font-size:14px;font-weight:700;color:var(--slide-accent,#7C3AED);margin-bottom:4px;">Professional</div>
    <div style="font-size:12px;color:#6B7280;margin-bottom:16px;">For high-performing revenue teams</div>
    <div style="display:flex;align-items:baseline;gap:4px;margin-bottom:4px;">
      <span style="font-size:36px;font-weight:800;color:var(--slide-accent,#7C3AED);">$95</span>
      <span style="font-size:13px;color:#6B7280;">/seat/mo</span>
    </div>
    <div style="font-size:11px;color:#9CA3AF;margin-bottom:16px;">billed annually · min 25 seats</div>
    <div style="display:flex;flex-direction:column;gap:7px;margin-bottom:18px;font-size:12px;color:var(--slide-secondary,#4B5563);line-height:1.4;">
      <div style="display:flex;gap:8px;"><span style="color:#059669;">✓</span><span>Everything in Starter</span></div>
      <div style="display:flex;gap:8px;"><span style="color:#059669;">✓</span><span>AI coaching reports (weekly)</span></div>
      <div style="display:flex;gap:8px;"><span style="color:#059669;">✓</span><span>Revenue forecasting (94% accuracy)</span></div>
      <div style="display:flex;gap:8px;"><span style="color:#059669;">✓</span><span>Manager coaching dashboard</span></div>
      <div style="display:flex;gap:8px;"><span style="color:#059669;">✓</span><span>Slack &amp; Teams integration</span></div>
    </div>
    <div style="background:var(--slide-accent,#7C3AED);border-radius:8px;padding:9px 14px;text-align:center;font-size:13px;font-weight:600;color:#FFFFFF;">Start Free Trial</div>
  </div>
  <!-- Enterprise -->
  <div style="flex:1;background:#FFFFFF;border-radius:12px;padding:22px 22px;box-shadow:0 2px 8px rgba(0,0,0,0.06);border:1px solid var(--slide-border,#E5E7EB);">
    <div style="font-size:14px;font-weight:700;color:var(--slide-text,#111827);margin-bottom:4px;">Enterprise</div>
    <div style="font-size:12px;color:#6B7280;margin-bottom:16px;">For large orgs with custom needs</div>
    <div style="display:flex;align-items:baseline;gap:4px;margin-bottom:4px;">
      <span style="font-size:36px;font-weight:800;color:var(--slide-text,#111827);">Custom</span>
    </div>
    <div style="font-size:11px;color:#9CA3AF;margin-bottom:16px;">volume discounts · custom terms</div>
    <div style="display:flex;flex-direction:column;gap:7px;margin-bottom:18px;font-size:12px;color:var(--slide-secondary,#4B5563);line-height:1.4;">
      <div style="display:flex;gap:8px;"><span style="color:#059669;">✓</span><span>Everything in Professional</span></div>
      <div style="display:flex;gap:8px;"><span style="color:#059669;">✓</span><span>Dedicated customer success manager</span></div>
      <div style="display:flex;gap:8px;"><span style="color:#059669;">✓</span><span>Custom AI model fine-tuning</span></div>
      <div style="display:flex;gap:8px;"><span style="color:#059669;">✓</span><span>SLA + 24/7 priority support</span></div>
      <div style="display:flex;gap:8px;"><span style="color:#059669;">✓</span><span>On-premise deployment option</span></div>
    </div>
    <div style="background:#F3F4F6;border-radius:8px;padding:9px 14px;text-align:center;font-size:13px;font-weight:600;color:#374151;">Talk to Sales</div>
  </div>
</div>
<!-- Dark Footer -->
<div style="position:absolute;bottom:0;left:0;right:0;height:44px;background:var(--slide-dark,#111827);display:flex;align-items:center;padding:0 57px;">
  <span style="font-size:12px;font-weight:500;color:#FFFFFF;">All plans include 14-day free trial · No credit card required · Cancel anytime · 96% renewal rate</span>
</div>
</body>
</html>
```

---

## Pattern 10: Customer Journey / Funnel

Standard header. Five horizontal funnel stages with connecting arrows and metrics.

```html
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: 1280px; height: 720px; overflow: hidden; font-family: 'Inter', sans-serif; background: var(--slide-bg, #FFFFFF); color: var(--slide-text, #111827); position: relative; }
</style>
</head>
<body>
<div style="position:absolute;top:0;left:0;width:5px;height:100%;background:var(--slide-accent,#7C3AED);"></div>
<div style="padding:28px 52px 0 57px;">
  <div style="font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:var(--slide-secondary,#4B5563);margin-bottom:6px;">SALES FUNNEL · Q1 2026 PERFORMANCE</div>
  <div style="font-size:28px;font-weight:700;color:var(--slide-text,#111827);padding-left:16px;">Revenue Funnel &amp; Conversion Rates</div>
</div>
<div style="margin:14px 52px 0 57px;height:1px;background:var(--slide-border,#E5E7EB);"></div>
<!-- Funnel Stages -->
<div style="display:flex;align-items:center;padding:20px 52px 0 57px;gap:0;">
  <!-- Stage 1 -->
  <div style="flex:1;display:flex;flex-direction:column;align-items:center;text-align:center;">
    <div style="background:var(--slide-dark,#111827);border-radius:10px;padding:16px 14px;width:100%;margin-bottom:12px;position:relative;">
      <div style="position:absolute;top:0;left:0;right:0;height:3px;background:var(--slide-accent,#7C3AED);border-radius:10px 10px 0 0;"></div>
      <div style="font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:var(--slide-accent-light,#C4B5FD);margin-bottom:6px;margin-top:4px;">AWARENESS</div>
      <div style="font-size:28px;font-weight:800;color:#FFFFFF;line-height:1;">48,200</div>
      <div style="font-size:11px;color:#9CA3AF;margin-top:4px;">MQLs generated</div>
    </div>
    <div style="font-size:11px;color:#6B7280;line-height:1.5;max-width:140px;">Paid search, content, and outbound SDR campaigns</div>
  </div>
  <!-- Arrow + Conversion -->
  <div style="display:flex;flex-direction:column;align-items:center;padding:0 6px;padding-bottom:40px;gap:4px;">
    <div style="font-size:11px;font-weight:600;color:#059669;">32%</div>
    <span style="font-size:18px;color:#E5E7EB;">→</span>
  </div>
  <!-- Stage 2 -->
  <div style="flex:1;display:flex;flex-direction:column;align-items:center;text-align:center;">
    <div style="background:var(--slide-dark,#111827);border-radius:10px;padding:16px 14px;width:100%;margin-bottom:12px;position:relative;">
      <div style="position:absolute;top:0;left:0;right:0;height:3px;background:var(--slide-accent,#7C3AED);border-radius:10px 10px 0 0;"></div>
      <div style="font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:var(--slide-accent-light,#C4B5FD);margin-bottom:6px;margin-top:4px;">DISCOVERY</div>
      <div style="font-size:28px;font-weight:800;color:#FFFFFF;line-height:1;">15,420</div>
      <div style="font-size:11px;color:#9CA3AF;margin-top:4px;">SQLs qualified</div>
    </div>
    <div style="font-size:11px;color:#6B7280;line-height:1.5;max-width:140px;">BDR qualification calls, demo requests</div>
  </div>
  <!-- Arrow + Conversion -->
  <div style="display:flex;flex-direction:column;align-items:center;padding:0 6px;padding-bottom:40px;gap:4px;">
    <div style="font-size:11px;font-weight:600;color:#D97706;">41%</div>
    <span style="font-size:18px;color:#E5E7EB;">→</span>
  </div>
  <!-- Stage 3 -->
  <div style="flex:1;display:flex;flex-direction:column;align-items:center;text-align:center;">
    <div style="background:var(--slide-dark,#111827);border-radius:10px;padding:16px 14px;width:100%;margin-bottom:12px;position:relative;">
      <div style="position:absolute;top:0;left:0;right:0;height:3px;background:var(--slide-accent,#7C3AED);border-radius:10px 10px 0 0;"></div>
      <div style="font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:var(--slide-accent-light,#C4B5FD);margin-bottom:6px;margin-top:4px;">EVALUATION</div>
      <div style="font-size:28px;font-weight:800;color:#FFFFFF;line-height:1;">6,320</div>
      <div style="font-size:11px;color:#9CA3AF;margin-top:4px;">Active opportunities</div>
    </div>
    <div style="font-size:11px;color:#6B7280;line-height:1.5;max-width:140px;">Pilot programs, proposals, security reviews</div>
  </div>
  <!-- Arrow + Conversion -->
  <div style="display:flex;flex-direction:column;align-items:center;padding:0 6px;padding-bottom:40px;gap:4px;">
    <div style="font-size:11px;font-weight:600;color:#D97706;">29%</div>
    <span style="font-size:18px;color:#E5E7EB;">→</span>
  </div>
  <!-- Stage 4 -->
  <div style="flex:1;display:flex;flex-direction:column;align-items:center;text-align:center;">
    <div style="background:var(--slide-dark,#111827);border-radius:10px;padding:16px 14px;width:100%;margin-bottom:12px;position:relative;">
      <div style="position:absolute;top:0;left:0;right:0;height:3px;background:var(--slide-accent,#7C3AED);border-radius:10px 10px 0 0;"></div>
      <div style="font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:var(--slide-accent-light,#C4B5FD);margin-bottom:6px;margin-top:4px;">NEGOTIATION</div>
      <div style="font-size:28px;font-weight:800;color:#FFFFFF;line-height:1;">1,830</div>
      <div style="font-size:11px;color:#9CA3AF;margin-top:4px;">Late-stage deals</div>
    </div>
    <div style="font-size:11px;color:#6B7280;line-height:1.5;max-width:140px;">Legal review, pricing negotiation, procurement</div>
  </div>
  <!-- Arrow + Conversion -->
  <div style="display:flex;flex-direction:column;align-items:center;padding:0 6px;padding-bottom:40px;gap:4px;">
    <div style="font-size:11px;font-weight:600;color:#059669;">68%</div>
    <span style="font-size:18px;color:#E5E7EB;">→</span>
  </div>
  <!-- Stage 5 -->
  <div style="flex:1;display:flex;flex-direction:column;align-items:center;text-align:center;">
    <div style="background:var(--slide-accent,#7C3AED);border-radius:10px;padding:16px 14px;width:100%;margin-bottom:12px;position:relative;">
      <div style="font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:rgba(255,255,255,0.7);margin-bottom:6px;">CLOSED WON</div>
      <div style="font-size:28px;font-weight:800;color:#FFFFFF;line-height:1;">1,244</div>
      <div style="font-size:11px;color:rgba(255,255,255,0.7);margin-top:4px;">Deals closed Q1</div>
    </div>
    <div style="font-size:11px;color:#6B7280;line-height:1.5;max-width:140px;">$612M total ARR · avg deal $492K</div>
  </div>
</div>
<!-- Summary Row -->
<div style="display:flex;gap:16px;padding:20px 52px 0 57px;">
  <div style="flex:1;background:#F9FAFB;border-radius:8px;padding:12px 16px;border:1px solid var(--slide-border,#E5E7EB);">
    <div style="font-size:12px;font-weight:600;color:var(--slide-text,#111827);">Overall Conversion</div>
    <div style="font-size:20px;font-weight:800;color:var(--slide-accent,#7C3AED);margin-top:4px;">2.6%</div>
    <div style="font-size:11px;color:#6B7280;margin-top:2px;">MQL to Closed Won</div>
  </div>
  <div style="flex:1;background:#F9FAFB;border-radius:8px;padding:12px 16px;border:1px solid var(--slide-border,#E5E7EB);">
    <div style="font-size:12px;font-weight:600;color:var(--slide-text,#111827);">Avg Sales Cycle</div>
    <div style="font-size:20px;font-weight:800;color:var(--slide-accent,#7C3AED);margin-top:4px;">67 days</div>
    <div style="font-size:11px;color:#059669;margin-top:2px;">↓ 14 days vs Q1 2025</div>
  </div>
  <div style="flex:1;background:#F9FAFB;border-radius:8px;padding:12px 16px;border:1px solid var(--slide-border,#E5E7EB);">
    <div style="font-size:12px;font-weight:600;color:var(--slide-text,#111827);">Avg Contract Value</div>
    <div style="font-size:20px;font-weight:800;color:var(--slide-accent,#7C3AED);margin-top:4px;">$492K</div>
    <div style="font-size:11px;color:#059669;margin-top:2px;">↑ 28% vs Q1 2025</div>
  </div>
  <div style="flex:1;background:#F9FAFB;border-radius:8px;padding:12px 16px;border:1px solid var(--slide-border,#E5E7EB);">
    <div style="font-size:12px;font-weight:600;color:var(--slide-text,#111827);">Pipeline Coverage</div>
    <div style="font-size:20px;font-weight:800;color:var(--slide-accent,#7C3AED);margin-top:4px;">3.4×</div>
    <div style="font-size:11px;color:#059669;margin-top:2px;">Above 3× target</div>
  </div>
</div>
<!-- Dark Footer -->
<div style="position:absolute;bottom:0;left:0;right:0;height:44px;background:var(--slide-dark,#111827);display:flex;align-items:center;padding:0 57px;">
  <span style="font-size:12px;font-weight:500;color:#FFFFFF;">Biggest opportunity: improve Evaluation → Negotiation conversion from 29% to 35% — would add ~$120M ARR</span>
</div>
</body>
</html>
```

---

## Pattern 11: Campaign / Channel Breakdown

Standard header. Dark hero panel left. Channel allocation rows right.

```html
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: 1280px; height: 720px; overflow: hidden; font-family: 'Inter', sans-serif; background: var(--slide-bg, #FFFFFF); color: var(--slide-text, #111827); position: relative; }
</style>
</head>
<body>
<div style="position:absolute;top:0;left:0;width:5px;height:100%;background:var(--slide-accent,#7C3AED);"></div>
<div style="padding:28px 52px 0 57px;">
  <div style="font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:var(--slide-secondary,#4B5563);margin-bottom:6px;">Q1 2026 MARKETING · CHANNEL PERFORMANCE</div>
  <div style="font-size:28px;font-weight:700;color:var(--slide-text,#111827);padding-left:16px;">Campaign Results by Channel</div>
</div>
<div style="margin:14px 52px 0 57px;height:1px;background:var(--slide-border,#E5E7EB);"></div>
<!-- Body -->
<div style="display:flex;gap:20px;padding:16px 52px 0 57px;height:calc(100% - 108px - 44px);">
  <!-- Dark Hero Left -->
  <div style="width:43%;background:var(--slide-dark,#111827);border-radius:12px;padding:28px 28px;position:relative;overflow:hidden;display:flex;flex-direction:column;justify-content:center;">
    <div style="position:absolute;top:0;left:0;right:0;height:3px;background:var(--slide-accent-light,#C4B5FD);"></div>
    <div style="font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:var(--slide-accent-light,#C4B5FD);margin-bottom:10px;">Q1 2026 CAMPAIGN</div>
    <div style="font-size:26px;font-weight:800;color:#FFFFFF;line-height:1.2;margin-bottom:6px;">Spring 2026<br>Enterprise Push</div>
    <div style="font-size:13px;color:#9CA3AF;margin-bottom:24px;">January 1 – March 31, 2026</div>
    <div style="border-top:1px solid rgba(255,255,255,0.1);padding-top:20px;">
      <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
        <span style="font-size:11px;color:#9CA3AF;">Total Spend</span>
        <span style="font-size:13px;font-weight:700;color:#FFFFFF;">$4.2M</span>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
        <span style="font-size:11px;color:#9CA3AF;">Total Reach</span>
        <span style="font-size:13px;font-weight:700;color:#FFFFFF;">2.8M impressions</span>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
        <span style="font-size:11px;color:#9CA3AF;">Pipeline Generated</span>
        <span style="font-size:13px;font-weight:700;color:var(--slide-accent-light,#C4B5FD);">$68M</span>
      </div>
      <div style="display:flex;justify-content:space-between;">
        <span style="font-size:11px;color:#9CA3AF;">Blended Pipeline ROI</span>
        <span style="font-size:13px;font-weight:700;color:#C4B5FD;">16.2×</span>
      </div>
    </div>
  </div>
  <!-- Channel Rows Right -->
  <div style="flex:1;display:flex;flex-direction:column;gap:10px;justify-content:center;">
    <div style="font-size:12px;font-weight:600;color:var(--slide-text,#111827);margin-bottom:4px;">Pipeline Generated by Channel</div>
    <!-- Channel 1 -->
    <div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
        <div style="display:flex;align-items:center;gap:8px;">
          <div style="width:28px;height:28px;border-radius:6px;background:rgba(124,58,237,0.1);display:flex;align-items:center;justify-content:center;font-size:13px;">🔍</div>
          <span style="font-size:13px;font-weight:600;color:var(--slide-text,#111827);">Paid Search</span>
        </div>
        <div style="display:flex;align-items:center;gap:12px;">
          <span style="font-size:13px;font-weight:700;color:var(--slide-accent,#7C3AED);">$24.5M</span>
          <span style="font-size:11px;color:#9CA3AF;width:30px;text-align:right;">36%</span>
        </div>
      </div>
      <div style="height:7px;border-radius:6px;background:#F3F4F6;"><div style="height:100%;width:36%;border-radius:6px;background:var(--slide-accent,#7C3AED);"></div></div>
    </div>
    <!-- Channel 2 -->
    <div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
        <div style="display:flex;align-items:center;gap:8px;">
          <div style="width:28px;height:28px;border-radius:6px;background:rgba(124,58,237,0.1);display:flex;align-items:center;justify-content:center;font-size:13px;">📧</div>
          <span style="font-size:13px;font-weight:600;color:var(--slide-text,#111827);">Outbound Email</span>
        </div>
        <div style="display:flex;align-items:center;gap:12px;">
          <span style="font-size:13px;font-weight:700;color:var(--slide-accent,#7C3AED);">$18.7M</span>
          <span style="font-size:11px;color:#9CA3AF;width:30px;text-align:right;">27%</span>
        </div>
      </div>
      <div style="height:7px;border-radius:6px;background:#F3F4F6;"><div style="height:100%;width:27%;border-radius:6px;background:var(--slide-accent,#7C3AED);"></div></div>
    </div>
    <!-- Channel 3 -->
    <div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
        <div style="display:flex;align-items:center;gap:8px;">
          <div style="width:28px;height:28px;border-radius:6px;background:rgba(124,58,237,0.1);display:flex;align-items:center;justify-content:center;font-size:13px;">📢</div>
          <span style="font-size:13px;font-weight:600;color:var(--slide-text,#111827);">Content / SEO</span>
        </div>
        <div style="display:flex;align-items:center;gap:12px;">
          <span style="font-size:13px;font-weight:700;color:var(--slide-accent,#7C3AED);">$14.3M</span>
          <span style="font-size:11px;color:#9CA3AF;width:30px;text-align:right;">21%</span>
        </div>
      </div>
      <div style="height:7px;border-radius:6px;background:#F3F4F6;"><div style="height:100%;width:21%;border-radius:6px;background:var(--slide-accent,#7C3AED);"></div></div>
    </div>
    <!-- Channel 4 -->
    <div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
        <div style="display:flex;align-items:center;gap:8px;">
          <div style="width:28px;height:28px;border-radius:6px;background:rgba(124,58,237,0.1);display:flex;align-items:center;justify-content:center;font-size:13px;">🎤</div>
          <span style="font-size:13px;font-weight:600;color:var(--slide-text,#111827);">Events &amp; Webinars</span>
        </div>
        <div style="display:flex;align-items:center;gap:12px;">
          <span style="font-size:13px;font-weight:700;color:var(--slide-accent,#7C3AED);">$7.1M</span>
          <span style="font-size:11px;color:#9CA3AF;width:30px;text-align:right;">10%</span>
        </div>
      </div>
      <div style="height:7px;border-radius:6px;background:#F3F4F6;"><div style="height:100%;width:10%;border-radius:6px;background:var(--slide-accent,#7C3AED);"></div></div>
    </div>
    <!-- Channel 5 -->
    <div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
        <div style="display:flex;align-items:center;gap:8px;">
          <div style="width:28px;height:28px;border-radius:6px;background:rgba(124,58,237,0.1);display:flex;align-items:center;justify-content:center;font-size:13px;">🤝</div>
          <span style="font-size:13px;font-weight:600;color:var(--slide-text,#111827);">Partner Referrals</span>
        </div>
        <div style="display:flex;align-items:center;gap:12px;">
          <span style="font-size:13px;font-weight:700;color:var(--slide-accent,#7C3AED);">$3.4M</span>
          <span style="font-size:11px;color:#9CA3AF;width:30px;text-align:right;">6%</span>
        </div>
      </div>
      <div style="height:7px;border-radius:6px;background:#F3F4F6;"><div style="height:100%;width:6%;border-radius:6px;background:var(--slide-accent,#7C3AED);"></div></div>
    </div>
  </div>
</div>
<!-- Dark Footer -->
<div style="position:absolute;bottom:0;left:0;right:0;height:44px;background:var(--slide-dark,#111827);display:flex;align-items:center;padding:0 57px;">
  <span style="font-size:12px;font-weight:500;color:#FFFFFF;">Paid Search most efficient at $0.17 per pipeline dollar · Events highest close rate (42%) despite smaller volume</span>
</div>
</body>
</html>
```

---

## Pattern 12: Call to Action

Dark full-slide background. Centered headline, sub, two buttons. Subtle dot texture.

```html
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: 1280px; height: 720px; overflow: hidden; font-family: 'Inter', sans-serif; background: var(--slide-dark, #111827); color: #FFFFFF; display: flex; align-items: center; justify-content: center; position: relative; }
</style>
</head>
<body>
<!-- Radial gradient background -->
<div style="position:absolute;inset:0;background:radial-gradient(ellipse at 30% 50%, rgba(124,58,237,0.25) 0%, transparent 55%), radial-gradient(ellipse at 70% 50%, rgba(124,58,237,0.12) 0%, transparent 55%);"></div>
<!-- Dot pattern -->
<svg style="position:absolute;inset:0;width:100%;height:100%;opacity:0.08;" xmlns="http://www.w3.org/2000/svg">
  <defs><pattern id="dots2" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.5" fill="#FFFFFF"/></pattern></defs>
  <rect width="100%" height="100%" fill="url(#dots2)"/>
</svg>
<!-- Accent top bar -->
<div style="position:absolute;top:0;left:0;right:0;height:3px;background:var(--slide-accent,#7C3AED);"></div>
<!-- Content -->
<div style="position:relative;text-align:center;max-width:800px;padding:0 60px;">
  <div style="font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:var(--slide-accent-light,#C4B5FD);margin-bottom:20px;">READY TO GET STARTED?</div>
  <div style="font-size:48px;font-weight:800;color:#FFFFFF;line-height:1.1;margin-bottom:18px;letter-spacing:-0.5px;">Start Closing More Deals<br>in 14 Days or Less</div>
  <div style="font-size:18px;font-weight:400;color:rgba(255,255,255,0.6);line-height:1.5;margin-bottom:40px;max-width:560px;margin-left:auto;margin-right:auto;">No credit card. No lengthy onboarding. See your first AI deal score within 24 hours of connecting your CRM.</div>
  <!-- Buttons -->
  <div style="display:flex;gap:16px;justify-content:center;align-items:center;margin-bottom:32px;">
    <a href="#" style="background:var(--slide-accent,#7C3AED);color:#FFFFFF;padding:14px 36px;border-radius:8px;font-size:15px;font-weight:600;text-decoration:none;box-shadow:0 4px 20px rgba(124,58,237,0.5);">Start Free Trial</a>
    <a href="#" style="background:transparent;color:#FFFFFF;padding:14px 36px;border-radius:8px;font-size:15px;font-weight:600;text-decoration:none;border:2px solid rgba(255,255,255,0.3);">Schedule a Demo</a>
  </div>
  <!-- Social proof micro -->
  <div style="display:flex;gap:24px;justify-content:center;align-items:center;">
    <div style="display:flex;align-items:center;gap:6px;font-size:12px;color:rgba(255,255,255,0.5);">
      <span style="color:#C4B5FD;">✓</span> 4,200+ companies
    </div>
    <div style="display:flex;align-items:center;gap:6px;font-size:12px;color:rgba(255,255,255,0.5);">
      <span style="color:#C4B5FD;">✓</span> 14-day free trial
    </div>
    <div style="display:flex;align-items:center;gap:6px;font-size:12px;color:rgba(255,255,255,0.5);">
      <span style="color:#C4B5FD;">✓</span> 4.8/5 on G2
    </div>
    <div style="display:flex;align-items:center;gap:6px;font-size:12px;color:rgba(255,255,255,0.5);">
      <span style="color:#C4B5FD;">✓</span> Cancel anytime
    </div>
  </div>
</div>
<!-- Bottom contact info -->
<div style="position:absolute;bottom:20px;font-size:11px;color:rgba(255,255,255,0.3);">
  Marcus Lee · marcus@nexusplatform.com · +1 (415) 555-0182
</div>
</body>
</html>
```
