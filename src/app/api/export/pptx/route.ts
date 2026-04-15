export const runtime = "nodejs";
export const maxDuration = 120;

import { NextRequest } from "next/server";
import { handleExportRequest } from "@/lib/export-common";

export async function GET(req: NextRequest) {
  return handleExportRequest(req, {
    endpoint: "/generate-pptx",
    contentType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    extension: ".pptx",
    name: "PPTX",
    includeLogo: true,
  });
}
