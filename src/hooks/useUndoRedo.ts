import { useRef, useState, useCallback } from "react";

const MAX_HISTORY = 20;

/**
 * Undo/redo using refs for synchronous stack access.
 * A tick counter forces re-renders so canUndo/canRedo stay current.
 */
export function useUndoRedo<T>() {
  const pastRef = useRef<T[]>([]);
  const futureRef = useRef<T[]>([]);
  const [, setTick] = useState(0);

  const pushSnapshot = useCallback((snapshot: T) => {
    pastRef.current = [...pastRef.current, snapshot].slice(-MAX_HISTORY);
    futureRef.current = [];
    setTick(t => t + 1);
  }, []);

  const undo = useCallback((current: T): T | null => {
    const past = pastRef.current;
    if (past.length === 0) return null;
    const prev = past[past.length - 1];
    pastRef.current = past.slice(0, -1);
    futureRef.current = [...futureRef.current, current];
    setTick(t => t + 1);
    return prev;
  }, []);

  const redo = useCallback((current: T): T | null => {
    const future = futureRef.current;
    if (future.length === 0) return null;
    const next = future[future.length - 1];
    futureRef.current = future.slice(0, -1);
    pastRef.current = [...pastRef.current, current];
    setTick(t => t + 1);
    return next;
  }, []);

  return {
    pushSnapshot,
    undo,
    redo,
    canUndo: pastRef.current.length > 0,
    canRedo: futureRef.current.length > 0,
  };
}
