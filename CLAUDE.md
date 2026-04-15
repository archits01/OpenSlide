# OpenSlide — CLAUDE.md

AI-powered presentation and document builder. Users describe what they want in a chat interface; an agent creates and updates slides in real time via tool calls. Built as a single Next.js 15 project with Supabase Auth + Postgres + Redis.

## Running the project

```bash
npm run dev          # http://localhost:3000
npm run build        # production build (verify before deploying)
npx tsc --noEmit     # type-check only
```

Copy `.env.example` to `.env.local` and fill in your values before running.

## Stack

- **Next.js 15** (App Router), TypeScript, Tailwind CSS
- **Geist** font (`geist` npm package — `GeistSans` + `GeistMono`)
- **@hugeicons/react** — icon library. Always use `weight="light"`. Never mix weights.
- **Supabase Auth** (`@supabase/supabase-js` + `@supabase/ssr`) — email/password + Google OAuth
- **Prisma 7** + `@prisma/adapter-pg` — ORM for Postgres (Supabase)
- **@upstash/redis** — session cache (1hr TTL, falls back to Postgres on miss)
- **@anthropic-ai/sdk** — direct Anthropic API calls (set `ANTHROPIC_API_KEY` in env)
- **framer-motion** — import from `"framer-motion"`, NOT `"motion/react"`
- **gray-matter** — parses SKILL.md frontmatter
- **react-markdown** — renders assistant messages in ChatPanel
- No shadcn. All components are custom, built with Tailwind + CSS custom properties.

## Project structure

```
pdf-server/                         # Standalone Node.js export server (optional, NOT Vercel)
├── server.js                       # Express: POST /generate-pdf, POST /generate-pptx, GET /health
├── package.json                    # deps: express, puppeteer, pptxgenjs, pdf-lib
├── ecosystem.config.js             # PM2 config
└── setup.sh                        # One-time VPS setup script (Ubuntu 22.04)

src/
├── app/
│   ├── layout.tsx                  # Geist font vars, metadata, AppShell wrapper
│   ├── page.tsx                    # Explore page — auth-gated, caches pending prompt in sessionStorage
│   ├── auth/callback/route.ts      # Supabase OAuth code exchange
│   ├── editor/[sessionId]/page.tsx # Full editor (chat + slides)
│   └── api/
│       ├── chat/route.ts           # POST: SSE agent stream | GET: fetch session
│       ├── sessions/route.ts       # GET list | POST create | DELETE remove
│       └── export/
│           ├── pdf/route.ts        # Proxies to PDF_SERVER_URL/generate-pdf
│           └── pptx/route.ts       # Proxies to PDF_SERVER_URL/generate-pptx
├── agent/
│   ├── loop.ts                     # Core agentic loop (max 15 iterations)
│   ├── stream.ts                   # Anthropic SDK streaming wrapper
│   ├── events.ts                   # AgentEventBus — typed events, subscribe/emit
│   ├── system-prompt.ts            # Builds system prompt, injects skills
│   ├── compaction.ts               # Context compaction at ~50k tokens
│   ├── mcp/
│   │   ├── client.ts               # MCPClient — listTools / callTool
│   │   └── registry.ts             # Auto-registers if MCP_SERVER_URL is set
│   └── tools/
│       ├── index.ts                # ToolProvider interface + global registry
│       ├── slide-provider.ts       # Registers all slide tools on import
│       ├── create-slide.ts
│       ├── update-slide.ts
│       ├── delete-slide.ts
│       ├── reorder-slides.ts
│       ├── set-theme.ts            # Also exports THEME_DEFINITIONS
│       ├── fetch-logo.ts
│       ├── google-drive.ts         # Google Drive connector tool
│       ├── google-sheets.ts        # Google Sheets connector tool
│       ├── github.ts               # GitHub connector tool
│       └── gmail-send.ts           # Gmail send tool
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx            # Hides sidebar on /editor/* routes
│   │   └── Sidebar.tsx             # Nav + user avatar/email from Supabase auth
│   ├── editor/
│   │   ├── ChatPanel.tsx           # Streaming messages + tool cards
│   │   ├── SlideCanvas.tsx         # Slide list renderer + CodeView
│   │   ├── EditorTopBar.tsx        # Title + actions (60px)
│   │   └── CanvasToolbar.tsx       # Canvas actions — Download PDF/PPTX
│   └── shared/
│       ├── AuthModal.tsx           # Sign in / sign up overlay
│       ├── InputToolbar.tsx        # Textarea + send/stop button
│       └── LegalLayout.tsx         # Shared layout for legal pages
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # createBrowserClient — NEVER call at render, use lazy ref
│   │   └── server.ts               # createServerClient with cookies
│   ├── db.ts                       # Prisma singleton
│   ├── redis.ts                    # Session CRUD (Upstash cache layer + Prisma fallback)
│   ├── types.ts                    # Session, Slide, Message, Outline types
│   └── utils.ts                    # cn() helper (clsx + tailwind-merge)
├── skills/                         # Presentation & document skill definitions (SKILL.md files)
└── styles/globals.css              # All CSS custom properties (design tokens)
middleware.ts                       # Refreshes Supabase tokens, guards /editor/* routes
```

