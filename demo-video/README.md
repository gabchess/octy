# Octy Demo Video

60-second hackathon demo for the Nosana x ElizaOS Builders Challenge.

Built with [Remotion](https://remotion.dev) — React-based programmatic video.

## Quick start

```bash
cd ~/projects/octy/demo-video
bun install

# Open the interactive preview in your browser
bunx remotion studio

# Render the final MP4
bunx remotion render DemoVideo out/octy-demo.mp4
```

## Before you have recordings

The project ships with placeholder panels for every screen recording slot.
Run `bunx remotion studio` and you will see the full 60-second timeline with
colored placeholders and `[GABE_SCREEN_RECORD_HERE]` labels — no recordings needed.

## Adding your screen recordings

Drop `.mov` files into `public/recordings/`:

| File | Segment | Time |
|------|---------|------|
| `01-nosana-dashboard.mov` | Nosana GPU proof | 6–10 s |
| `02-agent-opens.mov` | Agent boot | 10–12 s |
| `03-main-query.mov` | Main DeFi query | 12–40 s |
| `04-yield-query.mov` | Yield query | 40–48 s |

Then open `src/ScreenRecording.tsx` and change the `usePlaceholder` default to
`false`, **or** pass `usePlaceholder={false}` on each `<ScreenRecording>` in
`DemoVideo.tsx` once the files are in place.

## Segment timing

| # | Segment | Start | End | Frames |
|---|---------|-------|-----|--------|
| 1 | TitleCard | 0 s | 3 s | 0–90 |
| 2 | TransitionCard | 3 s | 6 s | 90–180 |
| 3 | Nosana dashboard | 6 s | 10 s | 180–300 |
| 4 | Agent opens | 10 s | 12 s | 300–360 |
| 5 | Main demo | 12 s | 40 s | 360–1200 |
| 6 | Yield query | 40 s | 48 s | 1200–1440 |
| 7 | TechStackCard | 48 s | 55 s | 1440–1650 |
| 8 | EndCard | 55 s | 60 s | 1650–1800 |

## Swapping in real logos

`EndCard.tsx` renders placeholder boxes for the Nosana and ElizaOS logos.
Replace them with real PNGs:

1. Drop `nosana-logo.png` and `elizaos-logo.png` into `public/`
2. In `EndCard.tsx`, replace `<LogoPlaceholder>` with:

```tsx
import { Img, staticFile } from "remotion";

<Img src={staticFile("nosana-logo.png")} style={{ height: 48 }} />
<Img src={staticFile("elizaos-logo.png")} style={{ height: 48 }} />
```

## Output spec

- Resolution: 1920 × 1080 (1080p)
- FPS: 30
- Duration: 60 s (1800 frames)
- Codec: H.264 (MP4)
- Colors: bg `#0a0a0a` · text `#ffffff` · accent `#00d4aa`
- Font: Space Grotesk (Google Fonts) → Inter fallback
