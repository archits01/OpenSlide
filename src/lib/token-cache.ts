import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

const key = (userId: string, provider: string) => `token:${userId}:${provider}`;

export async function getCachedToken(userId: string, provider: string): Promise<string | null> {
  return redis.get<string>(key(userId, provider));
}

export async function cacheToken(
  userId: string,
  provider: string,
  token: string,
  expiresInSec: number
): Promise<void> {
  await redis.set(key(userId, provider), token, { ex: expiresInSec - 60 });
}

export async function invalidateToken(userId: string, provider: string): Promise<void> {
  await redis.del(key(userId, provider));
}
