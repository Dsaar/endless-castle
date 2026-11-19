# The Endless Castle

A first-person, scroll-driven walk through an endless, impossible Japanese castle floating in a black void, where you hunt for six hidden figures.

## Tech stack

- **React 19 + TypeScript**, built with **Vite**
- **React Three Fiber** for 3D, with **drei** helpers and **@react-three/postprocessing**
- **zustand** for shared state
- **GSAP** for scripted sequences (camera moves, reveals, transitions)
- **oxlint** for linting
- Fonts: Cormorant Garamond (Latin) and Shippori Mincho (kanji), from Google Fonts
- No external 3D assets: all geometry is procedural and all textures are drawn on canvas

## Running it

```sh
npm install
npm run dev      # dev server at http://localhost:5173
npm run build    # typecheck and production build
npm run lint     # oxlint
```

## Controls (so far)

| Where        | Input                       | Action                                      |
| ------------ | --------------------------- | ------------------------------------------- |
| Title screen | Click **Enter the castle**  | Enter with sound on                         |
| Title screen | Click **Enter in silence**  | Enter with sound off                        |
| Title screen | Tab / Enter / Space         | Move between the buttons and choose one (the main button has focus on load) |
| Castle (dev only) | **Dev** panel, top right | Drag the sliders to tune fog density and bloom. Click the panel title to collapse it. |

## Features so far

### Title screen

A full-screen HTML overlay in front of the (future) 3D scene.

- Slow drifting smoke made from large blurred gradients, animated in CSS, with a vignette that fades into the void.
- An original emblem: a vermilion brush-stroke circle drawn in SVG from code. It has a heavy start, a dry tapering tail, rough edges and bristle gaps, and it paints itself on as the screen appears.
- The title in Cormorant Garamond, and 無限城 set vertically on the right at low opacity. Below 640px wide, the kanji move to the top-right corner.
- **Enter the castle** has a thin bronze border with a lantern glow on hover and focus. **Enter in silence** sits under it as a small italic link.
- Footer: a tiny **CREDITS** label in the center and the author's name at the bottom right.
- Everything fades in over 2s. Either choice saves `soundEnabled` in the store, fades the screen to black over 1.2s, then calls `onEnter()`.
- Works down to 375px wide and on short landscape phones. With reduced motion turned on, the smoke stops and the emblem appears already drawn.

**How to test:** run `npm run dev` and check that:

1. The screen fades in over about 2s and the brush circle paints itself on.
2. Hovering or tabbing to **Enter the castle** shows the glow.
3. Either choice fades to black, then the 3D scene fades in (see below).
4. In DevTools device mode at 375px wide, nothing overlaps or scrolls sideways.

The sound choice is saved, but nothing reads it yet. It will drive the audio in step 16.

### Canvas, atmosphere and post-processing

After the title screen's `onEnter`, a full-screen React Three Fiber canvas mounts behind all UI (`z-index: 0`) and fades in over 1.8s (no fade with reduced motion).

