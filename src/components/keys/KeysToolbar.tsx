"use client";

export function KeysToolbar({
  search,
  onSearch,
  category,
  onCategory,
  tag,
  onTag,
  categories,
  tags,
}: {
  search: string;
  onSearch: (value: string) => void;
  category: string;
  onCategory: (value: string) => void;
  tag: string;
  onTag: (value: string) => void;
  categories: string[];
  tags: string[];
}) {
  return (
    <div className="space-y-3">
      <input
        type="text"
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        placeholder="Search by name, notes, category, or tag..."
        className="w-full rounded-lg border border-black/[.08] px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400 dark:border-white/[.15] dark:bg-zinc-900 dark:text-zinc-50"
      />
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
          Category
          <select
            value={category}
            onChange={(e) => onCategory(e.target.value)}
            className="rounded-lg border border-black/[.08] bg-transparent px-2 py-1.5 text-sm text-zinc-900 outline-none focus:border-zinc-400 dark:border-white/[.15] dark:bg-zinc-900 dark:text-zinc-50"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
          Tag
          <select
            value={tag}
            onChange={(e) => onTag(e.target.value)}
            className="rounded-lg border border-black/[.08] bg-transparent px-2 py-1.5 text-sm text-zinc-900 outline-none focus:border-zinc-400 dark:border-white/[.15] dark:bg-zinc-900 dark:text-zinc-50"
          >
            <option value="">All tags</option>
            {tags.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
