/**
 * Seed script — replaces templates with real session-linked templates.
 * Run with: npx tsx scripts/seed-templates.ts
 *
 * Safe to re-run — deletes all existing, then inserts fresh.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const TEMPLATES = [
  {
    slug: "quarterly-business-review",
    title: "Quarterly Business Review",
    description:
      "A sleek, professional template designed for quarterly performance reporting with strong data visualization elements. Its layout prioritizes clarity with revenue dashboards, margin analysis, customer metrics, and forward-looking KPIs — perfect for finance and operations teams.",
    category: "Business",
    tags: ["Business", "Finance", "Metrics", "Quarterly Review", "Data-Driven"],
    bg: "linear-gradient(135deg, #1e3a5f 0%, #1e40af 100%)",
    prompt:
      "Build a Q1 2026 business review deck for Acme Corp, 8 slides with revenue, gross margin, new customers, NPS, and churn metrics.",
    sessionId: "15399b17-01e2-4754-962d-9793d04fb3c0",
  },
  {
    slug: "engineering-team-update",
    title: "Engineering Team Update",
    description:
      "A bold, structured template designed for engineering sprint reviews and technical team updates. Features layouts for incident timelines, project status boards, technical debt analysis, and velocity metrics with clean color hierarchy and strong visual elements.",
    category: "Engineering",
    tags: ["Engineering", "Technical", "Sprint Review", "Agile", "Infrastructure"],
    bg: "linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #3730a3 100%)",
    prompt:
      "Build an engineering deck for the Acme platform team, 8 slides, covering Sprint 17 incidents, projects, and technical debt.",
    sessionId: "704f7a28-9ed2-477b-b20e-e21f40e53163",
  },
  {
    slug: "professional-consulting-proposal",
    title: "Professional Consulting Proposal",
    description:
      "A sleek, executive-grade template designed for management consulting proposals and transformation roadmaps. Features structured layouts with financial metrics, engagement timelines, and strategic recommendations with strong data visualization elements suited for C-suite audiences.",
    category: "Consulting",
    tags: ["Consulting", "Strategy", "Professional", "Executive", "Corporate"],
    bg: "linear-gradient(135deg, #0f0c29 0%, #302b63 60%, #24243e 100%)",
    prompt:
      "I'm a Senior Account Executive at a boutique management consulting firm — 80 consultants, we specialise in operational transformation for manufacturing companies.",
    sessionId: "fe5bde9a-3623-4b15-8bb3-141907ecca4e",
  },
  {
    slug: "executive-leadership-briefing",
    title: "Executive Leadership Briefing",
    description:
      "A sleek, professional template designed for executive committee briefings and leadership updates. Its layout prioritizes clarity with status indicators, KPI dashboards, and action items — ideal for weekly ExCo meetings, board updates, and C-suite communication.",
    category: "Business",
    tags: ["Executive", "Leadership", "Corporate", "Briefing", "Professional"],
    bg: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
    prompt:
      "I'm the Chief of Staff to the CEO of a global logistics company with 18,000 employees and operations in 34 countries. Every Monday morning the CEO has a 20-minute briefing slot with the full ExCo.",
    sessionId: "55bd13d4-e5e4-4dbd-9066-8adc0a4fda84",
  },
  {
    slug: "deep-research-report",
    title: "In-Depth Research Report",
    description:
      "A data-rich, professional template designed for in-depth company analysis, market research, and due diligence reports. Features structured layouts for financials, competitive positioning, and strategic outlook with bold typography and clear data hierarchy.",
    category: "Research",
    tags: ["Research", "Analysis", "Data-Driven", "Deep Dive", "Professional"],
    bg: "linear-gradient(135deg, #18181b 0%, #27272a 100%)",
    prompt:
      "Create a presentation for Palantir and do a deep research on it",
    sessionId: "5fb3cf77-1f32-4adb-9e68-014947912089",
  },
  {
    slug: "technology-innovation-showcase",
    title: "Technology Innovation Showcase",
    description:
      "A visually dynamic, modern template designed for technology showcases, innovation talks, and future-forward presentations. Features clean layouts with geometric elements, concept diagrams, and a focus on data-driven storytelling suited for tech conferences and thought leadership.",
    category: "Technology",
    tags: ["Technology", "Innovation", "AI", "Modern", "Futuristic"],
    bg: "linear-gradient(135deg, #064e3b 0%, #065f46 100%)",
    prompt:
      "Make slides on space technology and how it is going to integrate AI into it",
    sessionId: "1cd915ea-0f1f-4fb0-90ad-9aeca169d1a9",
  },
  {
    slug: "educational-research-presentation",
    title: "Educational Research Presentation",
    description:
      "A clean, academic template designed for data science projects, research presentations, and educational showcases. Features structured layouts for methodology, data visualizations, model results, and key findings — ideal for university presentations, thesis defenses, and technical talks.",
    category: "Education",
    tags: ["Education", "Research", "Data Science", "Academic", "Technical"],
    bg: "linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)",
    prompt:
      "Create a presentation on predicting startup funding using machine learning — cover the problem, dataset, feature engineering, model results, and key findings.",
    sessionId: "b422cfa1-a236-4e85-959d-8b2d437717a3",
  },
  {
    slug: "startup-board-deck",
    title: "Startup Board Deck",
    description:
      "A professional, investor-ready template designed for startup board meetings and investor updates. Features clean layouts for ARR growth charts, customer segmentation, go-to-market strategy, and milestone tracking with modern corporate aesthetics.",
    category: "Startup",
    tags: ["Startup", "SaaS", "Board Deck", "Investor", "Growth"],
    bg: "linear-gradient(135deg, #292524 0%, #44403c 100%)",
    prompt:
      'Build a board deck for Series B SaaS company "Meridian AI" covering H1 2026 ARR, customer segments, and growth metrics.',
    sessionId: "b3deb367-dd84-4690-9603-bef4e494b44f",
  },
];

async function main() {
  console.log("Clearing old templates...");
  await prisma.template.deleteMany();

  console.log("Seeding templates...");
  for (let i = 0; i < TEMPLATES.length; i++) {
    const t = TEMPLATES[i];
    await prisma.template.create({
      data: { ...t, sortOrder: i },
    });
    console.log(`  ✓ ${t.slug} → ${t.sessionId?.slice(0, 8)}`);
  }

  console.log(`\nDone — ${TEMPLATES.length} templates seeded.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
