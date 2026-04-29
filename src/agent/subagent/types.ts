export type SubagentStatus = "pending" | "running" | "completed" | "failed" | "timeout";

export interface SubagentRecord {
  runId: string;
  childSessionId: string;
  parentSessionId: string;
  parentUserId: string;
  task: string;
  label?: string;
  spawnDepth: number;
  status: SubagentStatus;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  result?: string;
  error?: string;
}

export interface SpawnSubagentParams {
  task: string;
  label?: string;
}

export type SpawnSubagentResult =
  | { status: "accepted"; runId: string; childSessionId: string; note: string }
  | { status: "forbidden"; error: string }
  | { status: "error"; error: string };
