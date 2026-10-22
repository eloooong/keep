"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { dismissKeyReminder, dismissAllKeyReminders } from "@/app/actions/keys";
import { expiryStatus, formatExpiry } from "@/utils/expiry";
import { AnimatedList } from "@/components/react-bits/AnimatedList";
import { IconButton } from "@/components/ui/IconButton";
import { Glyph } from "@/components/ui/Glyph";

type ExpiryBannerProps = {
  keys: { id: string; name: string; expires_at: string | null }[];
};

export function ExpiryBanner({ keys }: ExpiryBannerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const flagged = keys
    .filter((k) => {
      const s = expiryStatus(k.expires_at);
      return s === "expired" || s === "soon";
    })
    .sort((a, b) => {
      const da = new Date(a.expires_at!).getTime();
      const db = new Date(b.expires_at!).getTime();
      return da - db;
    });

  if (flagged.length === 0) return null;

  function handleDismiss(keyId: string) {
    startTransition(async () => {
      setError(null);
      try {
        await dismissKeyReminder(keyId);
        router.refresh();
      } catch {
        setError("Unable to dismiss this reminder. Please try again.");
      }
    });
  }

  function handleDismissAll() {
    startTransition(async () => {
      setError(null);
      try {
        await dismissAllKeyReminders(flagged.map((k) => k.id));
        router.refresh();
      } catch {
        setError("Unable to dismiss reminders. Please try again.");
      }
    });
  }

  return (
    <div className="expiry-banner mb-6 rounded-xl p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Key expiry reminders</h3>
        <button
          type="button"
          onClick={handleDismissAll}
          disabled={isPending}
          className="expiry-dismiss text-xs font-medium underline transition-colors disabled:opacity-50"
        >
          Dismiss all
        </button>
      </div>
      {error && <p role="alert">{error}</p>}
      <div className="space-y-1">
        <AnimatedList>
          {flagged.map((k) => {
            const status = expiryStatus(k.expires_at);
            const label = formatExpiry(k.expires_at);
            return (
              <div key={k.id} className="flex items-center gap-2 text-sm">
                <span
                  className={`inline-block h-2 w-2 rounded-full ${
                    status === "expired" ? "bg-red-500" : "bg-amber-500"
                  }`}
                />
                <span
                  className={
                    status === "expired"
                      ? "text-red-700 dark:text-red-300"
                      : "text-amber-700 dark:text-amber-300"
                  }
                >
                  <span className="font-medium">{k.name}</span>
                  {status === "expired"
                    ? ` — Expired ${label}`
                    : ` — Expires ${label}`}
                </span>
                <IconButton
                  icon={<Glyph name="close" size={17} />}
                  ariaLabel={`Dismiss ${k.name}`}
                  onClick={() => handleDismiss(k.id)}
                  disabled={isPending}
                  className="ml-auto flex-shrink-0"
                />
              </div>
            );
          })}
        </AnimatedList>
      </div>
    </div>
  );
}
