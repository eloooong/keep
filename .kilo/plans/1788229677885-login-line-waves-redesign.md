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

## Pending: replace auth background with React Bits GradientWaves (NOT YET IMPLEMENTED)

Status: **Do not implement yet — awaiting further input.**

The Dither (R3F WebGL) background from the prior iteration is to be replaced with React Bits'
**GradientWaves** component. Run the shadcn install command first:

```
npx shadcn@latest add @react-bits/GradientWaves-JS-TW
```

After installing, the implementing agent should:
- Wire `GradientWaves` into both `/login` and `/signup` pages in place of the current `<Dither>` background (which sits in an `absolute inset-0` wrapper), keeping the centered card in the `relative z-10` wrapper.
- Confirm `GradientWaves` is Tailwind-based (Tailwind v4 via `@import "tailwindcss"`), uses `"use client"` + named export + `className` prop to match `src/components/react-bits/` conventions, and is dark/light safe.
- Remove the now-unused Dither component + the three/R3F deps (`three`, `@react-three/fiber`, `@react-three/postprocessing`, `postprocessing`, `@types/three`) if no longer referenced.
- Run `npm run lint` (0/0) and `npm run build` (pass).
- Verify in `npm run dev` that `/login` and `/signup` show flowing gradient waves with the card legible, in both light and dark themes.

### GradientWaves usage (provided by user — reference defaults)

```tsx
import GradientWaves from './GradientWaves';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
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
    mouseInteraction
    parallaxStrength={0.5}
    grain
    grainIntensity={0.05}
  />
</div>
```

Notes for implementation:
- This is the reference/default prop set from React Bits. The auth variation should fill the full page (not a fixed `600px` height) and sit in an `absolute inset-0` wrapper behind the centered card.
- `GradientWaves` comes as a **JS** component in the JS-TW variant (the shadcn package name ends in `-JS-TW`), i.e. JavaScript not TypeScript, and ships with a **`default export`**. The implementing agent should reconcile this with the repo's TS / named-export conventions (e.g. add a `"use client"` directive, and either keep the default export or wrap it in a named `export function GradientWaves` wrapper that forwards to the default component).
- **Dependency: the component uses `ogl`** (imports `Renderer, Program, Mesh, Triangle` from `'ogl'`), NOT three/R3F. Add `ogl` to `package.json` (`npm install ogl`) and remove the now-unused Dither + three/R3F deps (`three`, `@react-three/fiber`, `@react-three/postprocessing`, `postprocessing`, `@types/three`) if no longer referenced.
- The component renders its own `<canvas>` via `Renderer`, has no `"use client"` directive in source, and manages its own render loop + ResizeObserver + IntersectionObserver (visibility-aware pausing). It must be placed inside a sized, `relative` container (the `absolute inset-0` wrapper) so the canvas gets non-zero width/height.
- Override its `className`/container for full-bleed sizing and adjust `height`, `zoom`, `tilt`, `opacity`, and colors so the card stays legible in both light and dark themes.
- Import path will be resolved per wherever shadcn places the component (likely `src/components/react-bits/GradientWaves`).
- Keep `mouseInteraction` enabled for the hover-parallax behavior; tune `parallaxStrength` and `grainIntensity` for subtlety behind a form.
- Note: this OGL canvas background does NOT auto-adapt colors to dark mode via CSS — but since the centered card is solid (`bg-white` / `dark:bg-zinc-900`), a single color scheme (the vivid `#5227FF`/`#FF9FFC`/`#FFFFFF` default) works behind it in both themes. Keep card text contrast intact.

### GradientWaves full component source (provided by user — reference for implementation)

```jsx
import { useEffect, useRef } from 'react';
import { Renderer, Program, Mesh, Triangle } from 'ogl';

const hexToRgb = hex => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return [1, 1, 1];
  return [parseInt(result[1], 16) / 255, parseInt(result[2], 16) / 255, parseInt(result[3], 16) / 255];
};

const detailToSteps = detail => {
  if (detail === 'low') return 40.0;
  if (detail === 'high') return 110.0;
  return 70.0;
};

const vertex = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragment = `#version 300 es
precision highp float;
uniform vec2 iResolution;
uniform float iTime;
uniform float uSpeed;
uniform float uAmplitude;
uniform float uWaveScale;
uniform float uWaveRatio;
uniform float uSwell;
uniform float uTurbulence;
uniform float uTilt;
uniform float uZoom;
uniform float uHeight;
uniform float uFogDepth;
uniform float uSteps;
uniform float uBrightness;
uniform float uOpacity;
uniform float uGrain;
uniform float uGrainIntensity;
uniform vec2 uMouse;
uniform float uParallax;
uniform bool uEnableMouse;
uniform vec3 uHorizonColor;
uniform vec3 uWaveColor;
uniform vec3 uCrestColor;
out vec4 fragColor;

const float MAX_DIST = 20000.0;

