"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthLayout } from "@/components/AuthLayout";
import { createClient } from "@/utils/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [valid, setValid] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    createClient()
      .auth.getUser()
      .then(({ data: { user } }) => {
        if (active) {
          setValid(Boolean(user));
          setReady(true);
        }
      })
      .catch(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const password = String(values.get("password") ?? "");
    if (password !== values.get("confirmation")) {
      setError("Passwords do not match.");
      return;
    }
    setPending(true);
    setError("");
    try {
      const { error } = await createClient().auth.updateUser({ password });
      if (error) throw error;
      router.replace("/?password=updated");
      router.refresh();
    } catch {
      setError(
        "Unable to update your password. Try again or request a new reset link.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthLayout>
      <div className="auth-form">
        <h1>Set a new password</h1>
        {!ready ? (
          <p role="status">Checking your reset link…</p>
        ) : !valid ? (
          <>
            <p>
              This reset link has expired or is invalid. Return to sign in and
              request a new link.
            </p>
            <Link href="/login">Back to sign in</Link>
          </>
        ) : (
          <form onSubmit={submit} className="space-y-4 mt-6">
            <div>
              <label htmlFor="reset-password">New password</label>
              <input
                className="auth-input"
                id="reset-password"
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={12}
                maxLength={128}
                required
              />
            </div>
            <div>
              <label htmlFor="reset-confirmation">Confirm password</label>
              <input
                className="auth-input"
                id="reset-confirmation"
                name="confirmation"
                type="password"
                autoComplete="new-password"
                minLength={12}
                maxLength={128}
                required
              />
            </div>
            <p className="form-help">Use at least 12 characters.</p>
            {error && (
              <p role="alert" className="row-error">
                {error}
              </p>
            )}
            <button className="button-primary" disabled={pending} type="submit">
              {pending ? "Updating…" : "Update password"}
            </button>
          </form>
        )}
      </div>
    </AuthLayout>
  );
}
