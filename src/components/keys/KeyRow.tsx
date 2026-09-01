"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { revealKey, deleteKey, copyKey } from "@/app/actions/keys";
import { EditKeyForm } from "@/components/keys/EditKeyForm";
import { ManageShares } from "@/components/keys/ManageShares";
import { expiryStatus, formatExpiry } from "@/utils/expiry";
import { ClickSpark } from "@/components/react-bits/ClickSpark";
import { SpotlightCard } from "@/components/react-bits/SpotlightCard";
import { IconButton } from "@/components/ui/IconButton";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Copy01Icon,
  CheckIcon,
  ViewIcon,
  ViewOffIcon,
  PencilEdit01Icon,
  Share01Icon,
  Delete02Icon,
  Loading01Icon,
} from "@hugeicons/core-free-icons";

const COPY_CLEAR_MS = 15000;

export function KeyRow({
  keyId,
  name,
  notes,
  category,
  tags,
  expiresAt,
  lastViewedAt,
  maskedValue,
  isOwner,
}: {
  keyId: string;
  name: string;
  notes: string | null;
  category: string | null;
  tags: string[];
  expiresAt: string | null;
  lastViewedAt: string | null;
  maskedValue: string;
  isOwner: boolean;
}) {
  const [revealed, setRevealed] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showShares, setShowShares] = useState(false);
  const [isRevealing, startReveal] = useTransition();
  const [isDeleting, startDelete] = useTransition();
  const [isCopying, startCopy] = useTransition();
  const router = useRouter();

  const expired = expiryStatus(expiresAt) === "expired";

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => {
      navigator.clipboard.writeText("").catch(() => {});
      setCopied(false);
    }, COPY_CLEAR_MS);
    return () => clearTimeout(timer);
  }, [copied]);

  function handleReveal() {
    if (expired) return;
    if (revealed !== null) {
      setRevealed(null);
      return;
    }
    startReveal(async () => {
      setRevealed(await revealKey(keyId));
    });
  }

  function handleCopy() {
    if (expired) return;
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
      router.refresh();
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
          expiresAt={expiresAt}
          onDone={() => setEditing(false)}
          onCancel={() => setEditing(false)}
        />
      </div>
    );
  }

  if (showShares) {
    return (
      <div className="rounded-xl border border-black/[.08] px-4 py-3 dark:border-white/[.1]">
        <div className="mb-3 flex items-center justify-between">
          <p className="font-medium text-zinc-900 dark:text-zinc-50">{name}</p>
          <button
            type="button"
            onClick={() => setShowShares(false)}
            className="rounded-lg border border-black/[.08] px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-white/[.15] dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Close
          </button>
        </div>
        <ManageShares keyId={keyId} />
      </div>
    );
  }

  return (
    <SpotlightCard className="overflow-hidden rounded-xl">
      <div className="flex items-center justify-between gap-4 rounded-xl border border-black/[.08] px-4 py-3 dark:border-white/[.1]">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium text-zinc-900 dark:text-zinc-50">{name}</p>
          {!isOwner && (
            <span className="rounded-md bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700 dark:bg-violet-900 dark:text-violet-300">
              Shared
            </span>
          )}
          {expiryStatus(expiresAt) === "expired" && (
            <span className="rounded-md bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900 dark:text-red-300">
              Expired {formatExpiry(expiresAt)}
            </span>
          )}
          {expiryStatus(expiresAt) === "soon" && (
            <span className="rounded-md bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900 dark:text-amber-300">
              Expires {formatExpiry(expiresAt)}
            </span>
          )}
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
        <p className="mt-1 overflow-x-auto whitespace-nowrap font-mono text-sm text-zinc-500 dark:text-zinc-400">
          {revealed ?? maskedValue}
        </p>
        {lastViewedAt ? (
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Last viewed{" "}
            {new Date(lastViewedAt).toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </p>
        ) : null}
      </div>
      <div className="flex flex-shrink-0 items-center gap-2">
        <ClickSpark
          sparkColor="rgb(99 102 241)"
          sparkCount={8}
          sparkRadius={18}
          className=""
        >
          <IconButton
            icon={
              copied ? (
                <HugeiconsIcon icon={CheckIcon} size={16} />
              ) : (
                <HugeiconsIcon icon={Copy01Icon} size={16} />
              )
            }
            ariaLabel={
              expired
                ? "Expired"
                : copied
                  ? "Copied"
                  : isCopying
                    ? "Copying"
                    : "Copy"
            }
            onClick={handleCopy}
            disabled={expired || isCopying}
          />
        </ClickSpark>
        <IconButton
          icon={
            isRevealing ? (
              <HugeiconsIcon icon={Loading01Icon} size={16} className="animate-spin" />
            ) : revealed !== null ? (
              <HugeiconsIcon icon={ViewOffIcon} size={16} />
            ) : (
              <HugeiconsIcon icon={ViewIcon} size={16} />
            )
          }
          ariaLabel={
            expired
              ? "Expired"
              : revealed !== null
                ? "Hide"
                : "Reveal"
          }
          onClick={handleReveal}
          disabled={expired || isRevealing}
        />
        <IconButton
          icon={<HugeiconsIcon icon={PencilEdit01Icon} size={16} />}
          ariaLabel="Edit"
          onClick={() => setEditing(true)}
        />
        {isOwner && (
          <>
            <IconButton
              icon={<HugeiconsIcon icon={Share01Icon} size={16} />}
              ariaLabel="Share"
              onClick={() => setShowShares(true)}
            />
            <IconButton
              icon={
                isDeleting ? (
                  <HugeiconsIcon icon={Loading01Icon} size={16} className="animate-spin" />
                ) : (
                  <HugeiconsIcon icon={Delete02Icon} size={16} />
                )
              }
              ariaLabel="Delete"
              title="Delete"
              onClick={handleDelete}
              disabled={isDeleting}
              variant="danger"
            />
          </>
        )}
      </div>
      </div>
    </SpotlightCard>
  );
}
