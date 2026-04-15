// Agent endpoint — Node.js runtime (NOT Edge), streaming SSE
// Handles one turn of conversation, persists to Redis, streams events to browser

export const runtime = "nodejs";
export const maxDuration = 300; // Vercel: allow up to 5 minutes for generation

import { NextRequest } from "next/server";
import { getSession, createSession, saveSession } from "@/lib/redis";
import { createClient } from "@/lib/supabase/server";
import type { SessionAttachment, ContentBlock } from "@/lib/types";
import { AgentEventBus, type AgentEvent } from "@/agent/events";
import { runAgentLoop } from "@/agent/loop";
import { runResearch, type ResearchOutput } from "@/skills/deep-research/research-orchestrator";
import { classifyDeck, resolveSkillName, type SlideCategory } from "@/skills/slide-categories/slide-classifier";
import { resolveTemplateClassification } from "@/skills/slide-categories/template-category-map";
import { classifyDoc, type DocCategory } from "@/skills/DocSkills/doc-classifier";
import { prisma } from "@/lib/db";
import { DEFAULT_BRAND_CONFIG } from "@/lib/brand-defaults";
import { registerMCPProviders } from "@/agent/mcp/registry";
import { requireAuth, isResponse } from "@/lib/api-helpers";
import { randomUUID } from "crypto";

// Register optional providers once at module load
registerMCPProviders();

function toClientError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes("transaction") || msg.includes("expired") || msg.includes("timeout")) {
    return "It took a bit too long to save — please try again.";
  }
  if (msg.toLowerCase().includes("prisma") || msg.toLowerCase().includes("database") || msg.includes("P2")) {
    return "We had trouble saving your presentation. Please try again.";
  }
  if (msg.includes("rate-limited") || msg.includes("429") || msg.includes("529") || msg.toLowerCase().includes("overloaded")) {
    return "We're experiencing a lot of requests right now. Please try again in a moment.";
  }
  if (msg.includes("fetch") || msg.includes("network") || msg.includes("ECONNREFUSED")) {
    return "Couldn't reach the AI service. Check your connection and try again.";
  }
  return "Something went wrong. Please try again.";
}

