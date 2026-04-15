// src/lib/refresh-token.ts
import { OAUTH_CONFIGS } from './oauth-configs';

export interface RefreshResult {
  access_token: string;
  expires_in: number;
}

export async function refreshAccessToken(
  provider: string,
  refreshToken: string
): Promise<RefreshResult> {
  if (provider === 'github') {
    return { access_token: refreshToken, expires_in: 999999999 };
  }

  if (provider === 'notion') {
    return { access_token: refreshToken, expires_in: 999999999 };
  }

  if (provider === 'slack') {
    return { access_token: refreshToken, expires_in: 999999999 };
  }

  const config = OAUTH_CONFIGS[provider];
  if (!config) throw new Error(`Unknown provider: ${provider}`);

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: config.clientId,
    client_secret: config.clientSecret,
  });

  const res = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token refresh failed for ${provider}: ${res.status} ${text}`);
  }

  const data = await res.json() as { access_token: string; expires_in: number };
  return { access_token: data.access_token, expires_in: data.expires_in };
}
