<div align="center">
  <img src="public/og-image.png" alt="OpenSlide — Your All-In-One AI Workspace" width="100%" />

  <br />
  <br />

  <p>
    <a href="https://tryopenslide.com"><strong>tryopenslide.com</strong></a> ·
    <a href="#-quick-start">Quick Start</a> ·
    <a href="#-self-hosting">Self-Hosting</a> ·
    <a href="#-contributing">Contributing</a>
  </p>

  <p>
    <img src="https://img.shields.io/badge/license-AGPL%20v3-blue.svg" alt="AGPL v3 License" />
    <img src="https://img.shields.io/badge/Next.js-15-black?logo=next.js" alt="Next.js 15" />
    <img src="https://img.shields.io/badge/TypeScript-5-blue?logo=typescript" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Supabase-green?logo=supabase" alt="Supabase" />
    <img src="https://img.shields.io/badge/Anthropic-Claude-orange" alt="Claude" />
  </p>

  <br />

  <h3>Your all-in-one AI workspace.<br />Slides, docs, sheets &amp; websites — built on your brand.</h3>

  <br />
</div>

---

## What is OpenSlide?

OpenSlide is an AI agent that builds **slides, documents, spreadsheets, and websites** from a single prompt. You describe what you want; the agent works in real time, calling tools to create and refine output as you watch. Drop in a brand kit (PPTX or PDF) and every output ships in your colors, fonts, and layout patterns.

This is the open-source, self-hostable build. **No credits, no paywalls, no rate limits.** You bring your own API keys; the app stays out of the way.

---

## Features

### Four modes, one workspace

- **Slides** — pitch decks, board reports, lecture decks. Six themes, charts, vision-driven design checks. PDF + PPTX export.
- **Docs** — briefs, reports, proposals, long-form writing. Classifier-routed skills per document category.
- **Sheets** — spreadsheets, financial models, dashboards, trackers. Univer-based editor with a custom Excel-style ribbon (~30 ribbon groups). XLSX export.
- **Websites** — landing pages, microsites, MVPs. Built and previewed live in-browser via WebContainer; click any element to edit it; vision-driven self-review.

### Brand Kits v2

Upload a PPTX or PDF; the agent extracts colors, fonts, logos, and full layout patterns into a generated **skill** (`design-system.md`, `layout-library.md`, `SKILL.md`) injected into every prompt. Comes with version history and rollback.

### Agent loop

- Tool-calling agent built on the Anthropic Messages API (Sonnet 4.6 for slides/docs/sheets, Opus 4.7 for websites by default — both swappable).
- **Subagents** with bounded spawn depth and Redis-gated concurrency — long-horizon work fans out without blocking the main thread.
- **Vision review** — the agent screenshots its own output and critiques it against a rubric.
- **Image search + generation** — `search_images` (Google Images via SearchAPI) and `generate_image` (fal.ai Flux schnell) so the agent never hand-writes broken `<img>` URLs.
- **Compaction** — context auto-summarizes at ~50k tokens via Haiku 4.5.

### Connectors

OAuth integrations for Gmail, Google Drive, Google Sheets, GitHub, and Slack. Plus GitHub import + Vercel/GitHub deploy for the website mode.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript |
| Auth | Supabase Auth (email + Google OAuth) |
| Database | PostgreSQL via Supabase + Prisma 7 |
| Cache | Upstash Redis (session cache + subagent semaphore) |
| AI | Anthropic Claude (Sonnet 4.6 / Opus 4.7 / Haiku 4.5) |
| Sheets | Univer (full spreadsheet engine) |
| Websites | StackBlitz WebContainer (in-browser sandbox) |
| Export | Puppeteer + pdf-lib (PDF), pptxgenjs (PPTX), Univer (XLSX) |
| Storage | Supabase Storage (brand assets, website snapshots, image proxy) |
| Animations | Framer Motion |
| Styling | Tailwind CSS + CSS custom properties |

---

## Quick Start

```bash
git clone https://github.com/archits01/OpenSlide.git
cd OpenSlide
npm install
cp .env.local.example .env.local   # fill in keys (see below)
npx prisma migrate deploy
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Self-Hosting

### Prerequisites

- Node.js 24+
- [Supabase](https://supabase.com) project (free tier works)
- [Upstash Redis](https://upstash.com) database (free tier works)
- [Anthropic API key](https://console.anthropic.com)

### 1. Environment variables

```bash
cp .env.local.example .env.local
```

Required:

```env
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
DATABASE_URL=postgresql://...               # Supabase pooler URL
DIRECT_URL=postgresql://...                 # Supabase direct URL (migrations)
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
WEBSITE_ENV_ENCRYPTION_KEY=...              # 32 bytes base64; openssl rand -base64 32
```

Optional (unlock specific features):

```env
SEARCH_KEY=...           # searchapi.io — enables search_images in website mode
FAL_KEY=...              # fal.ai — enables generate_image (Flux schnell)
PDF_SERVER_URL=...       # standalone PDF/PPTX server (see below)
PDF_SERVER_SECRET=...
```

### 2. Database

```bash
npx prisma migrate deploy
npx prisma generate
```

### 3. Supabase auth trigger

Run this once in your Supabase SQL editor so a `public.users` row is created on signup:

```sql
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

### 4. Supabase Storage buckets

