/**
 * Lightweight toast emitter for sheet commands. Broadcasts a custom event
 * that SheetCanvas (or any component) can listen to and render.
 */

export type ToastKind = "info" | "success" | "error";

export interface SheetToastDetail {
  message: string;
  kind: ToastKind;
  durationMs?: number;
}

export function emitSheetToast(message: string, kind: ToastKind = "info", durationMs = 2500) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<SheetToastDetail>("sheet-toast", {
      detail: { message, kind, durationMs },
    }),
  );
}