## Design system

All tokens are CSS custom properties in `src/styles/globals.css`. Always use them — never hardcode colors.

```
--bg            #FFFFFF
--app-bg        #F9FAFB
--bg2           #F4F4F5
--border        rgba(0,0,0,0.08)
--border-hover  rgba(0,0,0,0.12)
--border-strong rgba(0,0,0,0.18)
--text          #09090B
--text2         #71717A
--text3         #A1A1AA
--accent        #4338CA
--accent-hover  #3730A3
--accent-soft   rgba(67,56,202,0.06)
--accent-text   #312E81
--green         #16A34A   --green-soft  rgba(22,163,74,0.08)
--red           #DC2626   --red-soft    rgba(220,38,38,0.08)
--r-sm 6px  --r-md 8px  --r-lg 12px  --r-xl 14px  --r-2xl 16px
```

## Authentication

### Key rules
- **Never call `createClient()` at component render time** — causes SSR crash. Always use a lazy ref:
  ```ts
  const supabaseRef = useRef<SupabaseClient | null>(null);
  function getSupabase() {
    if (!supabaseRef.current) supabaseRef.current = createClient();
    return supabaseRef.current;
  }
  ```
- Use `src/lib/supabase/server.ts` in route handlers and Server Components
- Use `src/lib/supabase/client.ts` (via lazy ref) in Client Components

### Auth flow
1. Unauthenticated user types prompt → saved to `sessionStorage`
2. AuthModal opens → user signs in/up
3. `onSuccess` reads cached prompt → navigates to editor
4. Direct `/editor/*` without auth → middleware redirects to `/?auth=1`

## AI / Agent

### How the agent works
- Model: `claude-sonnet-4-6` (change in `src/agent/loop.ts`)
- Called directly via `@anthropic-ai/sdk` — set `ANTHROPIC_API_KEY` in env
- Max iterations: 15 (change `MAX_ITERATIONS` in `src/agent/loop.ts`)
- Context compaction kicks in at ~50k tokens (`src/agent/compaction.ts`)
- Streaming is handled in `src/agent/stream.ts` via the Anthropic SDK stream API

### How a turn works
1. `POST /api/chat` receives `{ message, sessionId }`
2. Auth check → loads/creates session from Redis/Postgres
3. `runAgentLoop()` runs — calls Anthropic SDK with full history + tools, streams SSE back
4. Loop continues until no tool calls or max 15 iterations
5. After loop ends, saves updated session to Redis + Postgres

### SSE event types (streamed to browser)
```
session_id | text_delta | text_done | thinking | tool_call | tool_input_ready
tool_result | outline_created | slide_created | slide_updated | slide_deleted
slides_reordered | theme_changed | error | done
```

## Slide rendering

Slides are stored as `{ id, index, title, content (HTML), layout, theme, notes }`.
Content is raw HTML rendered in SlideCanvas using semantic CSS classes:
`.slide-headline`, `.slide-heading`, `.slide-subtitle`, `.slide-bullets`, `.slide-stat`,
`.stat-number`, `.stat-label`, `.slide-split`, `.slide-split-left`, `.slide-split-right`

