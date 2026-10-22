# React Bits in Keep

`CountUp.tsx` adapts the count mode from [React Bits CountUp](https://github.com/DavidHDev/react-bits/blob/main/src/ts-default/TextAnimations/CountUp/CountUp.tsx), retrieved October 22, 2026. Copyright (c) 2026 David Haz. The upstream license is preserved in `LICENSE.react-bits.md`.

Keep uses Motion's numeric animation with the upstream ease-out curve, and omits the unused rolling-number modes. Counts render their final value on the server, expose that value to screen readers, stop on unmount, and respect reduced motion, including preference changes while running. Duration is expressed in milliseconds for compatibility with Keep's existing API.

## Extended motion system

- **Threads** uses the original React Bits OGL shader from commit [`d50d8117`](https://github.com/DavidHDev/react-bits/tree/d50d8117e3f880312451059196d76518451316bc/src/ts-default/Backgrounds/Threads). Keep caps resolution at 720×420, targets 30 fps with 20 lines, and reduces resolution and cadence to 10 fps for software renderers. It supports pause and reduced motion, suspends work offscreen and in hidden tabs, and provides static SVG fallback when WebGL is unavailable. Resources and listeners are released on unmount. Pointer response stays inside the decorative panel.
- **DecryptedText** adapts the sequential scrambling technique from that revision. It runs once per entrance, preserves each character's layout width, exposes the original text to screen readers, and stops on pause, reduced motion, or page hiding. It only operates on marketing copy, never stored credentials.
- **StarBorder** adapts the two moving radial edges from that revision. It frames the illustrative preview, keeps a neutral surface, and supports pause, offscreen suspension, and reduced motion.
- **SpotlightCard** adapts that revision's pointer-positioned radial light. It uses the local palette and is disabled for reduced motion or paused effects. It never intercepts input.
- **GlareHover** adapts that revision's [diagonal hover sweep](https://github.com/DavidHDev/react-bits/tree/d50d8117e3f880312451059196d76518451316bc/src/ts-default/Animations/GlareHover) into a decorative span inside the native Add key button. It runs on hover or keyboard focus, preserves the button's click target, and disappears for reduced motion.
- **AnimatedContent** and **AnimatedList** adapt the corresponding React Bits concepts to the Motion dependency already used by CountUp. They render visible HTML, cancel on focus or reduced-motion changes, clean up transforms after arrival, and preserve native controls. List entrances are bounded to 20 visible new items with a maximum 120 ms stagger. Existing keyed rows keep their component state.

The pinned 2025 components' license is preserved in `LICENSE.react-bits-2025.md`. CountUp retains its separate, current upstream license above. Other existing files are local effects; names alone do not indicate verified upstream source. Add individual components from the official library as needed, rather than an unrelated npm package named after the library.

## Dashboard composition

`VaultHeader` combines Threads, StarBorder, SpotlightCard, DecryptedText, and real CountUp totals. Its ambient work stops offscreen and for reduced motion. The title reveals once per mount, rather than replaying on server refreshes. The header receives counts only; the page continues fetching and authorizing key metadata on the server.

Native key articles reuse the SpotlightCard pointer-positioning technique without a clipping wrapper, so menus and inline forms stay usable. Open menus raise their row above adjacent rows. Copy confirmation and key reveals have short state transitions; stored key values are never fed into scrambling or background effects. Edit and sharing panels use the existing AnimatedContent adaptation. All new dashboard effects have reduced-motion alternatives, and there is no effects-toggle UI.
