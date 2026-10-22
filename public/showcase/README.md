# Keep — Less key hunting. More building.

An original 18-second desktop product film inspired by the pacing and product-story approach of the supplied Revid-hosted source. All product screens are wide desktop browser captures of Keep, with masked local demo data.

## Deliverables

- `keep-desktop-showcase.mp4`: 1920 × 1080, 16:9, 60 fps, H.264 video with an original stereo soundtrack.
- `index.html`: replayable web film with play/pause, replay, seeking, sound toggle, reduced-motion support, transcript, and download.
- `film-v2.js`: deterministic canvas animation source shared by web playback and export.
- `assets/`: actual landscape website captures, Keep logo, Geist font, and original audio.

Open `/showcase/index.html` with the development server running, or open `index.html` directly from disk. The static showcase route is public and requires no account. Feature overlays are animated presentation details; no production keys are used or revealed.

## Original script and structure

| Time | Beat |
| --- | --- |
| 0–1.9 | Less key hunting. More building. Floating key cards converge. |
| 1.9–5 | One vault. Your whole stack. Full landscape workspace reveal. |
| 5–7.6 | The right key. Right now. A moving close-up of desktop search. |
| 7.6–10.3 | Access. On your terms. Team permissions over the actual sharing view. |
| 10.3–12.9 | A heads-up. Before the hurry. A focused expiry reminder. |
| 12.9–15.4 | Late-night ideas. Same clear view. Expanding light-to-dark transition. |
| 15.4–18 | Keys kept. Ideas moving. Meet Keep. |

The new sequence uses an original hook, copy, scene order, brand close, and sound design. It does not reuse the source's footage, mascot, phone frames, script, or music. The previous 30-second export remains as `keep-showcase.mp4`; the player and download now point to the new desktop version.

## Rebuild

From the project root, with the Next.js demo running:

1. `node scripts/capture-showcase.cjs` — captures the 1440 × 850 desktop demo.
2. `python scripts/score-showcase-v2.py` — generates 18-second audio (NumPy required).
3. `node scripts/render-showcase.cjs --preview` — seven review frames.
4. `node scripts/render-showcase.cjs` — 1,080 frames at 60 fps.
5. Encode:

```sh
ffmpeg -framerate 60 -i .motion-work/frames-v2/%05d.png -i public/showcase/assets/soundtrack-v2.wav -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p -c:a aac -b:a 192k -t 18 -movflags +faststart public/showcase/keep-desktop-showcase.mp4
```

Capture/render scripts use Microsoft Edge through Playwright. Set `PLAYWRIGHT_MODULE` to the installed package's absolute location if it is not installed locally. `SHOWCASE_BASE_URL` defaults to `http://localhost:3000`.
