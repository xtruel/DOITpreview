# droneDoIT — FPV Speed Simulator

A web-based FPV drone racing simulator with retro **Y2K / Jet Set Radio** cel-shaded
aesthetics, Betaflight-style rate physics, neon hoop & square gate courses, a Betaflight
OSD, ghost-pilot replays and procedural electronic beats.

Built with **React 19 + Vite 6 + Tailwind v4**. Rendering is a custom 3D projection on an
HTML canvas; everything runs client-side (no backend).

## Run locally

```sh
npm install
npm run dev        # http://localhost:8080
```

## Build & deploy (GitHub Pages)

The app is served under `/DOITpreview/` in production (see `vite.config.ts`).

```sh
npm run build      # outputs to dist/
npm run deploy     # publishes dist/ to the gh-pages branch
```

## Controls

**Mode 2 (Pro)** — `W/S` throttle · `A/D` yaw · `I/K` or `↑/↓` pitch · `J/L` or `←/→` roll · `Space` turbo boost

**Casual WASD** — `W/S/A/D` pitch/roll · `Space/Shift` throttle · `←/→` yaw · `Shift` turbo

Beginners should keep the flight mode on **ANGLE** (self-levelling). **ACRO** gives full
rate aerobatics.

## Project layout

```
src/
  App.tsx                  Menu / level select / global records modal
  levels.ts                Level + gate definitions (data-driven courses)
  types.ts                 Shared types
  index.css                Tailwind v4 + Y2K/JSR utilities & glitch animations
  components/
    FPVSimulator.tsx       Canvas renderer + flight physics loop + OSD/HUD
    BetaflightConfig.tsx   Rate tuner (RC Rate / Super Rate / Expo) + drone customizer
    SoundEngine.ts         Web Audio procedural music + engine/SFX
public/images/             Background concept art per level (Jet Set Radio style)
```

## Notes on the flight loop

The physics + canvas render run in a single `requestAnimationFrame` loop that mounts once
per race and reads live values from refs (game state, gate index, inputs, turbo…). HUD
numbers are flushed to React at ~14 fps so the canvas stays smooth and the heavier DOM/chart
updates don't run every frame.

## Roadmap

- More complex / longer courses and richer 3D worlds
- Multiplayer races and shared leaderboards between web users
- Pilot profiles / home hub
