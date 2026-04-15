// Profile API — single source of truth for reading/writing profile data.
// Reads/writes public.users via Prisma (superuser, bypasses RLS).
// Clients should never touch auth.users.raw_user_meta_data for profile fields.

export const runtime = "nodejs";

import { NextRequest } from "next/server";
import { requireAuth, isResponse } from "@/lib/api-helpers";
import { prisma } from "@/lib/db";

type ProfileResponse = {
  id: string;
  email: string | null;
  fullName: string | null;
  avatarUrl: string | null;
};

function toProfileResponse(row: {
  id: string;
  email: string | null;
  fullName: string | null;
  avatarUrl: string | null;
}): ProfileResponse {
  return {
    id: row.id,
    email: row.email,
    fullName: row.fullName,
    avatarUrl: row.avatarUrl,
  };
}

// ─── GET /api/profile — current user's profile row ───────────────────────────

export async function GET() {
  const authResult = await requireAuth();
  if (isResponse(authResult)) return authResult;
  const user = authResult;

  // Prisma bypasses RLS; we do ownership via auth.getUser() above.
  let row = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, email: true, fullName: true, avatarUrl: true },
  });

  // Self-heal: if a session exists but no public.users row (e.g. signup trigger
  // didn't fire, or this is an older account), create one on first read.
  if (!row) {
    row = await prisma.user.create({
      data: {
        id: user.id,
        email: user.email ?? null,
        fullName: (user.user_metadata?.full_name as string | undefined) ?? null,
        avatarUrl: (user.user_metadata?.avatar_url as string | undefined) ?? null,
      },
      select: { id: true, email: true, fullName: true, avatarUrl: true },
    });
  }

  return Response.json({ profile: toProfileResponse(row) });
}

// ─── POST /api/profile — update full_name and/or avatar ──────────────────────
//
// Body shape:
//   { fullName?: string }
//   { avatarPath: string, avatarUrl: string }   // after a direct-to-storage upload
//   { clearAvatar: true }                        // remove current avatar
//
// The avatar flow is:
//   1. Client compresses + uploads blob to avatars/{userId}/{uuid}.jpg directly
//      via supabase-js (bucket RLS allows this because the path matches auth.uid).
//   2. Client calls POST /api/profile with the new path + public URL.
//   3. Server reads the old avatar_path from public.users, updates the row,
//      then deletes the old blob from storage.

export async function POST(req: NextRequest) {
  const authResult = await requireAuth();
  if (isResponse(authResult)) return authResult;
  const user = authResult;

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }

  const { fullName, avatarPath, avatarUrl, clearAvatar } = body as {
    fullName?: unknown;
    avatarPath?: unknown;
    avatarUrl?: unknown;
    clearAvatar?: unknown;
  };

  const updates: {
    fullName?: string | null;
    avatarUrl?: string | null;
    avatarPath?: string | null;
  } = {};

  // Full name
  if (fullName !== undefined) {
    if (typeof fullName !== "string") {
      return Response.json({ error: "fullName must be a string" }, { status: 400 });
    }
    const trimmed = fullName.trim();
    if (trimmed.length === 0) return Response.json({ error: "fullName cannot be empty" }, { status: 400 });
    if (trimmed.length > 80) return Response.json({ error: "fullName too long" }, { status: 400 });
    updates.fullName = trimmed;
  }

  // Avatar clear
  if (clearAvatar === true) {
    updates.avatarUrl = null;
    updates.avatarPath = null;
  }

  // Avatar set
  if (avatarPath !== undefined || avatarUrl !== undefined) {
    if (typeof avatarPath !== "string" || typeof avatarUrl !== "string") {
      return Response.json({ error: "avatarPath and avatarUrl must both be strings" }, { status: 400 });
    }
    // Validate that the path lives under the user's own folder.
    const prefix = `${user.id}/`;
    if (!avatarPath.startsWith(prefix)) {
      return Response.json({ error: "avatarPath must be under your own folder" }, { status: 400 });
    }
    updates.avatarPath = avatarPath;
    updates.avatarUrl = avatarUrl;
  }

  if (Object.keys(updates).length === 0) {
    return Response.json({ error: "No fields to update" }, { status: 400 });
  }

  // Read the current row so we know which blob (if any) to clean up.
  const existing = await prisma.user.findUnique({
    where: { id: user.id },
    select: { avatarPath: true },
  });

  // Update the row. If the user row doesn't exist yet, create it first.
  let updated;
  if (!existing) {
    updated = await prisma.user.create({
      data: {
        id: user.id,
        email: user.email ?? null,
        ...updates,
      },
      select: { id: true, email: true, fullName: true, avatarUrl: true },
    });
  } else {
    updated = await prisma.user.update({
      where: { id: user.id },
      data: updates,
      select: { id: true, email: true, fullName: true, avatarUrl: true },
    });
  }

  // Best-effort cleanup of the old avatar blob.
  // Runs after the DB write so a storage failure never leaves the row inconsistent.
  const oldPath = existing?.avatarPath;
  const newPath = updates.avatarPath ?? null;
  if (oldPath && oldPath !== newPath) {
    try {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();
      await supabase.storage.from("avatars").remove([oldPath]);
    } catch (err) {
      console.warn("[profile] Failed to delete old avatar blob:", oldPath, err);
    }
  }

  return Response.json({ profile: toProfileResponse(updated) });
}
