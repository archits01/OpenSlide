/**
 * research-orchestrator.ts
 *
 * 4-stage multi-agent research pipeline that mirrors Claude's Research architecture,
 * compressed to ~2 minutes via parallel subagents.
 *
 * Pipeline:
 *   1. Orchestrator  — plans research, writes subagent briefs   (~5 sec, no tools)
 *   2. Subagents     — parallel web search via Promise.allSettled (~90 sec, web_search)
 *   3. Synthesizer   — deduplicates, ranks, checks slide-readiness (~15 sec, no tools)
 *   4. Citation Agent — builds citation registry, final JSON     (~10 sec, no tools)
 *
 * Total: ~2 min, ~7 API calls, ~60K tokens (~$0.40)
 */

import { streamFromRouter, type StreamPayload } from "@/agent/stream";
import type { AgentEventBus } from "@/agent/events";
import { ORCHESTRATOR_PROMPT } from "./prompts/orchestrator";
import { buildSubagentPrompt, type SubagentBrief } from "./prompts/subagent";
import { SYNTHESIZER_PROMPT } from "./prompts/synthesizer";
import { CITATION_AGENT_PROMPT } from "./prompts/citation-agent";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrchestratorPlan {
  hypothesis: string;
  effort_level: string;
  subagent_briefs: SubagentBrief[];
}

export interface ResearchOutput {
  research_metadata: {
    topic: string;
    hypothesis: string;
    hypothesis_refined: boolean;
    passes_completed: number;
    total_sources: number;
    total_pages_fetched: number;
    effort_level: string;
    slide_readiness: Record<string, boolean>;
    agent_coverage: Record<string, { findings_count: number; success: boolean }>;
  };
  citations: Array<{
    id: string;
    title: string;
    url: string;
    publisher: string;
    date: string;
    type: string;
    credibility: string;
    accessed_via: string;
  }>;
  key_findings: Array<{
    id: string;
    category: string;
    finding: string;
    significance: string;
    confidence: string;
    source_id: string;
    supporting_ids: string[];
    supporting_notes: string;
    slide_use: string;
    narrative_position: string;
    from_agent: string;
    data_quality: string;
    chart_data: unknown;
  }>;
  contradictions: Array<{
    topic: string;
    source_a_id: string;
    claim_a: string;
    source_b_id: string;
    claim_b: string;
    resolution: string;
    selected_id: string;
  }>;
  research_gaps: Array<{
    gap: string;
    impact: string;
    proxy_used: string | null;
    agents_that_tried: string[];
  }>;
}

export interface ResearchOptions {
  topic: string;
  userContext?: string;
  maxSubagents?: number;
  model?: string;
  signal?: AbortSignal;
  bus?: AgentEventBus;
}

// ─── Router helpers ───────────────────────────────────────────────────────────

/**
 * Streaming API call for stages without tools (orchestrator, synthesizer, citation).
 * Uses streaming to avoid Vercel function timeout — non-streaming calls hang
 * waiting for the full Anthropic response and hit 504 FUNCTION_INVOCATION_TIMEOUT.
 */
async function callRouterStreaming(opts: {
  model: string;
  system: string;
  userMessage: string;
  maxTokens?: number;
  signal?: AbortSignal;
}): Promise<string> {
  const payload: StreamPayload = {
    model: opts.model,
    max_tokens: opts.maxTokens ?? 16000,
    system: [{ type: "text", text: opts.system }],
    messages: [{ role: "user", content: opts.userMessage }],
    stream: true,
  };

  let text = "";
  for await (const event of streamFromRouter(payload, opts.signal)) {
    if (event.type === "content_block_delta") {
      const delta = event.data.delta as { type: string; text?: string };
      if (delta.type === "text_delta" && delta.text) {
        text += delta.text;
      }
    }
  }
  return text;
}

/**
 * Streaming API call for subagents with web_search connector.
 * Collects all text output while tracking search events for progress.
 */
async function callSubagent(opts: {
  model: string;
  system: string;
  userMessage: string;
  maxSearches?: number;
  maxTokens?: number;
  signal?: AbortSignal;
  onSearch?: () => void;
}): Promise<string> {
  const payload: StreamPayload = {
    model: opts.model,
    max_tokens: opts.maxTokens ?? 16000,
    system: [{ type: "text", text: opts.system }],
    messages: [{ role: "user", content: opts.userMessage }],
    tools: [
      {
        type: "web_search_20250305",
        name: "web_search",
        max_uses: opts.maxSearches ?? 5,
      },
    ],
    stream: true,
  };

  let text = "";
  for await (const event of streamFromRouter(payload, opts.signal)) {
    if (event.type === "content_block_delta") {
      const delta = event.data.delta as {
        type: string;
        text?: string;
      };
      if (delta.type === "text_delta" && delta.text) {
        text += delta.text;
      }
    }
    // Track when the model initiates a web search
    if (event.type === "content_block_start") {
      const block = event.data.content_block as { type: string; name?: string };
      if (block.type === "server_tool_use" && block.name === "web_search") {
        opts.onSearch?.();
      }
    }
  }
  return text;
}

