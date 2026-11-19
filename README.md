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
3. Either choice fades to black and leaves an empty void, since the castle isn't built yet.
4. In DevTools device mode at 375px wide, nothing overlaps or scrolls sideways.

The sound choice is saved, but nothing reads it yet. It will drive the audio in step 16.

## Project structure

```
index.html              Google Fonts, root element
src/
  main.tsx              Entry point; applies the palette to CSS variables
  App.tsx               Shows the title screen, then the castle
  index.css             Global styles, font variables, .kanji and .label classes
  lib/
    palette.ts          The only source of colors (also exposed as --color-* CSS variables)
  state/
    useGameStore.ts     zustand store (soundEnabled)
  ui/
    TitleScreen.tsx     Title overlay: layout, intro fade, enter and fade-out logic
    TitleScreen.css
    InkEmblem.tsx       Procedural vermilion brush-stroke circle (SVG)
    Smoke.tsx           Drifting smoke background
    Smoke.css
  scene/                3D components (R3F)
  world/                Level generation
  audio/                Sound
```

Style rules, palette and conventions are in [CLAUDE.md](CLAUDE.md).

## Progress

- [x] 1. Project setup and style rules
- [x] 2. Title screen
- [ ] 3. Canvas, atmosphere and post-processing
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
