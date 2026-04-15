export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { classifyDeck } from "@/skills/slide-categories/slide-classifier";

/**
 * GET /api/test-classifier?q=<prompt>
 *
 * Eval-only endpoint — calls the slide classifier and returns the raw result.
 * Used by scripts/evals/runner.mjs and the standalone eval scripts.
 * No auth required (test endpoint, not user-facing).
 */
export async function GET(req: NextRequest) {
  const prompt = req.nextUrl.searchParams.get("q");
  if (!prompt) {
    return NextResponse.json({ error: "Missing ?q= parameter" }, { status: 400 });
  }

  try {
    const result = await classifyDeck(prompt);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Classification failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
