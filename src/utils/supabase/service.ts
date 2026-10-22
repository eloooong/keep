import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";
import { isDemoMode } from "@/utils/demo/isDemo";
import { createMockServerClient } from "@/utils/demo/mock";
import { getSupabaseConfig } from "@/utils/config";

export function createServiceClient() {
  if (isDemoMode()) {
    return createMockServerClient() as unknown as SupabaseClient;
  }
  const { url } = getSupabaseConfig();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key)
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for reminders");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
