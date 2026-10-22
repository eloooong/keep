import type { SupabaseClient } from "@supabase/supabase-js";
import { createBrowserClient } from "@supabase/ssr";
import { isDemoMode } from "@/utils/demo/isDemo";
import { createMockBrowserAuth } from "@/utils/demo/mockAuth";
import { authCookieOptions, getSupabaseConfig } from "@/utils/config";

export function createClient(options?: { persistSession?: boolean }) {
  if (isDemoMode()) {
    return { auth: createMockBrowserAuth() } as unknown as SupabaseClient;
  }
  const { url, key } = getSupabaseConfig();
  return createBrowserClient(url, key, {
    cookieOptions: authCookieOptions,
    auth: { persistSession: options?.persistSession ?? true },
  });
}
