/**
 * read_brand_kit — let the model fetch specific brand-kit content mid-turn.
 *
 * Why: the kit's design-system + layout-library are injected into the system
 * prompt at turn start, but compaction or long sessions can drop them from
 * active context. This tool gives the agent a server-side escape hatch to
 * pull a specific section back when needed.
 *
 * Modes:
 *   - section: "vars"            → returns the kit's structured BrandVars
 *   - section: "design-system"   → returns the design-system.md (or a slice)
 *   - section: "layout-library"  → returns the full library OR a single pattern
 *   - section: "patterns-index"  → returns just the list of pattern headings
 */

import type { AgentTool, AgentToolContext } from "./index";
import { DEFAULT_BRAND_VARS, type BrandVars } from "@/lib/brand/types";

interface Input {
  section: "vars" | "design-system" | "layout-library" | "patterns-index";
  /** Optional: when section="layout-library", return only Pattern N (1-based). */
  patternIndex?: number;
}

export const readBrandKitTool: AgentTool = {
  name: "read_brand_kit",
  description:
    "Fetch a section of the active brand kit's content. Use this when you need to reference a specific layout pattern's HTML, the design system rules, or brand variables — especially in long sessions where compaction may have dropped kit content from your active context.",
  input_schema: {
    type: "object",
    properties: {
      section: {
        type: "string",
        enum: ["vars", "design-system", "layout-library", "patterns-index"],
        description:
          "Which section to fetch. 'vars' = structured BrandVars; 'design-system' = the design-system.md prose; 'layout-library' = the layout patterns (use patternIndex to scope to one); 'patterns-index' = just the list of pattern names.",
      },
      patternIndex: {
        type: "number",
        description:
          "When section='layout-library', return only the Nth pattern (1-based). Omit to return all patterns.",
      },
    },
    required: ["section"],
  },
  async execute(rawInput, _signal, context): Promise<unknown> {
    const input = rawInput as Input;
    if (!context?.activeBrandKit?.id) {
      throw new Error("read_brand_kit called but no brand kit is active for this session.");
    }
    const { prisma } = await import("@/lib/db");
    const kit = await prisma.brandKit.findUnique({
      where: { id: context.activeBrandKit.id },
      select: {
        name: true,
        brandVars: true,
        designSystemMd: true,
        layoutLibraryMd: true,
        version: true,
      },
    });
    if (!kit) throw new Error(`Brand kit ${context.activeBrandKit.id} not found`);

    if (input.section === "vars") {
      const raw = (kit.brandVars as Partial<BrandVars> | null) ?? {};
      const merged: BrandVars = {
        ...DEFAULT_BRAND_VARS,
        ...raw,
        colors: { ...DEFAULT_BRAND_VARS.colors, ...raw.colors },
        fonts: { ...DEFAULT_BRAND_VARS.fonts, ...raw.fonts },
        logo: { ...DEFAULT_BRAND_VARS.logo, ...raw.logo },
      };
      return { kit: kit.name, version: kit.version, brandVars: merged };
    }

    if (input.section === "design-system") {
      return { kit: kit.name, version: kit.version, content: kit.designSystemMd ?? "" };
    }

    if (input.section === "patterns-index") {
      const md = kit.layoutLibraryMd ?? "";
      const headers = Array.from(md.matchAll(/## Pattern (\d+): ([^\n]+)/g)).map((m) => ({
        index: Number(m[1]),
        name: m[2].trim(),
      }));
      return { kit: kit.name, version: kit.version, patterns: headers };
    }

    if (input.section === "layout-library") {
      const md = kit.layoutLibraryMd ?? "";
      if (typeof input.patternIndex === "number") {
        // Find the Nth `## Pattern N:` block, slice up to the next `## Pattern` or EOF.
        const re = new RegExp(`## Pattern ${input.patternIndex}:[\\s\\S]+?(?=## Pattern \\d+:|$)`, "");
        const m = md.match(re);
        return {
          kit: kit.name,
          version: kit.version,
          patternIndex: input.patternIndex,
          content: m ? m[0].trim() : null,
        };
      }
      return { kit: kit.name, version: kit.version, content: md };
    }

    throw new Error(`Unknown section: ${input.section}`);
  },
};
