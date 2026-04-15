export const runtime = "nodejs";
export const maxDuration = 120;

import { NextRequest } from "next/server";
import { handleExportRequest } from "@/lib/export-common";

export async function GET(req: NextRequest) {
  return handleExportRequest(req, {
    endpoint: "/generate-docx",
    contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    extension: ".docx",
    name: "DOCX",
    includeLogo: false,
    forceDocMode: true,
  });
}
