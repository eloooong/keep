import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      let destination = new URL("/", origin);
      try {
        destination = new URL(next, origin);
      } catch {
        /* Use the workspace for invalid paths. */
      }
      return NextResponse.redirect(
        destination.origin === origin ? destination : new URL("/", origin),
      );
    }
  }

  const error = searchParams.get("error") ?? "auth_failed";
  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent(error)}`,
  );
}
