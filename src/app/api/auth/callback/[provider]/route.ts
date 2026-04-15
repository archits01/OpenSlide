import { Redis } from '@upstash/redis';
import { OAUTH_CONFIGS } from '@/lib/oauth-configs';
import { encrypt } from '@/lib/crypto';
import { cacheToken } from '@/lib/token-cache';
import { prisma } from '@/lib/db';

const redis = Redis.fromEnv();

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  token_type?: string;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider } = await params;
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      return Response.redirect(new URL('/settings/connections?error=oauth_denied', req.url));
    }

    if (!code || !state) {
      return new Response('Missing code or state', { status: 400 });
    }

    // Validate CSRF state
    // Upstash auto-deserializes JSON, so the value is already an object (not a string)
    const raw = await redis.get<{ userId: string; returnTo: string }>(`oauth_state:${state}`);
    if (!raw) {
      return new Response('OAuth state expired or invalid. Please try connecting again.', { status: 400 });
    }
    await redis.del(`oauth_state:${state}`);
    const { userId, returnTo } = typeof raw === 'string' ? JSON.parse(raw) : raw;

    const config = OAUTH_CONFIGS[provider];
    if (!config) return new Response(`Unknown provider: ${provider}`, { status: 400 });

    // Exchange code for tokens
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    const redirectUri = `${appUrl}/api/auth/callback/${provider}`;

    let tokenRes: Response;

    if (provider === 'slack') {
      tokenRes = await fetch(config.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
        body: new URLSearchParams({
          code,
          redirect_uri: redirectUri,
          client_id: config.clientId,
          client_secret: config.clientSecret,
        }).toString(),
      });
    } else {
      // Standard OAuth2 (Google, GitHub)
      tokenRes = await fetch(config.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
          client_id: config.clientId,
          client_secret: config.clientSecret,
        }).toString(),
      });
    }

    if (!tokenRes.ok) {
      const text = await tokenRes.text();
      console.error(`[OAuth] Token exchange failed for ${provider}:`, text);
      return new Response(`Token exchange failed: ${text}`, { status: 502 });
    }

    const rawTokens = await tokenRes.json() as Record<string, unknown>;
    console.log(`[OAuth] Token response for ${provider}:`, Object.keys(rawTokens));

    // Normalize token response
    let tokens: TokenResponse;
    if (provider === 'slack') {
      const slackData = rawTokens as { ok?: boolean; access_token?: string; authed_user?: { access_token?: string }; team?: { name?: string } };
      tokens = {
        access_token: slackData.authed_user?.access_token ?? slackData.access_token ?? '',
        scope: (rawTokens.scope as string) ?? '',
      };
    } else {
      tokens = rawTokens as unknown as TokenResponse;
    }

    if (!tokens.access_token) {
      console.error(`[OAuth] No access_token in response for ${provider}:`, rawTokens);
      return new Response(`No access token received from ${provider}`, { status: 502 });
    }

    // Fetch provider metadata
    let metadata: Record<string, string> = {};
    try {
      if (provider === 'gmail' || provider === 'google_drive' || provider === 'google_sheets') {
        const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: { Authorization: `Bearer ${tokens.access_token}` },
        });
        if (profileRes.ok) {
          const profile = await profileRes.json() as { email?: string };
          if (profile.email) metadata = { email: profile.email };
        }
      } else if (provider === 'github') {
        const profileRes = await fetch('https://api.github.com/user', {
          headers: { Authorization: `Bearer ${tokens.access_token}`, 'User-Agent': 'OpenSlides' },
        });
        if (profileRes.ok) {
          const profile = await profileRes.json() as { login?: string };
          if (profile.login) metadata = { login: profile.login };
        }
      } else if (provider === 'slack') {
        const teamName = ((rawTokens.team as Record<string, string>)?.name) ?? '';
        if (teamName) metadata = { team: teamName };
      }
    } catch (metaErr) {
      console.warn(`[OAuth] Metadata fetch failed for ${provider}:`, metaErr);
    }

    // Upsert UserConnection
    console.log(`[OAuth] Upserting connection for user=${userId} provider=${provider}`);
    await prisma.userConnection.upsert({
      where: { userId_provider: { userId, provider } },
      create: {
        userId,
        provider,
        accessToken: encrypt(tokens.access_token),
        refreshToken: tokens.refresh_token ? encrypt(tokens.refresh_token) : null,
        expiresAt: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null,
        scopes: tokens.scope?.split(/[\s,]+/) ?? config.scopes,
        metadata,
        status: 'active',
      },
      update: {
        accessToken: encrypt(tokens.access_token),
        refreshToken: tokens.refresh_token ? encrypt(tokens.refresh_token) : null,
        expiresAt: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null,
        scopes: tokens.scope?.split(/[\s,]+/) ?? config.scopes,
        metadata,
        status: 'active',
      },
    });

    // Cache in Redis
    if (tokens.expires_in) {
      await cacheToken(userId, provider, tokens.access_token, tokens.expires_in);
    }

    console.log(`[OAuth] Successfully connected ${provider} for user=${userId}`);

    // Emit postMessage and close if popup, else redirect
    const html = `<!DOCTYPE html>
<html>
<head><title>Connected</title></head>
<body>
<script>
  if (window.opener) {
    window.opener.postMessage({ type: 'oauth_success', provider: '${provider}' }, '${appUrl}');
    window.close();
  } else {
    window.location.href = '${returnTo}?connected=${provider}';
  }
</script>
<p>Connected! You can close this window.</p>
</body>
</html>`;

    return new Response(html, { headers: { 'Content-Type': 'text/html' } });

  } catch (err) {
    console.error('[OAuth] Unhandled error in callback:', err);
    return new Response(`Internal error: ${err instanceof Error ? err.message : String(err)}`, { status: 500 });
  }
}
