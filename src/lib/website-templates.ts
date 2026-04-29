/**
 * Website mode starter templates.
 *
 * Each template has:
 *  - GitHub repo to fetch real files from (with in-memory cache)
 *  - Local `files` fallback used when GitHub is unavailable
 *  - `scaffoldHint` injected into the system prompt so the agent knows
 *    which file to modify first and what the entry point is
 *
 * Adding a new template: add an entry to WEBSITE_TEMPLATES and add a
 * keyword check in pickTemplate().
 */

export interface WebsiteTemplate {
  name: string;
  label: string;
  description: string;
  githubRepo: string;
  /** Lines added to the system prompt describing the pre-mounted scaffold. */
  scaffoldHint: string;
  /** Local fallback files — used if GitHub fetch fails. */
  files?: Record<string, string>;
}

// ─── Templates ────────────────────────────────────────────────────────────────

export const WEBSITE_TEMPLATES: WebsiteTemplate[] = [
  {
    name: "expo",
    label: "Expo (React Native)",
    description: "Cross-platform iOS/Android mobile app — preview via QR code + Expo Go",
    githubRepo: "archits01/openslide-expo-template",
    scaffoldHint:
      "Stack: **Expo SDK 54 (React Native) + TypeScript + Expo Router**. " +
      "Entry point: `app/(tabs)/index.tsx` — **modify this first**. " +
      "Route groups like `app/(tabs)/` are valid paths — write directly to them, NEVER use a staging folder. " +
      "This is a mobile app. After `npm install`, the dev script runs `expo start --web --tunnel` which serves a live web preview in the browser AND generates a QR code for real device testing via Expo Go. " +
      "Use React Native components (`View`, `Text`, `ScrollView`, `TouchableOpacity`, `FlatList`, etc.) — no HTML/CSS. " +
      "Use `StyleSheet.create()` for styles. " +
      "CRITICAL: After every `run_shell_command` that moves or copies files, immediately call `list_files` on the destination to confirm the files landed.",
    files: {
      "package.json": JSON.stringify({
        name: "expo-app",
        main: "expo-router/entry",
        version: "1.0.0",
        private: true,
        scripts: {
          dev: "EXPO_NO_TELEMETRY=1 expo start --web --tunnel",
          build: "expo export --platform web",
          lint: "expo lint",
        },
        dependencies: {
          "@expo/vector-icons": "^15.0.3",
          "@react-navigation/bottom-tabs": "^7.2.0",
          "@react-navigation/native": "^7.1.8",
          "expo": "~54.0.33",
          "expo-blur": "~15.0.8",
          "expo-constants": "~18.0.13",
          "expo-font": "~14.0.11",
          "expo-haptics": "~15.0.8",
          "expo-linear-gradient": "~15.0.8",
          "expo-linking": "~8.0.11",
          "expo-router": "~6.0.23",
          "expo-splash-screen": "~31.0.13",
          "expo-status-bar": "~3.0.9",
          "expo-symbols": "~1.0.8",
          "expo-system-ui": "~6.0.9",
          "expo-web-browser": "~15.0.10",
          "react": "19.1.0",
          "react-dom": "19.1.0",
          "react-native": "0.81.5",
          "react-native-gesture-handler": "~2.31.1",
          "react-native-reanimated": "~4.1.1",
          "react-native-safe-area-context": "~5.6.0",
          "react-native-screens": "~4.16.0",
          "react-native-svg": "15.15.4",
          "react-native-url-polyfill": "^2.0.0",
          "react-native-web": "~0.21.0",
          "react-native-webview": "13.16.1",
          "react-native-worklets": "0.5.1",
        },
        devDependencies: {
          "@babel/core": "^7.25.2",
          "@types/react": "~19.1.0",
          "typescript": "~5.9.2",
        },
      }, null, 2),
      "babel.config.js": `module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-worklets/plugin'],
  };
};\n`,
      "app.json": JSON.stringify({
        expo: {
          name: "App",
          slug: "app",
          version: "1.0.0",
          orientation: "portrait",
          icon: "./assets/images/icon.png",
          scheme: "myapp",
          userInterfaceStyle: "automatic",
          newArchEnabled: true,
          ios: { supportsTablet: true },
          android: { adaptiveIcon: { foregroundImage: "./assets/images/adaptive-icon.png", backgroundColor: "#ffffff" } },
          web: { bundler: "metro", output: "static", favicon: "./assets/images/favicon.png" },
          plugins: ["expo-router", "expo-font"],
          experiments: { typedRoutes: true },
        },
      }, null, 2),
      "tsconfig.json": JSON.stringify({
        extends: "expo/tsconfig.base",
        compilerOptions: { strict: true, paths: { "@/*": ["./*"] } },
        include: ["**/*.ts", "**/*.tsx", ".expo/types/**/*.d.ts", "expo-env.d.ts"],
      }, null, 2),
      "expo-env.d.ts": `/// <reference types="expo/types" />\n// NOTE: This file should not be edited and should be in your git ignore\n`,
      "app/_layout.tsx": `import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
      <StatusBar style="auto" />
    </>
  );
}\n`,
      "app/(tabs)/_layout.tsx": `import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#007AFF' }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}\n`,
      "app/(tabs)/index.tsx": `import { View, Text, StyleSheet } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Loading…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  text: { fontSize: 16, color: '#999' },
});\n`,
    },
  },
  {
    name: "nextjs-shadcn",
    label: "Next.js + shadcn/ui",
    description: "Next.js 15 + React 19 + shadcn/ui + Tailwind — full-stack, SSR, SEO-ready",
    githubRepo: "archits01/bolt-nextjs-shadcn-template",
    scaffoldHint:
      "Stack: **Next.js 15 (App Router) + React 19 + shadcn/ui + Tailwind CSS + TypeScript**. " +
      "Entry point: `app/page.tsx` — **replace this first** with your root page content. " +
      "Layout is in `app/layout.tsx`. Add new pages as `app/<name>/page.tsx`. " +
      "shadcn/ui components are pre-installed in `components/ui/` — import directly, e.g. `import { Button } from '@/components/ui/button'`. " +
      "API routes go in `app/api/<name>/route.ts`. " +
      "Dev server runs on port 5173. Use `next/image` for images, `next/link` for navigation. " +
      "Use this template for: landing pages, marketing sites, SEO-critical apps, full-stack apps with API routes, anything needing SSR.",
  },
  {
    name: "vite-react",
    label: "React + Vite",
    description: "Vite + React 19 + TypeScript + Tailwind — fast SPA, dashboard, or tool",
    githubRepo: "xKevIsDev/bolt-vite-react-ts-template",
    scaffoldHint:
      "Stack: **Vite + React 19 + TypeScript + Tailwind + framer-motion**. " +
      "Entry point: `src/App.tsx` (placeholder — **replace this first** with your root layout). " +
      "Tailwind is wired. `framer-motion` is installed. `vite --host --port 5173` is the dev script. " +
      "Use this template for: SPAs, dashboards, internal tools, calculators, games, any browser-only app.",
    files: {
      "package.json": JSON.stringify(
        {
          name: "site",
          private: true,
          version: "0.0.0",
          type: "module",
          scripts: { dev: "vite --host --port 5173", build: "tsc && vite build", preview: "vite preview" },
          dependencies: { react: "^18.3.1", "react-dom": "^18.3.1", "framer-motion": "^11.3.8" },
          devDependencies: {
            "@types/react": "^18.3.5",
            "@types/react-dom": "^18.3.0",
            "@vitejs/plugin-react": "^4.3.1",
            autoprefixer: "^10.4.20",
            postcss: "^8.4.41",
            tailwindcss: "^3.4.10",
            typescript: "^5.5.3",
            vite: "^5.4.2",
          },
        },
        null, 2,
      ),
      "vite.config.ts": `import { defineConfig } from 'vite'\nimport react from '@vitejs/plugin-react'\n\nexport default defineConfig({\n  plugins: [react()],\n})\n`,
      "tsconfig.json": JSON.stringify({ compilerOptions: { target: "ES2020", useDefineForClassFields: true, lib: ["ES2020", "DOM", "DOM.Iterable"], module: "ESNext", skipLibCheck: true, moduleResolution: "bundler", allowImportingTsExtensions: true, isolatedModules: true, moduleDetection: "force", noEmit: true, jsx: "react-jsx", strict: true, noUnusedLocals: true, noUnusedParameters: true, noFallthroughCasesInSwitch: true }, include: ["src"], references: [{ path: "./tsconfig.node.json" }] }, null, 2),
      "tsconfig.node.json": JSON.stringify({ compilerOptions: { target: "ES2022", lib: ["ES2023"], module: "ESNext", skipLibCheck: true, moduleResolution: "bundler", allowImportingTsExtensions: true, isolatedModules: true, moduleDetection: "force", noEmit: true, strict: true, noUnusedLocals: true, noUnusedParameters: true, noFallthroughCasesInSwitch: true }, include: ["vite.config.ts"] }, null, 2),
      "tailwind.config.js": `/** @type {import('tailwindcss').Config} */\nexport default {\n  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],\n  darkMode: 'media',\n  theme: { extend: {} },\n  plugins: [],\n}\n`,
      "postcss.config.js": `export default {\n  plugins: { tailwindcss: {}, autoprefixer: {} },\n}\n`,
      "index.html": `<!doctype html>\n<html lang="en">\n  <head>\n    <meta charset="UTF-8" />\n    <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n    <title>App</title>\n    <script src="/__opensl-edit.js" defer></script>\n  </head>\n  <body>\n    <div id="root"></div>\n    <script type="module" src="/src/main.tsx"></script>\n  </body>\n</html>\n`,
      "src/main.tsx": `import { StrictMode } from 'react'\nimport { createRoot } from 'react-dom/client'\nimport './index.css'\nimport App from './App.tsx'\n\ncreateRoot(document.getElementById('root')!).render(\n  <StrictMode>\n    <App />\n  </StrictMode>,\n)\n`,
      "src/index.css": `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n`,
      "src/App.tsx": `export default function App() {\n  return (\n    <div className="min-h-screen bg-white flex items-center justify-center">\n      <p className="text-gray-400 text-sm">Loading…</p>\n    </div>\n  )\n}\n`,
    },
  },
];

