# Change GradientWaves Colors to Monochrome (Black & White)

## Goal
The auth background gradient currently uses vivid purple/pink (`#5227FF` / `#FF9FFC` / `#FFFFFF`). Because the site design is black-and-white/gray (solid white card in light mode, zinc-900 in dark mode), swap the GradientWaves colors to a neutral monochrome palette that suits the design and stays legible in both themes.

## Current State
- `src/components/react-bits/GradientWaves.tsx` defaults:
  - `horizonColor = "#5227FF"` (purple)
  - `waveColor = "#FF9FFC"` (pink)
  - `crestColor = "#FFFFFF"` (white)
- `/login` and `/signup` pages render `<GradientWaves className="" />` with all defaults (no props passed), so the color props on the pages are not explicitly set.

## Plan

### 1. Update the GradientWaves component defaults (single source of truth)
**File:** `src/components/react-bits/GradientWaves.tsx`

Change the three defaults to a gray/black monochrome ramp:
- `horizonColor = "#0A0A0A"` (near-black backdrop)
- `waveColor = "#3F3F46"` (zinc-700 mid-gray wave)
- `crestColor = "#A1A1AA"` (zinc-400 light-gray crest)

Rationale:
- These are neutral grays matching the zinc palette already used by the card (`bg-zinc-900`, `dark:bg-zinc-900`, text `zinc-*`).
- The opaque `alpha=1` gradient behind the solid card stays legible in BOTH light and dark themes — a single color scheme works for both, so no dark/light color overrides are needed.
- No other color-bearing props need changing (`grain`, `parallaxStrength`, etc. remain defaults).

### 2. No CSS or page changes needed
- `/login` and `/signup` use all defaults, so updating the component defaults is sufficient. No changes to the pages or `globals.css`.

### 3. Validation
- `npm run lint` → 0 errors / 0 warnings.
- `npm run build` → passes.
- Optional `npm run dev` spot-check: `/login` and `/signup` show a subtle gray wave background behind the card in both light and dark themes.

## Out of Scope
- Any other components/colors on the pages.
- Greeting/taste adjustment beyond the three gradient stops (user can tweak later by passing props per page if a different harmony is desired).

## Notes for Implementer
- Only three lines (the default values) change; everything else in `GradientWaves.tsx` stays identical.
