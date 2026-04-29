import type { SheetCategory } from "./sheet-classifier";

export interface SheetRoutingEntry {
  timestamp: number;
  userPrompt: string;
  classifiedCategory: SheetCategory;
  confidence: "high" | "medium" | "low";
  method: "keyword" | "llm";
  skillFile: string;
  latencyMs: number;
}

const MAX_ENTRIES = 100;
const log: SheetRoutingEntry[] = [];

export function logSheetRouting(entry: SheetRoutingEntry): void {
  log.push(entry);
  if (log.length > MAX_ENTRIES) log.shift();
}

export function getSheetRoutingLog(): SheetRoutingEntry[] {
  return [...log];
}
