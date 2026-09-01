"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  dismissKeyReminder,
  dismissAllKeyReminders,
} from "@/app/actions/keys";
import { expiryStatus, formatExpiry } from "@/utils/expiry";
import { AnimatedList } from "@/components/react-bits/AnimatedList";
import { IconButton } from "@/components/ui/IconButton";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon } from "@hugeicons/core-free-icons";

type ExpiryBannerProps = {
  keys: { id: string; name: string; expires_at: string | null }[];
};

export function ExpiryBanner({ keys }: ExpiryBannerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

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
      await dismissKeyReminder(keyId);
      router.refresh();
    });
  }

  function handleDismissAll() {
    startTransition(async () => {
      await dismissAllKeyReminders(flagged.map((k) => k.id));
      router.refresh();
    });
  }

  return (
    <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-200">
          Key expiry reminders
        </h3>
        <button
          type="button"
          onClick={handleDismissAll}
          disabled={isPending}
          className="text-xs font-medium text-amber-700 underline transition-colors hover:text-amber-900 disabled:opacity-50 dark:text-amber-300 dark:hover:text-amber-100"
        >
          Dismiss all
        </button>
      </div>
      <ul className="space-y-1">
        <AnimatedList>
          {flagged.map((k) => {
            const status = expiryStatus(k.expires_at);
            const label = formatExpiry(k.expires_at);
            return (
            <li key={k.id} className="flex items-center gap-2 text-sm">
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
                icon={<HugeiconsIcon icon={Cancel01Icon} size={14} />}
                ariaLabel={`Dismiss ${k.name}`}
                onClick={() => handleDismiss(k.id)}
                disabled={isPending}
                className="ml-auto flex-shrink-0"
              />
            </li>
          );
          })}
        </AnimatedList>
      </ul>
    </div>
  );
}
