import { registerAuthTool } from "./tool-registry";
import { spawnSubagentDirect } from "@/agent/subagent/spawn";
import { AgentEventBus } from "@/agent/events";
import type { AgentTool } from "./types";

// Map keyed by sessionId — safe for concurrent requests.
// A module-level singleton would be overwritten by the second concurrent request,
// sending one user's subagent events to another user's SSE stream.
const _buses = new Map<string, AgentEventBus>();

export function setSubagentBus(sessionId: string, bus: AgentEventBus): void {
  _buses.set(sessionId, bus);
}

export function clearSubagentBus(sessionId: string): void {
  _buses.delete(sessionId);
}

const spawnSubagentTool: AgentTool = {
  name: "spawn_subagent",
  description:
    "Spawn a subagent to work on an independent task in parallel. Returns immediately with a runId — the subagent runs in the background. Use get_subagent_result(runId) to poll for the result, or get_subagent_result(runId, wait: true) to block until it completes. Good for: parallel research, drafting content for a specific section, generating assets while you work on other slides.",
  input_schema: {
    type: "object",
    properties: {
      task: {
        type: "string",
        description:
          "Full description of the task for the subagent. Be specific — the subagent has no other context.",
      },
      label: {
        type: "string",
        description: "Short human-readable label for this subagent (e.g. 'Market research', 'Slide 3 copy').",
      },
    },
    required: ["task"],
  },
  async execute(input, _signal, context) {
    const { task, label } = input as { task: string; label?: string };
    const sessionId = context?.sessionId;
    const userId = context?.userId;
    const spawnDepth = context?.spawnDepth ?? 0;

    if (!sessionId || !userId) {
      return { status: "error", error: "Missing session context" };
    }

    const result = await spawnSubagentDirect(
      { task, label },
      { parentSessionId: sessionId, parentUserId: userId, spawnDepth }
    );

    if (result.status === "accepted") {
      _buses.get(sessionId)?.emit({
        type: "subagent_spawned",
        runId: result.runId,
        label,
        task,
        spawnDepth: spawnDepth + 1,
      });
    }

    return result;
  },
};

registerAuthTool(spawnSubagentTool);

export { spawnSubagentTool };
