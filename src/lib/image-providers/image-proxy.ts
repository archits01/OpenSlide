import { createHash } from "node:crypto";
import { createClient } from "@/lib/supabase/server";

// SearchAPI.io returns URLs pointing at arbitrary third-party webservers. Many
// of these have hotlink protection, rotate CDNs, or 404 within days. We
// download each image once and re-host in Supabase Storage so the URL embedded
// in the user's generated HTML stays stable forever.

const BUCKET = "website-images";
const MAX_BYTES = 10 * 1024 * 1024; // 10MB per image
const FETCH_TIMEOUT_MS = 8000;

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15";

function hashUrl(url: string): string {
  return createHash("sha1").update(url).digest("hex").slice(0, 16);
}

function extFromContentType(ct: string | null): string {
  if (!ct) return "jpg";
  const head = ct.split(";")[0].trim().toLowerCase();
  if (head === "image/jpeg") return "jpg";
  if (head === "image/png") return "png";
  if (head === "image/webp") return "webp";
  if (head === "image/gif") return "gif";
  if (head === "image/avif") return "avif";
  if (head === "image/svg+xml") return "svg";
  return "jpg";
}

function looksLikeImage(bytes: Uint8Array, ct: string | null): boolean {
  if (ct && ct.startsWith("image/")) return true;
  // Magic-byte sniff as a fallback — guards against servers returning HTML error pages with 200
  if (bytes.length < 4) return false;
  const b0 = bytes[0];
  const b1 = bytes[1];
  const b2 = bytes[2];
  const b3 = bytes[3];
  if (b0 === 0xff && b1 === 0xd8) return true; // JPEG
  if (b0 === 0x89 && b1 === 0x50 && b2 === 0x4e && b3 === 0x47) return true; // PNG
  if (b0 === 0x47 && b1 === 0x49 && b2 === 0x46) return true; // GIF
  if (b0 === 0x52 && b1 === 0x49 && b2 === 0x46 && b3 === 0x46) return true; // RIFF (WebP/etc)
  return false;
}

/**
 * Download an image URL and re-host it in Supabase Storage, returning the
 * public URL. On any failure (non-image response, oversized, network error,
 * Supabase error), returns the original URL so the caller still has something
 * to show — the site is never worse off for proxying.
 */
export async function proxyImage(sourceUrl: string, userId: string, signal?: AbortSignal): Promise<string> {
  try {
    const supabase = await createClient();
    const hash = hashUrl(sourceUrl);

    // If we've already proxied this URL for this user, short-circuit.
    // Supabase Storage doesn't expose a HEAD-exists in the JS SDK, so we
    // probe via `list` on the prefix. Cheap — returns quickly when present.
    const probe = await supabase.storage
      .from(BUCKET)
      .list(userId, { search: hash, limit: 1 });
    if (probe.data && probe.data.length > 0) {
      const existing = probe.data[0];
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(`${userId}/${existing.name}`);
      if (data.publicUrl) return data.publicUrl;
    }

    // Fetch the image
    const res = await fetch(sourceUrl, {
      headers: { "User-Agent": UA, Accept: "image/*,*/*;q=0.5" },
      signal: signal ?? AbortSignal.timeout(FETCH_TIMEOUT_MS),
      redirect: "follow",
    });
    if (!res.ok) return sourceUrl;

    const ct = res.headers.get("content-type");
    const cl = res.headers.get("content-length");
    if (cl && Number(cl) > MAX_BYTES) return sourceUrl;

    const bytes = new Uint8Array(await res.arrayBuffer());
    if (bytes.byteLength > MAX_BYTES) return sourceUrl;
    if (!looksLikeImage(bytes, ct)) return sourceUrl;

    const ext = extFromContentType(ct);
    const path = `${userId}/${hash}.${ext}`;

    const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, bytes, {
      contentType: ct ?? "image/jpeg",
      upsert: true,
      cacheControl: "31536000, immutable",
    });
    if (upErr) {
      console.warn("[image-proxy] upload failed:", upErr.message);
      return sourceUrl;
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl || sourceUrl;
  } catch (err) {
    console.warn("[image-proxy] proxy failed, returning source:", err);
    return sourceUrl;
  }
}
