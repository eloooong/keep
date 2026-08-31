"use client";

import type { ActivityRow } from "@/app/actions/activity";

const ACTION_LABELS: Record<string, string> = {
  view: "View",
  copy: "Copy",
  edit: "Edit",
  share: "Share",
  revoke: "Revoke",
};

export function ActivityList({ activity }: { activity: ActivityRow[] }) {
  return (
    <div className="space-y-2">
      {activity.map((entry) => {
        const label = ACTION_LABELS[entry.action] ?? entry.action;
        const datetime = new Date(entry.created_at).toLocaleString();
        return (
          <div
            key={entry.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-black/[.08] px-3 py-2 dark:border-white/[.1]"
          >
            <div className="min-w-0">
              <p className="truncate text-sm text-zinc-900 dark:text-zinc-50">
                {label}{" "}
                <span className="text-zinc-500 dark:text-zinc-400">
                  {entry.keyName ?? "deleted key"}
                </span>
              </p>
            </div>
            <p className="shrink-0 text-sm text-zinc-500 dark:text-zinc-400">
              {datetime}
            </p>
          </div>
        );
      })}
    </div>
  );
}
