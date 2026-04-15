// src/__tests__/refresh-token.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('refresh-token', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.GOOGLE_CLIENT_ID = 'google-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'google-client-secret';
    process.env.GITHUB_CLIENT_ID = 'github-client-id';
    process.env.GITHUB_CLIENT_SECRET = 'github-client-secret';
  });

  it('refreshes Google token via correct endpoint', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: 'new-token', expires_in: 3600 }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const { refreshAccessToken } = await import('../lib/refresh-token');
    const result = await refreshAccessToken('gmail', 'refresh-tok');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://oauth2.googleapis.com/token',
      expect.objectContaining({ method: 'POST' })
    );
    expect(result).toEqual({ access_token: 'new-token', expires_in: 3600 });
  });

  it('throws on non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => 'invalid_grant',
    }));

    const { refreshAccessToken } = await import('../lib/refresh-token');
    await expect(refreshAccessToken('gmail', 'bad-token')).rejects.toThrow('Token refresh failed');
  });

  it('GitHub is a no-op (tokens do not expire)', async () => {
    const mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);

    const { refreshAccessToken } = await import('../lib/refresh-token');
    const result = await refreshAccessToken('github', 'gh-tok');

    expect(mockFetch).not.toHaveBeenCalled();
    expect(result).toEqual({ access_token: 'gh-tok', expires_in: 999999999 });
  });
});
