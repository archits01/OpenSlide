// src/agent/tools/types.ts

export interface AgentToolContext {
  userId: string;
  sessionId?: string;
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
