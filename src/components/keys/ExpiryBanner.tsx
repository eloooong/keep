"use client";

import { expiryStatus, formatExpiry } from "@/utils/expiry";

type ExpiryBannerProps = {
  keys: { id: string; name: string; expires_at: string | null }[];
};

export function ExpiryBanner({ keys }: ExpiryBannerProps) {
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

  return (
    <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
      <h3 className="mb-2 text-sm font-semibold text-amber-800 dark:text-amber-200">
        Key expiry reminders
      </h3>
      <ul className="space-y-1">
        {flagged.map((k) => {
          const status = expiryStatus(k.expires_at);
          const label = formatExpiry(k.expires_at);
          return (
            <li key={k.id} className="flex items-center gap-2 text-sm">
              <span
                className={`inline-block h-2 w-2 rounded-full ${
                  status === "expired"
                    ? "bg-red-500"
                    : "bg-amber-500"
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
            </li>
          );
        })}
      </ul>
    </div>
  );
}