/** Quick lookup by template name — used to restore scaffoldHint on follow-up turns. */
export const WEBSITE_TEMPLATES_MAP: Record<string, WebsiteTemplate> = Object.fromEntries(
  WEBSITE_TEMPLATES.map((t) => [t.name, t]),
);

// ─── Template picker (keyword heuristic — no LLM call needed) ────────────────

export function pickTemplate(message: string): WebsiteTemplate {
  const m = message.toLowerCase();

  // Mobile app → Expo
  if (
    /\bmobile app\b/.test(m) || /\breact native\b/.test(m) || /\bexpo\b/.test(m) ||
    /\bios app\b/.test(m) || /\bandroid app\b/.test(m) || /\biphone app\b/.test(m) ||
    /\bnative app\b/.test(m) || /\bphone app\b/.test(m) || /\bsmartphone\b/.test(m)
  ) {
    return WEBSITE_TEMPLATES.find((t) => t.name === "expo")!;
  }

  // Full website / SEO / full-stack → Next.js + shadcn
  if (
    /\bnext\.?js\b/.test(m) || /\bshadcn\b/.test(m) ||
    /\blanding page\b/.test(m) || /\bmarketing( site)?\b/.test(m) ||
    /\bseo\b/.test(m) || /\bfull.?stack\b/.test(m) ||
    /\bserver.?side\b/.test(m) || /\bssr\b/.test(m) || /\bssg\b/.test(m) ||
    /\bblog\b/.test(m) || /\bportfolio( site| website)?\b/.test(m) ||
    /\bapi route\b/.test(m) || /\bwebsite\b/.test(m)
  ) {
    return WEBSITE_TEMPLATES.find((t) => t.name === "nextjs-shadcn")!;
  }

  // Default → Vite React (SPA, dashboard, tool, calculator, game, etc.)
  return WEBSITE_TEMPLATES.find((t) => t.name === "vite-react")!;
}

