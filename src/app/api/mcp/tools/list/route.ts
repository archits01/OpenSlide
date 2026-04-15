// src/app/api/mcp/tools/list/route.ts
import { authenticateApiKey } from "@/lib/api-helpers";
import { getAllToolsWithAuth } from "@/agent/tools/tool-registry";
import { toAnthropicTools } from "@/agent/tools/index";

const EXPOSED_TOOL_NAMES = new Set([
  "create_outline", "create_slide", "update_slide", "delete_slide",
  "reorder_slides", "set_theme", "fetch_logo", "export_pdf",
]);

export async function POST(req: Request) {
  const userId = await authenticateApiKey(req);
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const tools = await getAllToolsWithAuth();
  const exposed = tools.filter((t) => EXPOSED_TOOL_NAMES.has(t.name));

  return Response.json({ tools: toAnthropicTools(exposed) });
}
