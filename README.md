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
| The Gate     | (none)                      | The intro plays by itself. Walking and looking unlock when the camera arrives. |
| Walking      | Mouse wheel / trackpad scroll | Walk forward (down) or back (up). Scroll faster to run, up to a top speed. |
| Walking      | W / S, ↑ / ↓ (hold)         | Walk forward / back at a steady pace |
| Walking      | Space / Shift+Space         | One stride (1.6 m, two steps) forward / back |
| Walking      | Touch: swipe up / down      | Walk forward / back. A quick flick carries on a little after you lift your finger. |
| Looking      | Mouse drag                  | Look around (drag the world: drag right to turn left). Limited to ±60° sideways, 30° up, 40° down. |
| Looking      | Touch: swipe sideways, or two-finger drag | Look around. A one-finger swipe picks walk or look by its first direction. |
| Looking      | Move the mouse (desktop)    | The view leans up to 4° toward the pointer |
| The Gate     | First scroll (or W / ↑ / Space / swipe) | Opens the guide scroll instead of walking. Happens once. |
| Guide        | **GUIDE** button, top left  | Opens the guide again |
| Guide        | Click a tab, or ← → / Home / End on the tabs | Switch between The Castle, Moving, Hidden Ones and Signs |
| Guide        | Esc, or **Accept the summons** | Roll the scroll back up |
| Guide        | Tab / Shift+Tab             | Move between the tabs, the text and the button (focus stays inside the scroll) |
| Castle (dev only) | **Dev** panel, top right | Drag the sliders to tune fog density and bloom. Click the panel title to collapse it. |
| Castle (dev only) | **Dev → Guide** | **open** opens the guide, **find a figure** marks the next hidden figure found, **reset figures** clears them |
| Kit view (`?kit`, dev only) | Drag / right-drag / scroll | Orbit, pan and zoom around the current piece |
| Kit view | Piece names at the bottom, or ← → | Glide the camera to the next piece |

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
- **Dev panel (leva):** only in `npm run dev`. Tunes fog density and bloom intensity, threshold, smoothing and radius live. The panel writes to a zustand store (`useAtmosphereStore`) and the scene reads from it. Production builds use the defaults, and leva is left out of the bundle (`import.meta.env.DEV` guards a lazy import).
- Stars and motes use seeded randomness (`src/lib/random.ts`), so the layout is the same on every reload.

**How to test:** run `npm run dev`, then click **Enter the castle** and check that:

1. The scene fades in with stars around it (the temporary bloom test rig from this step has been replaced by the Gate, below).
2. Stars twinkle slowly. Amber embers drift upward and flicker. Faint dust hangs in the air.
3. In the **Dev** panel, raising **Fog → density** swallows the bridge and gate in black. Raising **Bloom → threshold** above about 1 makes the shoji halo vanish while the lanterns and the door slits still glow. **Intensity** and **radius** change how strong and how wide the glow is.
4. `npm run build` and `npm run preview`: no Dev panel appears.

### Building kit

Procedural pieces that the castle will be built from, in `src/scene/kit/`. Each one is a React component with `position`, `rotation` and `size` props, plus an optional `seed` that shifts the grain so copies don't look identical (it defaults to a hash of the position).

| Piece | `size` | Other props | Notes |
| ----- | ------ | ----------- | ----- |
| `WoodBeam` | `[length, height, depth]` | | Horizontal, along local X, centered |
| `Post` | `[width, height, depth]` | | Stands on `position`; grain runs up the post |
| `FloorPlanks` | `[width, depth]` | `plankWidth` | Boards along X with staggered joints and 7 mm gaps over a dark underlay. Low roughness, so lanterns leave hot spots. |
| `ShojiPanel` | `[width, height]` | `lit`, `kickboard` | Cedar frame, kumiko lattice, and a paper plane in the middle of the frame (reads from both sides). `lit` paper glows and blooms; unlit paper is lit only by the scene. |
| `Lantern` | uniform scale | `kind` (`'hanging'` or `'standing'`), `cord`, `intensity`, `flicker`, `phase` | Emissive paper and one point light (distance 6, decay 2). A flickering lantern varies its light and paper glow together; `phase` keeps neighbours out of step. |
| `Railing` | `[height, postWidth]` | `length` | Evenly spaced posts, a wide top rail and a lower rail; end posts rise above the rail with a cap |
| `TatamiFloor` | `[width, depth]` | | Rounded to ~0.91 m half-mat cells. Mats follow the traditional rule (no point where four mats meet), with dark cloth borders on the long sides only. A 3 × 3 cell room gets the classic 4.5-mat pinwheel. |
| `Roof` | `[width, rise, length]` | | A gabled temple roof: a concave profile with a small upturn at the eave tips, extruded along the ridge and then bent so the corners sweep up. Tiles on top, cedar underneath and on the gable ends, plus a ridge cap with end blocks. |

