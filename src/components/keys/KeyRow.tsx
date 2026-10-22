"use client";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { revealKey, deleteKey, copyKey } from "@/app/actions/keys";
import { Glyph } from "@/components/ui/Glyph";
import { KeyProviderIcon } from "./KeyProviderIcon";
import { positionSpotlight } from "@/components/react-bits/SpotlightCard";
import { AnimatedContent } from "@/components/react-bits/AnimatedContent";
import { EditKeyForm } from "./EditKeyForm";
import { ManageShares } from "./ManageShares";
import { expiryStatus } from "@/utils/expiry";
import { IconButton } from "@/components/ui/IconButton";

type Props = {
  keyId: string;
  name: string;
  notes: string | null;
  category: string | null;
  tags: string[];
  expiresAt: string | null;
  lastViewedAt: string | null;
  maskedValue: string;
  isOwner: boolean;
  canEdit: boolean;
};
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
  canEdit,
}: Props) {
  const [revealed, setRevealed] = useState<string | null>(null),
    [editing, setEditing] = useState(false),
    [copied, setCopied] = useState(false),
    [sharing, setSharing] = useState(false),
    [confirming, setConfirming] = useState(false),
    [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const status = expiryStatus(expiresAt);
  const expired = status === "expired";
  useEffect(() => {
    if (!revealed) return;
    const timer = setTimeout(() => setRevealed(null), 20000);
    const hide = () => setRevealed(null);
    window.addEventListener("blur", hide);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("blur", hide);
    };
  }, [revealed]);
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 3000);
    return () => clearTimeout(timer);
  }, [copied]);
  function run(action: () => Promise<void>) {
    setError(null);
    startTransition(async () => {
      try {
        await action();
      } catch (e) {
        setError(
          e instanceof Error
            ? e.message
            : "Something went wrong. Please try again.",
        );
      }
    });
  }
  const date = expiresAt
    ? new Date(expiresAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "No expiration";
  return (
    <article
      className="key-record"
      aria-label={name}
      onPointerMove={positionSpotlight}
    >
      <div className="key-row">
        <div className="key-identity">
          <KeyProviderIcon name={name} category={category} />
          <div className="key-description">
            <h2>
              {name}
              {!isOwner && (
                <span className="key-tag">
                  {canEdit ? "Can edit" : "View only"}
                </span>
              )}
            </h2>
            <p title={notes ?? undefined}>{notes || "No notes added"}</p>
            <div className="key-tags">
              {category && <span>{category}</span>}
              {tags.map((tag) => (
                <span key={tag}>#{tag}</span>
              ))}
            </div>
          </div>
        </div>
        <div className="key-value">
          <code
            className={revealed ? "is-revealed" : undefined}
            title={
              lastViewedAt
                ? `Last viewed ${new Date(lastViewedAt).toLocaleDateString()}`
                : undefined
            }
          >
            {revealed ?? maskedValue}
          </code>
          <IconButton
            ariaLabel={`${revealed ? "Hide" : "Reveal"} ${name}`}
            title={
              expired
                ? "Expired keys cannot be revealed"
                : revealed
                  ? "Hide key"
                  : "Reveal for 20 seconds"
            }
            icon={<Glyph name={revealed ? "hide" : "view"} size={18} />}
            disabled={expired || pending}
            onClick={() =>
              revealed
                ? setRevealed(null)
                : run(async () => setRevealed(await revealKey(keyId)))
            }
          />
        </div>
        <div className={`key-expiry ${status}`}>
          <span>
            {expired
              ? "Expired"
              : status === "soon"
                ? "Expiring soon"
                : expiresAt
                  ? "Active"
                  : "No expiration"}
          </span>
          {expiresAt && <time dateTime={expiresAt}>{date}</time>}
        </div>
        <div className="key-actions">
          <button
            type="button"
            className={`copy-button${copied ? " is-copied" : ""}`}
            aria-label={`${copied ? "Copied" : "Copy"} ${name}`}
            disabled={expired || pending}
            onClick={() =>
              run(async () => {
                const value = await copyKey(keyId);
                await navigator.clipboard.writeText(value);
                setCopied(true);
              })
            }
          >
            <Glyph name={copied ? "check" : "copy"} size={17} />
            {copied ? "Copied" : "Copy"}
          </button>
          {canEdit && (
            <details className="row-menu">
              <summary
                aria-label={`More actions for ${name}`}
                title="More actions"
              >
                <Glyph name="more" />
              </summary>
              <div>
                {canEdit && (
                  <button
                    onClick={(e) => {
                      e.currentTarget
                        .closest("details")
                        ?.removeAttribute("open");
                      setEditing(!editing);
                      setSharing(false);
                    }}
                  >
                    <Glyph name="edit" size={17} />
                    Edit key
                  </button>
                )}
                {isOwner && (
                  <>
                    <button
                      onClick={(e) => {
                        e.currentTarget
                          .closest("details")
                          ?.removeAttribute("open");
                        setSharing(!sharing);
                        setEditing(false);
                      }}
                    >
                      <Glyph name="share" size={17} />
                      Manage sharing
                    </button>
                    <button
                      className="danger-text"
                      onClick={(e) => {
                        e.currentTarget
                          .closest("details")
                          ?.removeAttribute("open");
                        setConfirming(true);
                      }}
                    >
                      <Glyph name="delete" size={17} />
                      Delete key
                    </button>
                  </>
                )}
              </div>
            </details>
          )}
        </div>
      </div>
      {error && (
        <p className="row-error" role="alert">
          {error}
        </p>
      )}
      {confirming && (
        <div className="delete-confirm">
          <p>
            Delete <strong>{name}</strong>? This cannot be undone.
          </p>
          <button
            className="button-secondary"
            disabled={pending}
            onClick={() => setConfirming(false)}
          >
            Cancel
          </button>
          <button
            className="button-danger"
            disabled={pending}
            onClick={() =>
              run(async () => {
                await deleteKey(keyId);
                router.refresh();
              })
            }
          >
            {pending ? "Deleting…" : "Delete key"}
          </button>
        </div>
      )}
      {editing && (
        <AnimatedContent className="row-expanded" distance={6} speed={0.22}>
          <h3>Edit key</h3>
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
        </AnimatedContent>
      )}
      {sharing && (
        <AnimatedContent className="row-expanded" distance={6} speed={0.22}>
          <div className="expanded-heading">
            <h3>Access to {name}</h3>
            <button
              className="button-secondary"
              onClick={() => setSharing(false)}
            >
              Close
            </button>
          </div>
          <ManageShares keyId={keyId} />
        </AnimatedContent>
      )}
    </article>
  );
}
