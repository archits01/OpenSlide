// POST /api/upload — receives a file as multipart/form-data, extracts content
// server-side, stores raw bytes or extracted text in Supabase Storage, and
// returns a SessionAttachment metadata record (no content in the response).
// DELETE /api/upload — removes a previously uploaded file from Supabase Storage.

export const runtime = "nodejs";

import { NextRequest } from "next/server";
import { requireAuth, isResponse } from "@/lib/api-helpers";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/redis";
import { randomUUID } from "crypto";
import type { SessionAttachment } from "@/lib/types";

const MAX_FILE_BYTES   =  4 * 1024 * 1024; //  4 MB per file  — raw multipart fits Vercel's 4.5 MB body limit
const MAX_SESSION_BYTES =  5 * 1024 * 1024; //  5 MB per session — token budget + Storage egress control

// ─── Extraction helpers ───────────────────────────────────────────────────────

async function extractDocx(buffer: Buffer): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mammoth = require("mammoth");
  const result = await mammoth.extractRawText({ buffer });
  return result.value ?? "";
}

function extractXlsx(buffer: Buffer): string {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const XLSX = require("xlsx");
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const parts: string[] = [];
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const csv: string = XLSX.utils.sheet_to_csv(sheet, { blankrows: false });
    if (csv.trim()) parts.push(`## Sheet: ${sheetName}\n${csv}`);
  }
  return parts.join("\n\n");
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const authResult = await requireAuth();
  if (isResponse(authResult)) return authResult;
  const user = authResult;

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return Response.json({ error: "Invalid multipart request" }, { status: 400 });
  }

  const file = formData.get("file");
  const sessionId = formData.get("sessionId");

  if (!(file instanceof File)) {
    return Response.json({ error: "Missing file" }, { status: 400 });
  }
  if (typeof sessionId !== "string" || !sessionId) {
    return Response.json({ error: "Missing sessionId" }, { status: 400 });
  }
  if (file.size > MAX_FILE_BYTES) {
    return Response.json({ error: `File too large (max ${MAX_FILE_BYTES / (1024 * 1024)} MB per file)` }, { status: 413 });
  }

  // Check total attachment size for this session
  const session = await getSession(sessionId);
  const existingBytes = (session?.attachments ?? []).reduce((sum, a) => sum + a.sizeBytes, 0);
  if (existingBytes + file.size > MAX_SESSION_BYTES) {
    const remainingMB = ((MAX_SESSION_BYTES - existingBytes) / (1024 * 1024)).toFixed(1);
    return Response.json(
      { error: `Session attachment limit reached (5 MB total). ${remainingMB} MB remaining.` },
      { status: 413 }
    );
  }

  const mimeType = file.type || "application/octet-stream";
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Determine what to store and how
  const isDocx =
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    /\.docx$/i.test(file.name);
  const isXlsx =
    mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    mimeType === "application/vnd.ms-excel" ||
    /\.(xlsx|xls)$/i.test(file.name);
  const isText =
    mimeType.startsWith("text/") ||
    ["application/json"].includes(mimeType) ||
    /\.(txt|csv|json|md)$/i.test(file.name);
  const isRaw = mimeType === "application/pdf" || mimeType.startsWith("image/");

  let contentToStore: Buffer | string;
  let contentType: SessionAttachment["contentType"];
  let storageContentType: string;

  try {
    if (isDocx) {
      const text = await extractDocx(buffer);
      if (!text.trim()) return Response.json({ error: "No text found in document" }, { status: 422 });
      contentToStore = text;
      contentType = "text";
      storageContentType = "text/plain";
    } else if (isXlsx) {
      const text = extractXlsx(buffer);
      if (!text.trim()) return Response.json({ error: "No data found in spreadsheet" }, { status: 422 });
      contentToStore = text;
      contentType = "text";
      storageContentType = "text/plain";
    } else if (isText) {
      contentToStore = buffer.toString("utf-8");
      contentType = "text";
      storageContentType = "text/plain";
    } else if (isRaw) {
      contentToStore = buffer;
      contentType = "raw";
      storageContentType = mimeType;
    } else {
      return Response.json({ error: "Unsupported file format" }, { status: 415 });
    }
  } catch {
    return Response.json({ error: "Failed to parse file" }, { status: 422 });
  }

  // Upload to Supabase Storage at {userId}/{sessionId}/{attachmentId}
  const attachmentId = randomUUID();
  const ext = contentType === "text" ? "txt" : file.name.split(".").pop() ?? "bin";
  const storagePath = `${user.id}/${sessionId}/${attachmentId}.${ext}`;

  const supabase = await createClient();
  const uploadBody = typeof contentToStore === "string"
    ? new Blob([contentToStore], { type: "text/plain" })
    : new Blob([new Uint8Array(contentToStore)], { type: storageContentType });

  const { error: uploadError } = await supabase.storage
    .from("attachments")
    .upload(storagePath, uploadBody, { contentType: storageContentType, upsert: false });

  if (uploadError) {
    console.error("[upload] Storage upload failed:", uploadError);
    return Response.json({ error: "Failed to store file" }, { status: 500 });
  }

  const attachment: SessionAttachment = {
    id: attachmentId,
    name: file.name,
    mimeType,
    sizeBytes: file.size,
    storagePath,
    contentType,
    addedAt: Date.now(),
  };

  return Response.json({ attachment });
}

// DELETE /api/upload — body: { storagePath: string }
// Only allows deleting files that belong to the authenticated user
// (storagePath always starts with {userId}/ — enforced by construction)
export async function DELETE(req: NextRequest) {
  const authResult = await requireAuth();
  if (isResponse(authResult)) return authResult;
  const user = authResult;

  const body = await req.json().catch(() => null);
  if (!body || typeof body.storagePath !== "string") {
    return Response.json({ error: "Missing storagePath" }, { status: 400 });
  }

  const { storagePath } = body as { storagePath: string };

  // Verify the path belongs to this user — paths are always {userId}/{sessionId}/{attachmentId}.{ext}
  if (!storagePath.startsWith(`${user.id}/`)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = await createClient();
  const { error } = await supabase.storage.from("attachments").remove([storagePath]);
  if (error) {
    console.error("[upload] Storage delete failed:", error);
    return Response.json({ error: "Failed to delete file" }, { status: 500 });
  }

  return Response.json({ ok: true });
}
