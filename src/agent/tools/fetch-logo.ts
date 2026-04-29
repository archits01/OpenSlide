/**
 * fetch-logo.ts
 *
 * Logo fetching with Logo.dev as the single reliable source.
 *
 * Waterfall:
 *   1. Logo.dev (domain lookup, high-quality, free tier available)
 *   2. Google Favicon (always works, 128px max, no auth)
 */

import type { AgentTool, AgentToolContext } from "./index";
import type { LogoResult } from "@/lib/types";

export type { LogoResult };

interface FetchLogoInput {
  domain: string;
  company?: string;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const LOGO_DEV_PUBLISHABLE_KEY = process.env.LOGO_DEV_PUBLISHABLE_KEY ?? "";
const LOGO_DEV_SECRET_KEY = process.env.LOGO_DEV_SECRET_KEY ?? "";

interface LogoDevDescribeResponse {
  name: string;
  domain: string;
  description?: string;
  logo: string;
  colors?: Array<{ hex: string }>;
}

function logoDevImageUrl(domain: string, size = 256): string {
  return `https://img.logo.dev/${domain}?token=${LOGO_DEV_PUBLISHABLE_KEY}&size=${size}&format=png&theme=light`;
}

function googleFaviconUrl(domain: string): string {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
}

// ─── Strategies ───────────────────────────────────────────────────────────────

async function tryLogoDev(domain: string): Promise<LogoResult | null> {
  // Validate the image URL actually works (small size for fast check)
  const checkUrl = logoDevImageUrl(domain, 64);
  try {
    const checkRes = await fetch(checkUrl, {
      method: "GET",
      signal: AbortSignal.timeout(3000),
    });
    if (!checkRes.ok) {
      console.warn(`[fetch-logo] Logo.dev returned ${checkRes.status} for ${domain}`);
      return null; // Fall through to Google Favicon
    }
  } catch {
    console.warn(`[fetch-logo] Logo.dev unreachable for ${domain}`);
    return null;
  }

  // Image is valid — use full-size URL for display
  const imageUrl = logoDevImageUrl(domain);

  let colors: string[] = [];
  let name: string | undefined;

  if (LOGO_DEV_SECRET_KEY) {
    try {
      const describeRes = await fetch(`https://api.logo.dev/describe/${domain}`, {
        headers: { Authorization: `Bearer ${LOGO_DEV_SECRET_KEY}` },
        signal: AbortSignal.timeout(3000),
      });
      if (describeRes.ok) {
        const data: LogoDevDescribeResponse = await describeRes.json();
        colors = data.colors?.map((c) => c.hex) ?? [];
        name = data.name;
      }
    } catch {
      // Describe API failed — still have the image URL
    }
  }

  return { url: imageUrl, source: "logo.dev", colors, name };
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function fetchLogo(domain: string): Promise<LogoResult> {
  const cleanDomain = domain
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "")
    .trim()
    .toLowerCase();

  if (LOGO_DEV_PUBLISHABLE_KEY) {
    try {
      const result = await tryLogoDev(cleanDomain);
      if (result) return result;
    } catch (err) {
      console.warn(`[fetch-logo] Logo.dev failed for ${cleanDomain}:`, err);
    }
  }

  // Google favicon as hard fallback (small but always works)
  return { url: googleFaviconUrl(cleanDomain), source: "google_favicon", colors: [] };
}

// ─── Monogram helper ──────────────────────────────────────────────────────────

export function getMonogram(company?: string): string {
  if (!company) return "?";
  const words = company.trim().split(/\s+/);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return company[0].toUpperCase();
}

// ─── AgentTool wrapper ────────────────────────────────────────────────────────

export const fetchLogoTool: AgentTool = {
  name: "fetch_logo",
  description:
    "Fetch the official logo for a company by its website domain. " +
    "Uses Logo.dev for high-quality logos with brand colors, falling back to Google Favicon. " +
    "Returns a verified image URL plus optional brand colors. " +
    "Only call this for companies/brands that have a website. " +
    "IMPORTANT: If the returned `colors` array is non-empty, you MUST pass colors[0] as `accent` and colors[1] (or colors[0] if only one) as `accentLight` when calling `set_theme`. These are the brand's official colors.",
  input_schema: {
    type: "object",
    properties: {
      domain: {
        type: "string",
        description: "The company's website domain, e.g. 'spotify.com', 'stripe.com'",
      },
      company: {
        type: "string",
        description: "Optional company name for context, e.g. 'Spotify'",
      },
    },
    required: ["domain"],
  },

  async execute(rawInput: unknown, _signal?: AbortSignal, context?: AgentToolContext): Promise<LogoResult & { skipped?: boolean; reason?: string }> {
    const { domain } = rawInput as FetchLogoInput;

    // Architectural guard: never fetch a logo for the active brand kit's own
    // brand. The kit IS the deck's styling source, not its subject — its
    // identity flows through {{brand.*}} placeholders, not via fetch_logo.
    // Without this, agents repeatedly fetch e.g. mckinsey.com when the user's
    // deck is styled like McKinsey but is actually about Northwind.
    if (context?.activeBrandKit?.blockedDomainStems?.length) {
      const cleaned = domain.toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/^www\./, "");
      const stem = cleaned.split(".")[0];
      if (stem && context.activeBrandKit.blockedDomainStems.includes(stem)) {
        const msg = `Skipping fetch_logo for "${domain}" — this matches the active brand kit "${context.activeBrandKit.brandName}". The kit's identity is already the deck's STYLING SOURCE; do not fetch logos for it. Use fetch_logo only for entities the user named as the deck's TOPIC.`;
        console.log(`[fetch_logo] ${msg}`);
        return {
          url: "",
          source: "skipped" as never,
          colors: [],
          skipped: true,
          reason: msg,
        };
      }
    }

    console.log(`[fetch_logo] Resolving logo for: ${domain}`);
    const result = await fetchLogo(domain);
    console.log(`[fetch_logo] ${result.source}: ${result.url}${result.colors.length ? ` colors: ${result.colors.join(", ")}` : ""}`);
    return result;
  },
};