float hash21(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float plasma(vec3 r, vec2 freq, vec4 tc) {
  float mx = r.x + tc.x;
  mx += uSwell * sin((r.y + mx) / 20.0 + tc.y);
  float my = r.y - tc.z;
  my += uTurbulence * cos(r.x / 23.0 + tc.w);
  return r.z - (sin(mx * freq.x) * uAmplitude + sin(my * freq.y) * uAmplitude + uHeight);
}

float raymarch(vec3 pos, vec3 dir, vec2 freq, vec4 tc) {
  float dist = 0.0;
  for (int i = 0; i < 128; i++) {
    if (float(i) >= uSteps) break;
    float dscene = plasma(pos + dist * dir, freq, tc);
    if (abs(dscene) < 0.1) break;
    dist += 0.9 * dscene;
    if (!(abs(dist) < MAX_DIST)) return MAX_DIST;
  }
  return dist;
}

void main() {
  float T = iTime * uSpeed;
  vec2 freq = vec2(uWaveScale / 7.0, (uWaveScale * uWaveRatio) / 3.0);
  vec4 tc = vec4(T / 0.130, T / 0.810, T / 0.200, T / 0.710);
  float c, s;
  float vfov = (3.14159 / 2.3) / max(uZoom, 0.05);
  vec3 cam = vec3(0.0, 0.0, 30.0);
  vec2 uv = (gl_FragCoord.xy / iResolution.xy) - 0.5;
  uv.x *= iResolution.x / iResolution.y;
  uv.y *= -1.0;

  vec3 dir = vec3(0.0, 0.0, -1.0);
  float ulen = length(uv);
  float xrot = vfov * ulen;
  c = cos(xrot); s = sin(xrot);
  dir = mat3(1.0, 0.0, 0.0, 0.0, c, -s, 0.0, s, c) * dir;
  vec2 nuv = ulen > 1e-5 ? uv / ulen : vec2(1.0, 0.0);
  c = nuv.x; s = nuv.y;
  dir = mat3(c, -s, 0.0, s, c, 0.0, 0.0, 0.0, 1.0) * dir;
  c = cos(uTilt); s = sin(uTilt);
  dir = mat3(c, 0.0, s, 0.0, 1.0, 0.0, -s, 0.0, c) * dir;

  if (uEnableMouse) {
    float yaw = (uMouse.x - 0.5) * uParallax * 0.4;
    float pitch = (uMouse.y - 0.5) * uParallax * 0.4;
    c = cos(yaw); s = sin(yaw);
    dir = mat3(c, 0.0, s, 0.0, 1.0, 0.0, -s, 0.0, c) * dir;
    c = cos(pitch); s = sin(pitch);
    dir = mat3(1.0, 0.0, 0.0, 0.0, c, -s, 0.0, s, c) * dir;
  }

  float dist = raymarch(cam, dir, freq, tc);
  vec3 pos = cam + dist * dir;

  float t = clamp(uFogDepth / max(dist, 0.001), 0.0, 1.0);
  vec3 body = mix(uWaveColor, uCrestColor, clamp(pos.z * 0.08 + 0.5, 0.0, 1.0));
  vec3 col = mix(uHorizonColor, body, t);
  col *= uBrightness;
  col = clamp(col, 0.0, 1.0);

  float alpha = clamp(t, 0.0, 1.0) * uOpacity;
  if (uGrain > 0.5) {
    float g = hash21(gl_FragCoord.xy + mod(iTime, 64.0) * 11.0);
    alpha += (g - 0.5) * uGrainIntensity;
  }
  alpha = clamp(alpha, 0.0, 1.0);
  fragColor = vec4(col * alpha, alpha);
}
`;

const ctxMap = new WeakMap();

const GradientWaves = ({
  horizonColor = '#5227FF',
  waveColor = '#FF9FFC',
  crestColor = '#FFFFFF',
  speed = 0.4,
  amplitude = 2.5,
  waveScale = 0.6,
  waveRatio = 0.9,
  swell = 35,
  turbulence = 20,
  tilt = 1.11,
  zoom = 1.0,
  height = 5.5,
  fogDepth = 15,
  detail = 'medium',
  brightness = 1.0,
  opacity = 1.0,
  mouseInteraction = true,
  parallaxStrength = 0.5,
  grain = true,
  grainIntensity = 0.05,
  className = ''
}) => {
  const containerRef = useRef(null);
  const enableMouseRef = useRef(mouseInteraction);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const renderer = new Renderer({
      webgl: 2,
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      dpr: Math.min(window.devicePixelRatio || 1, 2)
    });

    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    const canvas = gl.canvas;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    container.appendChild(canvas);

    const geometry = new Triangle(gl);
    const program = new Program(gl, {
      vertex,
      fragment,
      uniforms: {
        iTime: { value: 0 },
        iResolution: { value: new Float32Array([1, 1]) },
        uSpeed: { value: 0.4 },
        uAmplitude: { value: 2.5 },
        uWaveScale: { value: 0.6 },
        uWaveRatio: { value: 0.9 },
        uSwell: { value: 35 },
        uTurbulence: { value: 20 },
        uTilt: { value: 1.11 },
        uZoom: { value: 1.0 },
        uHeight: { value: 5.5 },
        uFogDepth: { value: 15 },
        uSteps: { value: 70.0 },
        uBrightness: { value: 1.0 },
        uOpacity: { value: 1.0 },
        uGrain: { value: 1.0 },
        uGrainIntensity: { value: 0.05 },
        uMouse: { value: new Float32Array([0.5, 0.5]) },
        uParallax: { value: 0.5 },
        uEnableMouse: { value: true },
        uHorizonColor: { value: new Float32Array([1, 1, 1]) },
        uWaveColor: { value: new Float32Array([1, 1, 1]) },
        uCrestColor: { value: new Float32Array([1, 1, 1]) }
      }
    });

    const mesh = new Mesh(gl, { geometry, program });
    ctxMap.set(container, { renderer, program, mesh });

    const setSize = () => {
      const rect = container.getBoundingClientRect();
      const w = Math.max(1, Math.floor(rect.width));
      const h = Math.max(1, Math.floor(rect.height));
      renderer.setSize(w, h);
      const res = program.uniforms.iResolution.value;
      res[0] = gl.drawingBufferWidth;
      res[1] = gl.drawingBufferHeight;
      renderer.render({ scene: mesh });
    };

    const ro = new ResizeObserver(setSize);
    ro.observe(container);
    setSize();

    const currentMouse = [0.5, 0.5];
    const targetMouse = [0.5, 0.5];

    const onPointerMove = e => {
      const rect = canvas.getBoundingClientRect();
      targetMouse[0] = (e.clientX - rect.left) / rect.width;
      targetMouse[1] = 1.0 - (e.clientY - rect.top) / rect.height;
    };
    const onPointerLeave = () => {
      targetMouse[0] = 0.5;
      targetMouse[1] = 0.5;
    };
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerleave', onPointerLeave);

    let raf = 0;
    let isVisible = true;
    let isPageVisible = !document.hidden;
    const t0 = performance.now();

    const loop = t => {
      program.uniforms.iTime.value = (t - t0) * 0.001;
      const tx = enableMouseRef.current ? targetMouse[0] : 0.5;
      const ty = enableMouseRef.current ? targetMouse[1] : 0.5;
      currentMouse[0] += 0.05 * (tx - currentMouse[0]);
      currentMouse[1] += 0.05 * (ty - currentMouse[1]);
      program.uniforms.uMouse.value[0] = currentMouse[0];
      program.uniforms.uMouse.value[1] = currentMouse[1];
      renderer.render({ scene: mesh });
      raf = requestAnimationFrame(loop);
    };

    const tryStart = () => {
      if (isVisible && isPageVisible && raf === 0) raf = requestAnimationFrame(loop);
    };
    const tryStop = () => {
      if (raf !== 0) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
        isVisible ? tryStart() : tryStop();
      },
      { threshold: 0 }
    );
    io.observe(container);

    const onVisibility = () => {
      isPageVisible = !document.hidden;
      isPageVisible ? tryStart() : tryStop();
    };
    document.addEventListener('visibilitychange', onVisibility);

    tryStart();

    return () => {
      tryStop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerleave', onPointerLeave);
      ctxMap.delete(container);
      try {
        container.removeChild(canvas);
      } catch {}
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ctx = ctxMap.get(container);
    if (!ctx) return;
    const { program } = ctx;
    const u = program.uniforms;

    enableMouseRef.current = mouseInteraction;

    u.uSpeed.value = speed;
    u.uAmplitude.value = amplitude;
    u.uWaveScale.value = waveScale;
    u.uWaveRatio.value = waveRatio;
    u.uSwell.value = swell;
    u.uTurbulence.value = turbulence;
    u.uTilt.value = tilt;
    u.uZoom.value = zoom;
    u.uHeight.value = height;
    u.uFogDepth.value = fogDepth;
    u.uSteps.value = detailToSteps(detail);
    u.uBrightness.value = brightness;
    u.uOpacity.value = opacity;
    u.uGrain.value = grain ? 1.0 : 0.0;
    u.uGrainIntensity.value = grainIntensity;
    u.uParallax.value = parallaxStrength;
    u.uEnableMouse.value = mouseInteraction;
    const hc = u.uHorizonColor.value;
    const wc = u.uWaveColor.value;
    const cc = u.uCrestColor.value;
    const h = hexToRgb(horizonColor);
    const w = hexToRgb(waveColor);
    const cr = hexToRgb(crestColor);
    hc[0] = h[0];
    hc[1] = h[1];
    hc[2] = h[2];
    wc[0] = w[0];
    wc[1] = w[1];
    wc[2] = w[2];
    cc[0] = cr[0];
    cc[1] = cr[1];
    cc[2] = cr[2];
  }, [
    horizonColor,
    waveColor,
    crestColor,
    speed,
    amplitude,
    waveScale,
    waveRatio,
    swell,
    turbulence,
    tilt,
    zoom,
    height,
    fogDepth,
    detail,
    brightness,
    opacity,
    grain,
    grainIntensity,
    mouseInteraction,
    parallaxStrength
  ]);

  return <div ref={containerRef} className={`relative h-full w-full overflow-hidden ${className}`.trim()} />;
};

export default GradientWaves;
```
