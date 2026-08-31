"use client";

import { useEffect, useState, useTransition } from "react";
import { revealKey, deleteKey, copyKey } from "@/app/actions/keys";
import { EditKeyForm } from "@/components/keys/EditKeyForm";

const COPY_CLEAR_MS = 15000;

export function KeyRow({
  keyId,
  name,
  notes,
  category,
  tags,
  maskedValue,
}: {
  keyId: string;
  name: string;
  notes: string | null;
  category: string | null;
  tags: string[];
  maskedValue: string;
}) {
  const [revealed, setRevealed] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isRevealing, startReveal] = useTransition();
  const [isDeleting, startDelete] = useTransition();
  const [isCopying, startCopy] = useTransition();

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => {
      navigator.clipboard.writeText("").catch(() => {});
      setCopied(false);
    }, COPY_CLEAR_MS);
    return () => clearTimeout(timer);
  }, [copied]);

  function handleReveal() {
    if (revealed !== null) {
      setRevealed(null);
      return;
    }
    startReveal(async () => {
      setRevealed(await revealKey(keyId));
    });
  }

  function handleCopy() {
    startCopy(async () => {
      const plaintext = await copyKey(keyId);
      await navigator.clipboard.writeText(plaintext);
      setCopied(true);
    });
  }

  function handleDelete() {
    if (!window.confirm(`Delete "${name}"?`)) return;
    startDelete(async () => {
      await deleteKey(keyId);
    });
  }

  if (editing) {
    return (
      <div className="rounded-xl border border-black/[.08] px-4 py-3 dark:border-white/[.1]">
        <EditKeyForm
          keyId={keyId}
          name={name}
          notes={notes}
          category={category}
          tags={tags}
          onDone={() => setEditing(false)}
          onCancel={() => setEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-black/[.08] px-4 py-3 dark:border-white/[.1]">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium text-zinc-900 dark:text-zinc-50">{name}</p>
          {category ? (
            <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
              {category}
            </span>
          ) : null}
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
            >
              #{tag}
            </span>
          ))}
        </div>
        {notes ? (
          <p className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-400">
            {notes}
          </p>
        ) : null}
        <p className="mt-1 font-mono text-sm text-zinc-500 dark:text-zinc-400">
          {revealed ?? maskedValue}
        </p>
      </div>
      <div className="flex flex-shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={handleCopy}
          disabled={isCopying}
          className="rounded-lg border border-black/[.08] px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 disabled:opacity-50 dark:border-white/[.15] dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          {copied ? "Copied" : isCopying ? "Copying..." : "Copy"}
        </button>
        <button
          type="button"
          onClick={handleReveal}
          disabled={isRevealing}
          className="rounded-lg border border-black/[.08] px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 disabled:opacity-50 dark:border-white/[.15] dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          {revealed !== null ? "Hide" : isRevealing ? "Revealing..." : "Reveal"}
        </button>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="rounded-lg border border-black/[.08] px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-white/[.15] dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isDeleting}
          className="rounded-lg border border-black/[.08] px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 dark:border-white/[.15] dark:text-red-400 dark:hover:bg-red-950"
        >
          {isDeleting ? "Deleting..." : "Delete"}
        </button>
      </div>
    </div>
  );
}
