---
name: fast-research
description: Default research mode for slide generation. Performs inline hypothesis-driven web research with the agent's own web_search tool. Uses a hypothesize → search → extract → verify loop targeting slide-ready data. Runs automatically for all new presentations. Takes 1-2 minutes.
---

# Fast Research for Slides

Hypothesis-driven research engine. Every search exists to find data that makes a slide compelling — a hero metric, a trend line, a killer comparison, a story hook.

## Core Principle

Research like a senior analyst, not an encyclopedia. Form a hypothesis about the story first, then hunt for the 5-10 data points that prove it. Stop when you have enough slide fuel, not when you've covered every angle.

## Pipeline

```
TOPIC SCAN (30 seconds)
  → What is this? What metrics matter? Who are the key players?
  → Form a 1-sentence narrative hypothesis

EFFORT CALIBRATION
  → Data-rich topic (public company, major industry)? → 4-6 queries, 1-2 passes
  → Standard topic? → 6-8 queries, 2 passes
  → Niche/obscure topic? → 8-12 queries, 2-3 passes

PASS 1: Core Research
  → One query per ANGLE (not per metric) — each hits a different part of the internet
  → Smart result selection (skip SEO, prefer primary sources)
  → Precision data extraction from fetched pages

SLIDE-READINESS CHECK
  → Hero metric? Trend data? Comparison? Story hook? Forward-looking claim?
  → Missing any? → Pass 2 targets ONLY the gaps

PASS 2: Gap Fill (if needed)
  → Different query angles, different source types
  → Re-check slide-readiness

PASS 3: Precision Fill (rare — only if critical gaps remain after Pass 2)

CONSOLIDATE → Output structured findings
```

**Stopping rules:**
- All 5 slide-readiness checks pass → stop
- Pass N yields <30% new findings vs previous pass → stop
- Approaching 3 minutes → finish current pass, stop
- Maximum 3 passes

---

## Step 1: Topic Scan & Hypothesis

Before any search, answer these quickly:

1. **What is this?** Entity type + domain (company/product/concept + industry)
2. **What numbers matter?** 2-4 domain KPIs that analysts actually track:
   - SaaS/Cloud → ARR, NRR, churn rate, enterprise customer count
   - Fintech/Payments → TPV (total payment volume), take rate, transaction count
   - Consumer electronics → shipments (units), ASP, market share by region
   - Automotive → units delivered, EV mix, avg transaction price, factory utilization
   - E-commerce/Quick-commerce → GMV, order volume, AOV (avg order value), unit economics
   - Social/Consumer → MAU, DAU, ARPU, engagement time
   - Pharma/Biotech → pipeline stages, FDA approval status, clinical trial enrollment
   - If domain not listed, ask: "What 3 numbers would a sector analyst put on their cover slide?"
3. **Key nouns to use in every query:** Specific product names, competitor names, people, research firms that cover this space. Examples:
   - Stripe deck → "Stripe", "Adyen", "Square", "Patrick Collison", "TPV", "Series I"
   - India quick-commerce → "Blinkit", "Zepto", "Swiggy Instamart", "dark stores", "RedSeer", "Counterpoint"
   - Lithium mining → "Albemarle", "SQM", "Pilbara Minerals", "Atacama", "IEA", "BloombergNEF"
   - Never use just the category name ("fintech", "quick commerce", "mining") — always include the named players
4. **Narrative hypothesis:** One sentence predicting the deck's story.

**This hypothesis drives everything.** Every query should either support it, refine it, or find the data that makes it concrete. If research disproves the hypothesis, form a new one and adjust.

**If the user provided documents:** Parse them first. Extract claims, stats, entities. Research fills gaps only — never contradict user-provided data.

---

## Step 2: Search Execution

### Query Angle Diversity (CRITICAL)

The #1 research quality killer is running 8 queries that all hit the same pool of articles. Each query must target a **different layer of the internet**.

