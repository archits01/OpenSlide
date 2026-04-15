// src/lib/api-key.ts
import { createHash, randomBytes } from 'crypto';
import { prisma } from '@/lib/db';

const PREFIX = 'sk-os-';

export async function createApiKey(
  userId: string,
  name: string = 'Default'
): Promise<{ rawKey: string; id: string; prefix: string }> {
  const random = randomBytes(24).toString('base64url');
  const rawKey = `${PREFIX}${random}`;
  const keyHash = hashKey(rawKey);
  const prefix = rawKey.slice(0, 12) + '...';

  const record = await prisma.apiKey.create({
    data: { userId, name, keyHash, prefix },
  });

  return { rawKey, id: record.id, prefix };
}

export async function validateApiKey(rawKey: string): Promise<string | null> {
  if (!rawKey.startsWith(PREFIX)) return null;

  const keyHash = hashKey(rawKey);
  const record = await prisma.apiKey.findUnique({ where: { keyHash } });
  if (!record) return null;

  prisma.apiKey.update({
    where: { id: record.id },
    data: { lastUsedAt: new Date() },
  }).catch(() => {});

  return record.userId;
}

export async function revokeApiKey(id: string, userId: string): Promise<boolean> {
  const result = await prisma.apiKey.deleteMany({
    where: { id, userId },
  });
  return result.count > 0;
}

export async function listApiKeys(userId: string) {
  return prisma.apiKey.findMany({
    where: { userId },
    select: { id: true, name: true, prefix: true, lastUsedAt: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
}

function hashKey(rawKey: string): string {
  return createHash('sha256').update(rawKey).digest('hex');
}
