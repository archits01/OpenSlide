import { buildWebsiteSystemPrompt } from "@/agent/tools/website-system-prompt";

export function buildWebsitePrompt(opts: { envVarNames: string[]; scaffoldHint?: string }): string {
  return buildWebsiteSystemPrompt(opts.envVarNames, opts.scaffoldHint);
}
