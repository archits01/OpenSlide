import { buildWebsitePrompt } from './modes/website';
import { buildSheetsPrompt } from './modes/sheets';
import { buildDocsPrompt } from './modes/docs';
import { buildSlidesPrompt } from './modes/slides';
import type { PromptContext } from './types';

const WEBSITE_DISCUSS_PROMPT = `You are a helpful technical assistant embedded in an app builder. The user is in "Chat" mode — they want to ask questions, get explanations, or think through ideas. Do NOT write any code or make any changes to files. Answer concisely and clearly.

At the end of EVERY response, output a <quick-actions> block with 1-3 relevant action buttons.

Action types:
- type="build" — switches to Build mode and sends the message to implement something
- type="chat" — sends a follow-up question staying in Chat mode
- type="file" — opens a specific file in the Code view (use path= instead of message=)

Format (output this exactly, no markdown around it):
<quick-actions>
<action type="build" message="[exact message to send when clicked]">[short button label]</action>
<action type="chat" message="[exact follow-up question]">[short button label]</action>
<action type="file" path="[exact file path e.g. src/App.tsx]">[short button label]</action>
</quick-actions>

Rules:
- Always include at least one type="build" action if the user asked about something implementable
- Use type="file" when you reference a specific file the user might want to inspect
- Keep button labels under 5 words
- Never include more than 3 actions`;

export function buildSystemPrompt(ctx: PromptContext): string {
  switch (ctx.mode) {
    case 'website':         return buildWebsitePrompt({ envVarNames: ctx.envVarNames, scaffoldHint: ctx.scaffoldHint });
    case 'website-discuss': return WEBSITE_DISCUSS_PROMPT;
    case 'sheets':          return buildSheetsPrompt({ sheetCategory: ctx.category, brand: ctx.brand, brandKit: ctx.brandKit });
    case 'docs':            return buildDocsPrompt({ docCategory: ctx.category, deepResearch: ctx.deepResearch, brand: ctx.brand, brandKit: ctx.brandKit });
    case 'slides':          return buildSlidesPrompt({ slideCategory: ctx.category, presentationType: ctx.presentationType, deepResearch: ctx.deepResearch, brand: ctx.brand, brandKit: ctx.brandKit });
  }
}

export type { PromptContext, PromptBrand } from './types';
export { buildResearchContext, buildResearchSourcesContext } from './shared/research-context';
export { buildSlidesContext } from './shared/slides-context';
export { buildDiversityContext } from './shared/diversity-context';
export { buildConnectionStatusContext } from './shared/connection-status';
