# Endless Castle

## Concept
A first-person, scroll-driven walk through an endless, impossible Japanese castle floating in a black void. The player hunts six hidden figures.

## Style
- Background / void: `#030202`
- Cedar wood: `#5A2A18` (dark) to `#8B3A1E` (light)
- Shoji paper: `#F3DCB0`, emissive and backlit
- Lantern light: `#FFB866`
- One accent only, vermilion: `#B3241E`. Use it sparingly.
- UI text: `#E9DCC6`
- Mood: warm light in deep black. Everything fades into black fog (fog color = void color).

## Fonts
- Cormorant Garamond 400/500 for Latin text (`var(--font-latin)`).
- Shippori Mincho for kanji (`var(--font-kanji)`, `.kanji` class).
- Labels are tiny uppercase with `0.3em` letter-spacing (`.label` class in `src/index.css`).
- Fonts load from Google Fonts in `index.html`.

## Tech rules
- React Three Fiber for all 3D. Postprocessing via `@react-three/postprocessing`. Use drei helpers where they fit.
- An HTML overlay for all UI. No UI text rendered inside the 3D scene.
- zustand for shared state (`src/state`).
- GSAP for scripted sequences (camera moves, reveals, transitions).
- No external 3D assets yet: procedural geometry and canvas-generated textures only.
- Target 60fps on a mid-range laptop. Prefer instancing, shared geometries/materials, and few dynamic lights; avoid per-frame allocations and React state updates inside `useFrame`.

## Structure
- `src/scene` — 3D components
- `src/world` — level generation
- `src/ui` — HTML overlay
- `src/audio` — sound
- `src/state` — zustand store
- `src/lib` — palette, math helpers

## Conventions
- Small, focused components. One component per file.
- Colors only from `src/lib/palette.ts`. Never hard-code a hex value elsewhere.
  - In TS/R3F: `import { palette } from '../lib/palette'`.
  - In CSS: `var(--color-<kebab-key>)` (e.g. `--color-void`, `--color-ui-text`), set at startup by `applyPaletteToCss()` in `src/main.tsx`.

## Commands
- `npm run dev` — dev server
- `npm run build` — typecheck and build
- `npm run lint` — oxlint

## Workflow
- After every build step, update README.md before finishing: tick the step in the Progress checklist, describe new features, controls and files, and note how to test them.
