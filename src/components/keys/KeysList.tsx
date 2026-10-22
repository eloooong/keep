"use client";
import { useMemo, useState } from "react";
import { KeyRow } from "./KeyRow";
import { KeysToolbar } from "./KeysToolbar";
import { AddKeyButton } from "./AddKeyButton";
import { expiryStatus } from "@/utils/expiry";
import { Glyph } from "@/components/ui/Glyph";
import { motion } from "motion/react";
import { useReducedMotion } from "@/components/react-bits/useReducedMotion";
import { AnimatedList } from "@/components/react-bits/AnimatedList";
type KeyItem = {
  id: string;
  user_id: string;
  name: string;
  notes: string | null;
  category: string | null;
  tags: string[];
  expires_at: string | null;
  last_viewed_at: string | null;
  canEdit: boolean;
};
export function KeysList({
  keys,
  currentUserId,
}: {
  keys: KeyItem[];
  currentUserId: string;
}) {
  const [search, setSearch] = useState("");
  const reduce = useReducedMotion();
  const [category, setCategory] = useState("");
  const [tag, setTag] = useState("");
  const [view, setView] = useState("all");
  const [sort, setSort] = useState("recent");
  const categories = useMemo(
    () =>
      Array.from(
        new Set(
          keys.map((k) => k.category).filter((c): c is string => Boolean(c)),
        ),
      ).sort(),
    [keys],
  );
  const tags = useMemo(
    () => Array.from(new Set(keys.flatMap((k) => k.tags))).sort(),
    [keys],
  );
  function inView(key: KeyItem, tab: string) {
    const status = expiryStatus(key.expires_at);
    return tab === "active"
      ? status !== "expired"
      : tab === "attention"
        ? ["expired", "soon"].includes(status)
        : tab === "shared"
          ? key.user_id !== currentUserId
          : true;
  }
  const filtered = keys.filter(
    (key) =>
      inView(key, view) &&
      (!category || key.category === category) &&
      (!tag || key.tags.includes(tag)) &&
      [key.name, key.notes, key.category, ...key.tags].some((value) =>
        (value ?? "").toLowerCase().includes(search.trim().toLowerCase()),
      ),
  );
  if (sort === "name") filtered.sort((a, b) => a.name.localeCompare(b.name));
  if (sort === "expiry")
    filtered.sort(
      (a, b) =>
        (a.expires_at ? new Date(a.expires_at).getTime() : Infinity) -
        (b.expires_at ? new Date(b.expires_at).getTime() : Infinity),
    );
  const hasFilters = Boolean(search || category || tag || view !== "all");
  return (
    <section aria-label="Key collection">
      <div className="collection-tabs" aria-label="Key views">
        {[
          { id: "all", label: "All keys" },
          { id: "active", label: "Active" },
          { id: "attention", label: "Need attention" },
          { id: "shared", label: "Shared with me" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={view === tab.id ? "selected" : ""}
            aria-pressed={view === tab.id}
            onClick={() => setView(tab.id)}
          >
            {tab.label}
            <span>{keys.filter((key) => inView(key, tab.id)).length}</span>
            {view === tab.id && (
              <motion.i
                className="collection-tab-indicator"
                layoutId="collection-tab-indicator"
                aria-hidden="true"
                transition={{
                  duration: reduce ? 0 : 0.22,
                  ease: [0.16, 1, 0.3, 1],
                }}
              />
            )}
          </button>
        ))}
      </div>
      <KeysToolbar
        search={search}
        onSearch={setSearch}
        category={category}
        onCategory={setCategory}
        tag={tag}
        onTag={setTag}
        categories={categories}
        tags={tags}
      />
      <div className="collection-caption">
        <p aria-live="polite">
          {filtered.length} {filtered.length === 1 ? "key" : "keys"}
          {hasFilters ? " matching your filters" : " in your collection"}
          {hasFilters && (
            <button
              onClick={() => {
                setSearch("");
                setCategory("");
                setTag("");
                setView("all");
              }}
            >
              Clear filters
            </button>
          )}
        </p>
        <label>
          Sort by{" "}
          <select
            aria-label="Sort keys"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="recent">Recently added</option>
            <option value="name">Name</option>
            <option value="expiry">Expiry date</option>
          </select>
        </label>
      </div>
      {filtered.length ? (
        <div className="key-table">
          <div className="key-table-heading" aria-hidden="true">
            <span>Name &amp; details</span>
            <span>API key</span>
            <span>Expiration</span>
            <span>Actions</span>
          </div>
          <AnimatedList>
            {filtered.map((key) => (
              <KeyRow
                key={key.id}
                keyId={key.id}
                name={key.name}
                notes={key.notes}
                category={key.category}
                tags={key.tags}
                expiresAt={key.expires_at}
                lastViewedAt={key.last_viewed_at}
                maskedValue="•••• •••• ••••"
                isOwner={key.user_id === currentUserId}
                canEdit={key.canEdit}
              />
            ))}
          </AnimatedList>
        </div>
      ) : (
        <div className="collection-empty">
          <Glyph name="keys" size={32} />
          <h2>
            {keys.length ? "No keys here yet." : "Your first key belongs here."}
          </h2>
          <p>
            {hasFilters
              ? "Try a different search, or clear your filters."
              : "Add an API key to keep it organized and ready to use."}
          </p>
          {hasFilters ? (
            <button
              className="button-secondary"
              onClick={() => {
                setSearch("");
                setCategory("");
                setTag("");
                setView("all");
              }}
            >
              Clear filters
            </button>
          ) : (
            <AddKeyButton />
          )}
        </div>
      )}
      <p className="collection-footnote">
        <Glyph name="lock" size={13} />
        Key values stay hidden until you choose to reveal or copy them.
      </p>
    </section>
  );
}
