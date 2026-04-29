import type { AgentTool } from "./types";
import { getSession } from "@/lib/redis";

// Returned shape — the agent loop looks for `__visionBlocks` and assembles a
// structured tool_result content array for the model. A plain JSON result
// would be stringified and the model would never actually see the image.
export interface ReviewOutputResult {
  __visionBlocks: true;
  screenshotUrl: string | null;
  instruction: string;
  notReady?: boolean;
}

export const reviewOutputTool: AgentTool = {
  name: "review_output",
  description:
    "Look at the current rendered preview as an image and critique it against the quality rubric. " +
    "Call this EXACTLY ONCE per build, after you've confirmed `npm run dev` is running and the site is visible. " +
    "Returns the latest preview screenshot for you to visually inspect. Use the inspection to silently fix any " +
    "failures with `update_file` / `patch_file` before sending your 'done' message. " +
    "If the screenshot is not yet available (dev server still starting), this returns a 'not ready' hint — " +
    "call it again after a short pause or skip if the site is still finalising.",
  input_schema: {
    type: "object",
    properties: {
      focus: {
        type: "string",
        description:
          "Optional — narrow the review to specific concerns. e.g. 'mobile responsiveness' or 'color contrast'. Leave empty to review the full rubric.",
      },
    },
    required: [],
  },
  async execute(raw, _signal, context): Promise<ReviewOutputResult> {
    const { focus } = raw as { focus?: string };
    if (!context?.sessionId) {
      // Tool shouldn't run outside a session — but guard anyway.
      return {
        __visionBlocks: true,
        screenshotUrl: null,
        instruction: "No session context available. Skip review and send 'done'.",
        notReady: true,
      };
    }
    const session = await getSession(context.sessionId);
    const screenshotUrl = session?.previewScreenshotUrl ?? null;
    if (!screenshotUrl) {
      return {
        __visionBlocks: true,
        screenshotUrl: null,
        instruction:
          "Preview screenshot not captured yet — the dev server may still be starting or the iframe hasn't rendered. " +
          "Do NOT call `review_output` again this turn. Proceed with your 'done' message; the user can ask for a review later.",
        notReady: true,
      };
    }
    const focusClause = focus
      ? `\n\nFocus area for this review: ${focus}.`
      : "";
    return {
      __visionBlocks: true,
      screenshotUrl,
      instruction:
        "Here is the rendered preview of the site you just built. Visually inspect it against the 12-item Quality Bar from the system prompt. " +
        "Walk each item silently in `<thinking>`, note any that visibly fail (overlapping elements, misaligned sections, bad contrast, cramped spacing, broken mobile layout, missing OG image, etc.), " +
        "then fix them using `update_file` or `patch_file`. Do NOT narrate the review in chat — just fix and ship." +
        focusClause,
    };
  },
};
