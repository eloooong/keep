"use client";

import { useMemo, useState } from "react";
import { KeyRow } from "@/components/keys/KeyRow";
import { KeysToolbar } from "@/components/keys/KeysToolbar";
import { AnimatedList } from "@/components/react-bits/AnimatedList";
import { IconButton } from "@/components/ui/IconButton";
import { RotateCcw } from "lucide-react";

type KeyItem = {
  id: string;
  user_id: string;
  name: string;
  value_encrypted: string;
  notes: string | null;
  category: string | null;
  tags: string[];
  expires_at: string | null;
  last_viewed_at: string | null;
};

export function KeysList({
  keys,
  currentUserId,
}: {
  keys: KeyItem[];
  currentUserId: string;
}) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [tag, setTag] = useState("");

  const categories = useMemo(
    () =>
      Array.from(
        new Set(
          keys
            .map((k) => k.category)
            .filter((c): c is string => Boolean(c))
        )
      ).sort(),
    [keys]
  );

  const tags = useMemo(
    () =>
      Array.from(new Set(keys.flatMap((k) => k.tags))).sort(),
    [keys]
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return keys.filter((key) => {
      if (category && key.category !== category) return false;
      if (tag && !key.tags.includes(tag)) return false;
      if (!query) return true;
      return (
        key.name.toLowerCase().includes(query) ||
        (key.notes ?? "").toLowerCase().includes(query) ||
        (key.category ?? "").toLowerCase().includes(query) ||
        key.tags.some((t) => t.toLowerCase().includes(query))
      );
    });
  }, [keys, search, category, tag]);

  const hasFilters = search.trim() !== "" || category !== "" || tag !== "";

  return (
    <div className="space-y-4">
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
      {filtered.length > 0 ? (
        <AnimatedList className="space-y-3" staggerDelay={40}>
          {filtered.map((key) => {
            const isOwner = key.user_id === currentUserId;
            return (
              <KeyRow
                key={key.id}
                keyId={key.id}
                name={key.name}
                notes={key.notes}
                category={key.category}
                tags={key.tags}
                expiresAt={key.expires_at}
                lastViewedAt={key.last_viewed_at}
                maskedValue={`****${key.value_encrypted.slice(-4)}`}
                isOwner={isOwner}
              />
            );
          })}
        </AnimatedList>
      ) : hasFilters ? (
        <div className="rounded-2xl border border-dashed border-black/[.15] p-10 text-center dark:border-white/[.15]">
          <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            No keys match your filters
          </h3>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Adjust your search or filters to see more keys.
          </p>
          <IconButton
            icon={<RotateCcw size={16} />}
            ariaLabel="Reset filters"
            onClick={() => {
              setSearch("");
              setCategory("");
              setTag("");
            }}
            className="mt-4"
          />
        </div>
      ) : null}
    </div>
  );
}
