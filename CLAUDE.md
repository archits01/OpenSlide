# OpenSlide — CLAUDE.md

OpenSlide is an all-in-one AI workspace: an agent generates **slides, documents, spreadsheets, and websites** from a single prompt and ships them on the user's brand. This is the open-source self-hosted build — users plug in their own API keys, no credits, no rate limits, no payment infrastructure.

## OSS vs production

This repo is the **open-source** build. A separate paid product runs at tryopenslide.com with credits/billing/launch grants on top of the same code. Anything credit/payment/telemetry-related is intentionally absent here:

- No `credits.ts`, `analytics/`, `BuyCreditsModal`, `PricingModal`, `GrantBanner`, `TierBadge`, `V2OnboardingModal`, `NumberFlow`
- No `/api/credits`, `/api/payments`, `/api/feedback`, `/api/cron/cleanup-website-artifacts`
- No `creditsBalance`, `tier`, `creditsUsed`, `Payment`, `SlideFeedback`, `SessionFeedback` in the Prisma model

If you're adding code, do not introduce these concepts. Self-hosters expect unlimited usage gated only by their own API keys.

---

## Running the project

```bash
npm install
cp .env.local.example .env.local   # fill in keys
npx prisma migrate deploy
npx prisma generate
npm run dev                        # http://localhost:3000
npm run build                      # production build
npx tsc --noEmit                   # type-check
npx vitest run                     # tests
```

If `prisma generate` fails with `EACCES` on the cache, run with a clean cache:
```bash
HOME=/tmp/prisma-home npx prisma generate
```

---

## Stack

