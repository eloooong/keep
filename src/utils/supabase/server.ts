import type { SupabaseClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { isDemoMode } from "@/utils/demo/isDemo";
import { createMockServerClient } from "@/utils/demo/mock";
import { authCookieOptions, getSupabaseConfig } from "@/utils/config";

export async function createClient() {
  if (isDemoMode()) {
    // Demo mode: in-memory mock with the same surface as the real client.
    return createMockServerClient() as unknown as SupabaseClient;
  }

  const cookieStore = await cookies();
  const { url, key } = getSupabaseConfig();

  return createServerClient(url, key, {
    cookieOptions: authCookieOptions,
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Called from a Server Component — ignore.
        }
      },
    },
  });
}
