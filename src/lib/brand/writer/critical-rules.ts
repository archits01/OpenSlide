/**
 * Generate the "Critical Rules" section of design-system.md from rasterized
 * brand slides via a Claude vision call.
 *
 * Output: a numbered markdown list (10–15 rules) that captures the brand's
 * signature visual moves. Rules MUST reference {{brand.colors.*}} and
 * {{brand.fonts.*}} placeholders, not raw hex/font names — the same templating
 * mechanism the rest of the kit uses.
 */

import { callVision } from "./vision";
import type { BrandVars } from "../types";

export interface CriticalRulesInput {
  brandVars: BrandVars;
  /** Sampled slide image paths (≤8 keeps cost bounded). */
  slideImages: string[];
}

const SYSTEM = `You are a senior brand-design auditor. You analyze presentation
templates and produce concise, authoritative rules that capture the template's
visual signature. Your output is consumed by an LLM that builds slides — so
every rule must be specific, actionable, and reference brand variables (not
raw hex or font names).`;

const PROMPT_TEMPLATE = (vars: BrandVars) => `
You are writing the **"Critical Rules (Read First)"** section of a brand-specific
design system, modeled after this generic example:

<reference-rules>
1. **Dark panels ALWAYS have a 3px green top bar** — not optional.
2. **The 6px left accent stripe is on EVERY content slide** — it's the visual signature.
3. **Horizontal padding is 56px on both sides** — creates the spacious, premium feel.
4. **Slide title is 28px with border-left:6px** — gives the title authority.
5. **Every white card gets a 3px green top accent bar.**
... (10-13 rules total)
</reference-rules>

Your task: produce **10–15 numbered rules** that capture the visual identity of
**${vars.brandName}** as seen in the attached slides.

Brand variables available (use these in rules instead of literal values):
- Colors: {{brand.colors.bg}}, {{brand.colors.surface}}, {{brand.colors.text}},
  {{brand.colors.textSecondary}}, {{brand.colors.textMuted}},
  {{brand.colors.border}}, {{brand.colors.borderSubtle}},
  {{brand.colors.accent}}, {{brand.colors.accentLight}},
  {{brand.colors.dark}}, {{brand.colors.darkInner}}
- Fonts: {{brand.fonts.headingFamily}}, {{brand.fonts.bodyFamily}}
- Logo URL: {{brand.logo.url}}
- Header text: {{brand.headerLeft}}, {{brand.headerRight}}

Rules MUST be:
- **Concrete** — pixel values, weights, exact placements ("32px from top-left",
  not "comfortable spacing").
- **Brand-specific** — identify what makes THIS brand distinct (signature
  shapes, recurring stripes, header/footer treatments, typography contrasts,
  whitespace rhythm). Don't repeat generic taste advice that applies to any deck.
- **Authoritative** — use "MUST", "ALWAYS", "NEVER".
- **Reference brand variables** — never put a literal hex like "#1E2860" in a
  rule. Use "{{brand.colors.dark}}" instead.

Look for these signature moves in the images:
- Recurring rectangular blocks, stripes, dividers, frames
- Logo / wordmark placement and sizing
- Header structure (what's top-left? top-right? on every slide?)
- Footer / page-number / date strip
- Title typography (font, weight, size hierarchy, underline?)
- Body text density (lots of whitespace? dense? card-based?)
- Color usage rules (where is the dark panel used? when is the accent used?)
- Section markers / chapter divider treatments

Return ONLY the markdown numbered list, starting with "1." — no preamble, no
heading, no "Here are the rules", no closing prose.
`;

export async function generateCriticalRules(
  input: CriticalRulesInput,
): Promise<string> {
  const out = await callVision({
    system: SYSTEM,
    images: input.slideImages,
    prompt: PROMPT_TEMPLATE(input.brandVars),
    maxTokens: 2500,
  });

  // Trim leading/trailing whitespace and any "Here are..." preambles.
  return out.trim().replace(/^[^\d]*?(?=^\d+\.)/m, "").trim();
}
