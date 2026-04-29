import type { ResearchOutput } from "@/skills/deep-research/research-orchestrator";

/**
 * Builds the research results context block — injected when the multi-agent research
 * pipeline has pre-computed findings before the agent loop starts.
 */
export function buildResearchContext(research: ResearchOutput): string {
  const { research_metadata, key_findings, citations, contradictions, research_gaps } = research;

  // Build a compact but complete summary the agent can use for outline creation
  const readinessStatus = Object.entries(research_metadata.slide_readiness ?? {})
    .map(([k, v]) => `  - ${k}: ${v ? "✅" : "❌ MISSING"}`)
    .join("\n");

  const findingsSummary = (key_findings ?? [])
    .map((f, i) => {
      const citation = (citations ?? []).find((c) => c.id === f.source_id);
      const src = citation ? `[${citation.publisher}](${citation.url})` : "unknown source";
      const chart = f.chart_data ? " 📊 has chart data" : "";
      return `  ${i + 1}. [${f.significance}/${f.slide_use}] ${f.finding} — ${src}${chart}`;
    })
    .join("\n");

  const gapsSummary = (research_gaps ?? [])
    .map((g) => `  - ${g.gap} (impact: ${g.impact})${g.proxy_used ? ` — proxy: ${g.proxy_used}` : ""}`)
    .join("\n");

  const contradictionsSummary = (contradictions ?? [])
    .map((c) => `  - ${c.topic}: "${c.claim_a}" vs "${c.claim_b}" → resolved: ${c.resolution}`)
    .join("\n");

  return `
## Pre-Computed Research Results

The multi-agent research pipeline has already completed for this topic. Use these findings directly when creating the outline — do NOT repeat web searches for data already found here. You may still do additional web searches for supplementary data (logos, brand colors, very recent news not covered).

**Topic:** ${research_metadata.topic}
**Hypothesis:** ${research_metadata.hypothesis}
**Sources:** ${research_metadata.total_sources} sources from ${Object.keys(research_metadata.agent_coverage ?? {}).length} research agents
**Effort level:** ${research_metadata.effort_level}

### Slide Readiness
${readinessStatus}

### Key Findings (${key_findings?.length ?? 0} total)
${findingsSummary}

### Research Gaps
${gapsSummary || "  None — all 5 slide fuel types covered."}

### Contradictions
${contradictionsSummary || "  None found."}

### Full Research Data (JSON)
Use this for precise numbers, chart data, and citation URLs:
\`\`\`json
${JSON.stringify(research, null, 2)}
\`\`\`
`.trim();
}

/**
 * Builds a research sources context block from accumulated web search results.
 * Injected every iteration as a prompt-cached system block so research survives compaction.
 * Capped at ~2000 tokens (~8000 chars) — prioritizes most recent entries.
 */
export function buildResearchSourcesContext(
  research: Array<{ query: string; url: string; title: string; snippet: string; retrievedAt: number }>
): string | null {
  if (!research.length) return null;

  // Sort by most recent first, cap at ~2000 tokens
  const sorted = [...research].sort((a, b) => b.retrievedAt - a.retrievedAt);
  const MAX_CHARS = 8000;
  let totalChars = 0;
  const entries: string[] = [];

  for (const r of sorted) {
    const entry = `[${entries.length + 1}] ${r.title} — ${r.url}${r.snippet ? `\n    ${r.snippet}` : ""}`;
    if (totalChars + entry.length > MAX_CHARS) break;
    entries.push(entry);
    totalChars += entry.length;
  }

  if (!entries.length) return null;

  return `## Research Sources\n\nThe following sources were gathered during research for this deck. All numbers, quotes, statistics, and specific claims in slides MUST come from these sources or from the Pre-Computed Research Results above. Never fabricate data. Never cite sources not listed here.\n\n${entries.join("\n\n")}`;
}
