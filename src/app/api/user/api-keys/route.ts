import { requireAuth, isResponse } from "@/lib/api-helpers";
import { createApiKey, listApiKeys, revokeApiKey } from "@/lib/api-key";

export async function GET() {
  const authResult = await requireAuth();
  if (isResponse(authResult)) return authResult;
  const user = authResult;

  const keys = await listApiKeys(user.id);
  return Response.json(keys);
}

export async function POST(req: Request) {
  const authResult = await requireAuth();
  if (isResponse(authResult)) return authResult;
  const user = authResult;

  const { name } = await req.json().catch(() => ({ name: "Default" })) as { name?: string };
  const result = await createApiKey(user.id, name ?? "Default");
  return Response.json(result);
}

export async function DELETE(req: Request) {
  const authResult = await requireAuth();
  if (isResponse(authResult)) return authResult;
  const user = authResult;

  const { id } = await req.json() as { id: string };
  if (!id) return Response.json({ error: "Missing key id" }, { status: 400 });

  const deleted = await revokeApiKey(id, user.id);
  if (!deleted) return Response.json({ error: "Key not found" }, { status: 404 });

  return Response.json({ ok: true });
}
