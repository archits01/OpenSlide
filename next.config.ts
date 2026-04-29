import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Univer's mount/dispose cycle doesn't survive StrictMode's double-invocation
  // in dev (cells render but focus routes to a disposed instance → can't edit).
  // Production builds don't double-invoke, so this only affects `npm run dev`.
  reactStrictMode: false,
  serverExternalPackages: [
    "gray-matter",
    "@univerjs/core",
    "@univerjs/sheets",
    "@univerjs/engine-formula",
    "@univerjs/engine-render",
    "@univerjs/sheets-formula",
    "@univerjs/ui",
    "@univerjs/sheets-ui",
    "@univerjs/design",
    "@univerjs/docs",
    "@univerjs/docs-ui",
    "@univerjs/sheets-numfmt",
    "@univerjs/sheets-numfmt-ui",
    "@univerjs/sheets-conditional-formatting",
    "@univerjs/sheets-conditional-formatting-ui",
    "@univerjs/sheets-data-validation",
    "@univerjs/sheets-data-validation-ui",
    "@univerjs/sheets-filter",
    "@univerjs/sheets-filter-ui",
    "@univerjs/sheets-sort",
    "@univerjs/sheets-sort-ui",
    "@univerjs/sheets-find-replace",
    "@univerjs/sheets-hyper-link",
    "@univerjs/sheets-hyper-link-ui",
    "@univerjs/sheets-thread-comment",
    "@univerjs/sheets-thread-comment-ui",
    "@univerjs/sheets-zen-editor",
    "@univerjs/sheets-crosshair-highlight",
    "@univerjs/drawing",
    "@univerjs/drawing-ui",
    "@univerjs/sheets-drawing",
    "@univerjs/sheets-drawing-ui",
    "@univerjs/presets",
    "@univerjs/preset-sheets-core",
    "opentype.js",
  ],
  turbopack: {
    resolveAlias: {
      // Fix opentype.js ESM import missing .js extension in @univerjs/engine-render
      "opentype.js/dist/opentype.module": "opentype.js/dist/opentype.module.js",
    },
  },
  async headers() {
    // COOP/COEP required for StackBlitz WebContainers (SharedArrayBuffer).
    // `credentialless` is the lenient variant: cross-origin subresources load
    // without credentials and don't require explicit CORP headers — less likely
    // to break existing slide/doc/sheet iframes than `require-corp`.
    // Scoped to /editor/:path* only so the rest of the app (home, API, etc.)
    // is unaffected. Review docs/coep-spike.md for verified feature matrix.
    return [
      {
        source: "/editor/:path*",
        headers: [
          { key: "Cross-Origin-Embedder-Policy", value: "credentialless" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
