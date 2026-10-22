"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import {
  createShare,
  updateSharePermission,
  revokeShare,
  listShares,
  type ShareListItem,
} from "@/app/actions/shares";
import { AnimatedContent } from "@/components/react-bits/AnimatedContent";
import { AnimatedList } from "@/components/react-bits/AnimatedList";

export function ManageShares({ keyId }: { keyId: string }) {
  const [shares, setShares] = useState<ShareListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const load = useCallback(() => {
    listShares(keyId)
      .then(setShares)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [keyId]);

  useEffect(() => {
    load();
  }, [load]);

  function handleInvite(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await createShare(keyId, formData);
        load();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to share");
      }
    });
  }

  function handlePermissionChange(shareId: string, permission: string) {
    setError(null);
    startTransition(async () => {
      try {
        await updateSharePermission(shareId, permission);
        load();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update");
      }
    });
  }

  function handleRevoke(shareId: string) {
    if (!window.confirm("Revoke this share?")) return;
    setError(null);
    startTransition(async () => {
      try {
        await revokeShare(shareId);
        load();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to revoke");
      }
    });
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        Share with others
      </p>
      <AnimatedContent>
        <form action={handleInvite} className="flex gap-2">
          <input
            name="email"
            aria-label="Recipient email"
            type="email"
            required
            placeholder="user@example.com"
            className="flex-1 rounded-lg border border-black/[.08] px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400 dark:border-white/[.15] dark:bg-zinc-900 dark:text-zinc-50"
          />
          <select
            name="permission"
            aria-label="Recipient permission"
            defaultValue="view"
            className="rounded-lg border border-black/[.08] bg-transparent px-2 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400 dark:border-white/[.15] dark:bg-zinc-900 dark:text-zinc-50"
          >
            <option value="view">View</option>
            <option value="edit">Edit</option>
          </select>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {isPending ? "Adding..." : "Add"}
          </button>
        </form>
      </AnimatedContent>

      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading...</p>
      ) : shares.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Not shared with anyone yet.
        </p>
      ) : (
        <div className="space-y-2">
          <AnimatedList>
            {shares.map((share) => (
              <div
                key={share.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-black/[.08] px-3 py-2 dark:border-white/[.1]"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm text-zinc-900 dark:text-zinc-50">
                    {share.email}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={share.permission}
                    aria-label={`Permission for ${share.email}`}
                    onChange={(e) =>
                      handlePermissionChange(share.id, e.target.value)
                    }
                    disabled={isPending}
                    className="rounded-lg border border-black/[.08] bg-transparent px-2 py-1.5 text-sm text-zinc-900 outline-none focus:border-zinc-400 dark:border-white/[.15] dark:bg-zinc-900 dark:text-zinc-50"
                  >
                    <option value="view">View</option>
                    <option value="edit">Edit</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => handleRevoke(share.id)}
                    disabled={isPending}
                    className="rounded-lg border border-black/[.08] px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 dark:border-white/[.15] dark:text-red-400 dark:hover:bg-red-950"
                  >
                    Revoke
                  </button>
                </div>
              </div>
            ))}
          </AnimatedList>
        </div>
      )}
    </div>
  );
}
