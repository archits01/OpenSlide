// MCP (Model Context Protocol) client stub
// Real implementation — just needs MCP_SERVER_URL env var to activate
// Implements the MCP HTTP transport specification

import type { AgentTool } from "@/agent/tools/types";

interface MCPToolDefinition {
  name: string;
  description?: string;
  inputSchema?: {
    type: string;
    properties?: Record<string, unknown>;
    required?: string[];
  };
}

interface MCPToolsListResponse {
  tools: MCPToolDefinition[];
}

interface MCPCallToolResponse {
  content: Array<{
    type: "text" | "image" | "resource";
    text?: string;
    data?: string;
    mimeType?: string;
  }>;
  isError?: boolean;
}

export class MCPClient {
  private serverUrl: string;

  constructor(serverUrl: string) {
    // Normalize trailing slash
    this.serverUrl = serverUrl.replace(/\/$/, "");
  }

  async listTools(): Promise<AgentTool[]> {
    const res = await fetch(`${this.serverUrl}/tools/list`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    if (!res.ok) {
      throw new Error(`MCPClient.listTools failed: ${res.status} ${res.statusText}`);
    }

    const data: MCPToolsListResponse = await res.json();
    return data.tools.map((t) => this.toAgentTool(t));
  }

  async callTool(
    name: string,
    input: unknown,
    options?: { headers?: Record<string, string>; signal?: AbortSignal }
  ): Promise<unknown> {
    const res = await fetch(`${this.serverUrl}/tools/call`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(options?.headers ?? {}),
      },
      body: JSON.stringify({ name, arguments: input }),
      signal: options?.signal,
    });

    if (!res.ok) {
      throw new Error(`MCPClient.callTool(${name}) failed: ${res.status} ${res.statusText}`);
    }

    const data: MCPCallToolResponse = await res.json();

    if (data.isError) {
      const errorText = data.content.find((c) => c.type === "text")?.text ?? "Unknown MCP error";
      throw new Error(`MCP tool ${name} returned error: ${errorText}`);
    }

    // Return text content joined, or full content array for structured results
    const textParts = data.content.filter((c) => c.type === "text").map((c) => c.text);
    if (textParts.length === 1) return textParts[0];
    if (textParts.length > 1) return textParts.join("\n");
    return data.content;
  }

  private toAgentTool(def: MCPToolDefinition): AgentTool {
    return {
      name: def.name,
      description: def.description ?? `MCP tool: ${def.name}`,
      input_schema: {
        type: "object",
        properties: def.inputSchema?.properties ?? {},
        required: def.inputSchema?.required,
      },
      execute: (input: unknown, signal?: AbortSignal): Promise<unknown> => {
        return this.callTool(def.name, input, { signal });
      },
    };
  }
}

/** Registry of named MCP server clients. One entry per provider. */
export class MCPClientRegistry {
  private clients = new Map<string, MCPClient>();

  register(providerTag: string, serverUrl: string): void {
    this.clients.set(providerTag, new MCPClient(serverUrl));
  }

  getClient(providerTag: string): MCPClient | null {
    return this.clients.get(providerTag) ?? null;
  }

  /** Get all tools from all registered servers, tagging each with providerTag */
  async getAllTools(): Promise<AgentTool[]> {
    const results: AgentTool[] = [];
    for (const [providerTag, client] of this.clients) {
      try {
        const tools = await client.listTools();
        for (const tool of tools) {
          results.push({ ...tool, providerTag });
        }
      } catch (err) {
        console.warn(`[MCPRegistry] Failed to list tools for ${providerTag}:`, err);
      }
    }
    return results;
  }
}

export const mcpRegistry = new MCPClientRegistry();
