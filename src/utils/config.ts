export const authCookieOptions = { name: "keep-auth" };

export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, or explicitly enable NEXT_PUBLIC_DEMO_MODE=true for a sample workspace.",
    );
  }
  const parsed = new URL(url);
  if (!["https:", "http:"].includes(parsed.protocol)) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL must be an HTTP(S) URL");
  }
  return { url, key };
}
