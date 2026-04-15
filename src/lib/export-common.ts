// Shared logic for PDF/PPTX/DOCX export routes.
// Each route only needs to specify format-specific config.

import { NextRequest } from "next/server";
import { getSession } from "@/lib/redis";
import { requireAuth, isResponse, requireOwnership } from "@/lib/api-helpers";
import { buildSlideHtml } from "@/lib/slide-html";
import type { ThemeName } from "@/agent/tools/set-theme";
import type { LogoResult } from "@/lib/types";

const PDF_SERVER_URL = process.env.PDF_SERVER_URL;
const PDF_SERVER_SECRET = process.env.PDF_SERVER_SECRET;

export interface ExportConfig {
  /** Server endpoint, e.g. "/generate-pdf" */
  endpoint: string;
  /** Response Content-Type header */
  contentType: string;
  /** File extension including dot, e.g. ".pdf" */
  extension: string;
  /** Human-readable format name for error messages */
  name: string;
  /** Whether to include logo for slide-type sessions */
  includeLogo: boolean;
  /** Force document mode (A4 viewport, doc styles) regardless of session type */
  forceDocMode?: boolean;
}

export async function handleExportRequest(
  req: NextRequest,
  config: ExportConfig,
): Promise<Response> {
  const authResult = await requireAuth();
  if (isResponse(authResult)) return authResult;
  const user = authResult;

  const sessionId = req.nextUrl.searchParams.get("sessionId");
  if (!sessionId) return Response.json({ error: "sessionId required" }, { status: 400 });

  if (!PDF_SERVER_URL) {
    return Response.json({ error: `${config.name} export is not configured yet.` }, { status: 503 });
  }

  const session = await getSession(sessionId);
  const denied = requireOwnership(session, user.id);
  if (denied) return denied;

  const isDoc = config.forceDocMode || session!.type === "docs";
  const pages = (session!.slides ?? []).sort((a, b) => a.index - b.index);
  if (pages.length === 0) {
    return Response.json({ error: isDoc ? "No pages to export" : "No slides to export" }, { status: 400 });
  }

  const theme = (pages[0]?.theme as ThemeName) || "minimal";
  const exportReset = isDoc ? "" : `<style>html,body,.slide-root,.slide-root>*{border-radius:0!important}</style>`;
  const logoResult: LogoResult | null = (config.includeLogo && !isDoc && session!.logoUrl)
    ? { url: session!.logoUrl, source: "monogram", colors: [] }
    : null;

  const slidePayload = pages.map((page, i) => ({
    html: exportReset
      ? buildSlideHtml(page, theme, logoResult, i === 0, undefined, undefined, false, isDoc).replace("</head>", `${exportReset}</head>`)
      : buildSlideHtml(page, theme, null, false, undefined, undefined, false, true),
    title: page.title,
  }));

  const filename = `${session!.title.replace(/[^a-z0-9]/gi, "-").toLowerCase()}${config.extension}`;
  const viewport = isDoc ? { width: 816, height: 1056 } : { width: 1280, height: 720 };

  try {
    const res = await fetch(`${PDF_SERVER_URL}${config.endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(PDF_SERVER_SECRET ? { Authorization: `Bearer ${PDF_SERVER_SECRET}` } : {}),
      },
      body: JSON.stringify({ slides: slidePayload, filename, viewport }),
      signal: AbortSignal.timeout(110_000),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      return Response.json({ error: err?.error ?? "Export failed" }, { status: res.status });
    }

    const buffer = await res.arrayBuffer();
    return new Response(buffer, {
      headers: {
        "Content-Type": config.contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error(`${config.name} export failed:`, err);
    return Response.json({ error: `${config.name} export failed. Check server logs.` }, { status: 500 });
  }
}
