// src/lib/get-valid-token.ts
import { prisma } from '@/lib/db';
import { getCachedToken, cacheToken, invalidateToken } from './token-cache';
import { decrypt, encrypt } from './crypto';
import { refreshAccessToken } from './refresh-token';

export async function getValidToken(
  userId: string,
  provider: string
): Promise<string | null> {
  // 1. Redis cache hit
  const cached = await getCachedToken(userId, provider);
  if (cached) return cached;

  // 2. Fetch from DB
  const conn = await prisma.userConnection.findUnique({
    where: { userId_provider: { userId, provider } },
  });
  if (!conn) return null;

  // 3. Broken — needs reconnect
  if (conn.status === 'broken') return null;

  // 4. Not expired — decrypt, cache, return
  if (!conn.expiresAt || conn.expiresAt > new Date()) {
    const token = decrypt(conn.accessToken);
    const ttl = conn.expiresAt
      ? Math.floor((conn.expiresAt.getTime() - Date.now()) / 1000)
      : 3600;
    await cacheToken(userId, provider, token, ttl);
    return token;
  }

  // 5. Expired — try refresh
  if (!conn.refreshToken) {
    await markBroken(conn.id, userId, provider);
    return null;
  }

  try {
    const { access_token, expires_in } = await refreshAccessToken(
      provider,
      decrypt(conn.refreshToken)
    );

    await prisma.userConnection.update({
      where: { id: conn.id },
      data: {
        accessToken: encrypt(access_token),
        expiresAt: new Date(Date.now() + expires_in * 1000),
      },
    });

    await cacheToken(userId, provider, access_token, expires_in);
    return access_token;
  } catch {
    await markBroken(conn.id, userId, provider);
    return null;
  }
}

async function markBroken(id: string, userId: string, provider: string): Promise<void> {
  await prisma.userConnection.update({ where: { id }, data: { status: 'broken' } });
  await invalidateToken(userId, provider);
}