// ─── GitHub fetcher (server-side, with in-memory cache) ──────────────────────

interface CacheEntry { files: Record<string, string>; fetchedAt: number }
const templateCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 min

const SKIP_PREFIXES = [".git/", "node_modules/", ".next/", "dist/", "build/", ".vercel/", ".bolt/"];
const SKIP_EXTS = [".png", ".jpg", ".jpeg", ".gif", ".ico", ".webp", ".woff", ".woff2", ".ttf", ".eot", ".mp4", ".mp3"];
const MAX_FILE_BYTES = 150_000;

function ghHeaders(): Record<string, string> {
  const h: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "openslides/1.0",
  };
  if (process.env.GITHUB_TOKEN) h["Authorization"] = `Bearer ${process.env.GITHUB_TOKEN}`;
  return h;
}

/** Fetch all text files from a public GitHub repo. Server-side only. */
export async function fetchGithubTemplate(githubRepo: string): Promise<Record<string, string>> {
  const cached = templateCache.get(githubRepo);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) return cached.files;

  const GH = "https://api.github.com";
  const RAW = "https://raw.githubusercontent.com";

  // 1. Get default branch
  const repoRes = await fetch(`${GH}/repos/${githubRepo}`, { headers: ghHeaders() });
  if (!repoRes.ok) throw new Error(`GitHub repo ${githubRepo} → ${repoRes.status}`);
  const { default_branch: branch } = (await repoRes.json()) as { default_branch: string };

  // 2. Recursive tree (one call — gets every file path + size)
  const treeRes = await fetch(`${GH}/repos/${githubRepo}/git/trees/${branch}?recursive=1`, { headers: ghHeaders() });
  if (!treeRes.ok) throw new Error(`GitHub tree ${githubRepo} → ${treeRes.status}`);
  const { tree } = (await treeRes.json()) as { tree: Array<{ path: string; type: string; size?: number }> };

  const blobs = tree.filter((item) => {
    if (item.type !== "blob") return false;
    if (SKIP_PREFIXES.some((p) => item.path.startsWith(p))) return false;
    if (SKIP_EXTS.some((e) => item.path.toLowerCase().endsWith(e))) return false;
    if (item.size && item.size > MAX_FILE_BYTES) return false;
    return true;
  });

  // 3. Fetch contents in parallel batches of 10
  const files: Record<string, string> = {};
  const BATCH = 10;
  for (let i = 0; i < blobs.length; i += BATCH) {
    const batch = blobs.slice(i, i + BATCH);
    const results = await Promise.allSettled(
      batch.map(async ({ path }) => {
        const res = await fetch(`${RAW}/${githubRepo}/${branch}/${path}`, {
          headers: { "User-Agent": "openslides/1.0" },
        });
        if (!res.ok) return null;
        return { path, content: await res.text() };
      }),
    );
    for (const r of results) {
      if (r.status === "fulfilled" && r.value) files[r.value.path] = r.value.content;
    }
  }

  templateCache.set(githubRepo, { files, fetchedAt: Date.now() });
  return files;
}