How it stays cheap:

- **Shared textures** (`textures.ts`), drawn once on canvas: cedar grain (long wavy streaks and pores), tatami rush, washi paper fibres and roof tiles. All tile seamlessly.
- **Shared materials** (`materials.ts`): one per surface type, created once and reused by every piece. The only per-instance material is the paper of a flickering lantern, a clone that shares the same shader program.
- **Merged geometry**: each piece's static boxes are merged into one mesh per material (all floorboards are one draw call, all tatami mats another, a whole railing one). Lantern frames are built once per kind and shared by every lantern.
- **World-scaled UVs** (`texturedBox` in `geometry.ts`): texture density stays constant whatever the size, and the grain follows each piece's long axis.
- Derived tones (straw, tile charcoal, border cloth) are blends of two palette colors (`src/lib/color.ts`), so no new hex values.

### The Gate and the intro

The opening scene, built from the kit in `src/world/segments/Gate.tsx`. The player faces -Z. All dimensions live in `src/world/segments/gate/layout.ts`.

- **Bridge** (`gate/Bridge.tsx`): an 18 m long, 3 m wide bridge over the void. Boards run across it on two stringers. It has railings on both sides and pairs of piers every few meters that drop into the fog. A pair of standing lanterns at its head gives the first pool of warm light.
- **Landing** (`gate/Landing.tsx`): a 16 × 9 m platform with deep edge beams, railings around it and four tall corner piers.
- **Gate house** (`gate/GateHouse.tsx`): a two-story gate.
  - Lower story: closed central doors, with glowing shoji and lit transoms on both sides.
  - Two large hanging lanterns, either side of the doors.
  - A balcony with railings and bracket beams, then an upper story that is lit shoji all across.
  - A band of stacked beams under the large curved kit `Roof`, which has swept-up corners.
  - A hidden fill light, standing in for the upper shoji's glow, lights the balcony and the eaves soffit.
- **Sliding doors** (`gate/SlidingDoors.tsx`): two heavy board leaves on a sill and head rail. A bright plane behind them shows through the center slit, the gaps between boards and the gaps at the top and bottom, and those lines bloom. A small spill light and an additive streak on the floor (`gate/DoorLightSpill.tsx`, a canvas mask) carry the leak out onto the landing.
- **Shoji bays** (`gate/ShojiBay.tsx`): a row of `ShojiPanel`s filling a bay, with an optional dividing beam and a lit transom above it.
- **Back glow** (`gate/GateBackGlow.tsx`): a faint warm haze far behind the gate (additive, outside the fog). It lifts the black just enough for the roof's curve to read as a silhouette.
- **Distant pagodas** (`src/scene/Pagoda.tsx`): two five-story towers, far out to the left and right.
  - Square stories narrow toward the top. Each has a lathed, squared-off hip roof with upturned corners and a faint warm underside, and a spire with nine rings crowns the tower.
  - Every story has a grid of windows on all four sides, most of them lit, chosen by a seeded random pattern.
  - Each tower costs three draw calls: the body, the roofs and the windows (instanced). All three use unlit materials.
- **Distant haze** (`src/scene/distantHaze.ts`): a material patch for far scenery.
  - It swaps the normal fog for a thinner one: the scene's live `FogExp2` density × 0.5, in the same color.
  - It adds a fog bank by world height, so the pagodas stay faintly visible and their bases sink into the fog.
  - Near objects keep the normal fog.
- **Lights:** 6 point lights (2 bridge lanterns, 2 gate lanterns, the door spill and the upper fill; none on the pagodas) plus a very faint warm hemisphere fill.
- **Intro** (`src/scene/IntroCameraRig.tsx`): after **Enter**, the camera starts 24 m back over the void, slightly high and tilted down. It dollies to the start of the bridge at eye height over 5 s (GSAP, `power2.out`). The move starts after a few warm-up frames, so shader compilation doesn't eat into it. When it arrives, it sets `introComplete` in `useGameStore`.
- **Intro text** (`src/ui/IntroOverlay.tsx`): once `introComplete` is set, **YOU HAVE BEEN SUMMONED.** fades in at the center (uppercase, widely letter-spaced, opening up slightly as it appears). Then a small **SCROLL TO ENTER** label fades in below it, over a thin vertical line that keeps drawing downward and fading. A soft dark pool behind the text keeps it readable over the lit shoji.
- **Reduced motion:** the camera starts at the bridge and the text appears without animation.
- When the camera arrives, `Player` takes over (see **Movement**). Once you have walked about 0.6 m, the intro text fades out and stays gone.

