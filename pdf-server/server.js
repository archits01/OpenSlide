const express = require("express");
const puppeteer = require("puppeteer");
const PptxGenJS = require("pptxgenjs");
const { PDFDocument } = require("pdf-lib");
const { execFile } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const app = express();
app.use(express.json({ limit: "50mb" }));

const PORT = process.env.PORT || 3001;
const SECRET = process.env.PDF_SERVER_SECRET;

// ── Auth middleware ──────────────────────────────────────────────────────────
function requireAuth(req, res, next) {
  if (!SECRET) return next(); // no secret set → open (dev only)
  const auth = req.headers["authorization"];
  if (!auth || auth !== `Bearer ${SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

// ── Browser singleton — stays warm ──────────────────────────────────────────
let browser = null;

async function getBrowser() {
  if (browser && browser.isConnected()) return browser;
  browser = await puppeteer.launch({
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
  });
  browser.on("disconnected", () => { browser = null; });
  return browser;
}

// ── Health check ─────────────────────────────────────────────────────────────
app.get("/health", (req, res) => res.json({ status: "ok" }));

// ── POST /generate-pdf ────────────────────────────────────────────────────────
app.post("/generate-pdf", requireAuth, async (req, res) => {
  const { slides, filename = "presentation.pdf", viewport } = req.body;
  const vw = viewport?.width || 1280;
  const vh = viewport?.height || 720;

  if (!Array.isArray(slides) || slides.length === 0) {
    return res.status(400).json({ error: "slides array required" });
  }

  try {
    const b = await getBrowser();
    const mergedPdf = await PDFDocument.create();

    for (const slide of slides) {
      const page = await b.newPage();
      await page.setViewport({ width: vw, height: vh });
      await page.setContent(slide.html, { waitUntil: "networkidle0", timeout: 30000 });
      await wait(800);

      const pdfBytes = await page.pdf({
        width: `${vw}px`,
        height: `${vh}px`,
        printBackground: true,
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
      });

      await page.close();

      const slidePdf = await PDFDocument.load(pdfBytes);
      const [copiedPage] = await mergedPdf.copyPages(slidePdf, [0]);
      mergedPdf.addPage(copiedPage);
    }

    const pdfBytes = await mergedPdf.save();

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": pdfBytes.length,
    });
    res.send(Buffer.from(pdfBytes));
  } catch (err) {
    console.error("PDF generation failed:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /generate-pptx ───────────────────────────────────────────────────────
app.post("/generate-pptx", requireAuth, async (req, res) => {
  const { slides, filename = "presentation.pptx", viewport } = req.body;
  const vw = viewport?.width || 1280;
  const vh = viewport?.height || 720;
  // PPTX dimensions in inches (96 DPI)
  const pptxW = vw / 96;
  const pptxH = vh / 96;

  if (!Array.isArray(slides) || slides.length === 0) {
    return res.status(400).json({ error: "slides array required" });
  }

  try {
    const b = await getBrowser();
    const pptx = new PptxGenJS();
    pptx.defineLayout({ name: "CUSTOM", width: pptxW, height: pptxH });
    pptx.layout = "CUSTOM";

    for (const slide of slides) {
      const page = await b.newPage();
      await page.setViewport({ width: vw, height: vh, deviceScaleFactor: 2 });
      await page.setContent(slide.html, { waitUntil: "networkidle0", timeout: 30000 });
      await wait(800);

      const screenshotBuffer = await page.screenshot({
        type: "png",
        fullPage: false,
        clip: { x: 0, y: 0, width: vw, height: vh },
      });

      await page.close();

      const pptxSlide = pptx.addSlide();
      pptxSlide.addImage({
        data: `data:image/png;base64,${screenshotBuffer.toString("base64")}`,
        x: 0, y: 0,
        w: "100%", h: "100%",
      });
    }

    const pptxBuffer = await pptx.write({ outputType: "nodebuffer" });

    res.set({
      "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": pptxBuffer.length,
    });
    res.send(pptxBuffer);
  } catch (err) {
    console.error("PPTX generation failed:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /generate-docx ───────────────────────────────────────────────────────
// Renders each page as a high-res image, embeds into a DOCX with portrait layout.
// Uses the same Puppeteer approach as PPTX but with Letter/A4 dimensions.
app.post("/generate-docx", requireAuth, async (req, res) => {
  const { slides, filename = "document.docx", viewport } = req.body;
  const vw = viewport?.width || 816;
  const vh = viewport?.height || 1056;

  if (!Array.isArray(slides) || slides.length === 0) {
    return res.status(400).json({ error: "pages array required" });
  }

  try {
    const b = await getBrowser();
    const pptx = new PptxGenJS();
    // Letter portrait: 8.5 × 11 inches
    pptx.defineLayout({ name: "LETTER_PORTRAIT", width: 8.5, height: 11 });
    pptx.layout = "LETTER_PORTRAIT";

    for (const slide of slides) {
      const page = await b.newPage();
      await page.setViewport({ width: vw, height: vh, deviceScaleFactor: 2 });
      await page.setContent(slide.html, { waitUntil: "networkidle0", timeout: 30000 });
      await wait(800);

      const screenshotBuffer = await page.screenshot({
        type: "png",
        fullPage: false,
        clip: { x: 0, y: 0, width: vw, height: vh },
      });

      await page.close();

      const docSlide = pptx.addSlide();
      docSlide.addImage({
        data: `data:image/png;base64,${screenshotBuffer.toString("base64")}`,
        x: 0, y: 0,
        w: "100%", h: "100%",
      });
    }

    const docxBuffer = await pptx.write({ outputType: "nodebuffer" });

    res.set({
      "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": docxBuffer.length,
    });
    res.send(docxBuffer);
  } catch (err) {
    console.error("DOCX generation failed:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /extract-brand — Extract brand assets from PPTX ─────────────────────
app.post("/extract-brand", requireAuth, async (req, res) => {
  const { pptxBase64 } = req.body;

  if (!pptxBase64) {
    return res.status(400).json({ error: "pptxBase64 required" });
  }

  // Write base64 PPTX to temp file
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "brand-"));
  const pptxPath = path.join(tmpDir, "input.pptx");

  try {
    fs.writeFileSync(pptxPath, Buffer.from(pptxBase64, "base64"));

    // Run Python extraction
    const result = await new Promise((resolve, reject) => {
      execFile(
        "python3",
        [path.join(__dirname, "extract_brand.py"), pptxPath, tmpDir],
        { timeout: 30000 },
        (err, stdout, stderr) => {
          if (err) {
            console.error("[extract-brand] Python error:", stderr);
            reject(new Error(stderr || err.message));
          } else {
            try {
              resolve(JSON.parse(stdout));
            } catch (parseErr) {
              reject(new Error("Failed to parse extraction output"));
            }
          }
        }
      );
    });

    res.json(result);
  } catch (err) {
    console.error("[extract-brand] Extraction failed:", err.message);
    res.status(500).json({ error: "Brand extraction failed", detail: err.message });
  } finally {
    // Cleanup temp files
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {}
  }
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, async () => {
  console.log(`PDF server running on port ${PORT}`);
  // Pre-warm browser on startup
  try {
    await getBrowser();
    console.log("Chromium ready");
  } catch (err) {
    console.error("Failed to launch Chromium:", err.message);
  }
});