/**
 * Fetch template files — tries GitHub first, falls back to bundled local files.
 * Always returns a Record<string, string> (never throws).
 */
export async function fetchTemplateFiles(template: WebsiteTemplate): Promise<Record<string, string>> {
  try {
    const files = await fetchGithubTemplate(template.githubRepo);
    if (Object.keys(files).length > 0) {
      // Ensure dev server uses our required port regardless of what the template has.
      // Skip Expo: its --host flag takes a positional value (lan/tunnel/localhost),
      // not a boolean, so appending "--host --port 5173" breaks it with
      // "option requires argument: --host".
      if (template.name !== "expo" && files["package.json"]) {
        try {
          const pkg = JSON.parse(files["package.json"]) as { scripts?: Record<string, string> };
          if (pkg.scripts?.dev && !pkg.scripts.dev.includes("5173")) {
            pkg.scripts.dev = pkg.scripts.dev.replace(/--port\s+\d+/, "--port 5173").replace(/--host/, "") + " --host --port 5173";
            // Clean up double flags if regex produced them
            pkg.scripts.dev = pkg.scripts.dev.replace("--port 5173 --host --port 5173", "--host --port 5173");
            files["package.json"] = JSON.stringify(pkg, null, 2);
          }
        } catch { /* leave as-is */ }
      }
      // Ensure /__opensl-edit.js is in index.html (Vite) or app/layout.tsx (Next.js)
      if (files["index.html"] && !files["index.html"].includes("__opensl-edit.js")) {
        files["index.html"] = files["index.html"].replace("</head>", '  <script src="/__opensl-edit.js" defer></script>\n  </head>');
      }
      if (files["app/layout.tsx"] && !files["app/layout.tsx"].includes("__opensl-edit.js")) {
        files["app/layout.tsx"] = files["app/layout.tsx"].replace("</head>", '  <script src="/__opensl-edit.js" defer></script>\n        </head>');
      }
      return files;
    }
  } catch (err) {
    console.warn(`[website-templates] GitHub fetch failed for ${template.githubRepo}:`, err);
  }
  // Fall back to bundled local files (vite-react always has them; others fall through to vite-react)
  return template.files ?? WEBSITE_TEMPLATES.find((t) => t.name === "vite-react")!.files!;
}

