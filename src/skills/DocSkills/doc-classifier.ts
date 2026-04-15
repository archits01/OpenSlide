/**
 * doc-classifier.ts
 *
 * Two-phase classification for document generation.
 * Phase 1: Keyword rules (free, instant, catches ~70% of prompts)
 * Phase 2: Sonnet LLM fallback (ambiguous prompts, ~1sec, ~$0.003)
 *
 * 4 doc categories. Presentations redirect to the slide pipeline.
 *
 * Exports: classifyDoc(), docCategoryToSkillName(), allDocSkillNames()
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type DocCategory =
  | "business"
  | "financial"
  | "marketing"
  | "legal";

export interface DocClassification {
  category: DocCategory | "presentations_redirect";
  confidence: "high" | "medium" | "low";
  method: "keyword" | "llm";
}

// ─── Skill name mapping ─────────────────────────────────────────────────────

const DOC_SKILL_MAP: Record<DocCategory, string> = {
  business: "doc-business",
  financial: "doc-financial",
  marketing: "doc-marketing",
  legal: "doc-legal",
};

export function docCategoryToSkillName(category: DocCategory): string {
  return DOC_SKILL_MAP[category];
}

export function allDocSkillNames(): string[] {
  return Object.values(DOC_SKILL_MAP);
}

// ─── Phase 1: Keyword rules ────────────────────────────────────────────────

interface KeywordRule {
  category: DocCategory | "presentations_redirect";
  strong: RegExp[];
  moderate: RegExp[];
  negative: RegExp[];
}

const KEYWORD_RULES: KeywordRule[] = [
  // ── Presentations → redirect to slide pipeline (check first) ──
  {
    category: "presentations_redirect",
    strong: [
      /\.pptx?\b/i,
      /\bslide\s*deck/i,
      /\bpitch\s*deck/i,
      /\bkeynote\b/i,
      /\bpresentation/i,
      /\bslides?\b/i,
      /\bdeck\b/i,
      /\bspeaker\s*notes/i,
    ],
    moderate: [
      /\bpitch\b/i,
      /\bdemo\s*day/i,
    ],
    negative: [
      /\bhandout/i,
      /\bsummary\s*(of|for)\s*(the|my)\s*(deck|presentation)/i,
    ],
  },

  // ── Financial (check before business — "budget" and "invoice" are unambiguous) ──
  {
    category: "financial",
    strong: [
      /\.xlsx\b/i,
      /\.csv\b/i,
      /\bspreadsheet/i,
      /\bexcel\b/i,
      /\bbalance\s*sheet/i,
      /\bincome\s*statement/i,
      /\bcash\s*flow\s*statement/i,
      /\bp\s*[&]\s*l\b/i,
      /\bprofit\s*(and|&)\s*loss/i,
      /\bgeneral\s*ledger/i,
      /\btrial\s*balance/i,
      /\bbudget\b/i,
      /\bforecast/i,
      /\bfinancial\s*model/i,
      /\btax\s*return/i,
      /\bpayroll/i,
      /\bexpense\s*(report|tracker|sheet)/i,
    ],
    moderate: [
      /\binvoice/i,
      /\breceipt/i,
      /\bformula/i,
      /\bcalculat/i,
      /\brevenue/i,
      /\bquarterly\b/i,
      /\bfiscal/i,
      /\bROI\b/,
      /\bEBITDA\b/i,
    ],
    negative: [
      /\bslides?\b/i,
      /\bdeck\b/i,
      /\bpresentation/i,
      /\blanding\s*page/i,
      /\bwebsite/i,
    ],
  },

  // ── Marketing & creative ──
  {
    category: "marketing",
    strong: [
      /\blanding\s*page/i,
      /\bwebsite/i,
      /\bdashboard/i,
      /\bbrochure/i,
      /\bflyer/i,
      /\bposter\b/i,
      /\bnewsletter/i,
      /\bemail\s*template/i,
      /\bemail\s*campaign/i,
      /\bsocial\s*media\s*(post|content|copy)/i,
      /\bblog\s*post/i,
      /\bad\s*copy/i,
      /\bbanner/i,
      /\binfographic/i,
      /\bbrand\s*guide/i,
      /\bproduct\s*sheet/i,
      /\bpress\s*release/i,
    ],
    moderate: [
      /\bmarketing/i,
      /\bcreative/i,
      /\bbrand/i,
      /\bcampaign/i,
    ],
    negative: [
      /\b\.docx\b/i,
      /\bword\s*doc/i,
      /\bcontract/i,
    ],
  },

  // ── Legal ──
  {
    category: "legal",
    strong: [
      /\bcontract\b/i,
      /\bNDA\b/i,
      /\bnon[\s-]*disclosure/i,
      /\bagreement\b/i,
      /\bterms\s*(of\s*service|and\s*conditions)/i,
      /\bprivacy\s*policy/i,
      /\baffidavit/i,
      /\bpower\s*of\s*attorney/i,
      /\blegal\s*notice/i,
      /\bcompliance\b/i,
      /\bMOU\b/i,
      /\bmemorandum\s*of\s*understanding/i,
      /\blease\b/i,
      /\bindemnity/i,
      /\bwaiver\b/i,
      /\bgoverning\s*law/i,
      /\.pdf\b/i,
      /\bmerge\s*pdf/i,
      /\bfill\s*(in|out)?\s*(a\s*)?form/i,
      /\bOCR\b/i,
      /\bwatermark/i,
      /\bencrypt\b/i,
    ],
    moderate: [
      /\blegal\b/i,
      /\bregulat/i,
      /\bsign(ature|ed)?\b/i,
    ],
    negative: [
      /\bspreadsheet/i,
      /\.xlsx\b/i,
      /\bslides?\b/i,
    ],
  },

  // ── Business (broadest — catch-all, checked last) ──
  {
    category: "business",
    strong: [
      /\.docx?\b/i,
      /\bword\s*doc/i,
      /\bSOP\b/i,
      /\bstandard\s*operating\s*procedure/i,
      /\bmemo\b/i,
      /\breport\b/i,
      /\bproposal\b/i,
      /\bbusiness\s*plan/i,
      /\bletter\b/i,
      /\bpolicy\s*document/i,
      /\bhandbook/i,
      /\bmanual\b/i,
      /\buser\s*guide/i,
      /\bwhite\s*paper/i,
      /\bcase\s*study/i,
      /\bmeeting\s*minutes/i,
      /\bagenda\b/i,
      /\bresume\b/i,
      /\bCV\b/,
      /\bcover\s*letter/i,
      /\bcertificate/i,
      /\bonboarding/i,
      /\bstrategy\b/i,
      /\banalysis\b/i,
      /\bframework/i,
      /\bplaybook/i,
      /\bguideline/i,
      /\bbrief\b/i,
      /\bexecutive\s*summary/i,
      /\baction\s*plan/i,
    ],
    moderate: [
      /\bdocument/i,
      /\bdraft\b/i,
      /\btemplate/i,
      /\bwrite\b/i,
      /\bcreate\b/i,
      /\bprofessional/i,
      /\binvest/i,
      /\bplan\b/i,
    ],
    negative: [
      /\bspreadsheet/i,
      /\.xlsx\b/i,
      /\bslides?\b/i,
      /\bdeck\b/i,
      /\blanding\s*page/i,
    ],
  },
];

function classifyByKeywords(prompt: string): DocClassification | null {
  for (const rule of KEYWORD_RULES) {
    const hasNegative = rule.negative.some((re) => re.test(prompt));
    if (hasNegative) continue;

    const strongHits = rule.strong.filter((re) => re.test(prompt)).length;
    if (strongHits >= 1) {
      return { category: rule.category, confidence: "high", method: "keyword" };
    }

    const moderateHits = rule.moderate.filter((re) => re.test(prompt)).length;
    if (moderateHits >= 2) {
      return { category: rule.category, confidence: "medium", method: "keyword" };
    }
  }

  return null;
}

// ─── Phase 2: Sonnet LLM fallback ──────────────────────────────────────────

const CLASSIFICATION_PROMPT = `You are a document type classifier. Given a user prompt, classify it into exactly ONE category:

- business: Reports, SOPs, memos, proposals, letters, resumes, handbooks, meeting minutes, onboarding docs, certificates, cover letters, white papers, case studies. Default for general "create a document" requests.
- financial: Spreadsheets, budgets, balance sheets, income statements, P&L, invoices with calculations, tax records, expense trackers, financial models, payroll. Anything primarily numerical/tabular.
- marketing: Email templates, brochures, flyers, posters, newsletters, social media content, blog posts, ad copy, brand guidelines, product sheets, press releases, infographics. Anything creative/visual/brand-forward.
- legal: Contracts, NDAs, agreements, terms of service, privacy policies, compliance docs, affidavits, MOUs, leases, legal notices, waivers. Also PDF operations (merge, split, fill forms, OCR, encrypt).
- presentations_redirect: Slide decks, pitch decks, keynotes, presentations. This person wants slides, not a document.

Respond with ONLY a JSON object:
{"category": "business|financial|marketing|legal|presentations_redirect", "confidence": "high|medium|low"}`;

import { callRouterNonStreaming } from "@/agent/stream";

const CLASSIFIER_MODEL = "claude-haiku-4-5-20251001";
const CLASSIFIER_TIMEOUT_MS = 10_000;

async function classifyByLLM(prompt: string): Promise<DocClassification> {
  try {
    const text = await callRouterNonStreaming({
      model: CLASSIFIER_MODEL,
      max_tokens: 50,
      system: [{ type: "text", text: CLASSIFICATION_PROMPT }],
      messages: [{ role: "user", content: prompt }],
    });

    const clean = text.trim().replace(/```json|```/g, "").trim();

    try {
      const parsed = JSON.parse(clean);
      const valid = ["business", "financial", "marketing", "legal", "presentations_redirect"];
      if (!valid.includes(parsed.category)) {
        return { category: "business", confidence: "low", method: "llm" };
      }
      return { category: parsed.category, confidence: parsed.confidence || "medium", method: "llm" };
    } catch {
      // Fallback: try CATEGORY:CONFIDENCE format
      const lower = clean.toLowerCase();
      const parts = lower.split(":");
      const rawCat = parts[0]?.trim();
      const rawConf = parts[1]?.trim();
      const valid = ["business", "financial", "marketing", "legal", "presentations_redirect"];
      const category = valid.includes(rawCat) ? rawCat as DocClassification["category"] : "business" as DocCategory;
      const confidence = (rawConf === "high" || rawConf === "medium" || rawConf === "low") ? rawConf : "medium";
      return { category, confidence, method: "llm" };
    }
  } catch (err) {
    console.warn("[doc-classifier] LLM classification failed:", err);
    return { category: "business", confidence: "low", method: "llm" };
  }
}

// ─── Main export ────────────────────────────────────────────────────────────

export async function classifyDoc(prompt: string): Promise<DocClassification> {
  // Phase 1: keyword rules
  const keywordResult = classifyByKeywords(prompt);
  if (keywordResult && keywordResult.confidence === "high") {
    return keywordResult;
  }

  // Phase 2: Sonnet fallback with timeout
  const llmPromise = classifyByLLM(prompt);
  const timeoutPromise = new Promise<DocClassification>((resolve) => {
    setTimeout(() => {
      console.warn("[doc-classifier] Sonnet timed out — defaulting to business");
      resolve({ category: "business", confidence: "low", method: "llm" });
    }, CLASSIFIER_TIMEOUT_MS);
  });
  const llmResult = await Promise.race([llmPromise, timeoutPromise]);

  // If keyword had medium confidence and LLM agrees, boost
  if (keywordResult && keywordResult.confidence === "medium" && keywordResult.category === llmResult.category) {
    return { ...keywordResult, confidence: "high" };
  }

  return llmResult;
}
