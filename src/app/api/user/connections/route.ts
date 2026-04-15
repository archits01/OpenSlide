import { requireAuth, isResponse } from "@/lib/api-helpers";
import { invalidateToken } from "@/lib/token-cache";
import { prisma } from "@/lib/db";

export async function GET() {
  const authResult = await requireAuth();
  if (isResponse(authResult)) return authResult;
  const user = authResult;

  const connections = await prisma.userConnection.findMany({
    where: { userId: user.id },
    select: { provider: true, status: true, scopes: true, metadata: true, createdAt: true },
  });

  return Response.json(connections);
}

export async function DELETE(req: Request) {
  const authResult = await requireAuth();
  if (isResponse(authResult)) return authResult;
  const user = authResult;

  const { provider } = await req.json() as { provider: string };
  if (!provider) return Response.json({ error: "Missing provider" }, { status: 400 });

  // Optionally revoke token at provider
  try {
    if (provider === "gmail") {
      const conn = await prisma.userConnection.findUnique({
        where: { userId_provider: { userId: user.id, provider } },
      });
      if (conn) {
        const { decrypt } = await import("@/lib/crypto");
        await fetch(`https://oauth2.googleapis.com/revoke?token=${decrypt(conn.accessToken)}`, {
          method: "POST",
        });
      }
    }
  } catch {
    // Non-fatal — delete locally regardless
  }

  await prisma.userConnection.delete({
    where: { userId_provider: { userId: user.id, provider } },
  });
  await invalidateToken(user.id, provider);

  return Response.json({ ok: true });
}
