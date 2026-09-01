# Fix: keys list not updating after add + "0 keys" on reload

## Reported symptoms
1. Adding a key does not make it appear in the list.
2. Adding a second key then shows 2 keys in the list.
3. After a hard reload the page "says 0 keys" even though the keys exist in the database.

## Diagnosis (two independent root causes)

### Root cause A — `revalidatePath` alone does not refresh the mounted client tree
`page.tsx:74` renders `<NewKeyForm />` with **no `onSubmit`**. `NewKeyForm` (src/components/keys/NewKeyForm.tsx) calls `createKey(formData)` → `revalidatePath("/")` (src/app/actions/keys.ts:120), then `onSubmit?.()` which is undefined.

In the App Router, a Server Action's `revalidatePath` revalidates the data cache but the **already-mounted client page does not re-fetch the server component automatically** — the client must call `router.refresh()`. The codebase already does this for login (`router.push("/")` + `router.refresh()` in src/app/login/page.tsx:36), so this is the established pattern. Without it, the visible list stays stale after submitting — explains symptom 1 (and partly 2 when a later interaction finally re-renders).

### Root cause B — `AnimatedList` and `CountUp` are not StrictMode-safe
Next.js App Router enables React StrictMode by default in development, which double-invokes effect setup→cleanup→setup while **preserving refs**. Both fallback components use a `useRef` guard that permanently blocks the second (real) setup run:

- **`AnimatedList.tsx`**: the init effect guards on `initialisedRef.current`. First setup sets it `true` and schedules the stagger `setTimeout`s; cleanup clears them; second setup sees the flag already true and returns early → **no timers ever fire → `revealedCount` stays 0 → every item renders at opacity 0 → the list is invisible.** On reload the list appears empty → "0 keys."
- **`CountUp.tsx`**: the effect guards on `prevEndRef.current === end`. First setup sets the ref and schedules the rAF; cleanup cancels it; second setup sees the ref already equal to `end` and returns early → **`value` stays at `startAs` (0) → the "Your keys (0)" heading is stuck at 0.**

Together these explain symptom 3 exactly (empty/invisible list + heading stuck at 0), and the count-change reveal in `AnimatedList` explains symptom 2 (adding a second key changes `count`, so the `[count]` effect calls `setRevealedCount(count)` and the list becomes visible). RLS/data is NOT the problem — the keys are present; the UI simply doesn't reveal/animate them.

## Fix plan (ordered)

### 1. Add `router.refresh()` after creating a key (Root cause A)
- In `src/components/keys/NewKeyForm.tsx`, import `useRouter` from `next/navigation` and call `router.refresh()` after `await createKey(formData)` (before/after `onSubmit?.()`). Keep `revalidatePath("/")` in the action.
- Optionally apply the same refresh after `updateKey`/`deleteKey` in `EditKeyForm`/`KeyRow`/share actions for consistency (they currently only rely on `revalidatePath` + client `useTransition`). Do this if the edit/delete/share flows show the same staleness when verified.

### 2. Make `AnimatedList` StrictMode-safe (Root cause B)
Rewrite `src/components/react-bits/AnimatedList.tsx` so it does **not** rely on a persisted ref guard that survives StrictMode's double effect invocation. Requirements:
- On mount, stagger-reveal all items (opacity/translate) exactly once.
- When `count` increases (new items appended), keep already-shown items visible and reveal the new ones (remaining old behavior).
- Re-running under StrictMode is harmless/idempotent (no permanent 0-state).
- Avoid re-triggering on ordinary re-renders with the same `count`.

Recommended approach: drive staggering from the `[count]`-dep effect, or drop the `initialisedRef` sentinel and instead schedule idempotently so that both StrictMode setups produce the full reveal. Keep a `prevCountRef` (a ref of a *number*, guarded by a `current !== next` comparison) only for the "new items were added" branch — that comparison is StrictMode-safe because the double effect re-reads the same `count`; it only needs to avoid re-running on same-`count` re-renders.

### 3. Make `CountUp` StrictMode-safe (Root cause B)
Rewrite `src/components/react-bits/CountUp.tsx`:
- Remove the `prevEndRef.current === end` early-return that blocks the second StrictMode setup.
- Run the rAF animation whenever `end` changes, always reaching `end` (start value may be the current display value or `startAs`). Cleanup cancels the rAF.
- Ensure an ordinary re-render with the same `end` does **not** restart from 0 (guard by comparing `end` to the previously animated target, but without permanently blocking StrictMode's second run — e.g. only skip when the previous animation actually completed, or key the guard by the mounted instance and reset appropriately, or simply start from the current rendered value so a re-run is visually idempotent).

### 4. Verify
- `npm run dev` (StrictMode on), confirm:
  - Adding a key appends it to the visible list immediately.
  - Adding a second key shows 2 keys.
  - Hard reload shows the correct count in both the heading and the list.
  - Expiry banner items, activity feed, and shares list (other `AnimatedList` consumers) still appear.
- `npm run lint` → 0 errors / 0 warnings.
- `npm run build` passes (same StrictMode-safe code paths run in prod where effects run once — behavior must remain correct there too).
- Confirm `react-hooks/exhaustive-deps` and `set-state-in-effect` rules are not violated (setState stays inside timeout/rAF callbacks or event handlers, never synchronously in the effect body).

## Files touched
- `src/components/keys/NewKeyForm.tsx` (add `router.refresh()`)
- `src/components/react-bits/AnimatedList.tsx` (StrictMode-safe rewrite)
- `src/components/react-bits/CountUp.tsx` (StrictMode-safe rewrite)
- Possibly `EditKeyForm.tsx`, `KeyRow.tsx`, `ManageShares.tsx` if post-create/update/revoke staleness is confirmed

## Out of scope
- No schema/auth/data changes — the keys are correctly in the DB; this is a UI refresh/reveal bug only.
- No new npm dependencies.