// ─── LLM template picker ──────────────────────────────────────────────────────

const LLM_PICK_SYSTEM = `You are helping pick the best starter template for a web/mobile project.
Available templates:
${WEBSITE_TEMPLATES.map((t) => `<template>\n  <name>${t.name}</name>\n  <description>${t.description}</description>\n</template>`).join("\n")}

Rules:
- Pick "expo" ONLY for mobile apps (iOS, Android, React Native, phone app).
- Pick "nextjs-shadcn" for: landing pages, marketing sites, blogs, portfolios, full-stack apps, anything SEO-critical, anything needing API routes or server-side rendering, anything that is a "website" rather than a "tool/app".
- Pick "vite-react" for: SPAs, dashboards, internal tools, calculators, games, data visualisation, anything that is a browser-only app with no SEO needs.
- When in doubt between nextjs-shadcn and vite-react, prefer vite-react.
- Respond ONLY with the XML below, nothing else.

<selection>
  <templateName>{name}</templateName>
</selection>`;

/**
 * Ask Haiku to pick the best template for a given message.
 * Runs in parallel with the GitHub fetch — never throws, returns null on failure/timeout.
 */
export async function llmPickTemplate(message: string, timeoutMs = 3000): Promise<WebsiteTemplate | null> {
  const routerUrl = process.env.CLAUDE_ROUTER_URL;
  const proxyKey = process.env.CLAUDE_ROUTER_PROXY_KEY;
  if (!routerUrl || !proxyKey) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${routerUrl}/v1/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${proxyKey}`,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 64,
        system: LLM_PICK_SYSTEM,
        messages: [{ role: "user", content: message }],
      }),
      signal: controller.signal,
    });

    if (!res.ok) return null;
    const data = await res.json() as { content?: Array<{ text?: string }> };
    const text = data.content?.[0]?.text ?? "";
    const match = text.match(/<templateName>\s*([a-z-]+)\s*<\/templateName>/);
    if (!match) return null;
    const name = match[1].trim();
    return WEBSITE_TEMPLATES.find((t) => t.name === name) ?? null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
