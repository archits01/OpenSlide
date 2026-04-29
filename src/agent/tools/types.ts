// src/agent/tools/types.ts

export interface AgentToolContext {
  userId: string;
  sessionId?: string;
  /** Current slides array — needed by update_sheet to find target slide data. */
  slides?: unknown[];
  /** Current website files — read by list_files / read_file / update_file validators. */
  websiteFiles?: Record<string, string>;
  /** Current spawn depth — 0 for the top-level agent, increments for each subagent layer. */
  spawnDepth?: number;
  /**
   * Active brand kit's identity, if any. Used by tools (e.g. fetch_logo) to
   * tell apart the deck's STYLING SOURCE from its TOPIC subject and avoid
   * fetching logos for the kit's own brand.
   */
  activeBrandKit?: {
    id: string;
    brandName: string;
    /** Lowercased domain stems associated with this brand (e.g. ["mckinsey"]). */
    blockedDomainStems: string[];
  };
}

export interface AgentTool {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
  /** undefined or null = no auth required */
  providerTag?: string | null;
  execute(
    input: unknown,
    signal?: AbortSignal,
    context?: AgentToolContext
  ): Promise<unknown>;
}

export interface ToolProvider {
  name: string;
  getTools(): Promise<AgentTool[]>;
}
