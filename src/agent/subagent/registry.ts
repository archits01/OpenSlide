import { Redis } from "@upstash/redis";
import type { SubagentRecord } from "./types";

const SUBAGENT_TTL = 2 * 60 * 60; // 2 hours
const CHILDREN_TTL = 2 * 60 * 60;

function getRedis(): Redis {
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
}

export async function registerSubagent(record: SubagentRecord): Promise<void> {
  const redis = getRedis();
  // Pipeline: all three writes land atomically in one HTTP round-trip.
  // If sadd were separate and failed, the record would exist in Redis but be invisible
  // to countActiveChildren / listSubagentsForSession, breaking the announcement flow.
  const pipe = redis.pipeline();
  pipe.setex(`subagent:${record.runId}`, SUBAGENT_TTL, JSON.stringify(record));
  pipe.sadd(`subagent:children:${record.parentSessionId}`, record.runId);
  pipe.expire(`subagent:children:${record.parentSessionId}`, CHILDREN_TTL);
  await pipe.exec();
}

export async function getSubagent(runId: string): Promise<SubagentRecord | null> {
  return getRedis().get<SubagentRecord>(`subagent:${runId}`);
}

export async function updateSubagent(runId: string, updates: Partial<SubagentRecord>): Promise<void> {
  const redis = getRedis();
  const existing = await redis.get<SubagentRecord>(`subagent:${runId}`);
  if (!existing) return;
  const updated = { ...existing, ...updates };
  // Refresh both the record AND the children set TTL so countActiveChildren
  // stays accurate for the full lifetime of the record.
  const pipe = redis.pipeline();
  pipe.setex(`subagent:${runId}`, SUBAGENT_TTL, JSON.stringify(updated));
  pipe.expire(`subagent:children:${updated.parentSessionId}`, CHILDREN_TTL);
  await pipe.exec();
}

// Bug fix: use mget to batch all child lookups into one Redis round-trip instead of N serial calls
export async function countActiveChildren(parentSessionId: string): Promise<number> {
  const redis = getRedis();
  const runIds = await redis.smembers(`subagent:children:${parentSessionId}`);
  if (!runIds.length) return 0;

  const keys = (runIds as string[]).map((id) => `subagent:${id}`);
  const records = (await redis.mget(...keys)) as (SubagentRecord | null)[];
  return records.filter(
    (r): r is SubagentRecord => r !== null && (r.status === "pending" || r.status === "running")
  ).length;
}

export async function listSubagentsForSession(parentSessionId: string): Promise<SubagentRecord[]> {
  const redis = getRedis();
  const runIds = await redis.smembers(`subagent:children:${parentSessionId}`);
  if (!runIds.length) return [];

  const keys = (runIds as string[]).map((id) => `subagent:${id}`);
  const records = (await redis.mget(...keys)) as (SubagentRecord | null)[];
  return (records.filter((r): r is SubagentRecord => r !== null))
    .sort((a, b) => b.createdAt - a.createdAt);
}
