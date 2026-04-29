export const runtime = "nodejs";

import { requireAuth, isResponse } from "@/lib/api-helpers";

const ROUTER_URL = () => process.env.CLAUDE_ROUTER_URL!;
const PROXY_KEY = () => process.env.CLAUDE_ROUTER_PROXY_KEY!;

export interface PreflightQuestion {
  id: string;
  text: string;
  options: { id: string; label: string }[];
  autoAnswer: string; // option id that "Auto" selects
}

const SYSTEM = `You are a website design assistant. Given a user's website request, generate 2-3 short, high-impact clarifying questions that will help you build exactly what they want.

Rules:
- Return ONLY valid JSON — no prose, no markdown fences
- Each question must have exactly 3-4 option objects
- Questions should cover: visual style/mood, primary goal/CTA, and content focus (pick the 2-3 most relevant for this request)
- Keep question text under 8 words
- Keep option labels under 4 words
- autoAnswer must be the id of the option that would work best for most users (sensible default)

Return this exact shape:
{
  "questions": [
    {
      "id": "q1",
      "text": "What's the visual style?",
      "options": [
        { "id": "minimal", "label": "Clean & minimal" },
        { "id": "bold", "label": "Bold & vibrant" },
        { "id": "dark", "label": "Dark & premium" },
        { "id": "playful", "label": "Playful & fun" }
      ],
      "autoAnswer": "minimal"
    }
  ]
}`;

export async function POST(req: Request) {
  const authResult = await requireAuth();
  if (isResponse(authResult)) return authResult;

  const body = await req.json().catch(() => null);
  if (!body || typeof body.message !== "string") {
    return Response.json({ error: "Missing message" }, { status: 400 });
  }

  const { message } = body as { message: string };

  try {
    const res = await fetch(`${ROUTER_URL()}/v1/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${PROXY_KEY()}`,
        "anthropic-version": "2023-06-01",
        "x-source": "openslide-preflight",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 512,
        system: SYSTEM,
        messages: [{ role: "user", content: `Website request: "${message}"` }],
        stream: false,
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      throw new Error(`Router ${res.status}`);
    }

    const data = await res.json() as { content: Array<{ type: string; text?: string }> };
    const text = data.content.find((b) => b.type === "text")?.text ?? "";

    // Strip any markdown code fences in case the model adds them
    const clean = text.replace(/```(?:json)?\n?/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(clean) as { questions: PreflightQuestion[] };

    // Validate shape
    if (!Array.isArray(parsed.questions) || parsed.questions.length === 0) {
      throw new Error("Invalid questions shape");
    }

    return Response.json({ questions: parsed.questions.slice(0, 3) });
  } catch (err) {
    console.warn("[website-preflight] failed, skipping:", err);
    // Return empty questions so the client proceeds without them
    return Response.json({ questions: [] });
  }
}
