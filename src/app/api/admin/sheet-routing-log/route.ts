import { getSheetRoutingLog } from "@/skills/SheetSkills/sheet-routing-log";
import { requireAuth, isResponse } from "@/lib/api-helpers";

export const runtime = "nodejs";

// Mirror the allowlist check from /api/admin/classification-stats.
// Without this, any authenticated user can read the last 100 sheet-mode prompts
// (which contain PII, financial figures, HR data, etc.) from every other user.
const ADMIN_USER_IDS = (process.env.ADMIN_USER_IDS ?? "").split(",").filter(Boolean);

export async function GET() {
  const authResult = await requireAuth();
  if (isResponse(authResult)) return authResult;
  const user = authResult;

  if (!ADMIN_USER_IDS.includes(user.id)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const log = getSheetRoutingLog();
  return Response.json({ entries: log, count: log.length });
}
