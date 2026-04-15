export const runtime = "nodejs";
export const maxDuration = 120;

import { NextRequest } from "next/server";
import { handleExportRequest } from "@/lib/export-common";

export async function GET(req: NextRequest) {
  return handleExportRequest(req, {
    endpoint: "/generate-pdf",
    contentType: "application/pdf",
    extension: ".pdf",
    name: "PDF",
    includeLogo: true,
  });
}
