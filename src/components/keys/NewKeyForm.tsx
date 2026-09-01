"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { createKey } from "@/app/actions/keys";

export function NewKeyForm({ onSubmit }: { onSubmit?: () => void }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="space-y-3"
      action={(formData) => {
        startTransition(async () => {
          await createKey(formData);
          router.refresh();
          onSubmit?.();
        });
      }}
    >
      <div className="space-y-3">
        <div>
          <label
            htmlFor="new-key-name"
            className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Name
          </label>
          <input
            id="new-key-name"
            name="name"
            type="text"
            required
            placeholder="e.g. Production Stripe"
            className="w-full rounded-lg border border-black/[.08] px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400 dark:border-white/[.15] dark:bg-zinc-900 dark:text-zinc-50"
          />
        </div>
        <div>
          <label
            htmlFor="new-key-value"
            className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Value
          </label>
          <input
            id="new-key-value"
            name="value"
            type="password"
            required
            placeholder="sk-..."
            className="w-full rounded-lg border border-black/[.08] px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400 dark:border-white/[.15] dark:bg-zinc-900 dark:text-zinc-50"
          />
        </div>
        <div>
          <label
            htmlFor="new-key-notes"
            className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Notes
          </label>
          <textarea
            id="new-key-notes"
            name="notes"
            rows={2}
            className="w-full rounded-lg border border-black/[.08] px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400 dark:border-white/[.15] dark:bg-zinc-900 dark:text-zinc-50"
          />
        </div>
        <div>
          <label
            htmlFor="new-key-category"
            className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Category
          </label>
          <input
            id="new-key-category"
            name="category"
            type="text"
            placeholder="e.g. Payments, AI, Infra"
            className="w-full rounded-lg border border-black/[.08] px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400 dark:border-white/[.15] dark:bg-zinc-900 dark:text-zinc-50"
          />
        </div>
        <div>
          <label
            htmlFor="new-key-expires"
            className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Expires
          </label>
          <input
            id="new-key-expires"
            name="expires_at"
            type="date"
            className="w-full rounded-lg border border-black/[.08] px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400 dark:border-white/[.15] dark:bg-zinc-900 dark:text-zinc-50"
          />
        </div>
        <div>
          <label
            htmlFor="new-key-tags"
            className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Tags{" "}
            <span className="text-zinc-400 dark:text-zinc-500">
              (comma-separated)
            </span>
          </label>
          <input
            id="new-key-tags"
            name="tags"
            type="text"
            placeholder="prod, stripe, backend"
            className="w-full rounded-lg border border-black/[.08] px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400 dark:border-white/[.15] dark:bg-zinc-900 dark:text-zinc-50"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {isPending ? "Saving..." : "Add key"}
      </button>
    </form>
  );
}
