# Add DotGrid Background to Dashboard (theme-matched to login)

## Goal
Add the React Bits `DotGrid` (canvas + GSAP inertia/shock dot grid) as an interactive background on the dashboard page (`/`, `src/app/page.tsx`), using a monochrome color scheme that matches the auth pages (`/login`, `/signup`), which currently use `GradientWaves` with zinc-gray defaults (`#0A0A0A`, `#3F3F46`, `#A1A1AA`).

## Current State
- Dashboard `src/app/page.tsx` is an async **Server Component** wrapping content in `<div className="flex flex-1 flex-col">` with `<header>` and `<main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">`. It has no background component.
- Auth pages use `GradientWaves` (monochrome zinc grays, single scheme works in both light/dark because it's an alpha=1 gradient behind a solid card).
- Theming: `ThemeProvider` exposes `useTheme()` (`"light" | "dark"`), plus `mounted` flag. `html` gets `.dark` class. Body background: `#ffffff` light / `#0a0a0a` dark.
- Dependencies: `next`, `react` 19, `tailwindcss` v4, `lucide-react`, `ogl`. **No `gsap` installed yet.**

## Key Design Decisions

### 1. Dependency
Install `gsap`:
```bash
npm install gsap
```
- `InertiaPlugin` is bundled inside the `gsap` npm package (`gsap/InertiaPlugin`), so no separate install is needed. Register it as `gsap.registerPlugin(InertiaPlugin)`.
- Note: DotGrid is an interactive (mousemove + click) canvas effect. It renders dots and applies inertia/shock via GSAP. It drives its own RAF loop.

### 2. File placement & conventions
Create the component under the existing `react-bits` directory to match repo conventions:
- **File:** `src/components/react-bits/DotGrid.tsx`
- Convert the provided JS to TypeScript `.tsx` with `"use client"` and a **named export** `export function DotGrid(...)` (matches `GradientWaves`, `SplitText`, etc.).
- Keep all props/defaults from the provided source; type `style` as `React.CSSProperties` and `className` as `string`.
- Keep the throttle helper, `hexToRgb` (typed), `circlePath` useMemo (guard `window.Path2D`), `buildGrid`, and the three `useEffect`s (draw loop, resize + ResizeObserver, pointer/click listeners) unchanged in behavior.

### 3. Theme-matched colors (the "match the login page" requirement)
The login/auth background is monochrome zinc-gray. Match that instead of the purple defaults in the usage example:
- **Do NOT** use the reference defaults (`baseColor="#2F293A"`, `activeColor="#5227FF"` purple).
- Make the DotGrid **theme-aware** by selecting colors from `useTheme()`:
  - Light mode: `baseColor = "#A1A1AA"` (zinc-400), `activeColor = "#3F3F46"` (zinc-700)
  - Dark mode: `baseColor = "#3F3F46"` (zinc-700), `activeColor = "#A1A1AA"` (zinc-400)
- Rationale: body background is white in light / near-black in dark. Distinct dots need different colors per theme for legibility (unlike the alpha gradient on auth which uses one scheme).

### 4. Dashboard wiring (Server Component problem)
`page.tsx` is a Server Component and cannot call `useTheme()`. Create a small client wrapper:
- **File:** `src/components/keys/DashboardBackground.tsx` (or `src/components/DashboardBackground.tsx`)
  - `"use client"`, uses `useTheme()` to compute theme-matched colors, renders `<DotGrid ... />`.
  - Renders inside a `relative` full-size container. Uses fixed positioning (`position: fixed; inset: 0; z-index: -1`) so dots sit behind header + content and the pointer events remain on the canvas (canvas is `pointer-events-none`, listeners are on `window`), keeping the dashboard interactive.
- In `page.tsx`, render `<DashboardBackground />` as the first child inside the root `<div className="flex flex-1 flex-col">` (which should become `relative` for correct stacking).

Alternative (simpler, recommended): since DotGrid attaches `window` listeners and the canvas is `pointer-events-none`, mount it directly with `position: fixed; inset: 0; z-index: -1`. If the implementation prefers, it may instead render `absolute inset-0` inside a `relative` root; choose one approach consistently.

### 5. Component isolation / cleanup
Ensure the DotGrid effect listeners and RAF are cleaned up on unmount exactly as in the reference source (already includes cleanup functions). No changes needed beyond TS conversion.

## Implementation Task List
1. `npm install gsap`
2. Create `src/components/react-bits/DotGrid.tsx` (TS conversion, named export, `"use client"`).
3. Create `src/components/keys/DashboardBackground.tsx` (client wrapper using `useTheme()` for monochrome colors + fixed full-screen positioning).
4. Edit `src/app/page.tsx`:
   - Root `<div className="flex flex-1 flex-col">` → add `relative` (for stacking), and render `<DashboardBackground />` at the top of it.
   - Import `DashboardBackground`.
5. Validate.

## Validation
- `npm run build` → passes (Server + Client boundaries correct).
- `npm run lint` → 0 errors / 0 warnings.
- `npm run dev` spot-check on `/`:
  - Dot grid visible as background behind header + key list.
  - Dots respond to mouse move (inertia) and click (shock) in **both** light and dark themes.
  - Colors are gray/monochrome, consistent with auth pages (no purple).
  - Dashboard content (header, list, modal, buttons) remains clickable and legible.
  - Toggling theme updates dot colors on the fly.

## Risks / Notes
- **InertiaPlugin licensing:** `gsap` npm ships `InertiaPlugin`, but it is a Club GSAP plugin. It runs locally/bundled as provided; the user explicitly requested this exact component. Flag the Club-membership licensing consideration for any public/production deployment, but proceed as requested.
- **Performance:** DotGrid runs a continuous RAF + GSAP tweens. On low-end devices this is heavier than a static bg. If needed later, cap `maxSpeed`, reduce dot count via `dotSize`/`gap`, or gate by `prefers-reduced-motion`. Not required now.
- Ensure `z-index`/stacking does not push the dot canvas above interactive elements; keep canvas at `z-index: -1` (or below content) and rely on its `pointer-events-none`.

## Out of Scope
- Auth pages: no changes to `/login`, `/signup`, or `GradientWaves`.
- Theming system: unchanged.
- No changes to key list/cards/modal behavior.
