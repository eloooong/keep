# Convert Dashboard Key List to Responsive Multi-Column Grid

## Goal
Resolve the large empty side bands on the dashboard (`/`, `src/app/page.tsx`) by widening the content container and converting the single-column key list into a responsive multi-column grid, filling the screen with usable card columns instead of dead whitespace.

## Current State
- `src/app/page.tsx:67` — `<main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">`. The column is capped at 672px and centered, leaving wide empty left/right bands on large screens (header, meanwhile, spans the full viewport).
- `src/components/keys/KeysList.tsx:81` — `AnimatedList className="space-y-3"` renders key cards in a single column.
- `KeyRow` cards are `SpotlightCard`-based with badge-wrapped content + a fixed-width action cluster on the right. The left content column already uses `min-w-0` (`KeyRow.tsx:132`); the masked value is `break-all font-mono` (`KeyRow.tsx:169`), so text wraps and won't force grid blowout.
- Empty states are full-width cards: "No API keys yet" (`page.tsx:82`) and "No keys match your filters" (`KeysList.tsx:101`). These should stay full-width, not per-column.
- `AnimatedList` (`src/components/react-bits/AnimatedList.tsx`) wraps each child in a `<div className="transition-all ...">`; the grid must be applied to the `AnimatedList` container so the wrapper divs become grid items.

## Design Decisions

### 1. Container width
Change `<main>` `max-w-2xl` → `max-w-5xl` (1024px). Keeps `mx-auto w-full flex-1 px-6 py-10`. This roughly halves the side bands on common wide screens while keeping 3 columns readable. Do NOT change the header (it already spans full width and is unaffected).

### 2. Grid + breakpoints (in `KeysList.tsx`)
Change the `AnimatedList` class from `space-y-3` to:
```
grid gap-3 sm:grid-cols-2 xl:grid-cols-3
```
- Default (mobile, <640px): 1 column (natural grid behavior).
- ≥640px: 2 columns.
- ≥1280px: 3 columns (max of 3, so cards stay wide enough for the action cluster).
- `gap-3` matches the existing vertical `space-y-3` rhythm.

Do NOT add a 4th column — at `max-w-5xl` (1024px) 4 columns would make cards ~220px, too narrow for the badge stack + action buttons.

### 3. Empty states (no change)
Both "No API keys yet" and "No keys match your filters" remain full-width centered cards. They sit as siblings of the grid (direct children of `main` / of the `space-y-4` wrapper), so the grid layout does not affect them.

### 4. Card shrink safety (verify, adjust only if needed)
`KeyRow` already has `min-w-0` on the content column and `break-all` on the masked value, so grid items should shrink without overflow. `SpotlightCard` has `overflow-hidden rounded-xl`. If verification shows the masked value or long notes force a column to blow out, add `min-w-0` to the `AnimatedList` grid class (or the wrapper divs) — but this is expected NOT to be required.

## Implementation Task List
1. `src/app/page.tsx:67` — change `max-w-2xl` to `max-w-5xl`.
2. `src/components/keys/KeysList.tsx:81` — change `AnimatedList className="space-y-3"` to `className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"`.
3. (If needed, per step 4) add `min-w-0` shrink-safety to grid cells.

## Validation
- `npm run lint` → 0 errors / 0 warnings.
- `npm run build` → compiles + type-checks clean.
- `npm run dev` spot-check on `/`:
  - Empty side bands are visibly reduced on a wide viewport.
  - Keys render in 2 columns ≥640px and 3 columns ≥1280px; 1 column on mobile.
  - Cards remain legible: badges wrap, masked value stays in bounds, action buttons not clipped.
  - Header, toolbar, section heading, Add key / expiry banner, and modal still work and span the widened container correctly.
  - Empty states ("No API keys yet", "No keys match your filters") render full-width, not per-column.

## Risks / Notes
- **Grid blowout / whitespace**: `min-w-0` + `break-all` + `overflow-hidden` are expected to prevent overflow. Confirm visually in validation.
- **Odd key counts**: With 1–3 keys, the grid fills left-to-right and may leave trailing empty cells — expected grid behavior; not an issue.
- **AnimatedList wrapper divs**: The grid items are the wrapper divs created by `AnimatedList`. Apply the grid class to the `AnimatedList` `className`, not to `KeyRow`/`SpotlightCard`.
- **Activity page consistency**: `src/app/activity/page.tsx:50` has the identical single-column `max-w-2xl` + full-width list pattern. Out of scope per scope choice; consider applying the same treatment separately for consistency.

## Out of Scope
- The Activity page (`/activity`).
- Header layout changes.
- Card content / component structure (only grid container + main width change).
- Auth pages, theming.