// src/agent/tools/tool-registry.ts
// Two registries:
//   1. Core tools (slide tools etc.) — always sent to Claude
//   2. Integration tools (gmail, drive, sheets, github) — lazy-loaded via activate_integration
//
// Integration tools register themselves with a providerTag. They are NOT included
// in the default tool list. Instead, the activate_integration meta-tool loads them
// on demand, saving input tokens on every API call.

import { getAllTools, type AgentTool } from './index';
import { getValidToken } from '@/lib/get-valid-token';

// --- Integration (lazy) registry ---
// Keyed by providerTag → tools for that provider
const g = globalThis as unknown as { __INTEGRATION_TOOLS__?: Map<string, AgentTool[]> };
if (!g.__INTEGRATION_TOOLS__) g.__INTEGRATION_TOOLS__ = new Map();
const integrationRegistry = g.__INTEGRATION_TOOLS__;

// --- Non-provider auth tools (providerTag is null, e.g. export_pdf) ---
const g2 = globalThis as unknown as { __CORE_AUTH_TOOLS__?: AgentTool[] };
if (!g2.__CORE_AUTH_TOOLS__) g2.__CORE_AUTH_TOOLS__ = [];
const coreAuthTools = g2.__CORE_AUTH_TOOLS__;

/**
 * Register an auth tool. Tools with a providerTag go into the lazy integration
 * registry. Tools without (like export_pdf) go into the always-available pool.
 */
export function registerAuthTool(tool: AgentTool): void {
  if (tool.providerTag) {
    // Integration tool — lazy loaded
    const existing = integrationRegistry.get(tool.providerTag) ?? [];
    const idx = existing.findIndex(t => t.name === tool.name);
    if (idx >= 0) {
      existing[idx] = tool;
    } else {
      existing.push(tool);
    }
    integrationRegistry.set(tool.providerTag, existing);
  } else {
    // Core auth tool (no provider) — always available
    const idx = coreAuthTools.findIndex(t => t.name === tool.name);
    if (idx >= 0) {
      coreAuthTools[idx] = tool;
    } else {
      coreAuthTools.push(tool);
    }
  }
}

/** Get tools for a specific provider (called by activate_integration) */
export function getIntegrationTools(provider: string): AgentTool[] {
  return integrationRegistry.get(provider) ?? [];
}

/** List all registered provider names */
export function getAvailableProviders(): string[] {
  return Array.from(integrationRegistry.keys());
}

/**
 * Get core tools only — slide tools + non-provider auth tools (like export_pdf).
 * Integration tools are excluded; they're loaded on demand via activate_integration.
 */
export async function getAllToolsWithAuth(): Promise<AgentTool[]> {
  const slideTools = await getAllTools();
  return [...slideTools, ...coreAuthTools];
}

/**
 * Get ALL tools including integrations — used when checking if a tool exists
 * during execution (a provider may have been activated mid-loop).
 */
export async function getAllToolsIncludingIntegrations(): Promise<AgentTool[]> {
  const core = await getAllToolsWithAuth();
  const allIntegration: AgentTool[] = [];
  for (const tools of integrationRegistry.values()) {
    allIntegration.push(...tools);
  }
  return [...core, ...allIntegration];
}

export interface ResolvedTool {
  tool: AgentTool;
  token: string | null;
}

/**
 * Resolve a tool by name and pre-check its auth requirement.
 * Searches both core and integration tools.
 */
export async function resolveWithAuth(
  toolName: string,
  userId: string
): Promise<ResolvedTool | null> {
  const all = await getAllToolsIncludingIntegrations();
  const tool = all.find((t) => t.name === toolName);
  if (!tool) return null;

  if (!tool.providerTag) {
    return { tool, token: null };
  }

  const token = await getValidToken(userId, tool.providerTag);
  return { tool, token };
}