- **Next.js 16** (App Router), TypeScript, Tailwind CSS
- **Geist** font (`geist` package — `GeistSans` + `GeistMono`)
- **@hugeicons/react** — primary icon set
- **Supabase Auth** (`@supabase/supabase-js` + `@supabase/ssr`) — email/password + Google OAuth
- **Prisma 7** + `@prisma/adapter-pg` — ORM over Postgres
- **@upstash/redis** — session cache (1hr TTL, falls back to Postgres on miss); also gates subagent concurrency
- **framer-motion** — import from `"framer-motion"`, NOT `"motion/react"`
- **gray-matter** — parses SKILL.md frontmatter
- **react-markdown** — renders assistant messages
- **Anthropic SDK** — direct calls (no proxy in OSS)
- **@univerjs/*** — full sheets engine for sheets mode (~30 packages)
- **@webcontainer/api + @xterm/*** — in-browser sandbox for website mode
- All components are custom — Tailwind + inline CSS vars. **No shadcn.**

---

## Project structure

```
pdf-server/                         # Standalone Node.js export server (runs on a VPS, NOT Vercel)
├── server.js                       # Express: POST /generate-pdf, /generate-pptx, GET /health
├── package.json                    # deps: express, puppeteer, pptxgenjs, pdf-lib
├── ecosystem.config.js             # PM2 config
└── setup.sh                        # One-time VPS setup (Ubuntu 22.04)

src/
├── app/
│   ├── layout.tsx                  # Fonts, metadata (title/OG/Twitter/JSON-LD), AppShell wrapper
│   ├── page.tsx                    # Explore page — mode tabs, templates grid, prompt bar
│   ├── auth/callback/route.ts      # Supabase OAuth code exchange
│   ├── presentations/page.tsx      # Slides library
│   ├── docs/page.tsx               # Docs library
│   ├── sheets/page.tsx             # Sheets library
│   ├── websites/page.tsx           # Websites library
│   ├── assets/page.tsx             # Assets library
│   ├── brand/                      # Brand kits v2 — list, [id], new, _design
│   ├── editor/[sessionId]/page.tsx # Full editor (chat + canvas)
│   ├── settings/api-keys/          # API key management UI
│   ├── opengraph-image.png         # OG image (auto-versioned by Next.js convention)
│   ├── twitter-image.png           # Twitter card (auto-versioned)
│   ├── manifest.ts                 # PWA manifest
│   ├── sitemap.ts                  # SEO sitemap (4 modes + brand + legal)
│   ├── robots.ts                   # robots.txt with /api /editor /view blocked
│   └── api/
│       ├── chat/route.ts           # POST SSE agent stream | GET fetch session
│       ├── sessions/                # List / create / fetch / update / delete
│       ├── profile/route.ts        # User profile (id, email, fullName, avatarUrl)
│       ├── brand/route.ts          # Legacy v1 brand config (BrandConfig)
│       ├── brand-kits/             # v2 brand kit CRUD + extract + thumbnail + versions
│       ├── subagent/run/route.ts   # Subagent execution (called by spawn_subagent tool)
│       ├── templates/route.ts      # Template gallery
│       ├── export/{pdf,pptx,xlsx}/ # Export proxies
│       ├── deploy/{github,vercel}/ # Website deploy targets
│       ├── import/github/          # Import a GitHub repo as a website session
│       ├── website-{...}/          # Website-mode endpoints (env-vars, snapshot, screenshot, build-error, shell-result, preflight, sandbox)
│       └── admin/sheet-routing-log # Sheet-classifier observability
├── agent/
│   ├── loop.ts                     # Core agentic loop (max 15 iterations)
│   ├── stream.ts                   # SSE client + AbortController integration
│   ├── events.ts                   # AgentEventBus — typed events, subscribe/emit
│   ├── system-prompt.ts            # Mode-aware prompt assembly (slides/docs/sheets)
│   ├── compaction.ts               # Context summarization (Haiku 4.5) at ~50k tokens
│   ├── subagent/
│   │   ├── registry.ts             # In-memory parent↔child subagent state
│   │   ├── semaphore.ts            # Redis token bucket — caps concurrent Anthropic calls
│   │   ├── spawn.ts                # Spawn-depth limits + sanitization
│   │   └── types.ts
│   └── tools/
│       ├── index.ts                # ToolProvider interface + global registry
│       ├── types.ts                # AgentTool shape
│       ├── slide-provider.ts       # Registers slide tools (slides mode)
│       ├── sheet-provider.ts       # Registers sheet tools (sheets mode)
│       ├── website-provider.ts     # Registers website tools (website mode)
│       ├── website-system-prompt.ts# Website-only system prompt
│       ├── theme-defs.ts           # Pure THEME_DEFINITIONS (no prisma — safe in client bundles)
│       ├── set-theme.ts            # Lazy prisma import for from_brand_kit branch
│       ├── create-slide.ts | update-slide.ts | delete-slide.ts | reorder-slides.ts
│       ├── create-outline.ts | create-doc-outline.ts
│       ├── create-sheet.ts | update-sheet.ts | sheet-helpers.ts
│       ├── doc-page-tools.ts       # create_page / update_page / delete_page (docs mode)
│       ├── create-file.ts | update-file.ts | patch-file.ts | delete-file.ts
│       ├── read-file.ts | read-files.ts | list-files.ts
│       ├── run-shell-command.ts | check-types.ts
│       ├── search-images.ts        # SearchAPI Google Images proxied through Supabase Storage
│       ├── generate-image.ts       # fal.ai Flux schnell
│       ├── review-output.ts        # Vision self-review
│       ├── fetch-logo.ts | fetch-url.ts
│       ├── read-brand-kit.ts | update-brand-skill.ts
│       ├── spawn-subagent.ts | get-subagent-result.ts
│       ├── activate-integration.ts # Loads OAuth tools on demand
│       ├── github.ts | gmail-send.ts | google-drive.ts | google-sheets.ts
│       └── tool-registry.ts        # Resolves tool by name + auth gating
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx            # Hides sidebar on /editor /view routes
│   │   ├── Sidebar.tsx             # Nav + user avatar
│   │   └── Footer.tsx
│   ├── editor/
│   │   ├── ChatPanel.tsx           # Streaming messages + tool cards
│   │   ├── SlideCanvas.tsx         # Slide renderer + CodeView
│   │   ├── SheetCanvas.tsx         # Univer-mounted spreadsheet
│   │   ├── sheet/                  # Sheet sub-components: ribbon, formula bar, headers, etc.
│   │   ├── website/                # Website preview, env-vars panel, file tree
│   │   ├── EditorTopBar.tsx        # Title + Present + connectors + avatar
│   │   ├── CanvasToolbar.tsx       # Slide actions (Download → PDF/PPTX)
│   │   ├── DocsToolbar.tsx | SheetsToolbar.tsx | WebsiteToolbar.tsx
│   │   ├── OutlineCard.tsx         # Plan/outline review card
│   │   └── mobile/MobileEditorShell.tsx
│   ├── shared/
│   │   ├── AuthModal.tsx           # Sign in/up (Google OAuth + email/password)
│   │   ├── InputToolbar.tsx        # Textarea + mode tabs + leftAccessory (KitPicker)
│   │   ├── KitPicker.tsx           # Brand kit selector (slides only)
│   │   ├── AssetPickerModal.tsx
│   │   ├── AttachmentPopover.tsx
│   │   ├── ConnectorModal.tsx | ConnectorPopover.tsx
│   │   ├── SettingsModal.tsx       # Profile + Connections tabs
│   │   ├── AgentQuestionCard.tsx   # Preflight Q&A for website mode
│   │   ├── Tooltip.tsx | ShiningText.tsx | InfoCard.tsx
│   └── connect-card.tsx            # Inline reconnect-required card
├── lib/
│   ├── supabase/{client,server}.ts # createBrowserClient (lazy) | createServerClient
│   ├── db.ts                       # Prisma singleton
│   ├── redis.ts                    # Session cache + Postgres fallback
│   ├── types.ts                    # Session, Slide, Message, Outline, etc.
│   ├── api-helpers.ts              # requireAuth, isResponse helpers
│   ├── api-key.ts | crypto.ts | encryption.ts
│   ├── skills-loader.ts            # Loads + caches SKILL.md files
│   ├── slide-html.ts               # HTML rendering helpers + theme application
│   ├── sheet-engine.ts             # Headless Univer wrapper
│   ├── sheet-html.ts               # Sheet → HTML for canvas preview
│   ├── shell-sync.ts               # Server-side shell command result intake
│   ├── webcontainer/               # useWebContainer hook + edit-mode-script + helpers
│   ├── image-providers/            # search-images + image-proxy + Supabase upload
│   ├── website-templates.ts        # Starter templates for website mode
│   ├── brand/                      # Brand kit v2: types, writer pipeline, snapshot, load
│   ├── connectors.ts               # Connector list (Gmail, Drive, Sheets, GitHub, Slack)
│   ├── oauth-configs.ts            # OAuth client configs per provider
│   ├── refresh-token.ts | get-valid-token.ts | token-cache.ts
│   ├── session-title.ts            # Generates a title from first user message
│   ├── export-common.ts            # Shared export validation
│   ├── brand-defaults.ts           # Default brand config when no kit selected
│   └── hooks/useProfile.ts         # Shared client profile context
├── prompts/                        # Mode-specific prompt fragments (slides/docs/sheets)
├── skills/
│   ├── presentation/               # Top-level slide skill
│   ├── design/                     # Design system skill
│   ├── slide-categories/           # Per-category slide skills + classifier
│   ├── DocSkills/                  # Document skills + classifier
│   ├── SheetSkills/                # Sheet skills + classifier + routing log
│   ├── general-deck/               # Default deck skill
│   └── business_corporate/         # Corporate deck skill
└── styles/globals.css              # Design tokens + sheet-theme.css

middleware.ts                       # Refreshes Supabase tokens, guards /editor /websites /docs /sheets /presentations /brand /assets /settings
```

---

## Design system

All tokens are CSS custom properties in `src/styles/globals.css`. Always use them — never hardcode colors.

```
--bg            #FFFFFF              card / content surface
--app-bg        #F9FAFB              shell background
--bg2           #F4F4F5
--border        rgba(0,0,0,0.08)
--border-hover  rgba(0,0,0,0.12)
--border-strong rgba(0,0,0,0.18)
--text          #09090B
--text2         #71717A
--text3         #A1A1AA
--accent        #C2185B              claret
--accent-hover  #AD1457
--accent-soft   rgba(194,24,91,0.08)
--green / --red / --blue / --warn  (each with -soft variant)
--r-sm 6px  --r-md 8px  --r-lg 12px  --r-xl 14px  --r-2xl 16px
```

---

## Authentication

```
auth.users (Supabase-managed)
    ↓ DB trigger handle_new_user (set up once via SQL — see README)
public.users (id UUID, email, full_name, avatar_url, timestamps)
    ↓ FK onDelete: SetNull
public.sessions (userId UUID FK → users.id)
    ↓ FK onDelete: Cascade
public.slides / public.outlines
```

**Critical rule:** never call `createClient()` at component render time — it crashes SSR prerender. Always use a lazy ref:
```ts
const supabaseRef = useRef<SupabaseClient | null>(null);
function getSupabase() {
  if (!supabaseRef.current) supabaseRef.current = createClient();
  return supabaseRef.current;
}
```

Use `src/lib/supabase/server.ts` in route handlers and Server Components. Use `src/lib/supabase/client.ts` (via lazy ref) in Client Components.

### AuthModal (`src/components/shared/AuthModal.tsx`)
- Props: `open`, `onClose`, `onSuccess`
- Google OAuth + email/password with animated full-name field on signup
- Inline error display, loading states

### Google OAuth setup
- Add `http://localhost:3000/auth/callback` (and your prod domain) as redirect URLs in Supabase
- Configure Google Cloud Console OAuth credentials in Supabase

---

## Database

### Prisma models (high level)

- `User` — Supabase auth shadow row
- `BrandConfig` — legacy v1 brand config (kept for backward compat)
- `BrandKit` — v2 brand system (markdown skill + variables)
- `BrandKitVersion` — append-only version history
- `Session` — chat session, type ∈ {slides, docs, sheets, website}
- `Slide` — slide rows; for sheets sessions also stores `workbookJson` + `workbookSheetCount`
- `Outline` — plan/outline shown before slides build
- `ClassificationEvent` — telemetry on classifier outcomes
- `ApiKey` — user-managed OpenSlide API keys (for programmatic use)
- `UserConnection` — OAuth tokens per provider
- `Template` — gallery templates per mode

### Migrations

The `prisma/migrations/20260430000000_v2_workspace/migration.sql` migration is **idempotent** — it uses `IF NOT EXISTS` and FK existence checks so it works for both fresh installs and existing self-hosters who already applied parts via `prisma db push`.

### RLS

Enabled on all tables. Sessions: `auth.uid() = user_id`. Slides/outlines: ownership via parent session JOIN. Prisma uses postgres superuser → bypasses RLS (intentional). Public Supabase REST API is blocked by default.

### Session persistence

- Postgres is the **primary** store (durable, no payload limits)
- Redis is a **cache** layer (1hr TTL, best-effort updates after Postgres write)
- All writes go to both via `saveSession()`
- `listSessions(limit, userId)` reads directly from Postgres

---

## API routes

All require a valid Supabase session — return **401** otherwise.

| Route | Method | Notes |
|---|---|---|
| `/api/chat` | POST | SSE agent stream |
| `/api/chat` | GET | Fetch session state |
| `/api/sessions` | GET / POST / DELETE | List / create / delete |
| `/api/sessions/[sessionId]` | GET / PATCH | Fetch / update |
| `/api/profile` | GET / PATCH | Returns `{id, email, fullName, avatarUrl}` |
| `/api/brand-kits` | GET / POST | List / create |
| `/api/brand-kits/[id]` | GET / PATCH / DELETE | Read / update / delete kit |
| `/api/brand-kits/[id]/versions` | GET / POST | History + rollback |
| `/api/brand-kits/extract` | POST | Vision-driven extraction pipeline |
| `/api/subagent/run` | POST | Internal — called by spawn_subagent |
| `/api/website-*` | Various | Website-mode endpoints |
| `/api/export/{pdf,pptx,xlsx}` | POST | Proxies (xlsx is in-process; pdf/pptx need PDF_SERVER_URL) |
| `/api/deploy/{github,vercel}` | POST | Deploy a website session to GH/Vercel |
| `/api/import/github` | POST | Import a GH repo as a website session |
| `/api/templates` | GET | Template gallery |

---

## Agent architecture

### How a turn works

1. `POST /api/chat` receives `{ message, sessionId, sessionType, ... }`
2. Auth check → loads/creates session (Redis hit, then Postgres fallback)
3. Mode classifier routes to the right system prompt + tool subset
4. `runAgentLoop()` calls Anthropic Messages API with full history + tools, streams SSE back
5. Loop continues until `stop_reason: end_turn` (no tool calls) or hits `MAX_ITERATIONS = 15`
6. Each tool call updates session state in memory and emits a typed event
7. After each iteration, `onIterationComplete` checkpoints state to Postgres so a Vercel hard-kill can't destroy completed work
8. Final `saveSession` persists everything once the loop ends

### Token usage

`UsageAccumulator` in `loop.ts` tracks tokens for caller observability (returned in `LoopResult.tokenUsage`) but **never charges credits**. OSS users plug in their own keys; cost is on them.

### SSE event types

Defined in [`src/agent/events.ts`](src/agent/events.ts). High-level groups:

```
session_id, text_delta, text_done, thinking
tool_call, tool_input_ready, tool_result
outline_created, slide_created, slide_updated, slide_deleted, slides_reordered
theme_changed, logo_fetched, research_progress
website_file_*, website_shell_*, website_sandbox_state
done, error, connection_required
```

### System prompt rules

- Agent calls `create_outline` (slides) / `create_doc_outline` (docs) first, waits for approval
- After outline approval, brief acknowledgment only — outline is rendered as a card automatically
- After all content built, brief confirm only — no bullet-point summary

### Subagents

`spawn_subagent` creates a child agent with a constrained tool set; `get_subagent_result` blocks for the result. Spawn depth is capped at `MAX_SPAWN_DEPTH = 2`. Concurrency is gated by a Redis token bucket in `subagent/semaphore.ts` — without Redis configured, falls back to in-memory counting.

---

## Modes

### Slides

Stored as `{ id, index, title, content (HTML), layout, theme, notes }`. Six themes: `minimal | dark-pro | academic | bold | executive | editorial`. Defined in [`src/agent/tools/theme-defs.ts`](src/agent/tools/theme-defs.ts).

**Critical SlideCanvas layout rules:**
- `scrollRef` always on the outermost `absolute inset-0` div, never conditionally rendered
- Empty state lives **inside** the scrollRef div so ResizeObserver always sets up on first mount
- `containerWidth` initialized to `800` (never 0) to prevent invisible slides before ResizeObserver fires
- `slideWidth = containerWidth - 48`, `scale = slideWidth / 1280` — derive from `slideWidth`, not `containerWidth`

### Docs

Document outline + pages. Tools: `create_doc_outline`, `create_page`, `update_page`, `delete_page`. Skill: `src/skills/DocSkills/`.

### Sheets

Univer JSON workbook stored on the first `Slide` row of a sheets-type session (`workbookJson` + `workbookSheetCount`). Tools: `create_sheet`, `update_sheet`. Custom Excel-style ribbon in [`src/components/editor/sheet/ribbon/`](src/components/editor/sheet/ribbon/) with ~30 ribbon groups across Home / Insert / Page / Formula / Data / View tabs. Skills classifier-routed: financial-models, data-analysis, dashboards, etc.

### Websites

Files stored in `Session.websiteFilesJson` (`Record<path, content>`). Run live in-browser via [@webcontainer/api](https://webcontainer.io). Tools: `create_file`, `update_file`, `patch_file` (preferred for edits), `delete_file`, `read_file`, `list_files`, `run_shell_command`, `search_images`, `generate_image`, `review_output`, `fetch_url`.

**Click-to-edit:** [`src/lib/webcontainer/edit-mode-script.ts`](src/lib/webcontainer/edit-mode-script.ts) is injected into every WC sandbox at `/__opensl-edit.js`. Alt+hover outlines elements, alt+click `postMessage`s the selector + text to the parent. The agent must include `<script src="/__opensl-edit.js" defer></script>` in every HTML head — enforced by the system prompt.

**COOP/COEP:** website mode requires cross-origin isolation. Headers are set in [`next.config.ts`](next.config.ts). Navigation INTO `/editor/:path*` for website mode must be a full page load (`window.location.assign`), not `router.push` — SPA transitions leave the editor without `SharedArrayBuffer`.

---

## InputToolbar

[`src/components/shared/InputToolbar.tsx`](src/components/shared/InputToolbar.tsx)

- Buttons: Attachment, Voice, Send/Stop (each `w-9 h-9`)
- Mode tabs: slides / docs / sheets / website
- `leftAccessory` slot — used to mount KitPicker (slides only)
- `prefill` prop — used by website click-to-edit to pre-fill chat with "Change the {tag} '{text}' — "

The send button blob animation is portalled to `document.body` via `createPortal` — necessary to escape AppShell's `motion.div` whose CSS transform breaks `position: fixed` children.

---

## Error handling

- `toClientError(err)` in `src/app/api/chat/route.ts` maps Prisma/timeout/network errors to user-friendly strings. Raw errors never reach the client.
- Prisma `$transaction()` uses `{ timeout: 15000 }` — default 5000ms is too short for slide createMany through PgBouncer.
- `ChatMessage.role` has three values: `"user" | "assistant" | "error"`. Error role renders as a centered red pill, never as an assistant bubble.

---

## Environment variables

```bash
# Required
ANTHROPIC_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=                    # Supabase pooler (PgBouncer)
DIRECT_URL=                      # Supabase direct (migrations)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
WEBSITE_ENV_ENCRYPTION_KEY=      # 32 bytes base64; openssl rand -base64 32

# Optional — unlock features
SEARCH_KEY=                      # searchapi.io — search_images tool
FAL_KEY=                         # fal.ai — generate_image tool (Flux schnell)
PDF_SERVER_URL=                  # Standalone PDF/PPTX server URL
PDF_SERVER_SECRET=               # Bearer secret matching pdf-server/.env

# Tuning
THINKING_BUDGET=8192             # Slides/docs/sheets extended-thinking budget
THINKING_BUDGET_WEBSITE=8192     # Website mode (independent — Opus needs more)
NEXT_PUBLIC_APP_URL=             # Used in canonical/OG URLs
```

---

## Common tasks

**Add a new slide tool:** create `src/agent/tools/my-tool.ts` exporting an `AgentTool`, import + add it to `SlideToolProvider.getTools()` in `slide-provider.ts`.

**Add a new SKILL.md:** create `src/skills/<name>/SKILL.md` with YAML frontmatter (`name`, `description`). Picked up automatically on next server start.

**Change the model:** per-mode split lives in [`src/agent/loop.ts`](src/agent/loop.ts). Default: website uses `claude-opus-4-7`; slides/docs/sheets use `claude-sonnet-4-6`. Compaction stays on `claude-haiku-4-5-20251001` in [`src/agent/compaction.ts`](src/agent/compaction.ts).

**Change max iterations:** edit `MAX_ITERATIONS` in `loop.ts` (default 15).

**Add a new theme:** add to `THEME_DEFINITIONS` in `theme-defs.ts` and update `buildSlideStyles()` in `SlideCanvas.tsx`.

**Add a column to users:** add field to `User` model in `prisma/schema.prisma`, write a new migration in `prisma/migrations/`, run `prisma migrate deploy`.

**Deploy to Vercel:** `vercel --prod`. Set all env vars in Vercel dashboard. `maxDuration = 300` on chat route supports long generations. Make sure COEP/COOP headers in `next.config.ts` reach the browser through any proxy.

---

## PDF / PPTX export server (`pdf-server/`)

Runs on a VPS (NOT Vercel — Chromium ~300MB exceeds the 50MB serverless limit). Vercel routes proxy to it.

- **Stack:** Express + Puppeteer + pptxgenjs + pdf-lib
- **PDF:** Puppeteer `page.pdf()` per slide → merged with pdf-lib → vector PDF, selectable text
- **PPTX:** Puppeteer screenshot at 2x → full-bleed image per slide via pptxgenjs → pixel-perfect, text not selectable
- **Auth:** `Authorization: Bearer <PDF_SERVER_SECRET>`
- **Locally:** `node pdf-server/server.js` and set `PDF_SERVER_URL=http://localhost:3001`
- If `PDF_SERVER_URL` is unset, export gracefully no-ops

### One-time VPS setup
```bash
scp -r pdf-server/ root@<VPS_IP>:/opt/openslide-pdf
ssh root@<VPS_IP>
cd /opt/openslide-pdf && bash setup.sh   # prints PDF_SERVER_SECRET
```

### Updating after code changes
```bash
scp pdf-server/server.js root@<VPS_IP>:/opt/openslide-pdf/
ssh root@<VPS_IP> "pm2 restart openslides-pdf"
```

---

## Known issues / gotchas

- **`opentype.module` resolution:** `@univerjs/engine-render` looks for an extension-less alias. The `postinstall` script creates the symlink (`ln -sf opentype.module.js node_modules/opentype.js/dist/opentype.module`). If the build fails with `Cannot find module 'opentype.module'`, run that command manually.
- **AppShell motion.div:** wraps the sidebar with `<motion.div animate={{ width }}>` which creates a CSS transform containing block — any `position: fixed` child gets clipped. Use `createPortal(el, document.body)` to escape it.
- **Prisma cache permissions:** if `prisma generate` fails with `EACCES` on `~/.cache/prisma`, set `HOME=/tmp/prisma-home` for the command.
- **Prisma shadow DB + `auth.users`:** migrations touching Supabase's `auth.users` fail in `migrate dev --create-only`'s shadow DB. Use `prisma db push --accept-data-loss` for schema sync, or write the SQL by hand and apply via `prisma db execute --file`.
- **WebContainer support:** requires `SharedArrayBuffer` — only works on Chromium-based desktop browsers (Chrome, Edge, Arc). Safari and mobile fall back to read-only.

---

## Pending / not yet built

| Feature | Notes |
|---|---|
| Website-mode undo/redo | `patch_file` ships small surgical edits; client-side undo stack is a follow-up |
| `/settings` landing page | Gear icon links to it but the page is a stub |
| Memory / recall | Persistent agent memory across sessions |
| Public sharing | `isPublic` boolean on session, `/view/[sessionId]` public route, share modal |
| Collaboration | Yjs / PartyKit — deferred |
