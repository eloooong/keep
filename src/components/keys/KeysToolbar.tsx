"use client";
import { useEffect, useRef } from "react";
import { Glyph } from "@/components/ui/Glyph";
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
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    function keydown(event: KeyboardEvent) {
      const target = event.target as HTMLElement;
      if (
        event.key === "/" &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        !target.closest("input,textarea,select,[contenteditable=true]")
      ) {
        event.preventDefault();
        ref.current?.focus();
      }
    }
    document.addEventListener("keydown", keydown);
    return () => document.removeEventListener("keydown", keydown);
  }, []);
  return (
    <div className="keys-toolbar">
      <label className="search-field">
        <Glyph name="search" size={17} />
        <span className="sr-only">Search keys</span>
        <input
          ref={ref}
          type="search"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search keys, notes, or tags…"
        />
        <kbd>/</kbd>
      </label>
      <label className="filter-field">
        <span className="sr-only">Category</span>
        <select value={category} onChange={(e) => onCategory(e.target.value)}>
          <option value="">All categories</option>
          {categories.map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
      </label>
      <label className="filter-field">
        <span className="sr-only">Tag</span>
        <select value={tag} onChange={(e) => onTag(e.target.value)}>
          <option value="">All tags</option>
          {tags.map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
      </label>
    </div>
  );
}
