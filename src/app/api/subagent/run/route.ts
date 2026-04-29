// Internal subagent execution route — equivalent to OpenClaw's gateway handling
// callSubagentGateway({ method: "agent", lane: AGENT_LANE_SUBAGENT }).
//
// Auth: validates that runId + childSessionId exist in the registry (written by spawn
// before this route is called). No shared secret needed — only the server can write
// to Redis, so a valid record proves this is a legitimate internal spawn.
//
// Lifetime: uses a streaming ReadableStream (same pattern as /api/chat) so the Vercel
// function invocation stays alive for up to maxDuration while the loop runs.
// spawn.ts only reads the response STATUS (200), not the body — both functions are
// then fully independent.

export const runtime = "nodejs";
export const maxDuration = 300;

import { NextRequest } from "next/server";
import { getSession, saveSession } from "@/lib/redis";
import { AgentEventBus } from "@/agent/events";
import { runAgentLoop } from "@/agent/loop";
import { getSubagent, updateSubagent } from "@/agent/subagent/registry";
import { MAX_SPAWN_DEPTH } from "@/agent/subagent/spawn";
import { withSubagentSemaphore } from "@/agent/subagent/semaphore";
import type { Message } from "@/lib/types";

// Ensure subagent tools register themselves on this invocation too
import "@/agent/tools/spawn-subagent";
import "@/agent/tools/get-subagent-result";

function extractResult(messages: Message[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg.role !== "assistant") continue;
    if (typeof msg.content === "string") return msg.content;
    if (Array.isArray(msg.content)) {
      const text = (msg.content as Array<{ type: string; text?: string }>)
        .filter((b) => b.type === "text" && b.text)
        .map((b) => b.text!)
        .join("\n");
      if (text) return text;
    }
  }
  return "";
}

async function runSubagentLoop(params: {
  runId: string;
  task: string;
  childSessionId: string;
  parentUserId: string;
  spawnDepth: number;
}): Promise<void> {
  const { runId, task, childSessionId, parentUserId, spawnDepth } = params;

  // Outer try/catch: catches Redis/session failures before the inner try/catch.
  // Without this, errors on the updateSubagent or getSession calls bubble into the
  // ReadableStream's empty catch, get swallowed, and leave the record stuck as "pending".
  try {
    await updateSubagent(runId, { status: "running", startedAt: Date.now() });
  } catch (err) {
    console.error(`[subagent:${runId}] Failed to mark as running:`, err);
    // Continue — the record stays "pending" but the loop can still run
  }

  let session;
  try {
    session = await getSession(childSessionId);
  } catch (err) {
    console.error(`[subagent:${runId}] Failed to get child session:`, err);
    await updateSubagent(runId, { status: "failed", error: String(err), completedAt: Date.now() }).catch(() => {});
    return;
  }

  if (!session) {
    await updateSubagent(runId, { status: "failed", error: "Child session not found", completedAt: Date.now() });
    return;
  }

  session.messages = [{ role: "user", content: task }];

  const bus = new AgentEventBus();

  try {
    const result = await runAgentLoop(
      {
        sessionId: childSessionId,
        userId: parentUserId,
        messages: session.messages,
        slides: session.slides,
        outline: session.outline,
        toolHistory: session.toolHistory,
        spawnDepth,
        extraSystemPrompt: [
          "You are a subagent. Complete the task below thoroughly and return your result in your final response.",
          "Do not ask clarifying questions — work with the information given.",
          `Spawn depth: ${spawnDepth}/${MAX_SPAWN_DEPTH}`,
        ].join("\n"),
        // OSS build: no credit deduction for subagents.
      },
      bus
    );

    session.messages = result.messages;
    session.slides = result.slides;
    session.outline = result.outline;
    await saveSession(session);

    const raw = extractResult(result.messages);
    // Mirror OpenClaw: non-empty fallback so parent never receives a blank injection.
    // Cap at 100 KB to stay well within Redis value limits (matches OpenClaw's FROZEN_RESULT_TEXT_MAX_BYTES).
    const MAX_RESULT_BYTES = 100 * 1024;
    const trimmed = raw.trim() || "(no output)";
    const resultText =
      Buffer.byteLength(trimmed, "utf8") > MAX_RESULT_BYTES
        ? trimmed.slice(0, MAX_RESULT_BYTES) + "\n\n[Result truncated — exceeded 100 KB]"
        : trimmed;
    await updateSubagent(runId, { status: "completed", result: resultText, completedAt: Date.now() });
  } catch (err) {
    await updateSubagent(runId, { status: "failed", error: String(err), completedAt: Date.now() });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.runId || !body?.childSessionId || !body?.task || !body?.parentUserId || !body?.parentSessionId) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Auth via registry — only the server writes subagent records, so a matching record
  // proves this is a legitimate internal spawn. No shared secret needed.
  let record;
  try {
    record = await getSubagent(body.runId);
  } catch (err) {
    console.error("[subagent/run] Redis error fetching record:", err);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
  if (!record) {
    return Response.json({ error: "Unknown runId" }, { status: 401 });
  }
  if (
    record.childSessionId !== body.childSessionId ||
    record.parentUserId !== body.parentUserId ||
    record.parentSessionId !== body.parentSessionId
  ) {
    return Response.json({ error: "Mismatched subagent record" }, { status: 401 });
  }

  const encoder = new TextEncoder();

  // Streaming response — same pattern as /api/chat. The ReadableStream's async start()
  // keeps this Vercel function invocation alive until the loop completes.
  // spawn.ts reads only the response headers (status 200) and returns immediately,
  // so both parent and child run in parallel in their own Vercel invocations.
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Ack immediately so spawn.ts can return and the parent continues its loop
        controller.enqueue(
          encoder.encode(JSON.stringify({ status: "accepted", runId: body.runId }) + "\n")
        );

        await withSubagentSemaphore(body.runId, () =>
          runSubagentLoop({
            runId: body.runId,
            task: body.task,
            childSessionId: body.childSessionId,
            parentUserId: body.parentUserId,
            spawnDepth: body.spawnDepth ?? 1,
          })
        );

        controller.enqueue(
          encoder.encode(JSON.stringify({ status: "done", runId: body.runId }) + "\n")
        );
      } catch (err) {
        // Execution error or dropped connection.
        // Mark failed so the parent isn't blocked waiting for a result that will never come.
        console.error(`[subagent:${body.runId}] fatal error:`, err);
        await updateSubagent(body.runId, { status: "failed", error: String(err), completedAt: Date.now() }).catch(() => {});
      } finally {
        try { controller.close(); } catch { /* already closed */ }
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: { "Content-Type": "application/x-ndjson" },
  });
}
