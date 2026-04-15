---
name: deep-research
description: Multi-agent research pipeline for slide generation. 4-stage architecture (orchestrator → parallel subagents → synthesizer → citation agent) that gathers 15-50+ sources with comprehensive citations in ~2 minutes. Research results are pre-computed and injected as context — use them directly for outline creation.
---

# Deep Research for Slides — Multi-Agent Pipeline

Research is handled by a 4-stage multi-agent pipeline that runs BEFORE the main agent loop. When you see "Pre-Computed Research Results" in your system prompt, those findings are ready to use.

## Architecture

```
ORCHESTRATOR (1 call, ~5 sec)
  → Analyzes topic, forms hypothesis, writes 3-4 subagent briefs

SUBAGENTS (3-4 calls in parallel, ~90 sec total)
  → Each searches web independently via web_search
  → Different angles: metrics, story, competitive, future

SYNTHESIZER (1 call, ~15 sec)
  → Merges, deduplicates, resolves contradictions, ranks significance

CITATION AGENT (1 call, ~10 sec)
  → Builds citation registry, assigns IDs, checks integrity
  → Produces final ResearchOutput JSON
```

Total: ~2 minutes, ~7 API calls, ~60K tokens

## When Research Results Are Pre-Loaded

If you see `## Pre-Computed Research Results` in your system prompt:

1. **Use the findings directly** — don't repeat web searches for the same data
2. **Map findings to slides** using the `slide_use` and `narrative_position` tags
3. **Check slide-readiness** — if any of the 5 checks are MISSING, you may do targeted web searches to fill gaps
4. **Use chart_data** fields directly when building data slides — they contain pre-extracted chart-ready data
5. **Cite sources** — the citation URLs are in the research data, reference them in speaker notes
6. **You can still search** for supplementary data not covered: logos, brand colors, very recent news

## When Research Results Are NOT Available

If no pre-computed research appears (e.g., research pipeline failed, or this is a modification to an existing deck), fall back to inline web searches:

- Use web_search with specific, keyword-focused queries (4-7 words)
- Target different angles per query (metrics, people, competitive, product)
- Extract precise numbers with units, time-series data points, comparisons
- Stop when you have the 5 slide fuel types covered

## 5 Slide Fuel Types (Readiness Checks)

Every presentation needs ALL 5:

| # | Type | What You Need | Example |
|---|------|--------------|---------|
| 1 | **Hero metric** | One headline number | "$1.1T total payment volume" |
| 2 | **Trend data** | 3+ data points over time (for a chart) | Revenue: $12B → $14B → $17B → $21B |
| 3 | **Comparison** | Entity vs entity with numbers | "Blinkit: 12-min avg vs Zepto: 8-min avg" |
| 4 | **Story hook** | Origin, pivot, surprise, controversy | "Raised $50M for Arc, then pivoted to Dia" |
| 5 | **Forward look** | Roadmap, prediction, strategic direction | "Projects 2.4M tonnes lithium demand by 2030" |

## Output Format Reference

The research pipeline produces a `ResearchOutput` JSON with these sections:

### `research_metadata`
- `topic`, `hypothesis`, `hypothesis_refined`
- `total_sources`, `total_pages_fetched`, `effort_level`
- `slide_readiness` — boolean map of the 5 checks
- `agent_coverage` — which subagents succeeded and finding counts

### `citations[]`
Each source with: `id`, `title`, `url`, `publisher`, `date`, `type`, `credibility`, `accessed_via`

### `key_findings[]`
Each finding with:
- `finding` — the specific claim with numbers
- `significance` — critical / high / medium
- `confidence` — high / medium / low
- `source_id` + `supporting_ids[]` — links to citations
- `slide_use` — hero_metric / trend_chart / comparison / story_hook / forward_look / supporting_data
- `narrative_position` — opening / core / competitive / closing
- `from_agent` — which subagent found it
- `chart_data` — pre-extracted chart-ready data (if applicable)

### `contradictions[]`
Conflicting data from different sources, with resolution notes.

### `research_gaps[]`
What couldn't be found, impact level, and any proxy data used.

## Source Quality Hierarchy

```
Tier 1: Company filings, government data, peer-reviewed papers, official press releases
Tier 2: Reuters, Bloomberg, AP, FT, WSJ, TechCrunch, The Verge
Tier 3: Gartner, IDC, Statista, Crunchbase, Stratechery
Tier 4: Reddit, HN, forums, smaller outlets
Tier 5: SEO sites, listicles, content farms
```

## Mapping Research to Outline

When creating the outline from research results:

1. **Opening slides** — use findings tagged `narrative_position: "opening"` and `slide_use: "hero_metric"`
2. **Core slides** — use `narrative_position: "core"` findings, especially those with `chart_data`
3. **Competitive slides** — use `narrative_position: "competitive"` and `slide_use: "comparison"` findings
4. **Closing slides** — use `narrative_position: "closing"` and `slide_use: "forward_look"` findings
5. **Data slides** — any finding with `chart_data` should become a data slide with the appropriate chart type
6. **Story slides** — findings with `slide_use: "story_hook"` make great quote or content slides
