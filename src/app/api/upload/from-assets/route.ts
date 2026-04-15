// POST /api/upload/from-assets
// Copies files from the user's asset library (assets bucket) into the session's
// attachments bucket, running the same extraction pipeline as the regular upload endpoint.
// Body: { sessionId: string, assets: Array<{ storagePath, name, mimeType, size }> }

export const runtime = "nodejs";

import { NextRequest } from "next/server";
import { requireAuth, isResponse } from "@/lib/api-helpers";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/redis";
import { randomUUID } from "crypto";
import type { SessionAttachment } from "@/lib/types";

const MAX_FILE_BYTES    = 4 * 1024 * 1024;
const MAX_SESSION_BYTES = 5 * 1024 * 1024;

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

interface AssetInput {
  storagePath: string; // e.g. "{userId}/{filename}"
  name: string;
  mimeType: string;
  size: number;
}

export async function POST(req: NextRequest) {
  const authResult = await requireAuth();
  if (isResponse(authResult)) return authResult;
  const user = authResult;

  const body = await req.json().catch(() => null);
  if (!body || typeof body.sessionId !== "string" || !Array.isArray(body.assets)) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const { sessionId, assets } = body as { sessionId: string; assets: AssetInput[] };

  if (!assets.length) {
    return Response.json({ attachments: [] });
  }

  // Verify all asset paths belong to this user
  for (const a of assets) {
    if (!a.storagePath.startsWith(`${user.id}/`)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  // Check session attachment budget
  const session = await getSession(sessionId);
  let usedBytes = (session?.attachments ?? []).reduce((sum, a) => sum + a.sizeBytes, 0);

  const supabase = await createClient();
  const results: SessionAttachment[] = [];

  for (const asset of assets) {
    if (asset.size > MAX_FILE_BYTES) {
      console.warn(`[from-assets] Skipping ${asset.name} — too large (${asset.size} bytes)`);
      continue;
    }
    if (usedBytes + asset.size > MAX_SESSION_BYTES) {
      console.warn(`[from-assets] Skipping ${asset.name} — session limit reached`);
      break;
    }

    // Download from assets bucket
    const { data: blob, error: downloadErr } = await supabase.storage.from("assets").download(asset.storagePath);
    if (downloadErr || !blob) {
      console.warn(`[from-assets] Could not download ${asset.name}:`, downloadErr?.message);
      continue;
    }

    const arrayBuf = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuf);
    const mimeType = asset.mimeType || "application/octet-stream";

    const isDocx =
      mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      /\.docx$/i.test(asset.name);
    const isXlsx =
      mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      mimeType === "application/vnd.ms-excel" ||
      /\.(xlsx|xls)$/i.test(asset.name);
    const isText =
      mimeType.startsWith("text/") ||
      ["application/json"].includes(mimeType) ||
      /\.(txt|csv|json|md)$/i.test(asset.name);
    const isRaw = mimeType === "application/pdf" || mimeType.startsWith("image/");

    let contentToStore: Buffer | string;
    let contentType: SessionAttachment["contentType"];
    let storageContentType: string;

    try {
      if (isDocx) {
        const text = await extractDocx(buffer);
        if (!text.trim()) continue;
        contentToStore = text;
        contentType = "text";
        storageContentType = "text/plain";
      } else if (isXlsx) {
        const text = extractXlsx(buffer);
        if (!text.trim()) continue;
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
        console.warn(`[from-assets] Unsupported format: ${asset.name}`);
        continue;
      }
    } catch (err) {
      console.warn(`[from-assets] Extraction failed for ${asset.name}:`, err);
      continue;
    }

    // Upload to attachments bucket
    const attachmentId = randomUUID();
    const ext = contentType === "text" ? "txt" : asset.name.split(".").pop() ?? "bin";
    const destPath = `${user.id}/${sessionId}/${attachmentId}.${ext}`;

    const uploadBody =
      typeof contentToStore === "string"
        ? new Blob([contentToStore], { type: "text/plain" })
        : new Blob([new Uint8Array(contentToStore)], { type: storageContentType });

    const { error: uploadErr } = await supabase.storage
      .from("attachments")
      .upload(destPath, uploadBody, { contentType: storageContentType, upsert: false });

    if (uploadErr) {
      console.error(`[from-assets] Upload failed for ${asset.name}:`, uploadErr);
      continue;
    }

    usedBytes += asset.size;

    results.push({
      id: attachmentId,
      name: asset.name,
      mimeType,
      sizeBytes: asset.size,
      storagePath: destPath,
      contentType,
      addedAt: Date.now(),
    });
  }

  return Response.json({ attachments: results });
}
