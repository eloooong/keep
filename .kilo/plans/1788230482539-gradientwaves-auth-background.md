# Implement GradientWaves Background on Auth Pages (Login & Signup)

## Goal
Replace the current Dither (R3F/WebGL) background on `/login` and `/signup` with React Bits' **GradientWaves** (OGL-based, plain JS) for a flowing, mouse-interactive gradient wave background.

## Current State
- Both auth pages use `<Dither>` in an `absolute inset-0` wrapper, card in `relative z-10`.
- Dither uses three/R3F; `Dither.tsx` exists at `src/components/react-bits/Dither.tsx`.
- Dependencies installed: `three`, `@react-three/fiber`, `@react-three/postprocessing`, `postprocessing`, `@types/three`.

## Plan

### 1. Install `ogl` dependency
```bash
npm install ogl
```

### 2. Create GradientWaves component
**File:** `src/components/react-bits/GradientWaves.tsx`

Adapt the provided JS source to repo conventions:
- Add `"use client"` directive
- Convert to TypeScript (`.tsx`) with proper types
- Use **named export** `export function GradientWaves` (matching `Aurora`, `SplitText`, etc.)
- Keep all props with the same defaults from the reference source
- Prop `className` for container sizing (already in source)
- Ensure `hexToRgb`, `detailToSteps`, shaders, and OGL setup are preserved
- The component manages its own RAF, ResizeObserver, IntersectionObserver — keep this

### 3. Update `/login` page
**File:** `src/app/login/page.tsx`
- Replace `import { Dither }` with `import { GradientWaves }` from `@/components/react-bits/GradientWaves`
- Replace the `<Dither .../>` block with `<GradientWaves .../>` using the reference defaults:
```tsx
<GradientWaves
  horizonColor="#5227FF"
  waveColor="#FF9FFC"
  crestColor="#FFFFFF"
  speed={0.4}
  amplitude={2.5}
  waveScale={0.6}
  waveRatio={0.9}
  swell={35}
  turbulence={20}
  tilt={1.11}
  zoom={1}
  height={5.5}
  fogDepth={15}
  detail="medium"
  brightness={1}
  opacity={1}
  mouseInteraction={true}
  parallaxStrength={0.5}
  grain={true}
  grainIntensity={0.05}
  className=""
/>
```
- Keep the outer `main` wrapper and `absolute inset-0` / `relative z-10` structure unchanged.

### 4. Update `/signup` page (same change)
**File:** `src/app/signup/page.tsx`
- Identical import and `<GradientWaves .../>` replacement as login.

### 5. Remove unused Dither + three/R3F deps
- Delete `src/components/react-bits/Dither.tsx`
- Uninstall:
```bash
npm uninstall three @react-three/fiber @react-three/postprocessing postprocessing @types/three
```

### 6. Validation
- `npm run lint` → 0 errors / 0 warnings
- `npm run build` → passes
- `npm run dev`:
  - `/login` shows flowing gradient waves with mouse parallax, card legible
  - `/signup` matches
  - Works in both light and dark themes (card is solid; single color scheme works for both)

## Notes for Implementer
- GradientWaves renders its own `<canvas>`; it requires a sized `relative` container (the existing `absolute inset-0` wrapper provides this).
- The reference defaults (`horizonColor="#5227FF"`, `waveColor="#FF9FFC"`, `crestColor="#FFFFFF"`) are vivid and legible behind the solid card in both themes — no dark/light color overrides needed.
- `mouseInteraction` and `grain` enabled by default; tune `parallaxStrength` / `grainIntensity` if needed.
- The component has no `"use client"` in source — must be added in the TSX wrapper.
- Default export → named export conversion: either wrap the default component in a named export, or restructure as a proper TSX function component.

## Out of Scope
- Auth logic, form fields, Supabase integration — unchanged.
- Theming system — unchanged.
- The `Aurora`, `SplitText`, `ShinyText`, etc. components in `react-bits/` — untouched.

## Open Questions (None — all resolved)
- Both pages get GradientWaves for consistency.
- Repo conventions: `"use client"`, named export, TypeScript, `className` prop.
- Dependency: `ogl` only (no three/R3F).