Create three buckets in Supabase → Storage:

| Bucket | Purpose | Public? |
|---|---|---|
| `brand-assets` | Brand kit logos and source files (PPTX/PDF) | Yes |
| `website-images` | Image-search results, proxied for stable URLs | Yes |
| `website-snapshots` | Tier-2 gzipped WebContainer snapshots | No |

For website snapshots you may also need to raise the bucket file-size limit if your sites are large.

### 5. Run

```bash
npm run dev
```

---

## PDF & PPTX export (optional)

PDF and PPTX export run on a standalone Node.js server because Chromium is too large for Vercel. The XLSX export for sheets ships in-process and needs no extra server.

**Locally:**
```bash
cd pdf-server
npm install
node server.js
```

Then add to `.env.local`:
```env
PDF_SERVER_URL=http://localhost:3001
PDF_SERVER_SECRET=any_secret_you_choose
```

**On a VPS (one-time):**
```bash
scp -r pdf-server/ root@your-vps:/opt/openslide-pdf
ssh root@your-vps "cd /opt/openslide-pdf && bash setup.sh"
```

If `PDF_SERVER_URL` is unset, the export buttons gracefully no-op.

---

## Connectors

OpenSlide ships first-class OAuth flows for Gmail, Google Drive, Google Sheets, GitHub, and Slack. Each integration only loads its tools after the user connects, so they don't bloat the agent's context window.

To enable a connector you need OAuth credentials from that provider; see [`src/lib/oauth-configs.ts`](src/lib/oauth-configs.ts) for the redirect URLs and required scopes.

---

## Deploy to Vercel

```bash
npm run build   # verify locally first
vercel --prod
```

Set all env vars in the Vercel dashboard. The chat route is configured with `maxDuration = 300` for long generations.

> **Note:** the website-mode editor needs cross-origin isolation headers. They're already configured in [`next.config.ts`](next.config.ts) under `headers()`. If you proxy this app through your own infra, make sure those headers reach the browser.

---

## Project structure

```
src/
├── app/                          # Next.js pages + API routes
│   ├── editor/[sessionId]/       # Main editor (chat + canvas)
│   ├── presentations/            # Slides library
│   ├── docs/                     # Docs library
│   ├── sheets/                   # Sheets library
│   ├── websites/                 # Websites library
│   ├── brand/                    # Brand kit list + detail + new
│   └── api/                      # Route handlers (chat, sessions, brand-kits, etc.)
├── agent/
│   ├── loop.ts                   # Core agentic loop
│   ├── stream.ts                 # SSE streaming + AbortController
│   ├── compaction.ts             # Context summarization (Haiku 4.5)
│   ├── system-prompt.ts          # Mode-aware prompt assembly
│   ├── subagent/                 # Spawn registry, semaphore
│   └── tools/                    # All agent tools (slides, sheets, website, brand, file ops)
├── components/
│   ├── editor/                   # SlideCanvas, SheetCanvas, website/, sheet/, ChatPanel
│   ├── layout/                   # AppShell, Sidebar
│   └── shared/                   # InputToolbar, KitPicker, AuthModal, etc.
├── lib/
│   ├── brand/                    # Brand-kit writer pipeline (extract, classify, render)
│   ├── webcontainer/             # WebContainer hook + helpers
│   ├── image-providers/          # search-images + image-proxy
│   ├── sheet-engine.ts           # Headless Univer wrapper
│   ├── encryption.ts             # AES-GCM for website env vars
│   ├── redis.ts                  # Session cache + Postgres fallback
│   └── supabase/                 # Server / browser clients
├── skills/                       # Disk-based markdown skills (slide / doc / sheet categories)
└── styles/                       # Design tokens (CSS custom properties) + sheet-theme.css

pdf-server/                       # Standalone Puppeteer export server
prisma/                           # Schema + migrations
```

---

## Troubleshooting

**Build fails with `Cannot find module 'opentype.module'`** — `@univerjs/engine-render` looks for an extension-less alias. Fix:
```bash
ln -sf opentype.module.js node_modules/opentype.js/dist/opentype.module
```
The repo's `postinstall` script attempts this automatically; if it silently failed (often because `prisma generate` errored first), just run the symlink command manually.

**Prisma cache permission errors** — if `prisma generate` complains about `EACCES` on `~/.cache/prisma`, run with a clean cache dir: `HOME=/tmp/prisma-home npx prisma generate`.

**Website mode shows "WebContainer not supported"** — WebContainer requires `SharedArrayBuffer`, which only works on Chromium-based desktop browsers (Chrome, Edge, Arc). Mobile and Safari fall back to read-only.

---

## Contributing

PRs are welcome. For larger changes, open an issue first so we can align on direction.

1. Fork the repo
2. Create a branch (`git checkout -b feature/your-feature`)
3. Commit your changes
4. Open a pull request

See [CONTRIBUTING.md](CONTRIBUTING.md) for more.

---

## License

AGPL v3 — see [LICENSE](LICENSE) for details.

Any use of this code in a public-facing product or service requires you to open source your full codebase under the same license.

---

<div align="center">
  <br />
  <p>Built by <a href="https://github.com/archits01">Archit</a> and Saksham</p>
  <p>Part of <a href="https://tryopenslide.com"><strong>Open Computer</strong></a></p>
  <br />
</div>
