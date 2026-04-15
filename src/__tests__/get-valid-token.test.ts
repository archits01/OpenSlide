import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../lib/token-cache', () => ({
  getCachedToken: vi.fn(),
  cacheToken: vi.fn(),
  invalidateToken: vi.fn(),
}));
vi.mock('../lib/crypto', () => ({
  decrypt: vi.fn((s: string) => `decrypted:${s}`),
  encrypt: vi.fn((s: string) => `encrypted:${s}`),
}));
vi.mock('../lib/refresh-token', () => ({
  refreshAccessToken: vi.fn(),
}));
vi.mock('../lib/db', () => ({
  prisma: {
    userConnection: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe('get-valid-token', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns cached token on Redis hit', async () => {
    const { getCachedToken } = await import('../lib/token-cache');
    (getCachedToken as ReturnType<typeof vi.fn>).mockResolvedValue('cached-token');

    const { getValidToken } = await import('../lib/get-valid-token');
    expect(await getValidToken('user1', 'gmail')).toBe('cached-token');
  });

  it('returns null if no DB record', async () => {
    const { getCachedToken } = await import('../lib/token-cache');
    (getCachedToken as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const prisma = (await import('../lib/db')).prisma;
    (prisma.userConnection.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const { getValidToken } = await import('../lib/get-valid-token');
    expect(await getValidToken('user1', 'gmail')).toBeNull();
  });

  it('returns null and does not decrypt if status is broken', async () => {
    const { getCachedToken } = await import('../lib/token-cache');
    (getCachedToken as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const prisma = (await import('../lib/db')).prisma;
    (prisma.userConnection.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: 'broken',
      accessToken: 'enc-token',
      expiresAt: null,
      refreshToken: null,
    });

    const { getValidToken } = await import('../lib/get-valid-token');
    expect(await getValidToken('user1', 'gmail')).toBeNull();
  });

  it('decrypts and caches if token not expired', async () => {
    const { getCachedToken, cacheToken } = await import('../lib/token-cache');
    (getCachedToken as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const prisma = (await import('../lib/db')).prisma;
    const futureDate = new Date(Date.now() + 3600_000);
    (prisma.userConnection.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: 'active',
      accessToken: 'enc-token',
      expiresAt: futureDate,
      refreshToken: null,
    });

    const { getValidToken } = await import('../lib/get-valid-token');
    const token = await getValidToken('user1', 'gmail');

    expect(token).toBe('decrypted:enc-token');
    expect(cacheToken).toHaveBeenCalled();
  });
});
