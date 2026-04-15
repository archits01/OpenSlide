import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockRedis = {
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
};

vi.mock('@upstash/redis', () => ({
  Redis: {
    fromEnv: () => mockRedis,
  },
}));

describe('token-cache', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('getCachedToken returns null on cache miss', async () => {
    const { Redis } = await import('@upstash/redis');
    (Redis.fromEnv() as ReturnType<typeof Redis.fromEnv> & { get: ReturnType<typeof vi.fn> }).get.mockResolvedValue(null);
    const { getCachedToken } = await import('../lib/token-cache');
    expect(await getCachedToken('user1', 'gmail')).toBeNull();
  });

  it('getCachedToken returns token on cache hit', async () => {
    const redis = (await import('@upstash/redis')).Redis.fromEnv();
    (redis.get as ReturnType<typeof vi.fn>).mockResolvedValue('ya29.token');
    const { getCachedToken } = await import('../lib/token-cache');
    expect(await getCachedToken('user1', 'gmail')).toBe('ya29.token');
  });

  it('cacheToken sets key with TTL minus 60s buffer', async () => {
    const redis = (await import('@upstash/redis')).Redis.fromEnv();
    const { cacheToken } = await import('../lib/token-cache');
    await cacheToken('user1', 'gmail', 'ya29.token', 3600);
    expect(redis.set).toHaveBeenCalledWith(
      'token:user1:gmail',
      'ya29.token',
      { ex: 3540 }
    );
  });

  it('invalidateToken deletes the key', async () => {
    const redis = (await import('@upstash/redis')).Redis.fromEnv();
    const { invalidateToken } = await import('../lib/token-cache');
    await invalidateToken('user1', 'gmail');
    expect(redis.del).toHaveBeenCalledWith('token:user1:gmail');
  });
});
