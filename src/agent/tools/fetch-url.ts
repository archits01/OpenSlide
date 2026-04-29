import type { AgentTool } from "./types";

const MAX_BYTES = 100_000; // 100KB cap — prevents token explosion on large pages
const FETCH_TIMEOUT_MS = 10_000;

export const fetchUrlTool: AgentTool = {
  name: "fetch_url",
  description:
    "Fetch a URL server-side and return the plain-text content. " +
    "Strips HTML tags, scripts, and styles — returns readable text only. " +
    "Use this to read documentation pages, API references, or any public URL the user points you to. " +
    "NOT a replacement for web_search — use web_search to discover URLs, then fetch_url to read them deeply. " +
    `Truncated at ${Math.round(MAX_BYTES / 1000)}KB.`,
  input_schema: {
    type: "object",
    properties: {
      url: {
        type: "string",
        description: "Full URL to fetch (must be https://).",
      },
    },
    required: ["url"],
  },
  async execute(raw) {
    const { url } = raw as { url: string };
    if (!url) throw new Error("url is required");
    if (!url.startsWith("https://") && !url.startsWith("http://")) {
      throw new Error("Only http:// and https:// URLs are allowed.");
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    let html: string;
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { "User-Agent": "OpenSlides-Agent/1.0" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
      html = await res.text();
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        throw new Error(`Request timed out after ${FETCH_TIMEOUT_MS / 1000}s`);
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }

    // Strip HTML → plain text
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s{3,}/g, "\n\n")
      .trim();

    const truncated = text.length > MAX_BYTES;
    const content = truncated ? text.slice(0, MAX_BYTES) + "\n\n[…truncated]" : text;

    return { url, content, truncated, charCount: content.length };
  },
};
