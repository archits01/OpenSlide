/**
 * session-title.ts — Generate a short, meaningful session title with Haiku.
 *
 * Runs once per session, on the first agent turn, when the title is still
 * the default ("Untitled Presentation" / "Untitled Document" / etc.).
 *
 * The same code path works for every mode (slides, docs, sheets, website) —
 * we hand Haiku a small snapshot of what the agent just produced and ask
 * for a 3–5 word title. Fallback on any failure: a cleaned prompt slice.
 *
 * Model + transport mirror `src/agent/compaction.ts` — same router, same
 * bearer, same anthropic-version header.
 */

import type { Session } from "./types";

const MODEL = "claude-haiku-4-5-20251001";
const MAX_TOKENS = 80;
const TIMEOUT_MS = 10_000;

const DEFAULT_TITLES = new Set([
  "Untitled Presentation",
  "Untitled Document",
  "Untitled Spreadsheet",
  "Untitled Website",
]);

export function isDefaultTitle(title: string): boolean {
  return DEFAULT_TITLES.has(title);
}

/**
 * Strip command verbs + filler from a user prompt to use as a title fallback.
 * "Create a 10-slide pitch deck for my startup" → "10-slide pitch deck for my startup"
 */
function cleanPromptForTitle(prompt: string, maxLen = 60): string {
  let t = prompt.trim();
  // Strip leading command verbs
  t = t.replace(
    /^(please\s+)?(create|make|build|design|generate|give\s+me|write|draft|produce|whip\s+up|put\s+together|come\s+up\s+with)\s+(a|an|the|some|my)?\s*/i,
    "",
  );
  // Strip trailing punctuation
  t = t.replace(/[.!?]+$/, "");
  // Capitalize first letter
  if (t.length > 0) t = t[0].toUpperCase() + t.slice(1);
  if (t.length > maxLen) t = t.slice(0, maxLen - 1).trimEnd() + "…";
  return t || prompt.slice(0, maxLen);
}

/**
 * Build a concise content snapshot of whatever the agent produced on turn 1.
 * Kept under ~2k characters — Haiku only needs a taste.
 */
function buildContentSnapshot(session: Session, userMessage: string): string {
  const parts: string[] = [`User prompt: ${userMessage.slice(0, 400)}`];
  const mode = session.type ?? "slides";

  // Slides: the outline title is already what we want, but we still hand it
  // through Haiku for consistency + final cleanup (strip trailing punctuation,
  // unify casing across modes).
  if (session.outline?.presentation_title) {
    parts.push(`Presentation title: ${session.outline.presentation_title}`);
  }
  if (session.outline?.slides?.length) {
    const topFew = session.outline.slides
      .slice(0, 5)
      .map((s) => `- ${s.title}`)
      .join("\n");
    parts.push(`First slides:\n${topFew}`);
  }

  // Slides/docs/sheets all populate session.slides[] (sheets use workbookJson).
  if (session.slides?.length) {
    const firstSlide = session.slides[0];
    if (firstSlide?.title) parts.push(`First item title: ${firstSlide.title}`);
  }

  // Website: pull package.json name or index.html <title> if we can.
  if (mode === "website" && session.websiteFilesJson) {
    const files = session.websiteFilesJson;
    const pkg = files["package.json"];
    if (pkg) {
      try {
        const parsed = JSON.parse(pkg) as { name?: string };
        if (parsed.name) parts.push(`Project name: ${parsed.name}`);
      } catch {
        // ignore malformed package.json
      }
    }
    const html =
      files["index.html"] ??
      files["public/index.html"] ??
      files["src/index.html"] ??
      "";
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) parts.push(`HTML title: ${titleMatch[1].trim()}`);
    const h1 = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    if (h1) parts.push(`Hero heading: ${h1[1].trim()}`);
  }

  return parts.join("\n\n").slice(0, 2000);
}

/**
 * Ask Haiku for a short title. Returns null on any network/parse failure so
 * the caller can fall back to a cleaned prompt.
 */
export async function generateSessionTitle(
  session: Session,
  userMessage: string,
): Promise<string | null> {
  const routerUrl = process.env.CLAUDE_ROUTER_URL;
  const proxyKey = process.env.CLAUDE_ROUTER_PROXY_KEY;
  if (!routerUrl || !proxyKey) return null;

  const snapshot = buildContentSnapshot(session, userMessage);
  const mode = session.type ?? "slides";
  const thingWord =
    mode === "docs" ? "document" :
    mode === "sheets" ? "spreadsheet" :
    mode === "website" ? "app" :
    "presentation";

  const systemInstruction =
    `Given what a user asked an AI to build and what's been produced so far, ` +
    `write a short descriptive title (3-6 words) for the ${thingWord}. ` +
    `Rules:\n` +
    `- Title case (e.g. "Series A Pitch Deck", not "SERIES A PITCH DECK" or "series a pitch deck").\n` +
    `- No surrounding quotes. No trailing punctuation. No emoji.\n` +
    `- Describe the CONTENT, not the instruction ("Acme Fitness Landing Page", not "Build a landing page").\n` +
    `- If the content is too vague to name, use the main noun phrase from the prompt.\n` +
    `Reply with ONLY the title, nothing else.`;

  const payload = {
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: systemInstruction,
    messages: [{ role: "user", content: snapshot }],
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${routerUrl}/v1/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${proxyKey}`,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return null;

    const data = (await res.json()) as {
      content?: Array<{ type?: string; text?: string }>;
    };
    const raw = data.content?.find((b) => b.type === "text")?.text?.trim();
    if (!raw) return null;

    // Strip surrounding quotes/backticks if Haiku wrapped it
    const cleaned = raw
      .replace(/^["'`]+|["'`]+$/g, "")
      .replace(/[.!?]+$/, "")
      .trim();
    if (!cleaned || cleaned.length > 80) return null;
    return cleaned;
  } catch {
    clearTimeout(timer);
    return null;
  }
}

/**
 * Public entry point used by the chat route: resolve a title for a session
 * whose title is still the default. Tries Haiku; falls back to a cleaned
 * prompt; ultimately returns the existing default if both fail.
 */
export async function resolveSessionTitle(
  session: Session,
  userMessage: string,
): Promise<string> {
  const llmTitle = await generateSessionTitle(session, userMessage);
  if (llmTitle) return llmTitle;
  const trimmed = userMessage.trim();
  if (trimmed.length > 0) return cleanPromptForTitle(trimmed);
  return session.title;
}
