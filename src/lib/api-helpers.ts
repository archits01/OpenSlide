// Shared helpers for API routes — auth checks, ownership, error responses.
// Eliminates duplicated patterns across 17+ route files.

import { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

// ─── Auth ────────────────────────────────────────────────────────────────────

/** Authenticate the current request via Supabase. Returns the user or a 401 Response. */
export async function requireAuth(): Promise<User | Response> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return user;
}

/** Returns true if the result is a Response (i.e. auth failed). */
export function isResponse(result: unknown): result is Response {
  return result instanceof Response;
}

// ─── Ownership ───────────────────────────────────────────────────────────────

/** Check resource ownership. Returns a 403 Response if mismatch, null if OK. */
export function requireOwnership(
  resource: { userId?: string | null } | null,
  userId: string,
): Response | null {
  if (!resource) return Response.json({ error: "Not found" }, { status: 404 });
  if (resource.userId && resource.userId !== userId) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

// ─── Developer API Key Auth ──────────────────────────────────────────────────

/** Authenticate via Bearer API key (for developer tool routes). Returns userId or null. */
export async function authenticateApiKey(req: Request): Promise<string | null> {
  const { validateApiKey } = await import("@/lib/api-key");
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  return validateApiKey(auth.slice(7));
}
