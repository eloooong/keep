# Redesign auth pages (login/signup) with animated Line Waves background

## Goal

Redesign the existing `/login` and `/signup` pages to be visually consistent, adding an
animated **Line Waves** decorative background (layered horizontal-flow SVG waves) while
keeping the current centered-card layout. No auth/schema/logic changes.

## Context (current state)

- `src/app/login/page.tsx` and `src/app/signup/page.tsx` already exist as client components.
  Both render a centered card (`max-w-sm`) inside an `<Aurora>` wrapper, with `SplitText`
  headings, `ShinyText` subtitles, and a working Supabase auth form.
- `src/components/react-bits/` holds decorative/animated primitives (`Aurora`, `SplitText`,
  `ShinyText`, `Magnet`, `GradientText`, etc.). No `LineWaves` component exists yet.
- Animations (`@keyframes`) live in `src/app/globals.css` (e.g. `aurora`, `click-spark-fade`,
  `gradient-shift`, `shimmer-sweep`) and are referenced via Tailwind `animate-[name_dur_ease_infinite]`
  arbitrary values.
- `globals.css` uses Tailwind v4 (`@import "tailwindcss"; @custom-variant dark;`).
- Pages render inside `<body class="min-h-full flex flex-col">`; the auth page root passes
  `className="flex flex-1 items-center justify-center px-4"` so it fills remaining height.

## DESIGN: LineWaves effect

A full-page decorative background of **3 stacked, horizontally-scrolling SVG wave lines**
(thin strokes), each translating along the X-axis at a staggered speed so they cross-flow —
subtle and consistent with the app's minimal aesthetic.

- Component: `src/components/react-bits/LineWaves.tsx` (client; `"use client"`).
- Renders an absolute inset-0 `pointer-events-none` container (aria-hidden) behind content.
  Three absolutely-positioned SVG `<path>` wave lines, each wrapped in an element with
  `animate-[line-wave-<n>_<dur>s_linear_infinite]`.
- Each wave drawn as a repeating sine path (e.g. spanning 200% width) so the flow is seamless.
- Default prop `className` for sizing/positioning; overridable via props for wave count/speed/color.
- Colors: use currentColor-ish zinc tones with low opacity, adapting to dark mode
  (light: `text-zinc-400/20`, dark: `text-zinc-300/10`) — kept subtle so the card stays legible.

### CSS keyframes to add (`src/app/globals.css`)

Add three keyframe sets (or one parametrized via CSS variables) translating a wave
left→right / right→left. Pattern matching existing `@keyframes` style:

```css
@keyframes line-wave-1 {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}
@keyframes line-wave-2 {
  from { transform: translateX(-25%); }
  to   { transform: translateX(25%); }
}
@keyframes line-wave-3 {
  from { transform: translateX(0); }
  to   { transform: translateX(50%); }
}
```

Wave layers use the same durations/directions inverted so they visually cross each other.
(Exact translate spans depend on the authored path width — implementer should make the path
tile seamlessly so a translate of one full tile width loops cleanly.)

## Files touched

### NEW `src/components/react-bits/LineWaves.tsx`
Decorative background component (no state/effects) per the design above. Props:
`className?: string`, optional `waveColor?: string` (fallback to theme defaults).

### `src/app/globals.css`
Add the `line-wave-*` keyframes (and any color support) appended after the existing
`@keyframes` block.

### `src/app/login/page.tsx` — redesign
- Wrap the existing centered layout in a full-page container that includes the **Line Waves**
  background behind the card (replace or layer over the current `<Aurora` usage).
- Two options — pick one, keep minimal:
  - **A.** Keep `<Aurora>` as the color backdrop and add `<LineWaves>` layered on top of it,
    inside an `overflow-hidden` relative full-height wrapper.
  - **B.** Replace `<Aurora>` with `<LineWaves>` as the sole background (simpler, more of a
    "line waves" look).
  - Recommended: **A** (color + motion) unless user prefers just waves.
- Keep the existing card, `SplitText` heading, `ShinyText` subtitle, and the full submit form
  logic. Adjust only the outer wrapper + background. Ensure dark/light both safe, content
  `relative z-10`.

### `src/app/signup/page.tsx` — redesign
Apply the same wrapper/background change as login so both match.

## Out of scope
- Auth/Supabase logic, schema, data.
- Changing the submit buttons or form fields.
- Theming system beyond the wave background colors.

## Validation
- `npm run lint` → 0 errors / 0 warnings.
- `npm run build` passes.
- `npm run dev`:
  - `/login` and `/signup` show the animated line-wave background with the centered card
    legible on top; waves flow horizontally (crossing), subtle and not distracting.
  - Works in both light and dark themes.
  - Login/signup submission still functions unchanged.

## Open notes
- Wave path geometry should be seamless (tile width) so the translate loop has no jump.
- Keep wave opacity low enough that text/labels remain clearly readable (WCAG contrast intact).
