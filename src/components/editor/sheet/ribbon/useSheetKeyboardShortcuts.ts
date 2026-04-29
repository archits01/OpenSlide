"use client";

import { useEffect } from "react";
import type { SheetCommands } from "./hooks";

/**
 * Global keyboard shortcut handler for the sheet ribbon.
 * Mounted once in SheetCanvas — NOT in individual groups.
 * Uses capture phase so we fire before Univer's own handlers.
 */
export function useSheetKeyboardShortcuts(commands: SheetCommands, enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const handler = (e: KeyboardEvent) => {
      // Skip if user is typing in a non-sheet input (chat, modals, etc.)
      const target = e.target as HTMLElement;
      const tag = target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || target.contentEditable === "true") {
        // Allow if inside Univer's container
        if (!target.closest(".sheet-canvas-shell")) return;
      }

      const isMod = e.ctrlKey || e.metaKey;
      if (!isMod) return; // all our shortcuts need Ctrl/Cmd

      let handled = false;

      switch (e.key.toLowerCase()) {
        case "x":
          if (!e.shiftKey && !e.altKey) { commands.cut(); handled = true; }
          break;
        case "c":
          if (!e.shiftKey && !e.altKey) { commands.copy(); handled = true; }
          break;
        case "v":
          if (!e.shiftKey && !e.altKey) { commands.paste(); handled = true; }
          break;
        case "z":
          if (e.shiftKey) { commands.redo(); handled = true; }
          else if (!e.altKey) { commands.undo(); handled = true; }
          break;
        case "y":
          if (!e.shiftKey && !e.altKey) { commands.redo(); handled = true; }
          break;
        case "b":
          if (!e.shiftKey && !e.altKey) { commands.setBold(); handled = true; }
          break;
        case "i":
          if (!e.shiftKey && !e.altKey) { commands.setItalic(); handled = true; }
          break;
        case "u":
          if (!e.shiftKey && !e.altKey) { commands.setUnderline(); handled = true; }
          break;
        case "f":
          if (!e.shiftKey && !e.altKey) { commands.findReplace(); handled = true; }
          break;
      }

      if (handled) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    // Capture phase so we fire before Univer's listeners
    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
  }, [commands, enabled]);
}
