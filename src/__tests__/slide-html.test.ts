import { describe, it, expect } from "vitest";
import { buildSlideHtml } from "../lib/slide-html";
import type { Slide, LogoResult } from "../lib/types";

function makeSlide(content: string, overrides: Partial<Slide> = {}): Slide {
  return {
    id: "test",
    index: 0,
    title: "Test",
    content,
    layout: "content",
    ...overrides,
  } as Slide;
}

const LOGO: LogoResult = { url: "https://example.com/logo.png", name: "Example" } as LogoResult;

describe("buildSlideHtml — docs mode", () => {
  it("renders docs content directly inside <body> with no wrapper div", () => {
    const content = `<p>Hello</p><div class="page-footer"><span>F</span><span>1</span></div>`;
    const html = buildSlideHtml(makeSlide(content), "minimal", null, true, undefined, undefined, false, true);
    expect(html).toContain(`<body>${content}</body>`);
  });

  it("includes the universal box-sizing reset", () => {
    const html = buildSlideHtml(makeSlide(""), "minimal", null, true, undefined, undefined, false, true);
    expect(html).toContain("*{box-sizing:border-box}");
  });

  it("pins html/body to 816x1056 with overflow:hidden", () => {
    const html = buildSlideHtml(makeSlide(""), "minimal", null, true, undefined, undefined, false, true);
    expect(html).toContain("width:816px;height:1056px;overflow:hidden");
  });

  it("defines the .page and .page-footer utility classes", () => {
    const html = buildSlideHtml(makeSlide(""), "minimal", null, true, undefined, undefined, false, true);
    expect(html).toMatch(/\.page\{[^}]*width:816px/);
    expect(html).toMatch(/\.page\{[^}]*height:1056px/);
    expect(html).toMatch(/\.page-footer\{[^}]*margin-top:auto/);
  });

  it("never injects a logo in docs mode, even on the first page", () => {
    const html = buildSlideHtml(makeSlide("<p/>"), "minimal", LOGO, true, undefined, "Example", false, true);
    expect(html).not.toContain(LOGO.url);
  });
});

describe("buildSlideHtml — slides mode", () => {
  it("wraps slide content in .slide-root", () => {
    const content = `<h1 class="slide-headline">A</h1>`;
    const html = buildSlideHtml(makeSlide(content), "minimal", null, false, undefined, undefined, false, false);
    expect(html).toContain(`<body><div class="slide-root">${content}</div></body>`);
  });

  it("uses 1280x720 landscape dimensions", () => {
    const html = buildSlideHtml(makeSlide(""), "minimal", null, false, undefined, undefined, false, false);
    expect(html).toContain("width:1280px;height:720px");
  });

  it("injects the logo on the first slide", () => {
    const html = buildSlideHtml(makeSlide("<p/>"), "minimal", LOGO, true, undefined, "Example", false, false);
    expect(html).toContain(LOGO.url);
  });

  it("omits the logo on non-first slides", () => {
    const html = buildSlideHtml(makeSlide("<p/>"), "minimal", LOGO, false, undefined, "Example", false, false);
    expect(html).not.toContain(LOGO.url);
  });
});

describe("buildSlideHtml — DOCTYPE passthrough", () => {
  it("injects theme CSS vars into existing <head> when content is a full HTML document", () => {
    const full = `<!DOCTYPE html><html><head><title>T</title></head><body>X</body></html>`;
    const html = buildSlideHtml(makeSlide(full), "minimal", null, false, undefined, undefined, false, false);
    expect(html).toContain("--slide-accent");
    expect(html).toContain("<title>T</title>");
  });
});