**How to test:** run `npm run dev`, click **Enter the castle**, and check that:

1. The scene fades in from far back. The gate is small and hazy, and the pagodas are barely there. The camera glides forward, fast at first and then slowing, and comes to rest at the start of the bridge about 5 s later.
2. From the bridge: the two floor lanterns light the first planks and the railings, the middle of the bridge falls into darkness, and the gate glows at the end.
3. At the gate:
   - The lower shoji and transoms glow, and the two hanging lanterns flicker out of step.
   - Thin lines of light leak through the closed doors, and a warm streak spreads across the floor in front of them.
   - The balcony railing, the upper shoji and the curved roof with upturned corners read against a faint warm haze.
4. Left and right, far off: the pagodas show grids of lit windows and a few dark ones. Their lower stories fade into fog.
5. After the camera stops, **YOU HAVE BEEN SUMMONED.** fades in, then **SCROLL TO ENTER** with its pulsing line. Scrolling walks you onto the bridge and the text fades away.
6. With reduced motion turned on in the OS, the scene opens at the bridge and the text is already there.

### Movement

Scroll-driven walking along a path, in `src/scene/Player.tsx`.

- **The path:** the world provides a `CatmullRomCurve3` at floor level. For the Gate it is `GATE_PATH` (`src/world/segments/gate/path.ts`, points in `layout.ts`). It runs straight from the bridge head, where the intro stops, to the foot of the bridge, about 3.4 m from the doors, so the whole doorway fits in view. It is 18.5 m long. The canvas passes it to `<Player path={…} />`.
- **The store** (`src/state/usePlayerStore.ts`): `targetProgress` is where input wants you to be and `progress` is where you are, both in meters along the path. It also holds `speed` (m/s) and `pathLength`. `walkBy(meters)` moves the target. The target is kept between the start and the end of the path, and at most 8 m from the player, so a huge flick can't queue up a long run. Progress can never go below the start.
- **Input** (`src/scene/player/usePlayerInput.ts`):
  - Wheel, swipe and Space move the target straight away.
  - Held W / S / ↑ / ↓ push the target along at 1.5 m/s.
  - Drag deltas and the mouse position go into a small mutable object that `Player` reads each frame.
  - Nothing responds until the intro has finished.
  - Wheel deltas are normalised from lines and pages to pixels. One 100 px notch is about one step (0.8 m).
- **Smoothing:** each frame a goal eases toward the target, and progress follows the goal with a critically damped spring capped at 3.6 m/s. So speed and acceleration both change smoothly: no jitter when wheel ticks arrive unevenly, and no lurch on the first tick. Scrolling faster pushes the target further ahead, and the player speeds up into a run. Above 2.4 m/s counts as running.
- **Camera:** on the path at 1.6 m eye height. Yaw and pitch come from the path tangent (a finite difference with scratch vectors, since `getTangentAt` allocates). The drag look and the mouse look-around are added on top, with no roll except the bob's. The intro ends exactly at the path start facing down it, so the hand-over doesn't jump.
- **Head-bob:** tied to distance walked, not time. The head is lowest at each footfall (one dip per step), and there is a slight sideways sway and roll once per stride. The bob fades in with speed: about 2.8 cm at walking pace, rising to 5 cm at a run, and fading to nothing when you stop.
- **Footsteps** (`src/state/footsteps.ts`): `onFootstep(listener)` hears each step: `{ foot, speed, running, progress }`. A step comes every 0.8 m walked, forward or back, and the first one comes after half a step. Audio will hook in at step 16.
- **Look:**
  - Drag (mouse, a sideways swipe, or two fingers) turns the view, within ±60° yaw, +30° / −40° pitch.
  - While you walk and aren't dragging, the view eases back to center, settling in about 1 s.
  - On desktop (`hover: hover` and `pointer: fine`), the view also leans toward the mouse: at most 4° from center, slightly less vertically. It is held still during a drag and eases back when the mouse leaves the window.
