"use client";

import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import { SocialSignIn } from "@/components/auth/SocialSignIn";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

const oauthErrorMessages: Record<string, string> = {
  auth_failed: "Sign-in failed. Please try again.",
  server_error: "A server error occurred. Please try again later.",
  access_denied:
    "Sign-in was canceled or access was denied. Try again or continue with email.",
  invalid_request: "Invalid request. Please try again.",
};

function getOAuthErrorMessage(code: string | null): string {
  if (!code) return "";
  return oauthErrorMessages[code] ?? "Sign-in failed. Please try again.";
}

function LoginCardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [oauthError] = useState<string | null>(() => {
    const param = searchParams.get("error");
    return param ? getOAuthErrorMessage(param) : null;
  });
  const [forgotMessage, setForgotMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient({ persistSession: remember });
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError(error.message);
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Unable to sign in. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    setForgotMessage(null);
    setError(null);
    if (!email) {
      setError("Enter your email above first to receive a reset link.");
      return;
    }
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
    });
    if (error) {
      setError(error.message);
      return;
    }
    setForgotMessage(`Password reset link sent to ${email}.`);
  }

  return (
    <div className="w-full max-w-sm justify-self-center rounded-2xl border border-black/[.08] bg-white p-8 shadow-sm dark:border-white/[.1] dark:bg-zinc-900 lg:justify-self-end">
      <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Welcome back.
      </h2>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Sign in to your Keep workspace.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="email"
            className="text-sm font-medium text-zinc-800 dark:text-zinc-200"
          >
            Email
          </label>
          <input
            id="email"
            autoComplete="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="password"
              className="text-sm font-medium text-zinc-800 dark:text-zinc-200"
            >
              Password
            </label>
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-sm font-medium text-zinc-600 underline-offset-4 hover:underline dark:text-zinc-400"
            >
              Forgot password?
            </button>
          </div>
          <input
            id="password"
            autoComplete="current-password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500 dark:border-zinc-700"
          />
          Stay signed in
        </label>

        {error && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
        {forgotMessage && (
          <p className="text-sm text-emerald-600 dark:text-emerald-400">
            {forgotMessage}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {loading ? "Logging in…" : "Log in"}
        </button>
      </form>

      <SocialSignIn />
      {oauthError && (
        <p
          role="alert"
          className="mt-3 text-center text-sm text-amber-600 dark:text-amber-400"
        >
          {oauthError}
        </p>
      )}

      <p className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="font-medium text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-100"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}

export function LoginCard() {
  return (
    <Suspense>
      <LoginCardContent />
    </Suspense>
  );
}
