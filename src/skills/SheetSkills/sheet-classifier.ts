/**
 * sheet-classifier.ts
 *
 * Two-phase classification for spreadsheet generation.
 * Phase 1: Keyword rules (free, instant, catches ~70% of prompts)
 * Phase 2: Haiku LLM fallback (ambiguous prompts, ~1sec, ~$0.0003)
 *
 * 10 sheet categories mapped to SKILL.md files in src/skills/SheetSkills/.
 *
 * Exports: classifySheet(), sheetCategoryToSkillName(), allSheetSkillNames()
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type SheetCategory =
  | "financial_models"
  | "project_trackers"
  | "data_analysis"
  | "comparison_tables"
  | "inventory_assets"
  | "sales_crm"
  | "hr_payroll"
  | "academic_research"
  | "dashboards_charts"
  | "quotations_pricing";

export interface SheetClassification {
  category: SheetCategory;
  confidence: "high" | "medium" | "low";
  method: "keyword" | "llm";
}

// ─── Skill name mapping ─────────────────────────────────────────────────────

const SHEET_SKILL_MAP: Record<SheetCategory, string> = {
  financial_models: "xlsx-financial-models",
  project_trackers: "xlsx-project-trackers",
  data_analysis: "xlsx-data-analysis",
  comparison_tables: "xlsx-comparison-tables",
  inventory_assets: "xlsx-inventory-assets",
  sales_crm: "xlsx-sales-crm",
  hr_payroll: "xlsx-hr-payroll",
  academic_research: "xlsx-academic-research",
  dashboards_charts: "xlsx-dashboards",
  quotations_pricing: "xlsx-quotations-pricing",
};

export function sheetCategoryToSkillName(category: SheetCategory): string {
  return SHEET_SKILL_MAP[category];
}

export function allSheetSkillNames(): string[] {
  return Object.values(SHEET_SKILL_MAP);
}

// ─── Phase 1: Keyword rules ────────────────────────────────────────────────

interface KeywordRule {
  category: SheetCategory;
  strong: RegExp[];
  moderate: RegExp[];
  negative: RegExp[];
}

const KEYWORD_RULES: KeywordRule[] = [
  // ── Financial models (check first — highly specific financial terms) ──
  {
    category: "financial_models",
    strong: [
      /\bfinancial\s*model/i,
      /\bDCF\b/i,
      /\bdiscounted\s*cash\s*flow/i,
      /\bvaluation\b/i,
      /\bLBO\b/i,
      /\bleveraged\s*buy ?out/i,
      /\b3[\s-]statement\s*model/i,
      /\bthree[\s-]statement\s*model/i,
      /\bcap\s*table/i,
      /\bunit\s*economics/i,
      /\bburn\s*rate/i,
      /\brunway\b/i,
      /\brevenue\s*model/i,
      /\bsensitivity\s*analysis/i,
      /\bP\s*[&]\s*L\b/i,
      /\bprofit\s*(and|&)\s*loss/i,
      /\bincome\s*statement/i,
      /\bbalance\s*sheet/i,
      /\bcash\s*flow\s*statement/i,
      /\bbudget\b/i,
      /\bforecast/i,
    ],
    moderate: [
      /\bfinancial\b/i,
      /\bEBITDA\b/i,
      /\bROI\b/,
      /\bIRR\b/i,
      /\bNPV\b/i,
      /\bscenario\s*analysis/i,
      /\bwaterfall\b/i,
      /\bequity\b/i,
    ],
    negative: [
      /\bslides?\b/i,
      /\bdeck\b/i,
      /\bpresentation/i,
      /\bquotation\b/i,
      /\bquote\b/i,
      /\binvoice\b/i,
      /\bpayroll\b/i,
    ],
  },

  // ── Quotations & pricing (check before data_analysis — clear billing intent) ──
  {
    category: "quotations_pricing",
    strong: [
      /\bquotation\b/i,
      /\bquote\b/i,
      /\bestimate\b/i,
      /\brate\s*card/i,
      /\binvoice\b/i,
      /\bbilling\b/i,
      /\bcost\s*breakdown/i,
      /\bline\s*items?\b/i,
      /\bGST\b/i,
      /\bprice\s*list/i,
      /\bpricing\s*model/i,
      /\bfee\s*structure/i,
      /\bcost\s*estimate/i,
      /\bpurchase\s*order/i,
      /\bproforma\b/i,
      /\bPO\b/,
    ],
    moderate: [
      /\bpricing\b/i,
      /\bcosting\b/i,
      /\btaxable\b/i,
      /\btax\s*(rate|included|excluded)/i,
      /\bsubtotal\b/i,
      /\bdiscount\b/i,
    ],
    negative: [
      /\bslides?\b/i,
      /\bdeck\b/i,
      /\bpresentation/i,
      /\bfinancial\s*model/i,
      /\bDCF\b/i,
    ],
  },

  // ── HR & payroll (specific HR terms before broad data_analysis) ──
  {
    category: "hr_payroll",
    strong: [
      /\bpayroll\b/i,
      /\bsalary\b/i,
      /\bleave\s*tracker/i,
      /\battendance\b/i,
      /\bemployee\s*list/i,
      /\bheadcount\b/i,
      /\bcompensation\b/i,
      /\btax\s*deduction/i,
      /\bPF\b/,
      /\bESI\b/,
      /\bTDS\b/,
      /\bCTC\b/,
      /\bgross\s*pay/i,
      /\bnet\s*pay/i,
      /\bpay\s*slip/i,
      /\bHR\s*spreadsheet/i,
      /\bappraisal\s*tracker/i,
    ],
    moderate: [
      /\bHR\b/,
      /\bemployee\b/i,
      /\bstaff\b/i,
      /\bworkforce\b/i,
      /\bonboarding\s*tracker/i,
      /\bperformance\s*review/i,
    ],
    negative: [
      /\bslides?\b/i,
      /\bdeck\b/i,
      /\bpresentation/i,
      /\bfinancial\s*model/i,
      /\binvoice\b/i,
    ],
  },

  // ── Sales & CRM ──
  {
    category: "sales_crm",
    strong: [
      /\bsales\s*pipeline/i,
      /\bCRM\b/i,
      /\bdeal\s*tracker/i,
      /\bleads?\b/i,
      /\bprospects?\b/i,
      /\bopportunities\b/i,
      /\bpipeline\b/i,
      /\bconversion\s*rate/i,
      /\bwin\s*rate/i,
      /\bcommission\b/i,
      /\bsales\s*forecast/i,
      /\bquota\b/i,
      /\bterritory\b/i,
      /\bfunnel\b/i,
      /\bdeal\s*flow/i,
      /\bcold\s*outreach/i,
    ],
    moderate: [
      /\bsales\b/i,
      /\bdeals?\b/i,
      /\bprospecting\b/i,
      /\baccounts?\b/i,
      /\bcustomer\s*list/i,
      /\boutreach\b/i,
    ],
    negative: [
      /\bslides?\b/i,
      /\bdeck\b/i,
      /\bpresentation/i,
      /\bfinancial\s*model/i,
      /\bpayroll\b/i,
    ],
  },

  // ── Inventory & assets ──
  {
    category: "inventory_assets",
    strong: [
      /\binventory\b/i,
      /\basset\s*register/i,
      /\basset\s*list/i,
      /\bequipment\s*tracker/i,
      /\bstock\s*list/i,
      /\bwarehouse\b/i,
      /\bIT\s*assets/i,
      /\blicense\s*tracker/i,
      /\bserial\s*numbers?\b/i,
      /\bdepreciation\b/i,
      /\bparts\s*list/i,
      /\bBOM\b/i,
      /\bbill\s*of\s*materials/i,
      /\bfixed\s*assets/i,
      /\bconsumables\b/i,
    ],
    moderate: [
      /\bassets?\b/i,
      /\bstock\b/i,
      /\bitems?\b/i,
      /\bcatalog\b/i,
      /\btracking\b/i,
      /\bSKU\b/i,
    ],
    negative: [
      /\bslides?\b/i,
      /\bdeck\b/i,
      /\bpresentation/i,
      /\bfinancial\s*model/i,
      /\bsales\s*pipeline/i,
    ],
  },

  // ── Comparison tables ──
  {
    category: "comparison_tables",
    strong: [
      /\bcomparison\s*table/i,
      /\bvs\b/i,
      /\bversus\b/i,
      /\bside[\s-]by[\s-]side/i,
      /\bpros?\s*(and|&)\s*cons/i,
      /\bfeature\s*matrix/i,
      /\bvendor\s*comparison/i,
      /\btool\s*comparison/i,
      /\bpricing\s*comparison/i,
      /\bbenchmark\b/i,
      /\bevaluation\s*matrix/i,
      /\bdecision\s*matrix/i,
      /\bscorecard\b/i,
      /\branking\b/i,
    ],
    moderate: [
      /\bcompare\b/i,
      /\bcomparison\b/i,
      /\bcontrast\b/i,
      /\bevaluate\b/i,
      /\brate\b/i,
      /\bscore\b/i,
    ],
    negative: [
      /\bslides?\b/i,
      /\bdeck\b/i,
      /\bpresentation/i,
      /\bfinancial\s*model/i,
      /\binventory\b/i,
    ],
  },

  // ── Project trackers ──
  {
    category: "project_trackers",
    strong: [
      /\bproject\s*tracker/i,
      /\btask\s*tracker/i,
      /\bsprint\b/i,
      /\bbacklog\b/i,
      /\bGantt\b/i,
      /\bmilestone/i,
      /\broadmap\b/i,
      /\blaunch\s*plan/i,
      /\bchecklist\b/i,
      /\bkanban\b/i,
      /\bto[\s-]do\s*list/i,
      /\baction\s*items\b/i,
      /\bdeliverables\b/i,
      /\bRAG\s*status/i,
      /\bprogress\s*tracker/i,
      /\bOKR\s*tracker/i,
    ],
    moderate: [
      /\btasks?\b/i,
      /\bproject\b/i,
      /\bdeadline/i,
      /\bschedule\b/i,
      /\bstatus\s*update/i,
      /\bOKR\b/i,
    ],
    negative: [
      /\bslides?\b/i,
      /\bdeck\b/i,
      /\bpresentation/i,
      /\bfinancial\s*model/i,
      /\bdashboard\b/i,
    ],
  },

  // ── Dashboards & charts ──
  {
    category: "dashboards_charts",
    strong: [
      /\bdashboard\b/i,
      /\bKPI\b/i,
      /\bmetrics\s*dashboard/i,
      /\bexecutive\s*summary/i,
      /\bperformance\s*dashboard/i,
      /\banalytics\s*dashboard/i,
      /\bweekly\s*report/i,
      /\bmonthly\s*report/i,
      /\bstatus\s*overview/i,
      /\bmanagement\s*report/i,
      /\bscorecard\b/i,
    ],
    moderate: [
      /\bdashboard\b/i,
      /\bmetrics\b/i,
      /\bKPIs?\b/i,
      /\bcharts?\b/i,
      /\bvisualiz/i,
      /\breport\b/i,
    ],
    negative: [
      /\bslides?\b/i,
      /\bdeck\b/i,
      /\bpresentation/i,
      /\bfinancial\s*model/i,
      /\bproject\s*tracker/i,
    ],
  },

  // ── Academic & research ──
  {
    category: "academic_research",
    strong: [
      /\bliterature\s*review/i,
      /\bresearch\s*table/i,
      /\bpaper\s*comparison/i,
      /\bdataset\s*catalog/i,
      /\bexperiment\s*results/i,
      /\bstudy\s*guide/i,
      /\bquestion\s*bank/i,
      /\bcourse\s*tracker/i,
      /\bcitation\s*list/i,
      /\breading\s*list/i,
      /\bmodel\s*comparison/i,
      /\bSOTA\s*table/i,
      /\bstate[\s-]of[\s-]the[\s-]art/i,
      /\bbenchmark\s*results/i,
    ],
    moderate: [
      /\bresearch\b/i,
      /\bacademic\b/i,
      /\bpaper\b/i,
      /\bstudy\b/i,
      /\bcitations?\b/i,
      /\bexperiment/i,
    ],
    negative: [
      /\bslides?\b/i,
      /\bdeck\b/i,
      /\bpresentation/i,
      /\bfinancial\s*model/i,
      /\bsales\s*pipeline/i,
    ],
  },

  // ── Data analysis (broadest — catch-all, checked last) ──
  {
    category: "data_analysis",
    strong: [
      /\bdata\s*analysis/i,
      /\bstatistics\b/i,
      /\bsummary\s*report/i,
      /\bpivot\s*table/i,
      /\baggregate\b/i,
      /\bgroup\s*by/i,
      /\bclean\s*this\s*data/i,
      /\bdata\s*cleaning/i,
      /\bparse\s*CSV/i,
      /\bdistribution\b/i,
      /\bcorrelation\b/i,
      /\bfrequency\b/i,
      /\boutliers\b/i,
      /\bdata\s*exploration/i,
      /\bEDA\b/i,
    ],
    moderate: [
      /\bdata\b/i,
      /\banalysis\b/i,
      /\banalyze\b/i,
      /\bCSV\b/i,
      /\bdataset\b/i,
      /\bspreadsheet/i,
    ],
    negative: [
      /\bslides?\b/i,
      /\bdeck\b/i,
      /\bpresentation/i,
      /\bfinancial\s*model/i,
    ],
  },
];

function classifyByKeywords(prompt: string): SheetClassification | null {
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

// ─── Phase 2: Haiku LLM fallback ──────────────────────────────────────────

const CLASSIFICATION_PROMPT = `You are a spreadsheet type classifier. Given a user prompt, classify it into exactly ONE category:

- financial_models: Financial models, budgets, forecasts, DCF, valuations, P&L, income statements, balance sheets, cash flow models, cap tables, unit economics, burn rate, runway, revenue models, sensitivity analysis, LBO, 3-statement models.
- project_trackers: Project trackers, task trackers, sprints, backlogs, Gantt charts, milestones, roadmaps, launch plans, checklists, kanban boards, to-do lists, action items, deliverables, RAG status, progress trackers, OKR trackers.
- data_analysis: Data analysis, statistics, summary reports, pivot tables, aggregations, data cleaning, CSV parsing, distributions, correlations, frequency analysis, outlier detection, data exploration. Default for general spreadsheet requests.
- comparison_tables: Comparison tables, vs/versus tables, side-by-side comparisons, pros and cons, feature matrices, vendor comparisons, tool comparisons, pricing comparisons, benchmarks, evaluation matrices, decision matrices, scorecards, rankings.
- inventory_assets: Inventory trackers, asset registers, equipment trackers, stock lists, warehouse management, IT assets, license trackers, depreciation schedules, parts lists, BOM, fixed assets, consumables.
- sales_crm: Sales pipelines, CRM trackers, deal trackers, leads/prospects/opportunities lists, conversion rate tracking, commission calculations, sales forecasts, territory management, funnels, deal flow, cold outreach.
- hr_payroll: Payroll sheets, salary trackers, leave trackers, attendance sheets, employee lists, headcount planning, compensation, tax deductions, PF/ESI/TDS, CTC, gross/net pay, pay slips, HR spreadsheets, appraisal trackers.
- academic_research: Literature reviews, research tables, paper comparisons, dataset catalogs, experiment results, study guides, question banks, course trackers, citation lists, reading lists, model comparisons, SOTA tables.
- dashboards_charts: Dashboards, KPI dashboards, metrics dashboards, executive summaries, performance dashboards, analytics dashboards, weekly/monthly reports, status overviews, management reports.
- quotations_pricing: Quotations, quotes, estimates, rate cards, invoices, billing sheets, cost breakdowns, line items, GST calculations, price lists, pricing models, fee structures, cost estimates, purchase orders, proformas.

Respond with ONLY a JSON object:
{"category": "financial_models|project_trackers|data_analysis|comparison_tables|inventory_assets|sales_crm|hr_payroll|academic_research|dashboards_charts|quotations_pricing", "confidence": "high|medium|low"}`;

import { callRouterNonStreaming } from "@/agent/stream";

const CLASSIFIER_MODEL = "claude-haiku-4-5-20251001";
const CLASSIFIER_TIMEOUT_MS = 10_000;

async function classifyByLLM(prompt: string): Promise<SheetClassification> {
  try {
    const text = await callRouterNonStreaming({
      model: CLASSIFIER_MODEL,
      max_tokens: 60,
      system: [{ type: "text", text: CLASSIFICATION_PROMPT }],
      messages: [{ role: "user", content: prompt }],
    });

    const clean = text.trim().replace(/```json|```/g, "").trim();

    try {
      const parsed = JSON.parse(clean);
      const valid: SheetCategory[] = [
        "financial_models",
        "project_trackers",
        "data_analysis",
        "comparison_tables",
        "inventory_assets",
        "sales_crm",
        "hr_payroll",
        "academic_research",
        "dashboards_charts",
        "quotations_pricing",
      ];
      if (!valid.includes(parsed.category)) {
        return { category: "data_analysis", confidence: "low", method: "llm" };
      }
      return { category: parsed.category, confidence: parsed.confidence || "medium", method: "llm" };
    } catch {
      // Fallback: try CATEGORY:CONFIDENCE format
      const lower = clean.toLowerCase();
      const parts = lower.split(":");
      const rawCat = parts[0]?.trim();
      const rawConf = parts[1]?.trim();
      const valid: SheetCategory[] = [
        "financial_models",
        "project_trackers",
        "data_analysis",
        "comparison_tables",
        "inventory_assets",
        "sales_crm",
        "hr_payroll",
        "academic_research",
        "dashboards_charts",
        "quotations_pricing",
      ];
      const category = valid.includes(rawCat as SheetCategory) ? rawCat as SheetCategory : "data_analysis" as SheetCategory;
      const confidence = (rawConf === "high" || rawConf === "medium" || rawConf === "low") ? rawConf : "medium";
      return { category, confidence, method: "llm" };
    }
  } catch (err) {
    console.warn("[sheet-classifier] LLM classification failed:", err);
    return { category: "data_analysis", confidence: "low", method: "llm" };
  }
}

// ─── Main export ────────────────────────────────────────────────────────────

export async function classifySheet(prompt: string): Promise<SheetClassification> {
  // Phase 1: keyword rules
  const keywordResult = classifyByKeywords(prompt);
  if (keywordResult && keywordResult.confidence === "high") {
    return keywordResult;
  }

  // Phase 2: Haiku fallback with timeout
  const llmPromise = classifyByLLM(prompt);
  const timeoutPromise = new Promise<SheetClassification>((resolve) => {
    setTimeout(() => {
      console.warn("[sheet-classifier] Haiku timed out — defaulting to data_analysis");
      resolve({ category: "data_analysis", confidence: "low", method: "llm" });
    }, CLASSIFIER_TIMEOUT_MS);
  });
  const llmResult = await Promise.race([llmPromise, timeoutPromise]);

  // If keyword had medium confidence and LLM agrees, boost
  if (keywordResult && keywordResult.confidence === "medium" && keywordResult.category === llmResult.category) {
    return { ...keywordResult, confidence: "high" };
  }

  return llmResult;
}