- **Reduced motion:** no head-bob and no mouse look-around. Walking and drag look work as usual.
- **Performance:** no allocations in the frame loop. The store is written once per frame only while something is moving, and it stops when you're still. No React component subscribes to `progress` directly: the intro overlay uses `subscribe` and the dev panel uses `getState`.
- **Dev panel:** a **Player** folder shows live progress, a speed graph and a footstep count.
- Every feel number (speeds, smoothing, bob, look limits, sensitivities) is in `src/scene/player/tuning.ts`.

**How to test:** run `npm run dev`, click **Enter the castle**, wait for the intro to finish, and check that:

1. Scrolling before the camera arrives does nothing.
2. One wheel notch moves you about a step forward, with a gentle start and stop. Scrolling up at the start does nothing (you can't go behind the start).
3. Scrolling steadily walks you across the bridge with a soft bob. Scrolling hard makes the speed graph in **Dev → Player** climb and flatten at about 3.6 m/s, the bob gets stronger, and when you stop scrolling you glide to a halt.
4. Holding **W** or **↑** walks at a steady pace and **S** or **↓** walks back. **Space** takes one stride (two footsteps in the counter) and **Shift+Space** takes one back.
5. At the end of the bridge you stop, with the whole doorway in view. Scrolling further does nothing.
6. Dragging turns the view and stops at the limits. Start walking and the view eases back to center within about a second.
7. Without dragging, moving the mouse to a screen edge leans the view slightly that way.
8. The footstep counter goes up about every 0.8 m (about 23 steps over the whole path).
9. In DevTools device mode with touch: swiping up walks, a quick flick carries on a little, swiping down walks back, and a sideways swipe or two-finger drag looks around.
10. With reduced motion turned on, the walk has no bob.

### The guide scroll

A hanging paper scroll that explains the castle, in `src/ui/GuideScroll.tsx`. It opens by itself the first time you try to walk at the gate, and later from the **GUIDE** button.

- **Look:** parchment from layered CSS gradients (edge darkening, a few warm stains, a cream body) with fine fractal noise multiplied over it. Cedar rollers top and bottom with brass end caps, and a cord up to a brass nail above the top roller. Two faded vermilion seals (`src/ui/guide/InkStamp.tsx`, SVG with turbulence filters for rough edges and dry patches) sit in the bottom-right corner. All colors are palette variables or blends of two.
- **Unrolling** (GSAP, 0.9 s, `power2.inOut`): the rollers start together in the middle and move apart while the paper is revealed between them. The paper's `clip-path` is driven by one CSS variable (`--unrolled`, 0 to 1) and the rollers by `transform`, so nothing reflows. The grain on the rollers slides as they move, so they look like they turn. Closing plays the same move back to the middle, then fades out. Opening or closing partway through picks up from where the scroll is.
- **Content** (all the words are in `src/ui/guide/content.ts`):
  - 無限城 in vermilion, with **THE ENDLESS CASTLE · A GUIDE** under it.
  - Four underlined tabs. The selected one is darker with a heavier underline.
  - **The Castle:** a lore paragraph with a vermilion drop cap, a **WHAT LIES INSIDE** line of area names separated by middle dots, and *There is no exit.*
  - **Moving:** two columns of key caps (SCROLL / W / ↑, SPACE, S / ↓, A D ← →, Q E, DRAG, CLICK, ESC), each with a one-line description, plus a note for touch screens. A D ← →, Q E and CLICK describe controls that later steps will add (junctions in step 12, the figures in step 14). They don't do anything yet.
  - **Hidden Ones:** six numbered slots read from `useFigureStore`. Unfound slots show **?** in a dashed circle and found ones show 見 in a vermilion ring, with a count below.
  - **Signs:** the four omens (the guttering lantern, a bell with no bell, a shadow on the paper, the vermilion door) and what each one means. Step 15 will make them happen in the world.
  - **ACCEPT THE SUMMONS**, a vermilion rectangular button, rolls it up.
- **While it is open:**
  - `guideOpen` is set in `useGameStore`.
  - Player input is paused: wheel, keys, drag and swipe are ignored, held keys are released, and any drag in progress is dropped.
  - The canvas dims and blurs (`.castle-canvas--dimmed`, toggled from a store subscription, so the 3D scene never re-renders). The intro text sinks back with it.
  - The **GUIDE** button hides.
  - Input comes back as soon as the scroll starts rolling up.
- **The first time:** in `usePlayerInput`, the first attempt to walk (wheel, W / ↑, Space, or a vertical swipe) opens the guide and is swallowed, so you don't move. After that, walking works normally.
- **Accessibility:**
  - It is a modal dialog with focus kept inside.
  - The tabs follow the ARIA tabs pattern: arrow keys, Home and End.
  - Focus goes to the selected tab on open, and back to the **GUIDE** button (if that opened it) on close.
  - With reduced motion, it fades in and out without unrolling.
- **Small screens:** the paper is at most 34 rem wide and fits the viewport with a 16 px gutter. The panel scrolls inside the paper and fades at its bottom edge. Below 480 px wide, the key caps stack in one column. On short landscape screens, the header shrinks to one row.

**How to test:** run `npm run dev`, click **Enter the castle**, wait for the intro to finish, and check that:

1. The first scroll doesn't move you (**Dev → Player → progress** stays at 0). Instead, the two rollers appear together in the middle and unroll the paper over about a second, while the castle behind dims and blurs.
2. Scrolling, holding **W** or dragging while the scroll is open does nothing.
3. The four tabs switch content, by click or with ← → once a tab has focus. **The Castle** has the red drop cap and *There is no exit.* at the end.
4. In **Dev → Guide**, click **find a figure** twice: on **Hidden Ones**, slots 1 and 2 turn into vermilion rings, and the count reads **2 of 6 found**.
5. **Esc** rolls the scroll back up into the middle and the castle comes back into focus. Scrolling now walks.
6. The **GUIDE** button (top left) opens it again. **Accept the summons** closes it, and focus returns to the button.
7. In DevTools device mode at 375 × 667 and 667 × 375: the scroll fits with no sideways scrolling, and the panel scrolls inside the paper.
8. With reduced motion turned on, the scroll fades in and out instead of unrolling.

### Kit dev view (`?kit`)

Open <http://localhost:5173/?kit> in `npm run dev` to skip the title screen and see every piece in a row along X, each under its own hanging lantern, with OrbitControls, the usual fog, stars and post-processing, and the Dev panel. The buttons at the bottom (or ← →) glide the camera between pieces with GSAP. `?kit&focus=3` opens on the fourth piece. Like the Dev panel, the view only exists in dev builds and isn't in the production bundle.

**How to test:** run `npm run dev`, open `/?kit`, and step through the pieces:

1. **Wood beam / Post:** long red-brown grain streaks running along the beam and up the post.
2. **Floor planks:** staggered boards with dark gaps, and a bright polished hot spot under the lantern that moves as you orbit.
3. **Shoji:** the left panel glows cream and blooms, with the lattice in silhouette; the right panel is unlit paper. Orbit behind them: both read from the back too.
4. **Lanterns:** a hanging box lantern and a standing andon, both flickering gently and out of step with each other.
5. **Railing:** posts, top rail and lower rail, with capped end posts.
6. **Tatami:** an eight-mat room with dark borders on the long edges only. No point has four mat corners meeting.
7. **Roof:** a tiled roof with curved slopes and upturned corners; orbit underneath to see the cedar soffit.

## Project structure

```
index.html              Google Fonts, root element
src/
  main.tsx              Entry point; applies the palette to CSS variables
  App.tsx               Shows the title screen, then the 3D canvas and intro overlay (+ dev panel in dev); ?kit opens the kit view
  index.css             Global styles, font variables, .kanji and .label classes
  lib/
    palette.ts          The only source of colors (also exposed as --color-* CSS variables)
    color.ts            Blends of two palette colors (three Color or CSS string)
    random.ts           Seeded PRNG (mulberry32) for stable procedural layouts
    math.ts             clamp, smoothstep, damp, smoothDamp (critically damped spring)
  state/
    useGameStore.ts     zustand store (soundEnabled, introComplete, guideOpen, guideSeen)
    useFigureStore.ts   Which of the six hidden figures have been found
    usePlayerStore.ts   Progress along the path: target, smoothed progress, speed, path length, walkBy()
    footsteps.ts        Footstep events (onFootstep / emitFootstep), for audio later
    useAtmosphereStore.ts  Fog and bloom values (+ defaults), written by the dev panel
  ui/
    TitleScreen.tsx     Title overlay: layout, intro fade, enter and fade-out logic
    TitleScreen.css
    InkEmblem.tsx       Procedural vermilion brush-stroke circle (SVG)
    Smoke.tsx           Drifting smoke background
    Smoke.css
    DevPanel.tsx        leva panel for fog and bloom, player monitors and guide / figure buttons (dev builds only)
    IntroOverlay.tsx    "You have been summoned." and the "Scroll to enter" hint, after the intro; fades once you walk
    IntroOverlay.css
    GuideScroll.tsx     The guide: hanging scroll, unroll / roll-up timeline, tabs, focus trap, Esc
    GuideScroll.css     Parchment, rollers, brass caps, stamps, tab content
    GuideButton.tsx     GUIDE button, top left, once the guide has been seen
    GuideButton.css
    guide/
      content.ts        Every word in the guide: tabs, lore, areas, key bindings, omens
      CastlePanel.tsx   The Castle tab
      MovingPanel.tsx   Moving tab (key caps in two columns)
      HiddenOnesPanel.tsx  Hidden Ones tab (six slots)
      SignsPanel.tsx    Signs tab (the four omens)
      InkStamp.tsx      Faded vermilion seal (SVG with rough, dry-ink filters)
    KitOverlay.tsx      Kit view overlay: heading, controls hint, piece buttons, ← → keys
    KitOverlay.css
  scene/                3D components (R3F)
    CastleCanvas.tsx    The <Canvas>: renderer settings, camera, scene contents
    CastleCanvas.css    Full-screen layer behind the UI, fade-in
    Atmosphere.tsx      Void background and FogExp2
    Starfield.tsx       Twinkling star sphere (shader points)
    DriftingMotes.tsx   Rising, self-recycling particles (used for dust and embers)
    PostEffects.tsx     Bloom, tone mapping, vignette, grain
    IntroCameraRig.tsx  GSAP dolly from far back to the start of the bridge
    Player.tsx          First-person walker: smoothing, camera on the path, head-bob, look, footsteps
    player/
      tuning.ts         Every movement and look constant (eye height, speeds, bob, limits)
      usePlayerInput.ts Wheel, keys, mouse drag, touch swipe and mouse look-around
    Pagoda.tsx          Distant multi-story pagoda with lit window grids
    distantHaze.ts      Thinner fog + low fog bank for far scenery (material patch)
    renderer.ts         WebGL settings shared by every canvas
    KitView.tsx         ?kit dev view: every kit piece in a row, each under a lantern
    KitCameraRig.tsx    OrbitControls + GSAP glide between kit pieces
    kitExhibits.ts      Kit view stops: names, orbit targets, camera offsets
    kit/                The building kit
      types.ts          Vec3 and the shared position / rotation / seed props
      textures.ts       Canvas textures: cedar grain, tatami, washi paper, roof tiles
      materials.ts      Shared materials (create once, never dispose)
      geometry.ts       texturedBox (world-scaled UVs), merging, seeds, shared unit plane
      useDisposable.ts  useMemo for geometry that disposes the old one
      WoodBeam.tsx      Horizontal beam
      Post.tsx          Vertical post
      FloorPlanks.tsx   Polished floorboards with gaps
      ShojiPanel.tsx    Frame, lattice and glowing paper
      Lantern.tsx       Hanging and standing lanterns with a flickering point light
      Railing.tsx       Posts, top rail, lower rail
      tatamiLayout.ts   Traditional tatami layout search (no four-corner meetings)
      TatamiFloor.tsx   Tatami mats with dark borders
      Roof.tsx          Curved, extruded temple roof with upturned corners
  world/                Level generation
    segments/
      Gate.tsx          The opening scene: bridge, landing, gate, back glow, pagodas
      gate/
        layout.ts       Every dimension of the opening, the walking path's points and the intro camera path
        path.ts         GATE_PATH: the walkable CatmullRomCurve3 across the bridge
        Bridge.tsx      Bridge deck, stringers, railings, piers, head lanterns
        Landing.tsx     The platform the gate stands on
        GateHouse.tsx   The two-story gate: posts, shoji, balcony, upper story, roof
        ShojiBay.tsx    A bay of shoji panels with an optional lit transom
        SlidingDoors.tsx  Closed board doors with light leaking through
        DoorLightSpill.tsx  Additive light streak on the floor in front of the doors
        GateBackGlow.tsx  Faint warm haze behind the roof
  audio/                Sound
```

Style rules, palette and conventions are in [CLAUDE.md](CLAUDE.md).

## Progress

- [x] 1. Project setup and style rules
- [x] 2. Title screen
- [x] 3. Canvas, atmosphere and post-processing
- [x] 4. Building kit
- [x] 5. The Gate and the intro
- [x] 6. Movement
- [x] 7. The guide scroll
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
