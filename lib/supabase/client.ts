import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  // During build/prerender without env vars (e.g. CI), return an inert stub.
  // All Supabase calls happen in useEffect or event handlers — never during
  // server-side rendering — so this stub is never invoked.
  if ((!url || !key) && typeof window === "undefined") {
    return {} as SupabaseClient;
  }

  if (!browserClient) {
    browserClient = createBrowserClient(url!, key!);
  }
  return browserClient;
}
