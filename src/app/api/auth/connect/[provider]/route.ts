// src/app/api/auth/connect/[provider]/route.ts
import { createClient } from "@/lib/supabase/server";
import { Redis } from "@upstash/redis";
import { OAUTH_CONFIGS } from "@/lib/oauth-configs";

const redis = Redis.fromEnv();

export async function GET(
  req: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;
  const config = OAUTH_CONFIGS[provider];
  if (!config) {
    return Response.json({ error: `Unknown provider: ${provider}` }, { status: 400 });
  }

  // This route uses redirect-based auth (not JSON 401) so we keep createClient directly
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return Response.redirect(new URL("/?auth=1", req.url));
  }

  const { searchParams } = new URL(req.url);
  const returnTo = searchParams.get("returnTo") ?? "/settings/connections";

  // CSRF state
  const state = crypto.randomUUID();
  await redis.set(`oauth_state:${state}`, JSON.stringify({ userId: user.id, returnTo }), { ex: 300 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const redirectUri = `${appUrl}/api/auth/callback/${provider}`;

  const url = new URL(config.authUrl);
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", config.scopes.join(" "));
  url.searchParams.set("state", state);
  url.searchParams.set("response_type", "code");
  if (config.extras) {
    for (const [k, v] of Object.entries(config.extras)) {
      url.searchParams.set(k, v);
    }
  }

  return Response.redirect(url.toString());
}
