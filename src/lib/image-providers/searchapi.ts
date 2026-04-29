import { proxyImage } from "./image-proxy";

export interface ImageSearchResult {
  url: string;
  alt: string;
  photographer: string;
  attributionUrl: string;
}

// SearchAPI.io response shape (https://www.searchapi.io/docs/google-images)
// Differs from SerpAPI in two places that matter:
//  - the array is `images` (not `images_results`)
//  - `original` / `source` are nested objects, not strings
interface SearchApiImageResult {
  position?: number;
  title?: string;
  source?: { name?: string; link?: string };
  original?: { link?: string; width?: number; height?: number };
  thumbnail?: string;
}

interface SearchApiResponse {
  images?: SearchApiImageResult[];
  error?: string;
}

const BASE = "https://www.searchapi.io/api/v1/search";

function key(): string {
  const k = process.env.SEARCH_KEY;
  if (!k) throw new Error(
    "search_images disabled — SEARCH_KEY not set. Add it to .env.local (get one at searchapi.io) and restart the dev server. For now, fall back to generate_image or omit the image.",
  );
  return k;
}

async function rawSearch(
  query: string,
  count: number,
  signal?: AbortSignal,
): Promise<SearchApiImageResult[]> {
  const params = new URLSearchParams({
    engine: "google_images",
    q: query,
    num: String(Math.min(Math.max(count, 1), 10)),
    api_key: key(),
  });
  const res = await fetch(`${BASE}?${params}`, {
    signal: signal ?? AbortSignal.timeout(10000),
  });
  if (!res.ok) {
    throw new Error(`SearchAPI ${res.status}: ${await res.text().catch(() => "no body")}`);
  }
  const body = (await res.json()) as SearchApiResponse;
  if (body.error) throw new Error(`SearchAPI: ${body.error}`);
  return body.images ?? [];
}

function broaden(query: string): string | null {
  const tokens = query.trim().split(/\s+/);
  if (tokens.length <= 1) return null;
  return tokens.slice(0, -1).join(" ");
}

export async function searchImages(
  query: string,
  _width: number,
  _height: number,
  count = 3,
  signal?: AbortSignal,
  userId?: string,
): Promise<ImageSearchResult[]> {
  let current: string | null = query;
  let results: SearchApiImageResult[] = [];
  while (current) {
    results = await rawSearch(current, count, signal);
    const withUrl = results.filter((r) => !!r.original?.link);
    if (withUrl.length > 0) {
      results = withUrl;
      break;
    }
    current = broaden(current);
  }
  if (results.length === 0) return [];

  const top = results.slice(0, count);

  // Proxy each candidate through Supabase Storage for a stable URL. Parallel
  // fetch — total adds ~1-2s to search latency, but the returned URLs never
  // 404 and survive beyond the source site's CDN rotation. If no userId is
  // available (shouldn't happen from the agent loop), fall back to raw URLs.
  const urls = await Promise.all(
    top.map(async (r) => {
      const raw = r.original!.link!;
      if (!userId) return raw;
      return proxyImage(raw, userId, signal);
    }),
  );

  return top.map((r, i) => ({
    url: urls[i],
    alt: r.title ?? query,
    photographer: r.source?.name ?? "Google Images",
    attributionUrl: r.source?.link ?? "",
  }));
}