Four themes: `minimal` | `dark-pro` | `academic` | `bold`
Defined in `src/agent/tools/set-theme.ts` (`THEME_DEFINITIONS`).

### SlideCanvas layout rules (important)
- `scrollRef` is always on the **outermost** `absolute inset-0` div
- `containerWidth` initializes to `800` — prevents invisible slides before ResizeObserver fires
- Scale math: `slideWidth = containerWidth - SLIDE_PADDING_X * 2`, then `scale = slideWidth / 1280`
- Scale is derived from `slideWidth`, NOT `containerWidth`

## Session persistence

- Redis (Upstash) is a 1hr cache layer — always check Redis first, fall back to Postgres
- All writes go to both Redis and Postgres via `saveSession()`
- `listSessions()` goes directly to Postgres (list changes too frequently to cache)

## MCP integrations

Set `MCP_SERVER_URL` in your env to activate. The MCP client (`src/agent/mcp/client.ts`) auto-registers available tools and exposes them to the agent. Without `MCP_SERVER_URL` set, MCP is silently disabled.

## PDF export server

Runs on a VPS or locally — Chromium is too large for Vercel serverless.

- **Local dev**: `cd pdf-server && npm install && node server.js` then set `PDF_SERVER_URL=http://localhost:3001`
- **VPS**: copy `pdf-server/` to server, run `bash setup.sh`, PM2 keeps it alive

## Common tasks

**Add a new slide tool:**
Create `src/agent/tools/my-tool.ts` exporting an `AgentTool`, import and add it to `SlideToolProvider.getTools()` in `slide-provider.ts`.

**Add a new SKILL.md:**
Create `src/skills/<name>/SKILL.md` with YAML frontmatter (`name`, `description`). Picked up automatically on next server start.

**Change the model:**
Edit `model` in `src/agent/loop.ts`.

**Change max iterations:**
Edit `MAX_ITERATIONS` in `src/agent/loop.ts`.

**Add a new theme:**
Add to `THEME_DEFINITIONS` in `src/agent/tools/set-theme.ts` and update `buildSlideStyles()` in `SlideCanvas.tsx`.

**Add a column to the database:**
Add field to the relevant model in `prisma/schema.prisma`, run `npx prisma migrate dev --name <name>`.

**Deploy to Vercel:**
`vercel --prod`. Set all env vars in Vercel dashboard. `maxDuration = 300` on chat route supports long generations.

## Environment variables

```bash
ANTHROPIC_API_KEY=                   # Required — your Anthropic API key
NEXT_PUBLIC_SUPABASE_URL=            # Required — https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=       # Required — public anon key
DATABASE_URL=                        # Required — Supabase pooler (PgBouncer)
DIRECT_URL=                          # Required — Supabase direct (for migrations)
UPSTASH_REDIS_REST_URL=              # Required — Upstash Redis REST URL
UPSTASH_REDIS_REST_TOKEN=            # Required — Upstash Redis token
PDF_SERVER_URL=                      # Optional — URL of pdf-server (e.g. http://localhost:3001)
PDF_SERVER_SECRET=                   # Optional — Bearer secret for pdf-server
MCP_SERVER_URL=                      # Optional — leave blank to disable MCP
THINKING_BUDGET=0                    # Optional — extended thinking tokens (0 = disabled)
NEXT_PUBLIC_APP_URL=                 # Optional — your deployment URL
```

## Known gotchas

- **AppShell motion.div**: The sidebar uses `<motion.div animate={{ width }}>` which creates a CSS transform containing block. Any `position: fixed` child will be clipped — use `createPortal(el, document.body)` to escape it.
- **Prisma timeout**: `$transaction()` uses `{ timeout: 15000 }` — the default 5000ms is too short through PgBouncer.
- **Flaky build error**: `PageNotFoundError: Cannot find module for page: /auth/callback` — intermittent Next.js issue, retry the build once and it clears.
