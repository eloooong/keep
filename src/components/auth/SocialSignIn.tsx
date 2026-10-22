"use client";

import { useId, useState } from "react";
import { Glyph } from "@/components/ui/Glyph";
import { createClient } from "@/utils/supabase/client";
import { isDemoMode } from "@/utils/demo/isDemo";
import {
  authProviders,
  getEnabledAuthProviders,
  type AuthProvider,
} from "@/utils/auth-providers";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z"
      />
    </svg>
  );
}

export function SocialSignIn() {
  const descriptionId = useId();
  const enabled = isDemoMode()
    ? authProviders.map(({ id }) => id)
    : getEnabledAuthProviders();
  const [pending, setPending] = useState<AuthProvider | null>(null);
  const [error, setError] = useState("");

  async function signIn(provider: AuthProvider) {
    setError("");
    setPending(provider);
    try {
      const { error } = await createClient().auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
    } catch {
      setError("Unable to start sign-in. Try again or continue with email.");
      setPending(null);
    }
  }

  return (
    <div className="mt-6">
      <div className="mb-5 flex items-center gap-3 text-xs text-zinc-400">
        <span className="h-px flex-1 bg-white/10" />
        or continue with
        <span className="h-px flex-1 bg-white/10" />
      </div>
      <div className="flex flex-col gap-3" aria-label="Social sign-in">
        {authProviders.map(({ id, name }) => {
          const available = enabled.includes(id);
          return (
            <button
              key={id}
              type="button"
              disabled={!available || pending !== null}
              aria-describedby={!available ? descriptionId : undefined}
              aria-busy={pending === id}
              onClick={() => signIn(id)}
              className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:text-zinc-400 disabled:hover:bg-transparent"
            >
              {id === "google" ? (
                <GoogleIcon />
              ) : (
                <Glyph name="github" size={18} />
              )}
              {pending === id
                ? `Connecting to ${name}…`
                : `Continue with ${name}`}
            </button>
          );
        })}
      </div>
      {enabled.length < authProviders.length && (
        <p
          id={descriptionId}
          className="mt-3 text-center text-xs leading-relaxed text-zinc-400"
        >
          {enabled.length === 0
            ? "Social sign-in isn’t available yet. Continue with email."
            : "Some sign-in options aren’t available yet."}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
