"use client";

import { useMemo, useState } from "react";
import { KeyRow } from "@/components/keys/KeyRow";
import { KeysToolbar } from "@/components/keys/KeysToolbar";

type KeyItem = {
  id: string;
  name: string;
  value_encrypted: string;
  notes: string | null;
  category: string | null;
  tags: string[];
};

export function KeysList({ keys }: { keys: KeyItem[] }) {
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
        <div className="space-y-3">
          {filtered.map((key) => (
            <KeyRow
              key={key.id}
              keyId={key.id}
              name={key.name}
              notes={key.notes}
              category={key.category}
              tags={key.tags}
              maskedValue={`****${key.value_encrypted.slice(-4)}`}
            />
          ))}
        </div>
      ) : hasFilters ? (
        <div className="rounded-2xl border border-dashed border-black/[.15] p-10 text-center dark:border-white/[.15]">
          <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            No keys match your filters
          </h3>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Adjust your search or filters to see more keys.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setCategory("");
              setTag("");
            }}
            className="mt-4 rounded-lg border border-black/[.08] px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-white/[.15] dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Reset filters
          </button>
        </div>
      ) : null}
    </div>
  );
}
