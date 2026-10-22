/**
 * Returns true when the app should run against the built-in demo data
 * instead of a real Supabase project.
 *
 * Demo mode must be explicitly enabled. Missing credentials never bypass auth.
 */
export function isDemoMode(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true";
}
