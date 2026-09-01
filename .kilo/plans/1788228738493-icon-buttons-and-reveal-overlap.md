# Icon buttons + fix revealed-key overlap

## Goal

Two related UI changes on the dashboard:

1. **Icon buttons** — replace cramped text action buttons with compact icon buttons using the newly-installed `lucide-react` package, improving the crowded header and key-row action clusters.
2. **Fix key overlap on reveal** — the long plaintext API key (an unbreakable `font-mono` token) overruns and overlaps the right-hand action buttons when revealed. Convert the row's buttons to narrow icon buttons **and** add word-breaking to the revealed value so it wraps within its own column.

## Root cause (overlap)

- `src/components/keys/KeyRow.tsx` renders a two-column flex row: left `min-w-0` details, right `flex-shrink-0` action cluster (Copy / Reveal / Edit / Share / Delete — 3–5 wide labeled buttons).
- When revealed, the value `<p>` at `KeyRow.tsx:158` (`font-mono text-sm`) holds the full plaintext, which is a single token with no whitespace break opportunities. Tailwind wraps only at words, so it cannot wrap.
- Because the button cluster occupies most of the row width and the left column is width-constrained, the long token extends beyond the left column's box and renders under/over the buttons. `SpotlightCard` (`overflow-hidden rounded-xl` on the wrapper) prevents visual bleed outside the card, so the token is clipped/overlapped at the boundary.
- Fix has two parts: (a) make the value wrap with `[overflow-wrap:anywhere]`/`break-all`, and (b) shrink the button cluster to icons so the left column gets its fair width back.

## Files touched

### Install
- Add `lucide-react` to `package.json` dependencies (install once, no version pins in the plan — implementer should use the latest stable, e.g. `npm i lucide-react`).

### NEW `src/components/ui/IconButton.tsx` (client, no `use client` needed — it's presentational)
A small reusable icon button to DRY the shared styling and ensure consistent sizing/accessibility:
- Props: `icon: ReactNode`, `ariaLabel: string`, `title?: string`, `onClick?: () => void`, `disabled?: boolean`, `variant?: "default" | "danger"`, `className?: string`.

```tsx
export function IconButton({
  icon, ariaLabel, title, onClick, disabled, variant = "default", className = "",
}: {...}) {
  const danger = variant === "danger";
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      title={title ?? ariaLabel}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border text-sm transition-colors disabled:opacity-50 ${
        danger
          ? "border-black/[.08] text-red-600 hover:bg-red-50 dark:border-white/[.15] dark:text-red-400 dark:hover:bg-red-950"
          : "border-black/[.08] text-zinc-600 hover:bg-zinc-100 dark:border-white/[.15] dark:text-zinc-300 dark:hover:bg-zinc-800"
      } ${className}`}
    >
      {icon}
    </button>
  );
}
```
- Icon size: pass `size={16}` to lucide icons. Use `<Loader2 className="animate-spin" size={16} />` for pending states.

### `src/components/keys/KeyRow.tsx` — primary change
- Add `break-all` (or `[overflow-wrap:anywhere]`) to the revealed value `<p>` at line 158 so long keys wrap inside the left column.
- Replace the right-hand `div` (line 172) button cluster with `IconButton`s:
  - **Copy** (wrapped in `ClickSpark`): icon `copied ? Check : Copy`; disabled when `expired || isCopying`; aria-label from `copy`/`copied`/`copying`.
  - **Reveal**: icon `revealed !== null ? EyeOff : Eye`; disabled when `expired || isRevealing`; show `Loader2` while `isRevealing`.
  - **Edit**: icon `Pencil`; aria-label "Edit".
  - **Share** (owner only): icon `Share2`; aria-label "Share".
  - **Delete** (owner only, variant `danger`): icon `Trash2`, or `Loader2` while `isDeleting`; aria-label "Delete".
- All live inside the existing `ClickSpark` wrapper for Copy only (keep it on the copy button).
- Keep row layout: left column `min-w-0`, buttons `flex-shrink-0` — with `IconButton` the cluster is far narrower, further reducing overlap.

### `src/app/page.tsx` + `src/components/keys/AddKeyButton.tsx` — header Logout + Add key
- **Logout** (both `src/app/page.tsx:56` and `src/app/activity/page.tsx:39`): swap the text button for an `IconButton` with `<LogOut size={16} />` and `aria-label="Log out"`. Keep the surrounding `<form action={signOut}>`.
- **AddKeyButton** (`AddKeyButton.tsx`): convert text button to `IconButton` with `<Plus size={16} />`, `aria-label="Add key"`. (It lives in the "Your keys" heading row.)

### `src/components/keys/KeyFormModal.tsx` — modal close
- Replace the `&times;` text close button (line 79) with `IconButton` `<X size={16} />`, `aria-label="Close"`.

### `src/components/keys/ExpiryBanner.tsx` — dismiss
- "Dismiss all" (line 53): keep as labeled text (it's an explicit action in a semi-dense banner) — no change, OR optional leading icon. Out of scope to force icon-only here.
- Per-key dismiss `&times;` (line 86): swap to `IconButton` `<X size={14} />`, `aria-label={'Dismiss ' + k.name}`.

### `src/components/keys/KeysList.tsx` — reset filters (empty-filter state)
- Replace the text "Reset filters" button (line 106) with an `IconButton` `<RotateCcw size={16} />`, `aria-label="Reset filters"`.

### Form/primary CTAs — NOT converted to icon-only (keep labeled for usability)
- `NewKeyForm` submit "Add key" / "Saving…", `EditKeyForm` "Save"/"Cancel", `ManageShares` invite "Add" + "Revoke", `login` submit, `signup` submit: keep as labeled buttons. Rationale: icon-only submission buttons harm clarity/a11y on form actions. Optional polish (not required): prepend a leading icon (e.g. `Plus`/`Save`/`UserPlus`) before the label. Prefer a minimal, non-blocking approach — leave these files unchanged unless the user explicitly wants CTA icons.

## StrictMode / react-hooks notes
- All new state/effects already follow the repo rules (setState only in handlers/rAF/timeouts). `IconButton` adds no state or effects — safe.
- `Loader2` used inside `useTransition` guards; no new timers introduced.

## Validation
- `npm run lint` → 0 errors / 0 warnings.
- `npm run build` passes.
- `npm run dev`: open `/`.
  - Key row action cluster renders as compact icon buttons with tooltips (hover title) and aria-labels.
  - Reveal a long key → the plaintext wraps within its column (no overlap with buttons); hide restores `****xxxx`.
  - Header Logout (dashboard + activity) is an icon button; "Add key" heading-row button is an icon.
  - Modal close (`X`) and expiry per-key dismiss work; reset-filters icon works in the filtered-empty state.

## Out of scope
- Schema/auth/data changes.
- Changing login/signup primary submission buttons to icon-only.
- Theming/color system changes beyond existing button palettes.
