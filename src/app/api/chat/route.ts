// Agent endpoint — Node.js runtime (NOT Edge), streaming SSE
// Handles one turn of conversation, persists to Redis, streams events to browser

export const runtime = "nodejs";
export const maxDuration = 300; // Vercel: allow up to 5 minutes for generation

import { NextRequest } from "next/server";
import { getSession, createSession, saveSession } from "@/lib/redis";
import { isDefaultTitle, resolveSessionTitle } from "@/lib/session-title";
import { createClient } from "@/lib/supabase/server";
import type { SessionAttachment, ContentBlock } from "@/lib/types";
import { AgentEventBus, type AgentEvent } from "@/agent/events";
import { runAgentLoop } from "@/agent/loop";
import { runResearch, type ResearchOutput } from "@/skills/deep-research/research-orchestrator";
import { classifyDeck, resolveSkillName, type SlideCategory } from "@/skills/slide-categories/slide-classifier";
import { resolveTemplateClassification } from "@/skills/slide-categories/template-category-map";
import { classifyDoc, type DocCategory } from "@/skills/DocSkills/doc-classifier";
import { classifySheet, sheetCategoryToSkillName, type SheetCategory } from "@/skills/SheetSkills/sheet-classifier";
import { logSheetRouting } from "@/skills/SheetSkills/sheet-routing-log";
import { prisma } from "@/lib/db";
import { DEFAULT_BRAND_CONFIG } from "@/lib/brand-defaults";
import { resolveBrandKitForSession } from "@/lib/brand/load-brand-skill";
import { requireAuth, isResponse } from "@/lib/api-helpers";
import { getEnvVarNamesSafe } from "@/lib/encryption";
import { pickTemplate, fetchTemplateFiles, llmPickTemplate, WEBSITE_TEMPLATES_MAP } from "@/lib/website-templates";
import { randomUUID } from "crypto";
import { listSubagentsForSession, getSubagent, updateSubagent } from "@/agent/subagent/registry";

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

  let { message, sessionId: clientSessionId, deepResearch, docsMode, sheetsMode, websiteMode, discussMode, attachments, templateSlug } = body as {
    message: string;
    sessionId?: string;
    deepResearch?: boolean;
    docsMode?: boolean;
    sheetsMode?: boolean;
    websiteMode?: boolean;
    discussMode?: boolean;
    attachments?: SessionAttachment[];
    templateSlug?: string;
  };

  // OSS build: no credit balance check. Users plug in their own keys → unlimited.

  // Get or create session (always tagged with this user)
  const sessionId = clientSessionId ?? randomUUID();
  let session = await getSession(sessionId);
  if (!session) {
    const sessionType = websiteMode ? "website" : sheetsMode ? "sheets" : docsMode ? "docs" : "slides";
    const defaultTitle = websiteMode
      ? "Untitled Website"
      : sheetsMode
      ? "Untitled Spreadsheet"
      : docsMode
      ? "Untitled Document"
      : "Untitled Presentation";
    session = await createSession(sessionId, defaultTitle, user.id, sessionType);
  }

  // Use session.type as source of truth — not the frontend flag.
  // The frontend flag is only needed for the first message (to create the session).
  // After that, the DB type is authoritative.
  if (session.type === "docs") { docsMode = true; sheetsMode = false; websiteMode = false; }
  if (session.type === "slides") { docsMode = false; sheetsMode = false; websiteMode = false; }
  if (session.type === "sheets") { sheetsMode = true; docsMode = false; websiteMode = false; }
  if (session.type === "website") { websiteMode = true; docsMode = false; sheetsMode = false; }

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
      // Intercept "done" events — hold them until after session save so we can
      // attach sessionMessageCount (needed by client rewind/fork snapshots).
      let pendingDoneEvent: AgentEvent | null = null;
      bus.subscribe((event) => {
        if (event.type === "done") { pendingDoneEvent = event; return; }
        send(event);
      });

      try {
        // Classify slide category for new presentations (loads only the matching skill)
        let researchResults: ResearchOutput | null = null;
        const isNewPresentation =
          (session!.slides ?? []).length === 0 && !session!.outline;

        let slideCategory: SlideCategory | undefined;
        let presentationType: string | undefined;
        let docCategory: DocCategory | undefined;
        let sheetCategory: SheetCategory | undefined;

        // Use persisted classification from a previous turn if available
        // Fall back to general-deck for legacy sessions created before classification was added
        if (!isNewPresentation) {
          slideCategory = (session!.slideCategory as SlideCategory) ?? "general-deck";
          presentationType = session!.presentationType ?? undefined;
          const effectiveSkill = resolveSkillName(slideCategory);
          console.log(`[chat] Using persisted classification: ${effectiveSkill}${presentationType ? `/${presentationType}` : ""}`);
        }

        if (!isNewPresentation && sheetsMode) {
          sheetCategory = (session!.slideCategory as SheetCategory) ?? "data_analysis";
          console.log(`[chat] Using persisted sheet classification: ${sheetCategory}`);
        }

        if (isNewPresentation && !docsMode && !sheetsMode && !websiteMode) {
          // Template short-circuit: if the user came from a homepage template, we already
          // know the right skill — skip the classifier LLM call (~500ms + ~2000 tokens).
          // Website mode has its own purpose-built system prompt with no slide-category
          // concept, so classifier output would be discarded — skip the call entirely.
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

        if (isNewPresentation && sheetsMode) {
          try {
            const startMs = Date.now();
            const sheetClassification = await classifySheet(message);
            const latencyMs = Date.now() - startMs;

            sheetCategory = sheetClassification.category;
            console.log(`[chat] Sheet classified as: ${sheetCategory} (${sheetClassification.confidence}, ${sheetClassification.method}, ${latencyMs}ms)`);

            session!.slideCategory = sheetClassification.category;
            session!.classificationConfidence = sheetClassification.confidence;
            session!.classificationMethod = sheetClassification.method as "graph" | "default" | "template";
            session!.classifiedAt = Date.now();

            logSheetRouting({
              timestamp: Date.now(),
              userPrompt: message.slice(0, 200),
              classifiedCategory: sheetClassification.category,
              confidence: sheetClassification.confidence,
              method: sheetClassification.method,
              skillFile: sheetCategoryToSkillName(sheetClassification.category),
              latencyMs,
            });
          } catch (err) {
            console.warn("[chat] Sheet classification failed:", err);
            sheetCategory = "data_analysis" as SheetCategory;
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

        // Resolve which brand applies to this session.
        //
        // Two systems coexist during the v1 → v2 transition:
        //  - BrandKit (v2): full skill replacement (design-system + layouts as markdown)
        //  - BrandConfig (v1, legacy): rules-only prompt section
        //
        // BrandKit takes precedence when both are present.
        let brand: { brandJson: Record<string, unknown>; brandConfig?: typeof DEFAULT_BRAND_CONFIG } | undefined;
        let brandKit: import("@/lib/brand/types").BrandKitRecord | undefined;
        try {
          const resolvedKit = await resolveBrandKitForSession(user.id, session!.brandKitId ?? null);
          if (resolvedKit) {
            brandKit = resolvedKit;
            // Auto-stamp: if the session resolved a kit via fallback (no explicit
            // brandKitId), pin the resolved kit to the session so future turns
            // and any later kit-default changes don't silently switch styling.
            if (!session!.brandKitId) {
              session!.brandKitId = resolvedKit.id;
              try {
                await prisma.session.update({
                  where: { id: sessionId },
                  data: { brandKitId: resolvedKit.id },
                });
              } catch (err) {
                console.warn("[chat] Failed to auto-stamp brandKitId:", err);
              }
            }
          } else {
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
          }
        } catch (err) {
          console.warn("[chat] Brand resolution failed:", err);
        }

        // Record before running so the announcement phase only picks up subagents
        // spawned during THIS turn — not re-injects from previous turns still in Redis.
        const turnStartedAt = Date.now();

        // ── Website scaffold bootstrap ────────────────────────────────────────
        // On the very first message of a new website session (no files yet),
        // pre-mount the right starter template before the agent loop runs.
        // This lets the agent skip all boilerplate and go straight to content.
        let websiteScaffoldHint: string | undefined;
        if (websiteMode && Object.keys((session!.websiteFilesJson as Record<string, string>) ?? {}).length === 0) {
          // Keyword pick gives us an immediate template to start fetching.
          // LLM pick runs in parallel — if it disagrees, we swap and re-fetch.
          const keywordTemplate = pickTemplate(message);
          console.log(`[chat] website template keyword pick: ${keywordTemplate.name}`);

          const [llmPicked, keywordFiles] = await Promise.all([
            llmPickTemplate(message),
            fetchTemplateFiles(keywordTemplate),
          ]);

          let finalTemplate = keywordTemplate;
          let scaffoldFiles = keywordFiles;

          if (llmPicked && llmPicked.name !== keywordTemplate.name) {
            console.log(`[chat] LLM overriding keyword pick: ${keywordTemplate.name} → ${llmPicked.name}`);
            finalTemplate = llmPicked;
            scaffoldFiles = await fetchTemplateFiles(llmPicked);
          } else {
            console.log(`[chat] LLM confirmed keyword pick: ${finalTemplate.name}${llmPicked ? "" : " (LLM timed out)"}`);
          }

          websiteScaffoldHint = finalTemplate.scaffoldHint;

          // Persist scaffold to session so it survives reload
          session!.websiteFilesJson = scaffoldFiles;
          session!.websiteSandboxDirty = true;
          session!.websiteTemplateName = finalTemplate.name;
          try { await saveSession(session!); } catch { /* non-fatal */ }

          // Stream each file to the client so WebContainer writes them immediately
          for (const [path, content] of Object.entries(scaffoldFiles)) {
            send({ type: "website_file_created", path, content } as AgentEvent);
          }
          send({ type: "website_template_set", templateName: finalTemplate.name } as AgentEvent);
          console.log(`[chat] website scaffold mounted: ${finalTemplate.name} (${Object.keys(scaffoldFiles).length} files)`);
        } else if (websiteMode) {
          // Existing session — use persisted template name for system prompt hint
          const persisted = (session!.websiteTemplateName as string | null) ?? null;
          const template = persisted
            ? (WEBSITE_TEMPLATES_MAP[persisted] ?? pickTemplate(message))
            : pickTemplate(message);
          websiteScaffoldHint = template.scaffoldHint;
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
              sheetsMode: !!sheetsMode,
              sheetCategory,
              websiteMode: !!websiteMode,
              discussMode: !!(websiteMode && discussMode),
              websiteFiles: (session!.websiteFilesJson as Record<string, string>) ?? {},
              websiteEnvVarNames: websiteMode && session!.websiteEnvVars
                ? getEnvVarNamesSafe(session!.websiteEnvVars)
                : [],
              websiteScaffoldHint,
              brand,
              brandKit,
              signal: abortController.signal,
              // Per-iteration checkpoint: persist partial progress so a Vercel
              // hard-kill (or any mid-loop crash) doesn't destroy completed slides.
              // Without this, slides only exist in memory until the final
              // saveSession() below — which never runs if the function is killed.
              // Mirrors the post-loop save block below so a kill-point save is
              // equivalent to a normal-completion save.
              onIterationComplete: async (state) => {
                session!.messages = state.messages;
                session!.slides = state.slides;
                session!.toolHistory = state.toolHistory;
                if (state.outline) session!.outline = state.outline;
                if (state.logoUrl) session!.logoUrl = state.logoUrl;
                if (state.theme) session!.theme = state.theme;
                if (state.themeColors) session!.themeColors = state.themeColors;
                if (state.research && state.research.length > 0) {
                  session!.research = state.research;
                }
                if (websiteMode) {
                  session!.websiteFilesJson = state.websiteFiles;
                  session!.websiteSandboxDirty = true;
                }
                try {
                  await saveSession(session!);
                } catch (saveErr) {
                  console.warn("[chat] per-iteration save failed (will retry at end):", saveErr);
                }
              },
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
          if (websiteMode) {
            session!.websiteFilesJson = loopResult.websiteFiles;
            session!.websiteSandboxDirty = true; // files changed → snapshot should be re-uploaded
          }
        }

        // Name the session once, on the first turn. We let Haiku propose a
        // short content-based title (same treatment across all modes); if
        // that fails, the helper falls back to a cleaned version of the
        // prompt. Errors never block the save — the default title just stays.
        if (isDefaultTitle(session!.title) && message.length > 0) {
          try {
            session!.title = await resolveSessionTitle(session!, message);
          } catch (titleErr) {
            console.error("[chat] session title generation failed:", titleErr);
          }
        }

        // Always save — preserves partial progress even on mid-generation errors
        try {
          await saveSession(session!);
        } catch (saveErr) {
          console.error("[chat] session save failed:", saveErr);
        }

        // Flush deferred done event now that session.messages is persisted —
        // attach sessionMessageCount so client can snapshot for rewind/fork.
        if (pendingDoneEvent) {
          const doneEvent = pendingDoneEvent as { type: "done"; stopReason: string; sessionMessageCount?: number };
          send({ type: "done", stopReason: doneEvent.stopReason, sessionMessageCount: session!.messages.length });
          pendingDoneEvent = null;
        }

        // Announcement flow — mirrors OpenClaw's runSubagentAnnounceFlow().
        // If the agent spawned subagents that are still running, keep the SSE stream open
        // and poll until they complete (up to 90s). When all done, inject their results
        // as a new user message and run one final loop iteration so Claude can act on them.
        // This gives the parent the same capability as OpenClaw's autonomous announcement.
        if (loopResult && !abortController.signal.aborted) {
          try {
            const allSubagents = await listSubagentsForSession(sessionId);
            const pending = allSubagents.filter(
              (s) => s.createdAt >= turnStartedAt && (s.status === "pending" || s.status === "running")
            );

            if (pending.length > 0) {
              send({ type: "research_progress", stage: "subagents", detail: `Waiting for ${pending.length} subagent(s) to complete…` });

              const deadline = Date.now() + 90_000;
              let remaining = [...pending];

              while (remaining.length > 0 && Date.now() < deadline && !abortController.signal.aborted) {
                await new Promise((r) => setTimeout(r, 3_000));
                const next: typeof remaining = [];
                for (const sub of remaining) {
                  const updated = await getSubagent(sub.runId);
                  if (!updated) continue;
                  if (updated.status === "completed" || updated.status === "failed") {
                    send({ type: "subagent_completed", runId: updated.runId, label: updated.label, status: updated.status === "completed" ? "completed" : "failed" });
                  } else {
                    next.push(sub);
                  }
                }
                remaining = next;
              }

              // Mark any still-running subagents as timeout so countActiveChildren doesn't
              // permanently block future spawn_subagent calls for this session.
              // The subagent's Vercel function may still be running and will overwrite this
              // with "completed" when it finishes — that's fine.
              for (const sub of remaining) {
                await updateSubagent(sub.runId, { status: "timeout", completedAt: Date.now() }).catch(() => {});
                send({ type: "subagent_completed", runId: sub.runId, label: sub.label, status: "timeout" });
              }

              // Re-fetch to get final results — filter to this turn only, allow empty result string
              const finalSubagents = await listSubagentsForSession(sessionId);
              const completed = finalSubagents.filter(
                (s) => s.createdAt >= turnStartedAt && s.status === "completed" && s.result !== undefined
              );

              if (completed.length > 0 && !abortController.signal.aborted) {
                const injectedContent = [
                  "[Internal: subagent results ready]",
                  `${completed.length} subagent(s) have completed. Their findings are below.`,
                  "Use these results directly to build the presentation. Do NOT repeat any web searches for topics already covered — the subagents have done that work. Synthesize their findings and proceed.",
                  "",
                  ...completed.map((s) => [
                    `<<<BEGIN_SUBAGENT_RESULT label="${s.label ?? s.runId}">>>`,
                    s.result,
                    `<<<END_SUBAGENT_RESULT>>>`,
                  ].join("\n")),
                  "",
                  "Action: Use the above findings to build the slides now. Trust these results as complete research.",
                ].join("\n");

                const injectedMessages = [
                  ...loopResult.messages,
                  { role: "user" as const, content: injectedContent },
                ];

                send({ type: "research_progress", stage: "subagents", detail: "Processing subagent results…" });

                const announceResult = await runAgentLoop(
                  {
                    sessionId,
                    userId: user.id,
                    messages: injectedMessages,
                    slides: loopResult.slides,
                    outline: loopResult.outline,
                    toolHistory: loopResult.toolHistory,
                    research: loopResult.research,
                    slideCategory,
                    presentationType,
                    deepResearch: !!deepResearch,
                    docsMode: !!docsMode,
                    docCategory,
                    sheetsMode: !!sheetsMode,
                    sheetCategory,
                    websiteMode: !!websiteMode,
                    websiteFiles: loopResult.websiteFiles,
                    brand,
                    brandKit,
                    spawnDepth: 0,
                    signal: abortController.signal,
                  },
                  bus
                );

                session!.messages = announceResult.messages;
                session!.slides = announceResult.slides;
                session!.toolHistory = announceResult.toolHistory;
                if (announceResult.outline) session!.outline = announceResult.outline;
                if (announceResult.logoUrl) session!.logoUrl = announceResult.logoUrl;
                if (announceResult.theme) session!.theme = announceResult.theme;
                if (announceResult.themeColors) session!.themeColors = announceResult.themeColors;
                if (websiteMode) session!.websiteFilesJson = announceResult.websiteFiles;

                await saveSession(session!).catch((err) =>
                  console.error("[chat] announcement save failed:", err)
                );
              }
            }
          } catch (announceErr) {
            console.error("[chat] subagent announcement failed:", announceErr);
          }
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
