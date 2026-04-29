// Plugin architecture — all tools come from providers
// New capabilities (integrations, memory, etc.) plug in without touching the core loop

export type { AgentTool, ToolProvider, AgentToolContext } from './types';
import type { AgentTool, ToolProvider } from './types';

// Persist registry on globalThis so it survives Next.js HMR module re-evaluation.
// Without this, a re-evaluated module creates a fresh empty array while cached
// modules skip re-registration — resulting in missing or duplicate tools.
const g = globalThis as unknown as { __TOOL_PROVIDERS__?: ToolProvider[] };
if (!g.__TOOL_PROVIDERS__) g.__TOOL_PROVIDERS__ = [];
const providers = g.__TOOL_PROVIDERS__;

export function registerProvider(provider: ToolProvider): void {
  const idx = providers.findIndex(p => p.name === provider.name);
  if (idx >= 0) {
    providers[idx] = provider;
  } else {
    providers.push(provider);
  }
}

export async function getAllTools(): Promise<AgentTool[]> {
  const toolArrays = await Promise.all(providers.map((p) => p.getTools()));
  return toolArrays.flat();
}

async function getToolByName(name: string): Promise<AgentTool | undefined> {
  const all = await getAllTools();
  return all.find((t) => t.name === name);
}

// Convert to Anthropic tool format
export function toAnthropicTools(tools: AgentTool[]) {
  return tools.map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: t.input_schema,
  }));
}
