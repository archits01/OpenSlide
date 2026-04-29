import { createBrowserClient } from "@supabase/ssr";

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (!browserClient) {
    browserClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          // Prevents "lock was stolen" errors when middleware and client-side
          // both try to refresh the token concurrently.
          lock: async (name, acquireTimeout, fn) => fn(),
        },
      }
    );
  }
  return browserClient;
}
