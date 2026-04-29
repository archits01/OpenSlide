// Brand Config API — upload template, get/update brand config
// Uses Supabase Storage for files, Prisma for config data

export const runtime = "nodejs";

import { NextRequest } from "next/server";
import { requireAuth, isResponse } from "@/lib/api-helpers";
import { prisma } from "@/lib/db";

// OSS build: brand kit available to all users — no tier gate.
async function requirePaidTier(_userId: string): Promise<Response | null> {
  return null;
}

// ─── GET /api/brand — fetch active brand config for current user ──────────

export async function GET() {
  const authResult = await requireAuth();
  if (isResponse(authResult)) return authResult;
  const user = authResult;

  const denied = await requirePaidTier(user.id);
  if (denied) return denied;

  const config = await prisma.brandConfig.findFirst({
    where: { userId: user.id, isActive: true },
    orderBy: { updatedAt: "desc" },
  });

  return Response.json({ config });
}

// ─── POST /api/brand — upload .pptx, extract brand assets ─────────────────

export async function POST(req: NextRequest) {
  const authResult = await requireAuth();
  if (isResponse(authResult)) return authResult;
  const user = authResult;

  const denied = await requirePaidTier(user.id);
  if (denied) return denied;

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file || !file.name.endsWith(".pptx")) {
    return Response.json({ error: "Please upload a .pptx file" }, { status: 400 });
  }

  // 1. Read file into memory (no storage upload — we only need the extracted brand data)
  const fileBuffer = Buffer.from(await file.arrayBuffer());

  // 2. Run PPTX extraction via pdf-server (same VPS)
  const PDF_SERVER_URL = process.env.PDF_SERVER_URL;
  const PDF_SERVER_SECRET = process.env.PDF_SERVER_SECRET;

  let extractedBrand: Record<string, unknown>;

  if (PDF_SERVER_URL) {
    try {
      const extractRes = await fetch(`${PDF_SERVER_URL}/extract-brand`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(PDF_SERVER_SECRET ? { Authorization: `Bearer ${PDF_SERVER_SECRET}` } : {}),
        },
        body: JSON.stringify({ pptxBase64: fileBuffer.toString("base64") }),
      });

      if (!extractRes.ok) {
        const errText = await extractRes.text().catch(() => "unknown");
        console.error("[brand] Extraction failed:", extractRes.status, errText);
        extractedBrand = { extraction_status: "failed", extraction_error: errText };
      } else {
        extractedBrand = await extractRes.json();
      }
    } catch (err) {
      console.error("[brand] VPS extraction error:", err);
      extractedBrand = { extraction_status: "failed", extraction_error: String(err) };
    }
  } else {
    console.warn("[brand] PDF_SERVER_URL not set — extraction skipped");
    extractedBrand = {
      extraction_status: "skipped",
      extraction_message: "PDF_SERVER_URL not configured. Set it to enable brand extraction.",
    };
  }

  // 4. Deactivate any existing brand configs for this user
  await prisma.brandConfig.updateMany({
    where: { userId: user.id, isActive: true },
    data: { isActive: false },
  });

  // 5. Create new brand config record
  const config = await prisma.brandConfig.create({
    data: {
      userId: user.id,
      name: file.name.replace(".pptx", ""),
      brandJson: extractedBrand as object,
      brandConfigJson: {
        strictness: "balanced",
        allow_new_slide_types: false,
        allow_decorative_elements: false,
        allow_header_footer_changes: false,
        allow_logo_changes: false,
        allow_font_changes: false,
        allow_overlays: true,
        stock_photos_allowed: true,
        ai_images_allowed: false,
        company_images_only: false,
        max_bullets_per_slide: 5,
        max_words_per_slide: 40,
        whitespace_density: "balanced",
        require_section_dividers: true,
        closing_slide_required: true,
        max_consecutive_data_slides: 1,
        max_consecutive_text_slides: 2,
        image_crop_style: "rounded_8px",
        icon_style: "outline",
        date_format: "MMMM YYYY",
        number_format: { thousands: ",", decimal: "." },
      },
      strictness: "balanced",
      isActive: true,
    },
  });

  return Response.json({ config, brand: extractedBrand });
}

// ─── PUT /api/brand — update brand_config.json (Bucket 2) ─────────────────

export async function PUT(req: NextRequest) {
  const authResult = await requireAuth();
  if (isResponse(authResult)) return authResult;
  const user = authResult;

  const denied = await requirePaidTier(user.id);
  if (denied) return denied;

  const body = await req.json().catch(() => null);
  if (!body) {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }

  const { configId, brandConfigJson, strictness } = body as {
    configId?: string;
    brandConfigJson?: Record<string, unknown>;
    strictness?: string;
  };

  // Find the config to update — either by ID or the active one
  const where = configId
    ? { id: configId, userId: user.id }
    : { userId: user.id, isActive: true };

  const existing = await prisma.brandConfig.findFirst({ where });
  if (!existing) {
    return Response.json({ error: "No brand config found" }, { status: 404 });
  }

  const updateData: Record<string, unknown> = {};
  if (brandConfigJson) updateData.brandConfigJson = brandConfigJson;
  if (strictness) updateData.strictness = strictness;

  const updated = await prisma.brandConfig.update({
    where: { id: existing.id },
    data: updateData,
  });

  return Response.json({ config: updated });
}
