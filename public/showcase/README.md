# Product film

An 18-second desktop film using sample Keep data. The web player is available at `/showcase/index.html`; the downloadable export is `keep-desktop-showcase.mp4`.

The film includes historical interface captures. It is a product presentation, not a reference for the current interface.

## Files

- `film.js`: deterministic canvas animation used by playback and rendering
- `assets/`: captured screens, logo, font, and soundtrack
- `keep-desktop-showcase.mp4`: 1920 × 1080, 60 fps, H.264 with stereo audio

The player supports seeking, sound, reduced motion, a transcript, and download.

## Rebuild

Run the demo server locally. The renderer requires Node Playwright with Microsoft Edge; set `PLAYWRIGHT_MODULE` if the module is installed outside the project. The score generator requires Python and NumPy.

```sh
python scripts/score-showcase.py
node scripts/render-showcase.cjs --preview
node scripts/render-showcase.cjs
ffmpeg -framerate 60 -i .motion-work/frames-v2/%05d.png -i public/showcase/assets/soundtrack.wav -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p -c:a aac -b:a 192k -t 18 -movflags +faststart public/showcase/keep-desktop-showcase.mp4
```

`SHOWCASE_BASE_URL` defaults to `http://localhost:3000`. Intermediate frames are ignored by Git. Refresh screenshots manually using only sample data when updating the film.
