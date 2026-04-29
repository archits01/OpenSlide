/**
 * update_brand_skill — agent tool for chat-driven brand kit edits.
 *
 * Lets the user iterate on their brand kit by talking to the assistant:
 *   "Make headlines smaller"
 *   "Add a quote-pattern layout"
 *   "The accent should be more muted"
 *
 * Tool flow:
 *   1. Reads the current target file (skill / design-system / layout-library)
 *      from the user's default brand kit (or a specific kit by id).
 *   2. Sends the file + the user's instruction to Claude with a strict
 *      "produce the modified file in full" prompt.
 *   3. Validates the output (no unknown placeholders, no emojis, etc.).
 *   4. Persists to the BrandKit row and marks the file as user-edited.
 *
 * The tool is gated on context.userId — it cannot edit other users' kits.
 */

import type { AgentTool } from "./index";
import { prisma } from "@/lib/db";
import { callRouterNonStreaming } from "@/agent/stream";
import { validateBrandSkillMarkdown } from "@/lib/brand/writer/validate";
import { DEFAULT_BRAND_VARS, type BrandVars } from "@/lib/brand/types";

interface Input {
  /** Which file to edit. */
  file: "skill" | "design-system" | "layout-library";
  /** Natural-language instruction describing what to change. */
  instruction: string;
  /** Optional: target a specific kit by id. Defaults to user's default kit. */
  brandKitId?: string;
  /**
   * When true, generate the modified file but do NOT persist. The tool returns
   * the proposed content + a diff summary so the agent can confirm with the user
   * before committing. Default false (persist immediately) for backward compat.
   */
  dryRun?: boolean;
}

const FIELD_BY_FILE: Record<Input["file"], "skillMd" | "designSystemMd" | "layoutLibraryMd"> = {
  skill: "skillMd",
  "design-system": "designSystemMd",
  "layout-library": "layoutLibraryMd",
};

const SYSTEM = `You edit brand-kit markdown files for an AI workspace that generates slides, documents, spreadsheets, and websites.
Output the COMPLETE updated file in full — no diffs, no commentary, no markdown
fences around the entire output. Preserve the file's existing structure
(headings, sections, table format). Make only the changes described in the
instruction.

Brand variable placeholders use {{brand.path.to.var}} syntax (e.g.
{{brand.colors.accent}}, {{brand.fonts.headingFamily}}). Continue to use them
for all colors and fonts — never substitute literal hex codes or font names.

Do NOT use emojis. Do NOT use Tailwind classes. Use inline CSS only.`;

function buildPrompt(currentContent: string, instruction: string): string {
  return `Current file content:

\`\`\`markdown
${currentContent}
\`\`\`

User instruction:
${instruction}

Return the complete updated file. Begin output with the file's first heading
(e.g. "# Design System Reference") — no preamble, no fences, no trailing prose.`;
}

export const updateBrandSkillTool: AgentTool = {
  name: "update_brand_skill",
  description:
    "Edit one of the user's active brand-kit files (skill, design-system, or layout-library) according to a natural-language instruction. Used when the user wants to iterate on their brand kit. Returns the new file size and whether validation passed.",
  input_schema: {
    type: "object",
    properties: {
      file: {
        type: "string",
        enum: ["skill", "design-system", "layout-library"],
        description: "Which brand-kit file to edit.",
      },
      instruction: {
        type: "string",
        description:
          "Natural-language description of the change. Be specific: 'reduce body font size to 13px', 'add a Pull Quote pattern with a left-side serif glyph', etc.",
      },
      brandKitId: {
        type: "string",
        description:
          "Optional: target a specific kit by id. Defaults to the user's current default kit.",
      },
      dryRun: {
        type: "boolean",
        description:
          "If true, generate the modification without persisting. Returns proposed content + line-count diff so you can show the user before committing. Use this on the first edit attempt; call again with dryRun:false to persist after the user confirms.",
      },
    },
    required: ["file", "instruction"],
  },
  async execute(rawInput, _signal, context) {
    const input = rawInput as Input;
    if (!context?.userId) throw new Error("update_brand_skill requires userId");
    if (!input.file || !input.instruction) {
      throw new Error("file and instruction are required");
    }

    const kit = input.brandKitId
      ? await prisma.brandKit.findUnique({ where: { id: input.brandKitId } })
      : await prisma.brandKit.findFirst({
          where: { userId: context.userId, isDefault: true },
        });

    if (!kit) throw new Error("No brand kit found");
    if (kit.userId !== context.userId) throw new Error("Forbidden");

    const field = FIELD_BY_FILE[input.file];
    const currentContent = (kit as Record<string, unknown>)[field] as string | null;
    if (!currentContent) {
      throw new Error(`Brand kit has no ${input.file} content yet — extract one first`);
    }

    // Single LLM call to produce the modified file.
    const newContent = await callRouterNonStreaming({
      model: "claude-sonnet-4-6",
      max_tokens: 16000,
      system: SYSTEM,
      messages: [
        { role: "user", content: buildPrompt(currentContent, input.instruction) },
      ],
    });

    // Strip a leading "```" code fence if the model wrapped output despite instructions.
    let cleaned = newContent.trim();
    cleaned = cleaned.replace(/^```(?:markdown)?\s*\n/, "").replace(/\n```\s*$/, "").trim();

    // Validate.
    const vars = ((kit.brandVars as Partial<BrandVars> | null) ?? {}) as BrandVars;
    const merged: BrandVars = {
      ...DEFAULT_BRAND_VARS,
      ...vars,
      colors: { ...DEFAULT_BRAND_VARS.colors, ...vars.colors },
      fonts: { ...DEFAULT_BRAND_VARS.fonts, ...vars.fonts },
      logo: { ...DEFAULT_BRAND_VARS.logo, ...vars.logo },
    };
    const issues = validateBrandSkillMarkdown(cleaned, merged);
    const errors = issues.filter((i) => i.severity === "error");

    if (errors.length > 0) {
      return {
        ok: false,
        kitId: kit.id,
        file: input.file,
        errors: errors.map((e) => ({ rule: e.rule, message: e.message })),
        bytes: cleaned.length,
      };
    }

    // Compute a quick diff summary so the agent can describe the change.
    const prevLines = currentContent.split("\n").length;
    const newLines = cleaned.split("\n").length;

    // Dry-run: don't persist. Return the proposal + diff. The agent confirms
    // with the user, then calls again with dryRun:false to commit.
    if (input.dryRun) {
      return {
        ok: true,
        dryRun: true,
        kitId: kit.id,
        file: input.file,
        proposedBytes: cleaned.length,
        previousBytes: currentContent.length,
        proposedLines: newLines,
        previousLines: prevLines,
        // Truncated preview so the result stays compact in tool history.
        proposedPreview: cleaned.slice(0, 600) + (cleaned.length > 600 ? "\n…" : ""),
        warnings: issues.filter((i) => i.severity === "warning").map((w) => w.message),
      };
    }

    // Persist.
    const userEdited = new Set(kit.userEditedFiles);
    userEdited.add(field);
    await prisma.brandKit.update({
      where: { id: kit.id },
      data: {
        [field]: cleaned,
        userEditedFiles: Array.from(userEdited),
        version: { increment: 1 },
      },
    });

    return {
      ok: true,
      kitId: kit.id,
      file: input.file,
      bytes: cleaned.length,
      previousBytes: currentContent.length,
      lines: newLines,
      previousLines: prevLines,
      warnings: issues.filter((i) => i.severity === "warning").map((w) => w.message),
      version: kit.version + 1,
    };
  },
};
