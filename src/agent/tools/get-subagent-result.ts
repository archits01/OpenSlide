import { registerAuthTool } from "./tool-registry";
import { getSubagent, listSubagentsForSession } from "@/agent/subagent/registry";
import type { AgentTool } from "./types";

const POLL_INTERVAL_MS = 3_000;
const WAIT_TIMEOUT_MS = 120_000; // 2 minutes max wait

const getSubagentResultTool: AgentTool = {
  name: "get_subagent_result",
  description:
    "Get the result of a previously spawned subagent. Pass the runId returned by spawn_subagent. " +
    "Set wait=true to block until the subagent completes (up to 2 minutes). " +
    "Omit runId to list all subagents for the current session.",
  input_schema: {
    type: "object",
    properties: {
      runId: {
        type: "string",
        description: "The runId returned by spawn_subagent. Omit to list all subagents.",
      },
      wait: {
        type: "boolean",
        description:
          "If true and the subagent is still running, poll until it completes or 2 minutes elapse.",
      },
    },
    required: [],
  },
  async execute(input, signal, context) {
    const { runId, wait } = input as { runId?: string; wait?: boolean };
    const sessionId = context?.sessionId;

    // List mode
    if (!runId) {
      if (!sessionId) return { error: "Missing session context" };
      const all = await listSubagentsForSession(sessionId);
      return {
        subagents: all.map((r) => ({
          runId: r.runId,
          label: r.label,
          status: r.status,
          spawnDepth: r.spawnDepth,
          createdAt: r.createdAt,
          completedAt: r.completedAt,
          result: r.status === "completed" ? r.result : undefined,
          error: r.status === "failed" ? r.error : undefined,
        })),
      };
    }

    let record = await getSubagent(runId);
    if (!record) {
      return { status: "not_found", error: `No subagent found with runId: ${runId}` };
    }

    // Polling wait — mirrors OpenClaw's waitForSubagentRunOutcome()
    if (wait && (record.status === "pending" || record.status === "running")) {
      const deadline = Date.now() + WAIT_TIMEOUT_MS;
      while (Date.now() < deadline) {
        if (signal?.aborted) break;
        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
        const updated = await getSubagent(runId);
        if (!updated) break;
        record = updated;
        if (record.status === "completed" || record.status === "failed" || record.status === "timeout") {
          break;
        }
      }
    }

    return {
      runId: record.runId,
      label: record.label,
      task: record.task,
      status: record.status,
      spawnDepth: record.spawnDepth,
      createdAt: record.createdAt,
      startedAt: record.startedAt,
      completedAt: record.completedAt,
      result: record.result,
      error: record.error,
    };
  },
};

registerAuthTool(getSubagentResultTool);

export { getSubagentResultTool };