- **Renderer:** device pixel ratio clamped to `[1, 2]`, sRGB output, ACES filmic tone mapping. While the post-processing stack is mounted, `EffectComposer` turns the renderer's tone mapping off and ACES is applied by the `ToneMapping` effect instead, so it never runs twice. MSAA (4×) happens inside the composer, so the canvas itself has antialiasing off.
- **Void:** the scene background and `FogExp2` both use the void color (density 0.035), so everything fades into black.
- **Starfield:** 2000 tiny warm-white points (shoji cream) on a 600-unit sphere that follows the camera, so they always look infinitely far away. They ignore fog. Most are faint pinpricks and a few are brighter. Each one twinkles slowly with its own speed and phase, all computed in the shader.
- **Dust and embers:** two layers of amber, additive particles in a box that follows the camera. Dust: 500 faint, slow motes that stay below the bloom threshold. Embers: 160 brighter sparks that rise faster, flicker and bloom. Rising, swaying and recycling (a mote that leaves the top of the box comes back in at the bottom) all happen in the vertex shader, and motes fade near the box walls so they never pop. The CPU only updates a few uniforms per frame.
- **Post-processing:** Bloom (mipmap blur, threshold 0.6, intensity 1.2) → ACES tone mapping → Vignette (darkness 0.7) → film grain (Noise, opacity 0.04). The scene renders into a half-float buffer, so emissive values above 1 reach the bloom intact.
- **Bloom test rig (temporary):** a glowing shoji-cream emissive panel, one amber point light with a small bright bulb, and a dark cedar floor so you can see the light's falloff into the fog. The real castle replaces it from step 4.
- **Dev panel (leva):** only in `npm run dev`. Tunes fog density and bloom intensity, threshold, smoothing and radius live. The panel writes to a zustand store (`useAtmosphereStore`) and the scene reads from it. Production builds use the defaults, and leva is left out of the bundle (`import.meta.env.DEV` guards a lazy import).
- Stars and motes use seeded randomness (`src/lib/random.ts`), so the layout is the same on every reload.

**How to test:** run `npm run dev`, then click **Enter the castle** and check that:

1. The scene fades in: a cream panel with a soft halo, an amber bulb to its right, a warm pool of light on the floor, and stars around it.
2. Stars twinkle slowly. Amber embers drift upward and flicker. Faint dust hangs in the air.
3. In the **Dev** panel, raising **Fog → density** swallows the floor and panel in black. Raising **Bloom → threshold** above about 1 makes the panel's halo vanish while the bulb still glows. **Intensity** and **radius** change how strong and how wide the glow is.
4. `npm run build` and `npm run preview`: no Dev panel appears.

## Project structure

```
index.html              Google Fonts, root element
src/
  main.tsx              Entry point; applies the palette to CSS variables
  App.tsx               Shows the title screen, then the 3D canvas (+ dev panel in dev)
  index.css             Global styles, font variables, .kanji and .label classes
  lib/
    palette.ts          The only source of colors (also exposed as --color-* CSS variables)
    random.ts           Seeded PRNG (mulberry32) for stable procedural layouts
  state/
    useGameStore.ts     zustand store (soundEnabled)
    useAtmosphereStore.ts  Fog and bloom values (+ defaults), written by the dev panel
  ui/
    TitleScreen.tsx     Title overlay: layout, intro fade, enter and fade-out logic
    TitleScreen.css
    InkEmblem.tsx       Procedural vermilion brush-stroke circle (SVG)
    Smoke.tsx           Drifting smoke background
    Smoke.css
    DevPanel.tsx        leva panel for fog and bloom (dev builds only)
  scene/                3D components (R3F)
    CastleCanvas.tsx    The <Canvas>: renderer settings, camera, scene contents
    CastleCanvas.css    Full-screen layer behind the UI, fade-in
    Atmosphere.tsx      Void background and FogExp2
    Starfield.tsx       Twinkling star sphere (shader points)
    DriftingMotes.tsx   Rising, self-recycling particles (used for dust and embers)
    PostEffects.tsx     Bloom, tone mapping, vignette, grain
    BloomTestRig.tsx    Temporary emissive panel + point light for judging bloom
  world/                Level generation
  audio/                Sound
```

Style rules, palette and conventions are in [CLAUDE.md](CLAUDE.md).

## Progress

- [x] 1. Project setup and style rules
- [x] 2. Title screen
- [x] 3. Canvas, atmosphere and post-processing
- [ ] 4. Building kit
- [ ] 5. The Gate and the intro
- [ ] 6. Movement
- [ ] 7. The guide scroll
- [ ] 8. The endless segment system
- [ ] 9. The HUD
- [ ] 10. The Fall
- [ ] 11. The distant castle
- [ ] 12. Junctions and stairs
- [ ] 13. Special chambers
- [ ] 14. The hidden figures
- [ ] 15. Signs and presence
- [ ] 16. Audio
- [ ] 17. Mobile, performance and polish
- [ ] 18. Deploy
