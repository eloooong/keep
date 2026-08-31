"use client";

import { useTransition } from "react";
import { updateKey } from "@/app/actions/keys";

export function EditKeyForm({
  keyId,
  name,
  notes,
  category,
  tags,
  expiresAt,
  onDone,
  onCancel,
}: {
  keyId: string;
  name: string;
  notes: string | null;
  category: string | null;
  tags: string[];
  expiresAt: string | null;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="space-y-3"
      action={(formData) => {
        startTransition(async () => {
          await updateKey(keyId, formData);
          onDone();
        });
      }}
    >
      <div>
        <label
          htmlFor={`edit-${keyId}-name`}
          className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Name
        </label>
        <input
          id={`edit-${keyId}-name`}
          name="name"
          type="text"
          required
          defaultValue={name}
          className="w-full rounded-lg border border-black/[.08] px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400 dark:border-white/[.15] dark:bg-zinc-900 dark:text-zinc-50"
        />
      </div>
      <div>
        <label
          htmlFor={`edit-${keyId}-value`}
          className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Value{" "}
          <span className="text-zinc-400 dark:text-zinc-500">
            (leave blank to keep current)
          </span>
        </label>
        <input
          id={`edit-${keyId}-value`}
          name="value"
          type="password"
          placeholder="sk-..."
          className="w-full rounded-lg border border-black/[.08] px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400 dark:border-white/[.15] dark:bg-zinc-900 dark:text-zinc-50"
        />
      </div>
      <div>
        <label
          htmlFor={`edit-${keyId}-notes`}
          className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Notes
        </label>
        <textarea
          id={`edit-${keyId}-notes`}
          name="notes"
          rows={2}
          defaultValue={notes ?? ""}
          className="w-full rounded-lg border border-black/[.08] px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400 dark:border-white/[.15] dark:bg-zinc-900 dark:text-zinc-50"
        />
      </div>
      <div>
        <label
          htmlFor={`edit-${keyId}-category`}
          className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Category
        </label>
        <input
          id={`edit-${keyId}-category`}
          name="category"
          type="text"
          defaultValue={category ?? ""}
          className="w-full rounded-lg border border-black/[.08] px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400 dark:border-white/[.15] dark:bg-zinc-900 dark:text-zinc-50"
        />
      </div>
      <div>
        <label
          htmlFor={`edit-${keyId}-tags`}
          className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Tags{" "}
          <span className="text-zinc-400 dark:text-zinc-500">
            (comma-separated)
          </span>
        </label>
        <input
          id={`edit-${keyId}-tags`}
          name="tags"
          type="text"
          defaultValue={tags.join(", ")}
          className="w-full rounded-lg border border-black/[.08] px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400 dark:border-white/[.15] dark:bg-zinc-900 dark:text-zinc-50"
        />
      </div>
      <div>
        <label
          htmlFor={`edit-${keyId}-expires`}
          className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Expires{" "}
          <span className="text-zinc-400 dark:text-zinc-500">
            (leave blank to clear)
          </span>
        </label>
        <input
          id={`edit-${keyId}-expires`}
          name="expires_at"
          type="date"
          defaultValue={expiresAt ? expiresAt.slice(0, 10) : ""}
          className="w-full rounded-lg border border-black/[.08] px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400 dark:border-white/[.15] dark:bg-zinc-900 dark:text-zinc-50"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {isPending ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-black/[.08] px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-white/[.15] dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