// ─── JSON extraction ──────────────────────────────────────────────────────────

/** Extract JSON from text that may have markdown code fences or surrounding prose */
function extractJSON(text: string): string {
  // Try fenced code block first
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  // Try to find raw JSON object
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start >= 0 && end > start) return text.slice(start, end + 1);
  return text;
}

// ─── Main pipeline ────────────────────────────────────────────────────────────

export async function runResearch(options: ResearchOptions): Promise<ResearchOutput | null> {
  const {
    topic,
    userContext,
    maxSubagents = 4,
    model = "claude-sonnet-4-6",
    signal,
    bus,
  } = options;

  console.log(`[research] Starting multi-agent research for: "${topic.slice(0, 80)}..."`);
  const startTime = Date.now();

  // ── Stage 1: Orchestrator ─────────────────────────────────────────────────
  bus?.emit({
    type: "research_progress",
    stage: "orchestrator_start",
    detail: "Planning research strategy...",
  });

  let plan: OrchestratorPlan;
  try {
    const planText = await callRouterStreaming({
      model,
      system: ORCHESTRATOR_PROMPT,
      userMessage: `Research topic: ${topic}${userContext ? `\n\nUser-provided context:\n${userContext}` : ""}`,
      maxTokens: 4000,
      signal,
    });

    plan = JSON.parse(extractJSON(planText));

    if (!plan.subagent_briefs?.length) {
      throw new Error("Orchestrator returned no subagent briefs");
    }
  } catch (err) {
    console.error("[research] Orchestrator failed:", err);
    bus?.emit({
      type: "research_progress",
      stage: "orchestrator_error",
      detail: "Research planning failed. Falling back to standard mode.",
    });
    return null;
  }

  // Cap subagent count
  plan.subagent_briefs = plan.subagent_briefs.slice(0, maxSubagents);

  bus?.emit({
    type: "research_progress",
    stage: "orchestrator_done",
    detail: `Strategy ready. Launching ${plan.subagent_briefs.length} research agents...`,
  });

  console.log(
    `[research] Orchestrator done in ${Date.now() - startTime}ms. ` +
      `Effort: ${plan.effort_level}. Agents: ${plan.subagent_briefs.map((b) => b.id).join(", ")}`
  );

  // ── Stage 2: Subagents (parallel) ─────────────────────────────────────────
  const subagentStart = Date.now();

  const subagentResults = await Promise.allSettled(
    plan.subagent_briefs.map(async (brief) => {
      bus?.emit({
        type: "research_progress",
        stage: "subagent_start",
        agentId: brief.id,
        detail: `Agent [${brief.id}] starting research...`,
      });

      // Per-subagent timeout: 2 minutes
      const subagentAbort = new AbortController();
      const timeout = setTimeout(() => subagentAbort.abort(), 120_000);

      // Also abort if parent signal fires
      const onParentAbort = () => subagentAbort.abort();
      signal?.addEventListener("abort", onParentAbort, { once: true });

      try {
        const prompt = buildSubagentPrompt(brief, plan.hypothesis);
        let searchCount = 0;

        const result = await callSubagent({
          model,
          system: prompt,
          userMessage: "Begin your research assignment. Start searching now.",
          maxSearches: 5,
          maxTokens: 16000,
          signal: subagentAbort.signal,
          onSearch: () => {
            searchCount++;
            bus?.emit({
              type: "research_progress",
              stage: "subagent_search",
              agentId: brief.id,
              detail: `Agent [${brief.id}] search #${searchCount}...`,
            });
          },
        });

        bus?.emit({
          type: "research_progress",
          stage: "subagent_done",
          agentId: brief.id,
          detail: `Agent [${brief.id}] complete. ${searchCount} searches ran.`,
        });

        return { id: brief.id, result, searchCount };
      } catch (err) {
        console.warn(`[research] Subagent [${brief.id}] failed:`, err);
        bus?.emit({
          type: "research_progress",
          stage: "subagent_error",
          agentId: brief.id,
          detail: `Agent [${brief.id}] failed — continuing with others.`,
        });
        throw err;
      } finally {
        clearTimeout(timeout);
        signal?.removeEventListener("abort", onParentAbort);
      }
    })
  );

  // Collect successful results
  const successfulResults = subagentResults
    .filter(
      (r): r is PromiseFulfilledResult<{ id: string; result: string; searchCount: number }> =>
        r.status === "fulfilled"
    )
    .map((r) => r.value);

  const failedCount = subagentResults.filter((r) => r.status === "rejected").length;

  console.log(
    `[research] Subagents done in ${Date.now() - subagentStart}ms. ` +
      `${successfulResults.length} succeeded, ${failedCount} failed.`
  );

  if (successfulResults.length === 0) {
    console.error("[research] All subagents failed");
    bus?.emit({
      type: "research_progress",
      stage: "pipeline_error",
      detail: "All research agents failed. Falling back to standard mode.",
    });
    return null;
  }

  if (successfulResults.length < 2) {
    console.warn("[research] Fewer than 2 subagents succeeded — low confidence research");
  }

  const allFindings = successfulResults
    .map((r) => `=== SUBAGENT: ${r.id} (${r.searchCount} searches) ===\n\n${r.result}`)
    .join("\n\n" + "─".repeat(60) + "\n\n");

  // ── Stage 3: Synthesizer ──────────────────────────────────────────────────
  bus?.emit({
    type: "research_progress",
    stage: "synthesizer_start",
    detail: `Merging findings from ${successfulResults.length} agents...`,
  });

  const synthStart = Date.now();
  let synthesized: string;

  try {
    synthesized = await callRouterStreaming({
      model,
      system: SYNTHESIZER_PROMPT,
      userMessage: `Original topic: ${topic}\nOrchestrator hypothesis: ${plan.hypothesis}\n\nSubagent findings to merge:\n\n${allFindings}`,
      maxTokens: 20000,
      signal,
    });
  } catch (err) {
    console.error("[research] Synthesizer failed:", err);
    bus?.emit({
      type: "research_progress",
      stage: "synthesizer_error",
      detail: "Merge failed. Using raw findings.",
    });
    // Fallback: pass raw findings directly to citation agent
    synthesized = allFindings;
  }

  console.log(`[research] Synthesizer done in ${Date.now() - synthStart}ms`);

  bus?.emit({
    type: "research_progress",
    stage: "synthesizer_done",
    detail: "Research merged.",
  });

  // ── Stage 4: Citation Agent ───────────────────────────────────────────────
  bus?.emit({
    type: "research_progress",
    stage: "citation_start",
    detail: "Processing citations...",
  });

  const citeStart = Date.now();
  let finalOutput: ResearchOutput | null = null;

  try {
    const cited = await callRouterStreaming({
      model,
      system: CITATION_AGENT_PROMPT,
      userMessage: [
        `Topic: ${topic}`,
        `Hypothesis: ${plan.hypothesis}`,
        `Effort level: ${plan.effort_level}`,
        `Successful agents: ${successfulResults.map((r) => r.id).join(", ")}`,
        `Failed agents: ${subagentResults
          .map((r, i) => (r.status === "rejected" ? plan.subagent_briefs[i]?.id : null))
          .filter(Boolean)
          .join(", ") || "none"}`,
        "",
        "Synthesized research:",
        "",
        synthesized,
      ].join("\n"),
      maxTokens: 20000,
      signal,
    });

    finalOutput = JSON.parse(extractJSON(cited)) as ResearchOutput;
  } catch (err) {
    console.error("[research] Citation agent failed:", err);
    // Fallback: try to parse the synthesizer output directly
    try {
      finalOutput = JSON.parse(extractJSON(synthesized)) as ResearchOutput;
    } catch {
      console.error("[research] Could not parse synthesizer output either");
    }
  }

  console.log(`[research] Citation agent done in ${Date.now() - citeStart}ms`);

  const totalTime = Date.now() - startTime;
  console.log(
    `[research] Pipeline complete in ${(totalTime / 1000).toFixed(1)}s. ` +
      `Findings: ${finalOutput?.key_findings?.length ?? 0}, Citations: ${finalOutput?.citations?.length ?? 0}`
  );

  bus?.emit({
    type: "research_progress",
    stage: "citation_done",
    detail: `Research complete in ${Math.round(totalTime / 1000)}s. ${finalOutput?.key_findings?.length ?? 0} findings from ${finalOutput?.citations?.length ?? 0} sources. Ready for outline.`,
  });

  return finalOutput;
}
