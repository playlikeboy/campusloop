# CampusLoop launch film

Source for `public/launch/campusloop-launch.mp4` (1920x1080), `campusloop-launch-vertical.mp4` (1080x1920),
the posters and `campusloop-launch.vtt`.

## Re-render

```bash
node scripts/launch-video/build.mjs
```

Options: `--capture` re-shoots the app screens from the live site first (demo account), `--only h|v` builds one
orientation, `--carousel <dir>` also exports the six 1080x1350 Instagram slides, `--skip-render` reuses rendered video.
Intermediate files go to `$WORK` (default `<os tmp>/campusloop-launch`, about 1 GB). A full build takes about 15 minutes on a many-core machine.

Needs: Node 22, the repo's `playwright-core`, Chromium (`CHROMIUM`, default `~/.local/bin/chromium`),
ffmpeg (`FFMPEG`, default `~/.local/bin/ffmpeg`), Python 3 with numpy.

## How it works

| file | role |
|---|---|
| `film.html`, `film.css`, `film.js`, `lib.js` | The film as one paused GSAP timeline (`?v=h` or `?v=v`). Same times in both layouts, so the audio and captions are shared. |
| `render.mjs` | Seeks the timeline frame by frame (60 fps), screenshots at 2x and pipes to ffmpeg with a lanczos downscale. Never real time. `--dump` writes the SFX cues and captions; `--stills t1,t2` writes PNG stills. |
| `music.py` | Original 120 bpm track and SFX synthesised with numpy (additive pads and plucks, sine bass, synthetic drums, noise risers). SFX timing comes from the timeline cues. |
| `build.mjs` | Render, music, two-pass loudnorm to -14 LUFS, H.264 encode (CRF stepped up until 15 MB or less), posters, WebVTT. |
| `capture.mjs` | Playwright capture of the live app at 390px (DPR 3) and 1440px, notification prompt suppressed. |
| `carousel.html`, `carousel.js`, `carousel.mjs` | Six Instagram slides from the same parts. |
| `assets/` | Screens, logo, Bricolage Grotesque and Figtree (OFL) and GSAP 3.12.5. |

Copy lives in `film.js`. To change a line, edit it there and re-run the build.