**The 8 Angles — pick 6-8 per topic, one query each:**

| Angle | What it finds | Where it hits |
|-------|--------------|---------------|
| **Hard metrics** | Revenue, users, growth rates | Financial news (Reuters, Bloomberg) |
| **Official voice** | Strategy, vision, announcements | Company blog, press releases, IR pages |
| **People** | Strategy reasoning, future plans | Interview transcripts, podcasts, profiles |
| **User sentiment** | What real users love/hate | Reddit, HN, forums, review sites |
| **Competitive** | Head-to-head positioning | Analyst reports, comparison articles |
| **Risk / controversy** | What could go wrong | Regulatory news, opinion pieces |
| **Product / tech** | What they're building | Product blogs, changelogs, dev docs |
| **Inflection event** | The one thing that changes the story | Breaking news, filing signals, M&A |

### Query Construction Rules

- 4-7 words per query, keyword-focused, never full sentences
- **Every query includes:** current year (YYYY) + at least one specific noun from Topic Scan
- Never start with question words ("what is", "how does")
- Never repeat a query across passes — each must target a different angle

**BANNED in queries:** "overview", "landscape", "comprehensive", "analysis", "insights", "brand"

### Result Selection (CRITICAL)

**Fetch these (high-value sources):**
- Company official pages (investor relations, press releases, product pages)
- SEC filings, earnings transcripts, annual reports
- Major news outlets (Reuters, Bloomberg, FT, WSJ, TechCrunch for tech)
- Research firms (Gartner, IDC, Statista, Counterpoint, Canalys)

**Skip these (low-value sources):**
- SEO listicles ("Top 10...", "Complete Guide to...")
- Content farms and aggregator sites
- Pages where the snippet contains no numbers, dates, or specific claims

**Snippet extraction shortcut:** If a search snippet already contains the data point you need, extract it directly — don't waste a fetch.

**Per query: fetch at most 3-4 pages.** Quality over quantity.

### Data Extraction

Scan for:
- **Numbers with units** — %, $, M, B, units — slide fuel
- **Comparisons** — "X vs Y", "grew from A to B"
- **Time series** — extract ALL data points, not just the latest
- **Executive/analyst quotes** — punchy quotes for slide callouts
- **Category breakdowns** — pie/donut chart fuel

---

## Step 3: Slide-Readiness Check (after each pass)

| # | Check | What you need |
|---|-------|--------------|
| 1 | **Hero metric** | One headline number for the cover/data slide |
| 2 | **Trend data** | ≥3 data points over time (for a chart) |
| 3 | **Comparison** | Entity vs entity with numbers for both sides |
| 4 | **Story hook** | Origin, pivot, controversy, or surprise |
| 5 | **Forward look** | Roadmap, prediction, or strategic direction |

**Decision:**
- All 5 ✅ → Research complete
- Any ❌ → Pass 2 targets ONLY the missing checks
- After Pass 2, still missing? → Pass 3 or flag the gap

---

## Step 4: Reformulation (when queries fail)

Change the **angle**, not just the words:

| If this failed... | Try this instead |
|---|---|
| "[company] revenue 2025" | "[company] annual letter investor update 2025" |
| "[company] market share" | "[company] order volume [research firm] 2025" |
| News query returned nothing | "[company] investor presentation 2025" |
| Financial query returned nothing | "[CEO name] interview 2025" |
| Sentiment query returned nothing | "[product] site:reddit.com" |

**Escalation ladder:** News → Official sources → Financial filings → Interviews → Research firms → Reddit → Flag as gap

---

## Guardrails

- **Time cap:** 3 minutes max. Finish current pass and output what you have.
- **Diminishing returns:** If Pass N yields <30% new findings vs Pass N-1, stop.
- **No fabrication:** Never invent a citation. Never attribute a claim to a source that doesn't make it.
- **User data wins:** If user provides data that conflicts with research, use user's data.
- **Recency:** Key metrics must be from the most recent available period.
