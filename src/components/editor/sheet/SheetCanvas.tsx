"use client";

// All Univer CSS is imported in src/styles/globals.css in the correct order
// (AFTER our own Tailwind base) so its `--univer-tw-*` custom properties are
// not wiped by our Tailwind reset.

import { useEffect, useRef, useState } from "react";
import type { Slide } from "@/lib/types";
import { SheetRibbon } from "./ribbon/SheetRibbon";
import { SheetFacadeContext } from "./ribbon/SheetFacadeContext";
import { SheetContextMenu } from "./SheetContextMenu";
import { SheetToastHost } from "./SheetToastHost";
import { useSheetCommands } from "./ribbon/hooks/useSheetCommands";
import { useSheetKeyboardShortcuts } from "./ribbon/useSheetKeyboardShortcuts";

export interface SheetUpdate {
  slideId: string;
  workbookJson: string;
}

export interface SheetCanvasProps {
  slides: Slide[];
  activeSheetId?: string;
  onActiveSheetChange?: (id: string) => void;
  onSheetsEdited?: (slideId: string, workbookJson: string) => void;
  isReadOnly?: boolean;
}

export function SheetCanvas({
  slides,
  activeSheetId,
  onActiveSheetChange,
  onSheetsEdited,
  isReadOnly = false,
}: SheetCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const univerRef = useRef<unknown>(null);
  const facadeRef = useRef<unknown>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const activeSlideIdRef = useRef(activeSheetId);
  activeSlideIdRef.current = activeSheetId;
  const onSheetsEditedRef = useRef(onSheetsEdited);
  onSheetsEditedRef.current = onSheetsEdited;

  // All slides in a sheets session are spreadsheets — show them all,
  // even if workbookJson is missing (blank workbook fallback handles that)
  const sheetSlides = slides;
  const activeSlide = activeSheetId
    ? sheetSlides.find((s) => s.id === activeSheetId)
    : sheetSlides[0];

  // Keyboard shortcuts — global handler for the sheet
  const sheetCommands = useSheetCommands(facadeRef);
  useSheetKeyboardShortcuts(sheetCommands, !isReadOnly && isMounted);

  // Auto-select first sheet slide
  useEffect(() => {
    if (!activeSheetId && sheetSlides.length > 0 && onActiveSheetChange) {
      onActiveSheetChange(sheetSlides[0].id);
    }
  }, [activeSheetId, sheetSlides.length, onActiveSheetChange]);

  // Mount Univer
  useEffect(() => {
    if (!containerRef.current) return;
    let disposed = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let univerInstance: any = null;

    (async () => {
      try {
        // Use Univer's OFFICIAL preset API — it bundles the core plugins in the
        // right order with the doc-editor wiring that makes inline cell editing
        // work. We manually wired plugins before, which was missing something
        // subtle the preset handles internally.
        const { createUniver, LocaleType, merge } = await import("@univerjs/presets");
        const { UniverSheetsCorePreset } = await import("@univerjs/preset-sheets-core");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sheetsCoreEnUS: any = (await import("@univerjs/preset-sheets-core/locales/en-US")).default;

        // Extended plugins not in the core preset
        const [
          { UniverSheetsConditionalFormattingPlugin },
          { UniverSheetsConditionalFormattingUIPlugin },
          { UniverSheetsDataValidationPlugin },
          { UniverSheetsDataValidationUIPlugin },
          { UniverSheetsFilterPlugin },
          { UniverSheetsFilterUIPlugin },
          { UniverSheetsSortPlugin },
          { UniverSheetsSortUIPlugin },
          { UniverSheetsFindReplacePlugin },
          { UniverSheetsHyperLinkPlugin },
          { UniverSheetsHyperLinkUIPlugin },
          { UniverSheetsThreadCommentPlugin },
          { UniverSheetsThreadCommentUIPlugin },
          { UniverSheetsZenEditorPlugin },
          { UniverSheetsCrosshairHighlightPlugin },
          { UniverDrawingPlugin },
          { UniverDrawingUIPlugin },
          { UniverSheetsDrawingPlugin },
          { UniverSheetsDrawingUIPlugin },
        ] = await Promise.all([
          import("@univerjs/sheets-conditional-formatting"),
          import("@univerjs/sheets-conditional-formatting-ui"),
          import("@univerjs/sheets-data-validation"),
          import("@univerjs/sheets-data-validation-ui"),
          import("@univerjs/sheets-filter"),
          import("@univerjs/sheets-filter-ui"),
          import("@univerjs/sheets-sort"),
          import("@univerjs/sheets-sort-ui"),
          import("@univerjs/sheets-find-replace"),
          import("@univerjs/sheets-hyper-link"),
          import("@univerjs/sheets-hyper-link-ui"),
          import("@univerjs/sheets-thread-comment"),
          import("@univerjs/sheets-thread-comment-ui"),
          import("@univerjs/sheets-zen-editor"),
          import("@univerjs/sheets-crosshair-highlight"),
          import("@univerjs/drawing"),
          import("@univerjs/drawing-ui"),
          import("@univerjs/sheets-drawing"),
          import("@univerjs/sheets-drawing-ui"),
        ]);

        // Facade side-effect imports for extension methods we rely on
        await import("@univerjs/sheets-drawing/facade");

        if (disposed) return;

        const { univer, univerAPI } = createUniver({
          locale: LocaleType.EN_US,
          locales: {
            [LocaleType.EN_US]: merge({}, sheetsCoreEnUS),
          },
          presets: [
            UniverSheetsCorePreset({
              container: containerRef.current!,
              // Hide Univer's native toolbar — our custom SheetRibbon replaces it.
              // `header: false` is NOT safe here (it removes the focus-sink input
              // that routes keystrokes into cell edit mode), but `toolbar: false`
              // works cleanly.
              toolbar: false,
              formulaBar: true,
            }),
          ],
          plugins: [
            UniverSheetsConditionalFormattingPlugin,
            UniverSheetsConditionalFormattingUIPlugin,
            UniverSheetsDataValidationPlugin,
            UniverSheetsDataValidationUIPlugin,
            UniverSheetsFilterPlugin,
            UniverSheetsFilterUIPlugin,
            UniverSheetsSortPlugin,
            UniverSheetsSortUIPlugin,
            UniverSheetsFindReplacePlugin,
            UniverSheetsHyperLinkPlugin,
            UniverSheetsHyperLinkUIPlugin,
            UniverSheetsThreadCommentPlugin,
            UniverSheetsThreadCommentUIPlugin,
            UniverSheetsZenEditorPlugin,
            UniverSheetsCrosshairHighlightPlugin,
            UniverDrawingPlugin,
            UniverDrawingUIPlugin,
            UniverSheetsDrawingPlugin,
            UniverSheetsDrawingUIPlugin,
          ],
        });

        univerInstance = univer;
        univerRef.current = univer;
        facadeRef.current = univerAPI;

        if (!disposed) {
          setIsMounted(true);
        }
      } catch (err) {
        console.error("[SheetCanvas] Failed to initialize Univer:", err);
      }
    })();

    return () => {
      disposed = true;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      // Capture the instance before nulling refs, then defer the actual dispose
      // to a microtask. Univer runs its own React root internally — calling
      // dispose() synchronously during a parent render phase produces the
      // "Attempted to synchronously unmount a root while React was already
      // rendering" warning and can leak state. Deferring lets the current
      // render finish before we tear down.
      const toDispose = univerInstance;
      univerRef.current = null;
      facadeRef.current = null;
      setIsMounted(false);
      queueMicrotask(() => {
        try { toDispose?.dispose(); } catch { /* dispose can throw during HMR */ }
      });
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Track which workbook is currently loaded to avoid duplicate creates
  const loadedSlideIdRef = useRef<string | null>(null);

  // Load workbook when mounted + active slide changes
  useEffect(() => {
    if (!isMounted || !facadeRef.current) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const facade = facadeRef.current as any;
    const slideId = activeSlide?.id ?? null;

    // Skip if this slide is already loaded
    if (slideId && slideId === loadedSlideIdRef.current) return;

    // Dispose any previously loaded workbook
    try {
      const existing = facade.getActiveWorkbook();
      if (existing) {
        const existingId = existing.getId();
        facade.disposeUnit(existingId);
      }
    } catch {
      // No workbook to dispose
    }

    if (!activeSlide?.workbookJson) {
      loadedSlideIdRef.current = activeSlide?.id ?? null;
      try {
        // Create a proper empty workbook with one blank sheet so users can edit
        const blankId = `wb_blank_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const sheetId = `sheet_${Math.random().toString(36).slice(2, 8)}`;
        facade.createWorkbook({
          id: blankId,
          name: activeSlide?.title || "Untitled",
          appVersion: "3.0.0",
          sheetOrder: [sheetId],
          sheets: {
            [sheetId]: {
              id: sheetId,
              name: "Sheet1",
              rowCount: 100,
              columnCount: 26,
              cellData: {},
              defaultColumnWidth: 88,
              defaultRowHeight: 24,
            },
          },
        });
      } catch (err) {
        console.warn("[SheetCanvas] Failed to create blank workbook:", err);
      }
      return;
    }

    try {
      const data = JSON.parse(activeSlide.workbookJson);
      // Generate a fresh ID to avoid duplicate unit ID errors on re-mount
      data.id = `wb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      facade.createWorkbook(data);
      loadedSlideIdRef.current = slideId;
    } catch (err) {
      console.warn("[SheetCanvas] Failed to load workbook:", err);
      loadedSlideIdRef.current = null;
    }
  }, [isMounted, activeSlide?.id]); // Note: removed workbookJson from deps to prevent save→re-load loop

  // Edit persistence — debounced save
  useEffect(() => {
    if (!isMounted || !facadeRef.current || isReadOnly) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const facade = facadeRef.current as any;

    const disposable = facade.onCommandExecuted(() => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        try {
          const wb = facade.getActiveWorkbook();
          if (!wb) return;
          const snapshot = typeof wb.save === "function" ? wb.save() : wb.getSnapshot();
          const json = JSON.stringify(snapshot);
          const slideId = activeSlideIdRef.current;
          if (slideId && onSheetsEditedRef.current) {
            onSheetsEditedRef.current(slideId, json);
          }
        } catch (err) {
          console.warn("[SheetCanvas] Save failed:", err);
        }
      }, 500);
    });

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      disposable?.dispose?.();
    };
  }, [isMounted, isReadOnly]);

  const hasSheets = sheetSlides.length > 0;
  const [showHint, setShowHint] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("openslides-sheet-hint-dismissed") !== "true";
  });

  return (
    <div className="sheet-canvas-shell">
      <SheetFacadeContext.Provider value={facadeRef}>
        <SheetRibbon />
        <SheetContextMenu />
      </SheetFacadeContext.Provider>
      <SheetToastHost />
      <div style={{ position: "relative", flex: 1, minHeight: 0 }}>
        {!hasSheets && !isMounted && (
          <div style={{
            position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "var(--font-geist-sans, system-ui)", fontSize: 14, color: "var(--text3, #6B6B75)",
            zIndex: 10, pointerEvents: "none",
          }}>
            Ask the AI to build something.
          </div>
        )}
        {/* First-time help banner — pointerEvents: none so it doesn't block cell clicks */}
        {hasSheets && isMounted && showHint && (
          <div style={{
            position: "absolute", top: 48, left: "50%", transform: "translateX(-50%)",
            zIndex: 1000, display: "flex", alignItems: "center", gap: 10,
            background: "rgba(15,15,15,0.85)", backdropFilter: "blur(8px)",
            color: "#e0e0e0", padding: "8px 16px", borderRadius: 10,
            fontSize: 12.5, fontFamily: "var(--font-geist-sans, system-ui)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
            pointerEvents: "none",
          }}>
            <span>You can edit cells directly or ask the AI to make changes.</span>
            <button
              onClick={() => {
                setShowHint(false);
                localStorage.setItem("openslides-sheet-hint-dismissed", "true");
              }}
              style={{
                background: "none", border: "none", color: "#888", cursor: "pointer",
                fontSize: 14, lineHeight: 1, padding: "2px 4px",
                pointerEvents: "auto",
              }}
            >
              ✕
            </button>
          </div>
        )}
        <div ref={containerRef} className="sheet-canvas-univer" />
      </div>
    </div>
  );
}
