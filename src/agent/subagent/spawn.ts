import { randomUUID } from "crypto";
import { createSession } from "@/lib/redis";
import { registerSubagent, updateSubagent, countActiveChildren } from "./registry";
import type { SpawnSubagentParams, SpawnSubagentResult, SubagentRecord } from "./types";

export const MAX_SPAWN_DEPTH = 3;
export const MAX_CHILDREN_PER_SESSION = 5;

interface SpawnContext {
  parentSessionId: string;
  parentUserId: string;
  spawnDepth: number;
}

export async function spawnSubagentDirect(
  params: SpawnSubagentParams,
  ctx: SpawnContext
): Promise<SpawnSubagentResult> {
  const { task, label } = params;
  const { parentSessionId, parentUserId, spawnDepth } = ctx;

  if (spawnDepth >= MAX_SPAWN_DEPTH) {
    return {
      status: "forbidden",
      error: `Max spawn depth reached (current: ${spawnDepth}, max: ${MAX_SPAWN_DEPTH})`,
    };
  }

  const activeChildren = await countActiveChildren(parentSessionId);
  if (activeChildren >= MAX_CHILDREN_PER_SESSION) {
    return {
      status: "forbidden",
      error: `Max active children reached (${activeChildren}/${MAX_CHILDREN_PER_SESSION})`,
    };
  }

  const runId = randomUUID();
  const childSessionId = randomUUID();
  const childDepth = spawnDepth + 1;

  await createSession(childSessionId, label ?? `Subagent: ${task.slice(0, 40)}`, parentUserId, "slides");

  const record: SubagentRecord = {
    runId,
    childSessionId,
    parentSessionId,
    parentUserId,
    task,
    label,
    spawnDepth: childDepth,
    status: "pending",
    createdAt: Date.now(),
  };
  await registerSubagent(record);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  let resp: Response;
  try {
    resp = await fetch(`${baseUrl}/api/subagent/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ runId, task, childSessionId, parentSessionId, parentUserId, spawnDepth: childDepth }),
      // Bug fix: 10s timeout to receive response headers — prevents hanging forever if
      // Redis/subagent route is unresponsive
      signal: AbortSignal.timeout(10_000),
    });
  } catch (err) {
    // Bug fix: mark registry record as failed so countActiveChildren doesn't count it
    // as permanently active, which would block future spawns for this session
    await updateSubagent(runId, { status: "failed", error: String(err), completedAt: Date.now() });
    return { status: "error", error: `Failed to launch subagent: ${String(err)}` };
  }

  if (!resp.ok) {
    // Bug fix: same — orphaned "pending" record must be cleaned up on HTTP error
    await updateSubagent(runId, { status: "failed", error: `HTTP ${resp.status}`, completedAt: Date.now() });
    return { status: "error", error: `Subagent launch failed (HTTP ${resp.status})` };
  }

  // Bug fix: explicitly cancel the body so the TCP connection is released cleanly.
  // The subagent's ReadableStream.start() catches the resulting error and continues
  // running runSubagentLoop() — it doesn't depend on the client staying connected.
  resp.body?.cancel().catch(() => {});

  return {
    status: "accepted",
    runId,
    childSessionId,
    note: `Subagent started (runId: ${runId}). Call get_subagent_result("${runId}") to poll, or get_subagent_result("${runId}", wait: true) to block until complete.`,
  };
}
