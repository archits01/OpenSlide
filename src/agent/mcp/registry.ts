// MCP server registry — registers MCP tool providers from env config
// Set MCP_SERVER_URL to activate

import { MCPClient } from "./client";
import { type ToolProvider, type AgentTool, registerProvider } from "@/agent/tools/index";

class MCPToolProvider implements ToolProvider {
  name = "mcp";
  private client: MCPClient;
  private _tools: AgentTool[] | null = null;

  constructor(serverUrl: string) {
    this.client = new MCPClient(serverUrl);
  }

  async getTools(): Promise<AgentTool[]> {
    if (!this._tools) {
      try {
        this._tools = await this.client.listTools();
        console.log(`[MCP] Loaded ${this._tools.length} tools from MCP server`);
      } catch (err) {
        console.warn("[MCP] Failed to list tools, MCP unavailable:", err);
        this._tools = [];
      }
    }
    return this._tools;
  }
}

let _registered = false;

export function registerMCPProviders(): void {
  if (_registered) return;
  _registered = true;

  const serverUrl = process.env.MCP_SERVER_URL;
  if (!serverUrl) {
    // MCP not configured — skip silently
    return;
  }

  console.log(`[MCP] Registering MCP provider at ${serverUrl}`);
  registerProvider(new MCPToolProvider(serverUrl));
}
