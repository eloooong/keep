"use client";

import type { ActivityRow } from "@/app/actions/activity";
import { AnimatedList } from "@/components/react-bits/AnimatedList";

const ACTION_LABELS: Record<string, string> = {
  view: "View",
  copy: "Copy",
  edit: "Edit",
  share: "Share",
  revoke: "Revoke",
};

const ACTION_COLORS: Record<string, string> = {
  view: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
  copy: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300",
  edit: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  share: "bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300",
  revoke: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

export function ActivityList({ activity }: { activity: ActivityRow[] }) {
  return (
    <div className="space-y-2">
      <AnimatedList>
        {activity.map((entry) => {
          const label = ACTION_LABELS[entry.action] ?? entry.action;
          const color = ACTION_COLORS[entry.action] ?? ACTION_COLORS.view;
          const datetime = new Date(entry.created_at).toLocaleString();
          return (
            <div
              key={entry.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-black/[.08] px-3 py-2 dark:border-white/[.1]"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-medium ${color}`}
                >
                  {label}
                </span>
                <p className="truncate text-sm text-zinc-900 dark:text-zinc-50">
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
      </AnimatedList>
    </div>
  );
}