export async function POST(req: NextRequest) {
  const authResult = await requireAuth();
  if (isResponse(authResult)) return authResult;
  const user = authResult;

  const body = await req.json().catch(() => null);

  if (!body || typeof body.message !== "string") {
    return Response.json({ error: "Missing message" }, { status: 400 });
  }

  let { message, sessionId: clientSessionId, deepResearch, docsMode, attachments, templateSlug } = body as {
    message: string;
    sessionId?: string;
    deepResearch?: boolean;
    docsMode?: boolean;
    attachments?: SessionAttachment[];
    templateSlug?: string;
  };

  // Get or create session (always tagged with this user)
  const sessionId = clientSessionId ?? randomUUID();
  let session = await getSession(sessionId);
  if (!session) {
    session = await createSession(sessionId, docsMode ? "Untitled Document" : "Untitled Presentation", user.id, docsMode ? "docs" : "slides");
  }

  // Use session.type as source of truth — not the frontend flag.
  // The frontend flag is only needed for the first message (to create the session).
  // After that, the DB type is authoritative.
  if (session.type === "docs") docsMode = true;
  if (session.type === "slides") docsMode = false;

  // Merge any new attachments into session (metadata only — content stays in Supabase Storage)
  if (attachments?.length) {
    const existingIds = new Set((session.attachments ?? []).map((a) => a.id));
    const newAtts = attachments.filter((a) => !existingIds.has(a.id));
    if (newAtts.length) {
      session.attachments = [...(session.attachments ?? []), ...newAtts];
    }
  }

  // User message is always plain text — attachment content is injected by the loop.
  // If the user sent only files with no text, use a sensible default so the message
  // is never an empty string (the loop filters those out, leaving no injection target).
  const userText = message.trim() || (session.attachments?.length ? "Please analyze the attached file(s)." : "");
  if (userText) {
    session.messages = [...session.messages, { role: "user", content: userText }];
  }

  // Fetch attachment content from Supabase Storage — resolved once per turn, passed to loop
  const resolvedAttachments: ContentBlock[] = [];
  if (session.attachments?.length) {
    const supabase = await createClient();
    for (const att of session.attachments) {
      try {
        const { data, error } = await supabase.storage.from("attachments").download(att.storagePath);
        if (error || !data) {
          console.warn(`[chat] Could not fetch attachment ${att.name}:`, error?.message);
          continue;
        }
        if (att.contentType === "text") {
          const text = await data.text();
          resolvedAttachments.push({
            type: "document",
            source: { type: "text", media_type: "text/plain", data: text },
            title: att.name,
          });
        } else {
          // raw — PDF or image
          const arrayBuf = await data.arrayBuffer();
          const base64 = Buffer.from(arrayBuf).toString("base64");
          if (att.mimeType.startsWith("image/")) {
            resolvedAttachments.push({
              type: "image",
              source: { type: "base64", media_type: att.mimeType, data: base64 },
              // Note: Anthropic image blocks do not accept a title field
            });
          } else {
            resolvedAttachments.push({
              type: "document",
              source: { type: "base64", media_type: att.mimeType, data: base64 },
              title: att.name,
            });
          }
        }
      } catch (err) {
        console.warn(`[chat] Attachment fetch error for ${att.name}:`, err);
      }
    }
  }

  // Set up SSE response
  const encoder = new TextEncoder();
  const abortController = new AbortController();

  const stream = new ReadableStream({
    async start(controller) {
      function send(event: AgentEvent) {
        const payload = `data: ${JSON.stringify(event)}\n\n`;
        try {
          controller.enqueue(encoder.encode(payload));
        } catch {
          // Controller closed
        }
      }

      // First event: session ID so the client can track it
      send({ type: "text_delta", text: "" } as AgentEvent);
      const sessionEvent = `data: ${JSON.stringify({ type: "session_id", sessionId })}\n\n`;
      controller.enqueue(encoder.encode(sessionEvent));

      const bus = new AgentEventBus();
      bus.subscribe(send);

      try {
        // Classify slide category for new presentations (loads only the matching skill)
        let researchResults: ResearchOutput | null = null;
        const isNewPresentation =
          (session!.slides ?? []).length === 0 && !session!.outline;

        let slideCategory: SlideCategory | undefined;
        let presentationType: string | undefined;
        let docCategory: DocCategory | undefined;

        // Use persisted classification from a previous turn if available
        // Fall back to general-deck for legacy sessions created before classification was added
        if (!isNewPresentation) {
          slideCategory = (session!.slideCategory as SlideCategory) ?? "general-deck";
          presentationType = session!.presentationType ?? undefined;
          const effectiveSkill = resolveSkillName(slideCategory);
          console.log(`[chat] Using persisted classification: ${effectiveSkill}${presentationType ? `/${presentationType}` : ""}`);
        }

        if (isNewPresentation && !docsMode) {
          // Template short-circuit: if the user came from a homepage template, we already
          // know the right skill — skip the classifier LLM call (~500ms + ~2000 tokens).
          const templateHit = resolveTemplateClassification(templateSlug);
          if (templateHit) {
            slideCategory = templateHit.category;
            presentationType = templateHit.presentationType;
            console.log(`[chat] Template short-circuit (${templateSlug}): ${slideCategory}${presentationType ? `/${presentationType}` : ""}`);

            session!.slideCategory = templateHit.category;
            session!.presentationType = templateHit.presentationType ?? null;
            session!.classificationConfidence = "high";
            session!.classificationMethod = "template";
            session!.classifiedAt = Date.now();

          } else {
            try {
              const classification = await classifyDeck(message);
              slideCategory = classification.category;
              presentationType = classification.presentationType;
              console.log(`[chat] Slide classified as: ${slideCategory}${presentationType ? `/${presentationType}` : ""} (${classification.confidence}, ${classification.method})`);

              // Persist classification on session (only set once)
              session!.slideCategory = classification.category;
              session!.presentationType = classification.presentationType ?? null;
              session!.classificationConfidence = classification.confidence;
              session!.classificationMethod = classification.method;
              session!.classifiedAt = Date.now();

            } catch (err) {
              console.warn("[chat] Slide classification failed, falling back to general-deck:", err);
              slideCategory = "general-deck";
            }
          }
        }
        if (isNewPresentation && docsMode) {
          try {
            const docClassification = await classifyDoc(message);
            if (docClassification.category === "presentations_redirect") {
              // User asked for slides while in docs mode — fall back to slide pipeline
              console.log("[chat] Doc classifier detected slide request, redirecting to slide pipeline");
              docsMode = false;
              session!.type = "slides"; // persist type so subsequent requests don't revert to docs mode
              const slideClassification = await classifyDeck(message);
              slideCategory = slideClassification.category;
              presentationType = slideClassification.presentationType;

              // Persist classification on session
              session!.slideCategory = slideClassification.category;
              session!.presentationType = slideClassification.presentationType ?? null;
              session!.classificationConfidence = slideClassification.confidence;
              session!.classificationMethod = slideClassification.method;
              session!.classifiedAt = Date.now();

            } else {
              docCategory = docClassification.category;
              console.log(`[chat] Doc classified as: ${docCategory} (${docClassification.confidence}, ${docClassification.method})`);
            }
          } catch (err) {
            console.warn("[chat] Doc classification failed:", err);
          }
        }

        if (isNewPresentation && deepResearch) {
          try {
            researchResults = await runResearch({
              topic: message,
              bus,
              signal: abortController.signal,
            });
          } catch (err) {
            console.warn("[chat] Research pipeline failed, continuing without:", err);
            // Non-fatal — agent will fall back to inline web searches via the skill
          }
        }

        // Load active brand config for this user (if any)
        let brand: { brandJson: Record<string, unknown>; brandConfig?: typeof DEFAULT_BRAND_CONFIG } | undefined;
        try {
          const brandConfig = await prisma.brandConfig.findFirst({
            where: { userId: user.id, isActive: true },
            select: { brandJson: true, brandConfigJson: true },
          });
          if (brandConfig?.brandJson && typeof brandConfig.brandJson === "object") {
            const bj = brandConfig.brandJson as Record<string, unknown>;
            if (bj.colors || bj.fonts) {
              brand = {
                brandJson: bj,
                brandConfig: (brandConfig.brandConfigJson as unknown as typeof DEFAULT_BRAND_CONFIG) ?? DEFAULT_BRAND_CONFIG,
              };
            }
          }
        } catch (err) {
          console.warn("[chat] Brand config load failed:", err);
        }

        let loopResult: Awaited<ReturnType<typeof runAgentLoop>> | null = null;
        try {
          loopResult = await runAgentLoop(
            {
              sessionId,
              userId: user.id,
              messages: session!.messages,
              slides: session!.slides,
              outline: session!.outline,
              toolHistory: session!.toolHistory,
              research: session!.research,
              researchResults,
              resolvedAttachments: resolvedAttachments.length ? resolvedAttachments : undefined,
              slideCategory,
              presentationType,
              deepResearch: !!deepResearch,
              docsMode: !!docsMode,
              docCategory,
              brand,
              signal: abortController.signal,
            },
            bus
          );
        } catch (err) {
          console.error("[chat] agent loop error:", err);
          send({ type: "error", message: toClientError(err) });
        }

        // Persist whatever was built — even if the loop errored partway through.
        // loopResult is null only if runAgentLoop itself threw before returning anything.
        if (loopResult) {
          session!.messages = loopResult.messages;
          session!.slides = loopResult.slides;
          session!.toolHistory = loopResult.toolHistory;
          if (loopResult.outline) session!.outline = loopResult.outline;
          if (loopResult.logoUrl) session!.logoUrl = loopResult.logoUrl;
          if (loopResult.theme) session!.theme = loopResult.theme;
          if (loopResult.themeColors) session!.themeColors = loopResult.themeColors;
          if (loopResult.research && loopResult.research.length > 0) {
            session!.research = loopResult.research;
          }
        }

        // Update title from first user message if still default
        if ((session!.title === "Untitled Presentation" || session!.title === "Untitled Document") && message.length > 0) {
          session!.title = message.slice(0, 60) + (message.length > 60 ? "…" : "");
        }

        // Always save — preserves partial progress even on mid-generation errors
        try {
          await saveSession(session!);
        } catch (saveErr) {
          console.error("[chat] session save failed:", saveErr);
        }
      } catch (err) {
        console.error("[chat] agent error:", err);
        send({ type: "error", message: toClientError(err) });
      } finally {
        controller.close();
      }
    },
    cancel() {
      abortController.abort();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

// GET /api/chat?sessionId=... — fetch session state
export async function GET(req: NextRequest) {
  const authResult = await requireAuth();
  if (isResponse(authResult)) return authResult;
  const user = authResult;

  const sessionId = req.nextUrl.searchParams.get("sessionId");
  if (!sessionId) return Response.json({ error: "Missing sessionId" }, { status: 400 });

  const session = await getSession(sessionId);
  if (!session) return Response.json({ error: "Session not found" }, { status: 404 });

  if (session.userId && session.userId !== user.id) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  return Response.json({ session });
}
