// src/app/api/mcp/tools/call/route.ts
import { authenticateApiKey } from "@/lib/api-helpers";
import { getAllToolsWithAuth } from "@/agent/tools/tool-registry";

const BLOCKED_TOOLS = new Set(["gmail_send"]);

export async function POST(req: Request) {
  const userId = await authenticateApiKey(req);
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as { name: string; arguments?: unknown };
  const { name, arguments: args } = body;

  if (!name) {
    return Response.json(
      { content: [{ type: "text", text: "Missing tool name" }], isError: true },
      { status: 400 }
    );
  }

  if (BLOCKED_TOOLS.has(name)) {
    return Response.json(
      { content: [{ type: "text", text: `${name} is not available via the API. Use the editor UI.` }], isError: true },
      { status: 403 }
    );
  }

  const allTools = await getAllToolsWithAuth();
  const tool = allTools.find((t) => t.name === name);

  if (!tool) {
    return Response.json(
      { content: [{ type: "text", text: `Tool "${name}" not found` }], isError: true },
      { status: 404 }
    );
  }

  try {
    const result = await tool.execute(args ?? {}, undefined, { userId });
    const text = typeof result === "string" ? result : JSON.stringify(result);
    return Response.json({ content: [{ type: "text", text }], isError: false });
  } catch (err) {
    return Response.json(
      { content: [{ type: "text", text: `Tool execution failed: ${String(err)}` }], isError: true }
    );
  }
}
