export const runtime = "nodejs";

import { NextRequest } from "next/server";
import { getSession } from "@/lib/redis";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  const session = await getSession(sessionId);

  if (!session || !session.isPublic) {
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404, headers: { "Content-Type": "application/json" },
    });
  }

  // Strip userId before sending to public consumers
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { userId: _userId, ...publicSession } = session;

  return new Response(JSON.stringify(publicSession), {
    status: 200, headers: { "Content-Type": "application/json" },
  });
}
