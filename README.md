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
| Title screen | Click **Enter the castle**  | Enter with sound on: the audio starts on this click, and the wind and drone fade in |
| Title screen | Click **Enter in silence**  | Enter with sound off (turn it on later with the HUD toggle) |
| Title screen | Tab / Enter / Space         | Move between the buttons and choose one (the main button has focus on load) |
| The Gate     | (none)                      | The intro plays by itself. Walking and looking unlock when the camera arrives. |
| The Gate     | Walk toward the doors       | About 9 m out, the heavy doors swing open. Walk through the gate house and on into the castle. |
| Walking      | Mouse wheel / trackpad scroll | Walk forward (down) or back (up). Scroll faster to run, up to a top speed. |
| Walking      | W / S, ↑ / ↓ (hold)         | Walk forward / back at a steady pace |
| Walking      | Space / Shift+Space         | One stride (1.6 m, two steps) forward / back |
| Walking      | Touch: swipe up / down      | Walk forward / back. A quick flick carries on a little after you lift your finger. |
| Looking      | Mouse drag                  | Look around (drag the world: drag right to turn left). Limited to ±60° sideways, 30° up, 40° down. |
| Looking      | Touch: swipe sideways, or two-finger drag | Look around. A one-finger swipe picks walk or look by its first direction. |
| Looking      | Move the mouse (desktop)    | The view leans up to 4° toward the pointer |
| The Gate     | First scroll (or W / ↑ / Space / swipe) | Opens the guide scroll instead of walking. Happens once. |
| Guide        | **案内 GUIDE** button, bottom right | Opens the guide again |
| HUD          | **SOUND ON / OFF**, bottom right | Turn sound on or off (the equalizer bars dance while it is on). Sound fades out in about 0.3 s, then the audio is paused to save the CPU. |
| Guide        | (while it is open)          | Every sound is muffled, as if heard through the paper |
| Guide        | Click a tab, or ← → / Home / End on the tabs | Switch between The Castle, Moving, Hidden Ones and Signs |
| Guide        | Esc, or **Accept the summons** | Roll the scroll back up |
| Guide        | Tab / Shift+Tab             | Move between the tabs, the text and the button (focus stays inside the scroll) |
| The Fall     | Walk off the end of the first Threshold | THE FALL plays by itself. Walking and looking are locked until you land: scrolling, keys, drags and swipes do nothing, and can't slow it. |
| After the Fall | Walk back (S / scroll up) | You stop at the landing: the way back up is gone. |
| Forking Hall / Crossroads | (arrive) | The walk stops just short of the middle of the hall, and three round buttons **← ● →** appear at the bottom of the screen |
| Forking Hall / Crossroads | A / ←, or click **←** | Turn left: the camera swings round to the left doorway in 0.8 s, and you're carried a step into the turn |
| Forking Hall / Crossroads | D / →, or click **→** | Turn right, the same way |
| Forking Hall / Crossroads | W / ↑ / Space, a fresh scroll forward, or click **●** | Go straight on (the scroll that brought you to the middle doesn't count: scroll again) |
| Forking Hall | After choosing | The doors of the two ways you didn't take slide shut. The way you came in stays open. |
| Stairwell | (arrive) | You stop on the deck where the stairs split, and **↑ ↓** buttons appear |
| Stairwell | E, or click **↑** | Take the flight up: you're carried across the deck to its foot, then walk (scroll / W) up it |
| Stairwell | Q, or click **↓** | Take the flight down, the same way |
| At a fork | Walk back (S / scroll up) | The buttons go; walk back in to bring them back. After choosing, you can still walk back round the turn or down the stairs and out the way you came. |
| Inverted Chamber | Walk in | A few steps in, the view rolls over in about 3 s and you walk on the ceiling among the furniture. Dragging still turns the view the way you drag. About 5.5 m before the far door it rolls back (faster if you're running), so you're upright at the door. Walking back out the way you came rolls you back too. |
| Central Abyss | Walk the bridge, drag to look | One long bridge across the void. Look up, down and sideways at the towers. |
| Anywhere past the Fall | Stand still for 2 s | A biwa string is plucked: the rooms ahead shift (see *Special chambers*). Once per stop: walk again before it can happen again. Not while you're stopped at a fork. |
| Anywhere past the Fall | (walking) | Now and then (about once every 90 s of walking, never within 12 s of the last), the rooms shift by themselves |
| Room shift | (during it, about 2 s) | You can walk inside the room you're in, but not out of it until the new rooms have landed |
| Castle (dev only) | **Dev → Special → inverted chamber** / **central abyss** | Rebuild the rooms ahead so the next one is that chamber, and teleport to 1.2 m before its door |
| Castle (dev only) | **Dev → Special → biwa (room shift)** | Shift the rooms where you stand. **biwa events** counts biwa events and shows why the last one came; **camera roll** shows the Inverted Chamber's roll. |
| Castle (dev only) | **Dev** panel, top right | Drag the sliders to tune fog density and bloom. Click the panel title to collapse it. |
| Hidden figures | Look at one: keep it near the middle of the view, within 60 m, for 1 s | Found: its circle fills, the **FOUND** card shows its number and name, it says its first line, and progress is saved |
| Hidden figures | Click one (a press without dragging) | Finds it. If it is found already, its card shows again and it says its next line. Nothing behind a wall counts. |
| After the sixth figure | (none) | The finale plays by itself: walking and looking are locked, every light turns red, a last line appears, and the screen fades back to the title |
| Castle (dev only) | **Dev → Guide → open** | Opens the guide |
| Castle (dev only) | **Dev → Figures** | **found** and **mounted** (each mounted figure's distance and gaze time) monitor them. **always appear** puts every figure in every room of its area. **go to next hidden** ticks it, builds the first unfound figure's area as the next room and puts you at its door. **find next** finds the next figure at once (card, line, save; the sixth starts the finale). **reset figures** clears them and the saved progress. |
| Anywhere | Walk within about 40 m of a hidden figure you haven't found | Its presence builds over a few seconds: the view darkens and drains of color, its rim waves and splits into red and blue fringes, and a dark ripple rolls across the view every few seconds from the figure's side. Stronger the closer you get, through walls too. It drops away as soon as you find the figure. |
| Anywhere | (walking) | Now and then (every 12–28 s) a lantern near you and on screen gutters: it flickers hard and dims for about a second. Far more often near a hidden figure. |
| Castle (dev only) | **Dev → Signs** | **presence** shows the strength, which figure and how far, and the heartbeat's rate. **events** counts each sign and shows the last. **force presence** holds the presence at a strength without a figure (0 gives it back to the figures). **ripple** rolls a ripple now. **gutter a lantern** gutters one near you now. |
| Castle (dev only) | **Dev → Audio** | **context** shows the audio state (*locked* before the first Enter click, then *running* or *suspended*). The buttons play each sound by itself, with sound on: a walking or running step, a shoji opening or shutting and the gate doors (from the front right), a lantern crackle (front right), the biwa without a shift, one heartbeat, a ripple swell, a shift rumble, and the Fall's sound without the Fall. |
| Castle (dev only) | **Dev → HUD** | **show subtitle** cycles through three sample lines, **toggle sound** flips the sound toggle |
| Castle (dev only) | **Dev → World → skip to next segment** | Teleport to just past the start of the next segment |
| Castle (dev only) | **Dev → World → next kind** | Make every segment generated from now on a given kind, including The Forking Hall, The Crossroads, The Stairwell, The Inverted Chamber and The Central Abyss (the 3 already built ahead come first: skip 4 times to reach it). While a kind is forced, the junction schedule is off. |
| Castle (dev only) | **Dev → World → forking hall** | How many rooms until the next Forking Hall is due |
| Castle        | `?seed=123` in the URL      | Build the castle from that seed (the same seed always builds the same castle). Without it, every visit builds a new one. |
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
- **Post-processing:** Bloom (mipmap blur, threshold 0.6, intensity 1.2) → ACES tone mapping → Vignette (darkness 0.7) → film grain (Noise, opacity 0.04). (Since step 15 the presence's warp comes first and its grade sits after tone mapping; see *Signs and presence*.) The scene renders into a half-float buffer, so emissive values above 1 reach the bloom intact.
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
| `Lantern` | uniform scale | `kind` (`'hanging'` or `'standing'`), `cord`, `intensity`, `flicker`, `phase` | Emissive paper and a warm light (distance 6, decay 2) borrowed from the light pool (see **The endless castle**). A flickering lantern varies its light and paper glow together; `phase` keeps neighbours out of step. |
| `Railing` | `[height, postWidth]` | `length` | Evenly spaced posts, a wide top rail and a lower rail; end posts rise above the rail with a cap |
| `TatamiFloor` | `[width, depth]` | `glow` | Rounded to ~0.91 m half-mat cells. Mats follow the traditional rule (no point where four mats meet), with dark cloth borders on the long sides only. A 3 × 3 cell room gets the classic 4.5-mat pinwheel. |
| `Roof` | `[width, rise, length]` | | A gabled temple roof: a concave profile with a small upturn at the eave tips, extruded along the ridge and then bent so the corners sweep up. Tiles on top, cedar underneath and on the gable ends, plus a ridge cap with end blocks. |
| `HangingScroll` | `[width, height]` | | A vermilion silk mounting round a pale paper panel, a thin top rod and a heavier bottom roller, on a short cord. `position` is the hook. Faces +Z. |

`TatamiFloor`'s `glow` makes the mats faintly self-lit (the Threshold's runner).

Instanced and merged versions, for pieces that repeat. Each takes a list of placements (`position`, plus optional `yaw`, `pitch` and `scale`):

| Piece | What it draws | Draw calls |
| ----- | ------------- | ---------- |
| `KitInstances` | Any shared geometry and material, once per placement. Matrices are written once; the bounding sphere covers every copy. | 1 |
| `BoxInstances` | Identical cedar boxes (posts, planks, battens, rails, brackets, cords) with the kit's world-scaled grain. `anchor="base"` for posts. Any material. | 1 |
| `MergedBoxes` | One-off boxes of all sizes (beams, sills, slabs, fascias) merged into one mesh. Any material (cedar by default, vermilion lacquer for the corridor portals). | 1 |
| `ShojiInstances` | A wall's worth of identical shoji panels: frames, lit paper, unlit paper | 3 |
| `LanternInstances` | A row of identical lanterns: frames, paper, cords. Each flickers out of step through a per-instance `instanceGlow` attribute read by a patched paper material, and registers its light with the pool. | 3 |

New shared materials: vermilion lacquer, vermilion scroll silk, earthen plaster (tsuchikabe), glowing tatami, and the instanced lantern paper.

How it stays cheap:

- **Shared textures** (`textures.ts`), drawn once on canvas: cedar grain (long wavy streaks and pores), tatami rush, washi paper fibres and roof tiles. All tile seamlessly.
- **Shared materials** (`materials.ts`): one per surface type, created once and reused by every piece. The only per-instance material is the paper of a flickering lantern, a clone that shares the same shader program.
- **Instancing** for repeated pieces (see the table above), and **merging** for one-off boxes: a whole segment is 10 to 20 draw calls whatever its length.
- **Merged geometry**: each piece's static boxes are merged into one mesh per material (all floorboards are one draw call, all tatami mats another, a whole railing one). Lantern frames are built once per kind and shared by every lantern.
- **World-scaled UVs** (`texturedBox` in `geometry.ts`): texture density stays constant whatever the size, and the grain follows each piece's long axis.
- Derived tones (straw, tile charcoal, border cloth, plaster) are blends of two palette colors (`src/lib/color.ts`), so no new hex values.
- **No real lights in the kit**: lanterns register light sources with a fixed pool of point lights (`src/scene/lighting/`), so mounting and unmounting pieces never changes the light count and never recompiles a shader.

### The Gate and the intro

The opening scene, built from the kit in `src/world/segments/Gate.tsx`. It is segment 0 of the endless castle (see below). The player faces -Z. All dimensions live in `src/world/segments/gate/layout.ts`.

- **Bridge** (`gate/Bridge.tsx`): an 18 m long, 3 m wide bridge over the void. Boards run across it on two stringers. It has railings on both sides and pairs of piers every few meters that drop into the fog. A pair of standing lanterns at its head gives the first pool of warm light.
- **Landing** (`gate/Landing.tsx`): a 16 × 9 m platform with deep edge beams, railings around it and four tall corner piers. The back railing leaves a 4 m gap where the first Threshold carries on.
- **Gate house** (`gate/GateHouse.tsx`): a two-story gate.
  - Lower story: heavy central doors, with glowing shoji and lit transoms on both sides. A doorway through the back wall, behind the doors, leads on.
  - Two large hanging lanterns, either side of the doors.
  - A balcony with railings and bracket beams, then an upper story that is lit shoji all across.
  - A band of stacked beams under the large curved kit `Roof`, which has swept-up corners.
  - A hidden fill light, standing in for the upper shoji's glow, lights the balcony and the eaves soffit.
- **Gate doors** (`gate/GateDoors.tsx`): two heavy board leaves on a sill and head rail. A bright plane behind them shows through the center slit, the gaps between boards and the gaps at the top and bottom, and those lines bloom. A small spill light and an additive streak on the floor (`gate/DoorLightSpill.tsx`, material and canvas mask in `gate/doorSpillMaterial.ts`) carry the leak out onto the landing. When the player is about 9 m away, both leaves swing inward on their outer hinges (GSAP, 2.6 s, one leaf a beat behind the other) while the light behind them and the streak fade away. With reduced motion, or if the Gate remounts behind a player walking back, they are simply open.
- **Shoji bays** (`gate/ShojiBay.tsx`): a row of `ShojiPanel`s filling a bay, with an optional dividing beam and a lit transom above it.
- **Back glow** (`gate/GateBackGlow.tsx`): a faint warm haze far behind the gate (additive, outside the fog). It lifts the black just enough for the roof's curve to read as a silhouette. It fades out as the player walks through the gate, long before the walk reaches its plane.
- **Distant pagodas** (`src/scene/Pagoda.tsx`, placed by `src/world/Backdrop.tsx`, which never unmounts): two five-story towers, far out to the left and right.
  - Square stories narrow toward the top. Each has a lathed, squared-off hip roof with upturned corners and a faint warm underside, and a spire with nine rings crowns the tower.
  - Every story has a grid of windows on all four sides, most of them lit, chosen by a seeded random pattern.
  - Each tower costs three draw calls: the body, the roofs and the windows (instanced). All three use unlit materials.
- **Distant haze** (`src/scene/distantHaze.ts`): a material patch for far scenery.
  - It swaps the normal fog for a thinner one: the scene's live `FogExp2` density × 0.5, in the same color.
  - It adds a fog bank by world height, so the pagodas stay faintly visible and their bases sink into the fog.
  - Near objects keep the normal fog.
- **Lights:** 6 light sources (2 bridge lanterns, 2 gate lanterns, the door spill and the upper fill; none on the pagodas), lit through the light pool, plus a very faint warm hemisphere fill (in `Backdrop`).
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
7. Walk on across the bridge: about 9 m before the doors they swing slowly inward, the light behind them fades, and the gate house's back doorway shows the Threshold's lanterns beyond. The haze behind the roof fades as you go through.

### Movement

Scroll-driven walking along a path, in `src/scene/Player.tsx`.

- **The path:** the world provides a `WalkPath` (`src/scene/player/walkPath.ts`): a point at floor level for any distance along the walk. It is the endless castle's `WorldPath` (see below), which starts at the bridge head, where the intro stops, and runs on through every generated segment. The canvas passes it to `<Player path={…} />`.
- **The store** (`src/state/usePlayerStore.ts`): `targetProgress` is where input wants you to be and `progress` is where you are, both in meters along the walk. It also holds `speed` (m/s) and the walkable stretch, `pathStart` … `pathEnd`, which the world keeps up to date. `walkBy(meters)` moves the target. The target is kept inside the walkable stretch, and at most 8 m from the player, so a huge flick can't queue up a long run. `jumpTo(progress)` (dev tools) teleports: the player snaps there without walking or footsteps.
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
5. The walk doesn't stop at the doors: it carries on through the gate into the castle, and never ends.
6. Dragging turns the view and stops at the limits. Start walking and the view eases back to center within about a second.
7. Without dragging, moving the mouse to a screen edge leans the view slightly that way.
8. The footstep counter goes up about every 0.8 m (about 23 steps across the bridge).
9. In DevTools device mode with touch: swiping up walks, a quick flick carries on a little, swiping down walks back, and a sideways swipe or two-finger drag looks around.
10. With reduced motion turned on, the walk has no bob.

### The guide scroll

A hanging paper scroll that explains the castle, in `src/ui/GuideScroll.tsx`. It opens by itself the first time you try to walk at the gate, and later from the **案内 GUIDE** button in the HUD.

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
  - The HUD sinks back with the canvas and is inert, so its buttons are out of reach.
  - Input comes back as soon as the scroll starts rolling up.
- **The first time:** in `usePlayerInput`, the first attempt to walk (wheel, W / ↑, Space, or a vertical swipe) opens the guide and is swallowed, so you don't move. After that, walking works normally.
- **Accessibility:**
  - It is a modal dialog with focus kept inside.
  - The tabs follow the ARIA tabs pattern: arrow keys, Home and End.
  - Focus goes to the selected tab on open, and back to the **案内 GUIDE** button (if that opened it) on close.
  - With reduced motion, it fades in and out without unrolling.
- **Small screens:** the paper is at most 34 rem wide and fits the viewport with a 16 px gutter. The panel scrolls inside the paper and fades at its bottom edge. Below 480 px wide, the key caps stack in one column. On short landscape screens, the header shrinks to one row.

**How to test:** run `npm run dev`, click **Enter the castle**, wait for the intro to finish, and check that:

1. The first scroll doesn't move you (**Dev → Player → progress** stays at 0). Instead, the two rollers appear together in the middle and unroll the paper over about a second, while the castle behind dims and blurs.
2. Scrolling, holding **W** or dragging while the scroll is open does nothing.
3. The four tabs switch content, by click or with ← → once a tab has focus. **The Castle** has the red drop cap and *There is no exit.* at the end.
4. In **Dev → Figures**, click **find next** twice: on **Hidden Ones**, slots 1 and 2 turn into vermilion rings, and the count reads **2 of 6 found**.
5. **Esc** rolls the scroll back up into the middle and the castle comes back into focus. Scrolling now walks.
6. The **案内 GUIDE** button (bottom right) opens it again. **Accept the summons** closes it, and focus returns to the button.
7. In DevTools device mode at 375 × 667 and 667 × 375: the scroll fits with no sideways scrolling, and the panel scrolls inside the paper.
8. With reduced motion turned on, the scroll fades in and out instead of unrolling.

### The endless castle

Past the gate, the castle builds itself as you walk, one **segment** at a time, in `src/world/`.

**Segments** (`segment.ts`). A `Segment` is one placed piece of the castle:

- `id`, the order of generation (the Gate is 0), and `room`, the number the HUD shows. They match, except that the walk out of a fork shares its fork's room number (see *Junctions and stairs*).
- `kind`, `area` (e.g. *The Shoji Corridor*) and `kanji`.
- `length`: how far the walk through it is.
- `start` and `end` transforms: a position and a yaw (0 faces -Z, positive turns left).
- `path`: the camera path at floor level, in world space.
- `params`: its random variations.
- `Component`: the React component that builds it in its local frame (start at the origin, facing -Z).

A `SegmentDefinition` is a kind of segment:

- `generate(rand, context)` picks a fresh copy's variations.
- `plan(params)` gives its walk (control points) and its exit.
- An optional `continues` / `follow` pair chains runs of nearly identical copies.
- An optional `fork` makes it a place where the walk divides (see *Junctions and stairs*).

`placeSegment` puts a plan at the previous segment's end.

**The generator** (`WorldGenerator.ts`) builds the castle from a seed. Segment `id`'s variations come from `hash(seed, id)`, so a seed always builds the same castle. It always opens the same way, whatever the seed or the dev panel's forced kind: the Gate, a Threshold, **the Fall** and the Suspended Walkway the Fall lands on (rooms 0 to 3, see *The Fall* below). After that it picks a kind by weight (`segments/registry.ts`) and never picks the same kind twice in a row, except for runs (Tatami Room echoes, a corridor's false exit). A Forking Hall comes on a schedule instead, every 3 to 5 rooms (see *Junctions and stairs*). Each new segment's start is the previous one's end. `update(progress)`:

- Generates ahead so that at least **3 segments and 32 m** of walk lie in front of the player (short rooms come in runs).
- Keeps the window to mount: **1 segment behind** to 3+ ahead. The window grows as soon as it has to, but only shrinks once the player is 1.5 m past a boundary, so pacing back and forth over a boundary doesn't mount and unmount the same segment.
- Remembers 24 more segments behind the window as data only (not mounted). Walking back remounts them exactly as they were, and you can't walk back past the oldest one.

**Joining the paths** (`WorldPath.ts`). `WorldPath` chains every segment's path into one walk, addressed by distance from the bridge head. It is what `Player` walks along. Every plan starts at its origin heading -Z and ends heading along its exit yaw, with straight leads at both ends. So where two segments meet, the point and the tangent are the same: the camera's position, heading and pitch carry straight across the boundary. Checked over 3 km and five seeds: joints match to under 1e-12 m and 0.002°, and the heading never changes by more than 0.4° per 10 cm.

**Mounting** (`World.tsx`, `SegmentView.tsx`). `World` listens to progress with `subscribe`, so it doesn't re-render every frame. It re-renders only when the window changes, mounts each segment in a group at its start transform, and unmounts the ones that leave. Mounting runs as a React transition. It also keeps `pathStart` / `pathEnd` in `usePlayerStore` and the location in `useWorldStore`.

**The store** (`src/state/useWorldStore.ts`) changes only when you cross into another segment:

- `area`, `kanji`, `kind`
- `room` (the current segment's id) and `furthestRoom`
- `segmentStart` / `segmentEnd`
- `seed`
- `forcedKind` (dev)

Every segment counts as a room, except the walk out of a fork.

**The five room types** (`segments/<kind>/`: `layout.ts` turns params into placements, the component draws them, and `definition.ts` ties them together). Three more, where the walk divides, are under *Junctions and stairs*.

| Segment | Kanji | What it is | Varies |
| ------- | ----- | ---------- | ------ |
| **The Threshold** | 敷居 | An open 4 m walkway in the void with no railings, standing lanterns along both edges, a glowing tatami runner down the middle and piers dropping away beneath. Sometimes a cedar frame over the far end. | Length 12–24 m, lantern spacing 2.4–3.6 m, lanterns paired or staggered, end frame or not |
| **The Suspended Walkway** | 懸橋 | A narrow 1.6 m plank bridge that curves and arches. Planks and stringers follow its slope. It has rope rails, cords rising from the rails into the dark, lanterns on posts with arms reaching over the walk, and 2–4 floating pavilions around it. The only room that curves. | Length 16–28 m, turn ±25° (steered so the walk never heads more than 50° off the castle's axis: the Gate's direction, turned a quarter at each turn taken at a fork), S-bend, arch up to 0.8 m, lantern spacing 3.5–5.5 m, lanterns paired or alternating |
| **The Shoji Corridor** | 廊下 | An enclosed, straight 2.4 m hall of shoji with transoms, a board ceiling with battens, floorboards running along it for a long vanishing view, wall lanterns on brackets at eye level, 1–2 vermilion portals (lacquered posts, lintel and tie), and a roof outside. 30% end in a **false exit** (see *Junctions and stairs*). | 9–17 bays of 1.82 m (16–31 m). Which walls are lit: both, left, right, alternating bays, sparse, or a dark stretch. Lantern every 2–3 bays, paired or alternating |
| **The Open Gallery** | 縁側 | A veranda: shoji on one side, eave posts and a two-rail balustrade open to the void on the other, and a roof whose underside slopes up from the eave. Lanterns hang along the eave, and 1–2 pavilions float in the dark. | Which side the shoji is on, 8–14 bays, lit pattern, lantern every 1–2 bays |
| **The Tatami Room** | 座敷 | A square room of tatami (4.55 or 5.46 m), shoji and plaster walls, floor lanterns in the corners, one hanging lantern and a vermilion hanging scroll. Its far doors (the middle two of four lit panels) slide open when you're 30% of the way in, onto the next room. That room is almost the same one: the scroll has moved and a lantern is missing. | Runs of 2–4 rooms. Room size, which wall halves are plaster, where the scroll hangs, whether there's a hanging lantern |

Shared pieces:

- `segments/shojiWall.ts`: the corridor and gallery wall (posts, sill, door head, panels, transoms) and the lit patterns.
- `segments/common.ts`: the 1.82 m bay, pier pairs and lantern phases.
- `pieces/FloatingPavilion.tsx`: a pavilion with nothing holding it up. It has struts and a keel dangling into the fog and shoji walls, mostly glowing. It drifts gently up and down and has no lights of its own.

Every segment keeps its solid pieces inside its own length (end posts are pulled in, and the room's end walls sit 5 cm inside). So a neighbour's post never pokes through a closed door.

**The light pool** (`src/scene/lighting/`). A castle lined with lanterns would need dozens of point lights, and every time a segment mounted or unmounted, the change in light count would recompile every lit shader. Instead:

- Lanterns (and the Gate's door spill and fill light) register **light sources** (`lightSources.ts`, `PooledLight.tsx`).
- `LightPool.tsx` owns **10 point lights**, mounted once. Each frame it hands them to the sources nearest the camera; sources ahead win over sources behind.
- A light fades out as its source nears the edge of the chosen set, so a hand-over is never visible.
- Flicker is computed with the same function and phase as the lantern's paper (`kit/flicker.ts`), so they pulse together.

The shader count stays flat while you walk (19–20 in the dev panel, plus the distant castle's 3, which compile when the canvas mounts).

**Cost** (dev panel, whole frame including post-processing): about 120–150 draw calls on the walkways, galleries and corridors, up to about 195 in a long Tatami Room run (several short rooms mounted), and about 220 at the Gate, whose pieces aren't instanced. The distant castle adds 4 more everywhere.

**Dev tools:**

- **Dev → World** shows:
  - the seed
  - the renderer totals (draw calls, triangles and shader programs per frame, from `RenderStats.tsx`)
  - the distant castle: pieces alive, how many have their structure, how many are waiting to spawn, and its CPU time last frame (with the worst of the last second)
  - the room number (and furthest)
  - the area
- **skip to next segment** teleports you to the next segment.
- **next kind** forces every new segment to one kind.
- `?seed=` in the URL pins the layout.

**How to test:** run `npm run dev`, click **Enter the castle**, and check that:

1. Walking up to the gate swings its doors open. Through the gate house's back doorway, the first **Threshold** lies beyond: lanterns down both sides of a walkway over the void and a softly glowing tatami runner. **Dev → World → room** reads 0 at the Gate and 1 on the Threshold, and **area** reads 敷居 The Threshold.
2. Walk off the end of the Threshold: THE FALL plays (see its own test steps below) and lands you on a **Suspended Walkway**. Keep walking (or press **skip to next segment** a few times). Segments follow one another with no gap and no jolt where they meet. On a **Suspended Walkway**, the camera turns and rises with the curve and arch, and pavilions drift in the dark around it.
3. Pick **The Shoji Corridor** in **next kind** and skip four times: a long lit hall with wall lanterns at eye level and a vermilion portal. Repeat for **The Open Gallery** (shoji on one side, the void and floating pavilions on the other).
4. Pick **The Tatami Room** and skip four times. Walk in: about 1.5 m in, the far doors slide apart onto a nearly identical room. Its red scroll hangs somewhere else and a corner lantern is gone. The next room changes again.
5. Walk back (**S** or scroll up): the segments behind are there again, exactly as they were, and doors you opened are still open.
6. In **renderer**, the shader count doesn't climb as new segments appear. The draw calls stay in the ranges above.
7. Open `/?seed=42` twice: the same castle both times (Threshold, the Fall, Suspended Walkway, three Tatami Rooms, a Forking Hall…; past a fork, the same ways chosen build the same castle). Without `?seed`, a different castle each visit.

### The Fall

A scripted transition after the first Threshold: the bridge breaks and you fall about 120 m through a shaft of impossible architecture, landing on a Suspended Walkway. It plays once per visit.

**In the world** (`src/world/segments/fall/`). The Fall is a segment of its own, `fall` (落下 *The Fall*). The generator always places it as room 2, between the first Threshold and a Suspended Walkway, and it is never picked at random (`RandomSegmentKind` leaves it out).

- **Its walk is only the deck.** An 8 m bridge of old cross planks continues the Threshold. Every plank is split down the middle, and a few are already missing toward the far end. Its exit (where the walkway starts) is 120 m below and 8 m ahead. This is the one place where the next segment doesn't begin where the walk ends: the camera is scripted across the gap. When you land, `WorldPath.sealBefore()` closes the walk behind you, so walking back stops at the landing.
- **The deck** (`CollapsingDeck.tsx`, `deckLayout.ts`): 60-odd plank halves and 8 short stringers in two instanced meshes. When the Fall starts, a GSAP timeline cracks each plank (the halves part and their inner ends dip), then drops it 110 m into the fog with a slight random turn (`addPieceFall`). Matrices are rewritten only while that plays, and the deck stays gone if it ever mounts again.
- **The shaft** (`shaftLayout.ts`, `FallShaft.tsx`): everything you fall past, generated only for the Fall from the segment's seed and fully instanced (about 30 draw calls):
  - **hanging pillars** (`HangingPillars.tsx`): 13–18 shafts hanging out of the dark, each ending in a cross-shaped base (two crossed beams, a cap, a foot under each arm end) with a lantern beneath.
  - **upside-down rooms** (`InvertedRooms.tsx`): 6 rooms hung floor-up, with glowing shoji walls and the roof pointing down.
  - **floating stairs** (`FloatingStairs.tsx`): 7–9 flights with no support, some level (with a lantern on the landing), some tilted, some upside down.
  - **lit towers** (`LitTowers.tsx`): 7 towers of 4–7 stories ringed with shoji, mostly lit, further out. Some hang roof-first.
  - **Placement.** A placer keeps every piece at least 5 m clear of the line the camera falls along and away from each other. High up it keeps them in front of the deck (the Threshold's and Gate's piers hang behind it). Low down it keeps them out of the corridor above the walkway, where its suspension cords rise. The shaft only mounts once you are on the Threshold (room 1), so it costs nothing at the Gate, and compiles its shaders right then.
  - **Roofs** come from the kit's new `RoofInstances.tsx`, which shares `roofGeometry.ts` with `Roof.tsx`.

**The script** (`src/scene/fall/FallDirector.tsx`, times in `world/segments/fall/timing.ts`, feel in `scene/fall/tuning.ts`). When your progress reaches the deck:

1. **0 s.** `useFallStore` goes to `falling`. This locks all input (`usePlayerInput` ignores it and lets go of held keys and drags) and stands `Player` down. The HUD crossfades to **THE FALL 落下, N° 002**. The camera takes over from exactly where it was, stumbles forward with your walking momentum, centers and looks down at the deck. A warm light carried just ahead of the view starts to glow.
2. **0.2–0.9 s.** The planks ahead split and drop away, in a ripple running away from your feet.
3. **1.1–1.4 s.** The planks you stand on sag, then give.
4. **1.4–7.6 s, the fall.** The camera pitches 70° down and falls, accelerating for 4.6 s (gravity-like, up to about 39 m/s), then braking for 1.6 s. It drifts 8 m forward as it goes, past pillars, rooms, stairs and towers rushing upward. With speed:
   - the field of view widens by up to 7°
   - the vignette closes in (`PostEffects`)
   - the fog thins so more of the shaft shows
   - embers streak upward past the camera (`FallStreaks.tsx`: 260 instanced streaks, longer and brighter the faster you fall)
   - the camera's roll wobbles gently
5. **5.7–7.6 s.** It levels out while braking, between the walkway's hanging cords, and lands softly with a small knee-bend and nod.
6. **8.45 s.** The way back is sealed, you're placed at the walkway's start (exactly where the camera already is), and input unlocks.

Scrolling, keys and swipes during the fall do nothing: the landing comes at the same moment whatever you press. With `prefers-reduced-motion` there is no roll wobble and no FOV change. Teleporting past the Fall with the dev panel skips it, and the way back is still sealed.

`fallFx.ts` carries the current fall speed to the vignette and the streaks each frame without re-rendering anything. The streak shader compiles at load (it draws invisibly for a few frames), so nothing compiles as the fall begins.

**How to test:** run `npm run dev`, open `/?seed=42`, click **Enter in silence**, and walk the Threshold (W, or **Dev → World → skip to next segment** once from the Gate, then walk). Check that:

1. Stepping onto the old planks past the last lanterns crossfades the area to **THE FALL 落下 / N° 002**. Scrolling, W/S and dragging stop doing anything.
2. The planks ahead split in two and drop away into the dark, nearest first. A moment later the ones under you go.
3. The view tips down and you fall faster and faster: ember streaks rush upward, the edges darken, the view widens and rolls slightly. Glowing shoji rooms, cross-based pillars with lanterns and lit towers flash past.
4. Hold S and scroll up hard during the fall: it doesn't slow. The landing comes about 8.5 s after you stepped onto the deck either way.
5. Near the bottom it slows and levels, coming down between the walkway's cords. It lands softly at the start of the **Suspended Walkway 懸橋, N° 003** with lanterns ahead, and walking works again at once.
6. Walk back (S): you stop at the landing.
7. **Dev → World → renderer** stays around 130–140 draw calls during the fall. The shader count doesn't change during it: the streaks compile at load, and the shaft's instanced roofs compile as soon as it mounts on the Threshold (`FallShaft` calls `compileAsync`).

### The HUD

The in-game overlay, in `src/ui/HUD.tsx` (styles in `src/ui/HUD.css`). It is a full-screen layer with `pointer-events: none`: only its buttons take clicks, so dragging, scrolling and swiping anywhere else still reach the castle. The four corners fade in together once the intro camera arrives (`introComplete`). While the guide is open, the HUD dims and blurs with the canvas and is `inert`.

- **Top left** (`hud/HudHeader.tsx`): **THE ENDLESS CASTLE 無限城** in tiny letter-spaced capitals, **HIDDEN ONES 0 / 6** under it, then six small outlined circles numbered 6 to 1. A found figure's circle fills vermilion (from `useFigureStore`, with a 0.8 s color fade).
- **Bottom left** (`hud/AreaPlate.tsx`): the current area name (28 px, uppercase, letter-spaced) with its kanji beside it, then a hairline and the room number, **N° 001**. Both come from `useWorldStore`. When you walk into another room, the old plate fades out while the new one fades in over 0.8 s. A long name wraps and grows upward, and the kanji drops under the name when there is no room beside it.
- **Bottom right**:
  - **案内 GUIDE** (`hud/GuideToggle.tsx`) opens the guide scroll. It replaces the old top-left GUIDE button and shows from the start, not only after the guide has opened once. Focus comes back to it when the scroll closes.
  - The sound toggle (`hud/SoundToggle.tsx`, `hud/Equalizer.tsx`) flips `soundEnabled` in `useGameStore`. While sound is on, five bars bounce at different speeds (CSS `transform` only) and the label reads **SOUND ON**. While it is off, the bars lie flat and the label reads **SOUND OFF**. For screen readers, the button is named "Sound" and uses `aria-pressed`. Since step 16 it drives the sound engine's master gain (see *Audio*).
- **Center** (`hud/FoundCard.tsx`): the **FOUND** card when a hidden figure is found or clicked again (see *The hidden figures*).
- **Lower center** (`hud/SubtitleLine.tsx`): subtitles. Any code can call `useSubtitleStore.getState().showSubtitle(en, ja, duration)`. The English line shows in italics, with a smaller, dimmer Japanese line under it (pass `''` to leave it out). The line fades in over 0.6 s and stays up for `duration` seconds (default 4). Then it fades out. A new line crossfades over the old one. `clearSubtitle()` removes it early. Screen readers hear each line through a `role="status"` region.
- **Crossfades** (`src/ui/Crossfade.tsx`, `CrossfadeLayer.tsx`): a small reusable component. Give it a `contentKey`, and whenever the key changes it stacks the new content over the old one in the same grid cell. GSAP fades the old layer out and the new one in, then the old layer is removed. A layer that is leaving is `aria-hidden`.
- **Readability:** all text is the UI off-white, with a soft void-colored text shadow (hairlines, circles and bars get a matching `box-shadow`). Numbers use lining figures, because Cormorant's default old-style figures made "001" look like "ooı".
- **Small screens:** every size is in `em` off the HUD's root font size, so one rule scales it all. Below 640 px wide or 480 px tall, the HUD drops to 13 px from 16 px, the area name shrinks a little more, the gutters tighten, and GUIDE stacks above the sound toggle so the area name keeps most of the width.
- **Reduced motion:** the crossfades are instant, and the equalizer bars hold still at uneven heights.

**How to test:** run `npm run dev`, click **Enter in silence**, and wait for the intro camera to arrive. Then check that:

1. The four corners fade in. Top left reads **HIDDEN ONES 0 / 6** with six empty circles (6 to 1), bottom left reads **THE GATE 城門** and **N° 000**, and bottom right reads **SOUND OFF** with flat bars.
2. Clicking the sound toggle switches it to **SOUND ON** and the bars start bouncing. Click again to turn it off.
3. Walk (or use **Dev → World → skip to next segment**) into the next room: the area plate crossfades to the new name and **N° 001** over about a second.
4. **Dev → Figures → find next** twice: circles 1 and 2 fill vermilion and the count reads **2 / 6** (then **reset figures**).
5. **Dev → HUD → show subtitle**: a line and its Japanese fade in at the lower center and go away after a few seconds. Click it twice quickly: the second line crossfades over the first.
6. Drag or scroll over the area name or the subtitle: you look and walk as usual. Only the two buttons react to the pointer.
7. **案内 GUIDE** opens the guide. The HUD dims behind it, and closing the guide gives focus back to the button.
8. In DevTools device mode at 375 × 667 and 667 × 375: everything is smaller, GUIDE sits above SOUND, nothing overlaps, and the page doesn't scroll sideways.

### The distant castle

All around the walk, the void is full of more castle: towers and rooms floating in every direction, from 40 m out to 300 m, upright, upside down or leaning, lit windows fading into the fog with distance. It never runs out: pieces are generated around the camera as it moves and recycled behind it. It lives in `src/world/distant/` (what goes where) and `src/scene/distant/` (drawing it).

**The pieces** (`towerDesign.ts`):

- **Towers** (about 70%): 3–6 stories, each narrower and lower than the one below, each under a curved hip roof with swept-up corners, with a pointed cap roof and a finial on top.
- **Rooms** (about 30%): 1–2 stories, wide and shallow, under a long cap roof.
- Every piece stands on a floor slab with 2–6 posts dangling underneath (sometimes one long keel).
- **Windows:** one row of tall windows on all four faces of every story (2–4 per face). Each window is lit or dark on its own (45–90% lit per piece, sometimes a whole story dark), and lit ones vary between lantern amber and shoji cream. Lit or dark is just the instance color.
- **Poses:** about 17% hang upside down and 24% lean 6–20°.
- **Movement:** about one piece in ten moves. Some rooms sway sideways along their length, 4–8 m each way over about 80 s, and some rooms and the odd tower turn very slowly (one turn every 3½–9 minutes).

**Where they go.** Space is a grid of 48 × 64 × 48 m cells. 42% of cells hold a piece. Each piece is designed from `hash(seed, cell)`, so a seed always builds the same distant castle, and walking back finds the same towers. Everything a piece can reach (eaves, posts, lean, sway, turn) fits inside its own cell, so pieces never touch each other. Pieces also keep clear of:

- **the near castle** (`walkClearance.ts`). For every height the mounted segments' walk passes through, nothing comes within 26 m below it (the piers) or 20 m above it, at any distance. That way the distant castle can't run into the walk however the walk turns, and you look out over a gap with castle above and below.
- **the Fall**. A drop gets a 40 m column around its fall line instead, so the shaft stays clear but towers still stand beside it. You fall past their windows, and once you've walked a few steps from the landing, the castle fills in above you.
- **the two pagodas** by the Gate (their placements moved to `world/backdropLayout.ts`).
- **the Central Abyss**. Its ring of towers gets an endless column, from far below to far above, so the void inside stays empty and nothing distant runs into a tower (see *Special chambers*).

**Recycling** (`DistantCastleSystem.ts`). Every time the camera has moved 12 m, the system works out which cells are within 312 m. Cells that came into range queue their piece (nearest first), and cells now beyond 336 m free theirs at once (anything past 300 m is invisible). At most 10 pieces spawn per frame, so a teleport or the Fall's 39 m/s never stalls a frame. When the clearance changes (segments mount or unmount), pieces now inside it fade out and pieces no longer inside it fade in.

**Level of detail.** Every piece has its windows. Only pieces whose nearest point is within about 150 m also get their bodies, slab, posts and roofs (at most 6 per frame). Those parts fade into the fog by 150 m, so they come and go unseen, and far pieces are just window grids.

**Drawing it** (`InstanceBank.ts`, `distantMaterial.ts`, `distantGeometry.ts`): four instanced meshes, so four draw calls:

| Mesh | What | Slots |
| ---- | ---- | ----- |
| windows | every piece's windows | 560 pieces × 96 |
| boxes | stories, slabs, posts, finials (unit boxes, faces shaded by vertex color) | 110 near pieces × 14 |
| roofs | every story's roof but the top one | 110 × 5 |
| caps | the pointed top roofs | 110 × 1 |

- **Fixed blocks.** Each piece owns a fixed block of instances in each mesh. Unused instances in a block have a zero matrix, so they draw nothing. Spawning or freeing a piece rewrites and uploads only its blocks (`addUpdateRange`), never the whole buffer.
- **Unlit.** Everything uses unlit materials: no light reaches 40 m out.
- **Roofs** share `scene/flaredRoof.ts` with the pagodas: the pagoda's roof builder, moved out of `Pagoda.tsx`. Here it is coarser (about 290 triangles) and has a dimmer underside, because from below at 50 m the pagoda's would read as a lit orange slab.
- **The vertex shader does all the per-frame work.** Two per-instance attributes, `aPivot` (turning axis, born, dies) and `aMotion` (turn rate, sway, heading, phase), drive the movement. The same shader handles every fade:
  - in from the fog over 2.5 s when a piece appears, and out when it is removed
  - in between 40 and 75 m
  - out between 225 and 300 m (structure: 115 to 150 m)
- **The fog** is the scene's FogExp2 at about a quarter of its density, so the near castle is gone by about 60 m while distant windows still show at 150 m and have dissolved by 250–300 m. It follows the dev panel's fog slider and thins during the Fall like everything else.

**Cost.** In Node over 1.5 km of walking (three seeds), the per-frame update averages under 0.01 ms; 99.9% of frames are under 0.4 ms and the worst is about 1.2 ms. The only real work is a cell rebuild every 12 m (sorting the spawn queue) and spawning. Filling the whole ring when the canvas mounts takes about 18 ms, once. The dev panel shows about 0.1–0.4 ms in the browser. The GPU draws about 300–490 pieces: some 45 windows each (about 40k instances in all), plus the structure of 20–45 near pieces. Over 1.5 km on three seeds the test found no piece within the walk's clearance and no piece outside its cell.

**How to test:** run `npm run dev`, open `/?seed=42` and click **Enter in silence**. Then check that:

1. At the Gate, faint grids of lit windows hang in the dark above the gate house, beyond the pagodas. Drag to look up: towers and rooms float overhead, some upside down or leaning, posts dangling. The nearest have dark bodies and curved roofs. Further out they are only windows, dimmer with distance, until they fade into the black.
2. **Dev → World → distant castle** reads about 300 pieces, around 20 near, 0 queued, and a fraction of a millisecond.
3. Walk off the Threshold into **the Fall**. Window grids stream upward past you on every side, and below you.
4. After landing, walk a few steps and look up and to the sides: the castle fills in above the walkway (the piece count climbs to about 430). Nothing distant ever comes near the walk itself.
5. Keep walking, or press **skip to next segment** a few times: the distant castle goes on in every direction. The queue empties within a few frames, and nothing pops in or out at the edges.
6. Stand still and watch a room for a minute: a few drift slowly sideways or turn.
7. Open `/?seed=42` again: the same towers in the same places. Drag the **Fog → density** slider: the distant castle thickens and thins with the rest.

### Junctions and stairs

The walk divides. Three new segments are **forks**, where you stop and choose a way: the **Forking Hall**, the **Crossroads** and the **Stairwell**. Some stairs hang upside down from hall ceilings, and some corridors end in a **false exit**.

**How a fork works** (`segment.ts`, `WorldGenerator.ts`, `scene/fork/`):

- A fork's walk ends at the point where the way divides, and the generator builds nothing past it until you choose. So the walk simply ends there, and you come to rest at the end, the walking spring easing you in.
- Within 0.4 m of the end, `ForkDirector` sets `useForkStore.waiting`. The HUD shows the buttons and the fork's keys work (`useForkInput.ts`). Walk back more than 1.2 m and they go again.
- A choice calls `generator.resolveFork(choice)`. That adds a **branch** segment (`segments/branch/`): the walk out along that way. It draws nothing (it runs through pieces the fork already built), and it shares the fork's area, kanji and room number. Then generation carries on from its end.
- **The turn.** A side way starts with a tight quarter circle, 0.5 m in radius. The walk stops 0.5 m short of the hall's middle, so the turn ends exactly on the side doorway's center line. GSAP carries `scriptedWalk.progress` (`state/scriptedWalk.ts`) round it in **0.8 s** (`power2.inOut`). `Player` takes that as its position, and since the camera always faces along the path, it swings smoothly round to the doorway, with head-bob and footsteps. Walking input waits meanwhile, and a teleport cancels it. Straight on just takes a stride.
- The joined walk stays smooth through every fork, so walking back works: back round the turn (or down the stairs) and out the way you came in.
- `useForkStore.chosen` remembers the way taken at each fork, so halls can close their doors, and close them again if they remount.

**The fork segments:**

| Segment | Kanji | What it is | Choose |
| ------- | ----- | ---------- | ------ |
| **The Forking Hall** | 岐路 | A tall square hall (5 bays, 9.1 m, ceiling 4.6 m): shoji walls up to the door heads, plaster above with a band of glowing clerestory lattices, a coffered ceiling, corner floor lanterns and a big lantern hanging in the middle. A doorway in the middle of every wall, each with a pair of lit sliding shoji. Through the three ways out, a short lit vestibule (2 bays) leads off into the dark; the next room attaches at its end. Once you choose, the doors of the other two ways slide shut (1.4 s). | ← ● → (A / W / D) |
| **The Crossroads** | 辻 | The same hall with no doors at all: every way is open. The room beyond each way is **built in advance**, as soon as the Crossroads is (`previews`), so you can look down all three before you choose. Choosing keeps that one (it keeps its React key, so it never remounts), and the other two stay as they are, open, until the hall itself unmounts. | ← ● → (A / W / D) |
| **The Stairwell** | 階段 | An open stair tower: a deck where the way splits, then two flights side by side, 13 risers of 0.2 m each (a story). One climbs to a lantern-lit landing, the other goes down into the dark to a landing a story below. Open treads, handrails, landings held up from the void, all under one roof on four tall posts. Lit by floor lanterns at the deck's near corners, a lantern hanging over the deck, a small lantern on the newel post where the flights part, and one on each landing. Choosing carries you across the deck to the foot of your flight (1.5 s, a smooth S-bend); then you walk it. | ↑ ↓ (E / Q) |

Both halls share `segments/hall/` (`layout.ts`, `Hall.tsx`, `HallDoors.tsx`). Shared stair geometry is in `segments/stairs.ts`.

**On the stairs** (`Player.tsx`, `player/tuning.ts`). On a slope steeper than the walkway's arches, the head-bob changes to one dip per riser, timed from the flight's foot, so each dip lands in the middle of a tread. The camera tilts only 45% of the slope, so you look up the flight, not at the ceiling. The walking line runs exactly through the tread middles, rounding off only where it meets the floor and the landing.

**Hanging stairs** (`pieces/HangingStairs.tsx`, `hangingStairsLayout.ts`). About half the halls have a staircase hanging upside down from the ceiling, in one corner quarter, clear of the walk: a normal flight (7–9 risers, with closed risers for a clear stepped profile) reflected about the ceiling, its landing hanging lowest on posts up to the ceiling, and a standing lantern upside down on the landing, head down into the room. A hall that comes straight after a Stairwell always has one. Visual only: nothing walks on it. (`LanternInstances` now takes a `pitch` for this.)

**The false exit** (`segments/corridor/`). 30% of Shoji Corridors end in a closed pair of lit shoji with a lattice above. They slide open as you come within 5 m, onto **the same corridor again**: the same params and seed, down to the lantern flicker. Only the room number has moved on. A few steps in, the subtitle reads *The same corridor.* / 同じ廊下。 Sometimes that one has the door too, and opens onto it a third time.

**The junction schedule** (`WorldGenerator.ts`). A Forking Hall is always the 3rd, 4th or 5th room after the previous one (the first comes 3–5 rooms after the landing):

- Every segment carries `untilJunction`, how many rooms may still come before a Forking Hall is due. A Forking Hall sets it to 2–4, from its own random stream; every room after counts down; at 0, the next room is a Forking Hall.
- Runs are told how many rooms they may fill (`context.roomsAfter`), so a Tatami Room run or a false exit never makes it late.
- The Crossroads and the Stairwell are picked at random (weights 0.45 and 0.6), never straight after another fork. The Crossroads is never picked just before a Forking Hall is due. The Stairwell is three times likelier then, so you often climb straight into a Forking Hall with stairs hanging from its ceiling.
- Each segment also carries an `axis`, the heading the castle runs along: it turns a quarter at every side way taken. The Suspended Walkway now steers back toward it rather than toward the Gate's heading.

**The HUD** (`ui/hud/ForkChoice.tsx`). The buttons sit at the bottom center: 3.25 em circles with a thin bronze outline (`--hud-bronze`), each with its key underneath, lighting up with a lantern glow on hover and focus. They fade in on arrival and out once you choose. On small screens they sit above the corner panels.

**Checked** in Node over 60 seeds × 300 segments, choosing at random at every fork:

- Junction gaps: 3 rooms 1139 times, 4 rooms 1109, 5 rooms 1098, never anything else.
- Room numbers always consecutive.
- Joints meet within 7e-13 m. The worst change of heading at a joint is 0.28°, where a hall's walk meets its turn.
- Every turn ends within 0.14° of its doorway's direction. The Stairwell's S-bend turns at most 7.4° per 10 cm.
- The stair walking line sits exactly on the tread middles, away from the rounded ends.
- Every Crossroads preview is the one committed when chosen.

In the dev panel, a Crossroads with its three previews is about 110 draw calls, and a Forking Hall 80–110.

**How to test:** run `npm run dev`, open `/?seed=905` and click **Enter in silence**. Walk, or press **Dev → World → skip to next segment**:

1. After the Fall and the walkway, room **N° 004** is **The Crossroads 辻**. The walk stops near the middle and **← ● →** fade in at the bottom with A, W, D under them. Drag to look round: a corridor beyond the left way, a gallery straight on, a walkway to the right, and a staircase hanging upside down from the ceiling, front right, with a lantern standing head down on its landing.
2. Scroll the wheel once more: nothing at first (that scroll brought you here). Scroll again: you go straight on. Or reload, come back and press **A**: the view swings left to the doorway in under a second, and you walk on into the corridor.
3. (Left at the Crossroads.) The corridor ends in a closed pair of lit shoji. Walk toward them: they slide apart onto the same corridor. Walk through: *The same corridor.* appears, and the room number moves on.
4. Room **N° 007** is **The Stairwell 階段**: the deck stops you where the flights split, and **↑ ↓** appear with E and Q under them. Press **E**: you're carried across to the foot of the up flight. Hold W: the camera tilts partly up the flight and dips once per step. (Or press **Q** and go down into the dark.)
5. At the top is **The Forking Hall 岐路** (**forking hall** in the dev panel read *next room* on the stairs), with stairs hanging from its ceiling. Press **D**: you turn right, and the doors of the straight and left ways slide shut behind you. Walk back (S): back round the turn to the middle; the doors stay shut, and the entrance is still open.
6. Keep going, watching **Dev → World → forking hall**: it counts down, and a Forking Hall comes every 3 to 5 rooms.
7. Pick **The Stairwell** in **next kind** and skip four times. Press Q at each one: down, and down again.
8. In DevTools device mode at 375 × 667: the buttons sit above the area plate and work by tapping.

### Special chambers

Two rare rooms, and a castle that rearranges itself.

**The Inverted Chamber** 逆さの間 (`world/segments/inverted/`, `scene/invert/InvertDirector.tsx`). A long room (9–12 bays, 16–22 m) built for walking on its ceiling:

- **The room.** 4.55 m wide and 4.46 m tall. Its walls read the same either way up: a tier of shoji at the floor, a beam, and a second tier hung from the ceiling. The floor is bare boards with battens across, like a board ceiling. The ceiling is a tatami floor, face down. Standing on it, upside down, are low tables with cushions either side, a floor lantern in each corner, a folding screen against one wall, and the vermilion scroll. Lanterns "hang" up from the floor. Outside, the roof hangs under the floor and piers rise from the top into the dark.
- **The doorways.** At the floor tier, the middle two of four panels at each end are open. The ceiling tier is closed: a lit doorway to nowhere. Upside down, it is the real door that looks wrong, high up on the wall.
- **The roll.** 2.2 m in, `InvertDirector` tweens `cameraFx.roll` (`state/cameraFx.ts`) from 0 to 180° over 3 s (`power2.inOut`). `Player` turns the whole body about a line halfway up the room, so upside down the eye sits 1.6 m below the ceiling, as if standing on it. 5.5 m before the far door it rolls back, timed so you are upright by the door even at a run (never faster than 1.2 s). Walking back out the entrance rolls back in half the time. A teleport snaps the roll.
- **Looking** while rolled works in the rolled frame (`Player` composes yaw/pitch, then the roll about the view, then the look), so a drag turns the view the way you drag. Head-bob and sway turn with the body.
- The first time, the subtitle reads *The floor is above you.* / 床が頭上にある。
- About 25 draw calls.

**The Central Abyss** 奈落 (`world/segments/abyss/`). A huge round void crossed by one long, thin bridge:

- **The bridge** (`layout.ts`, `CentralAbyss.tsx`): 64–84 m of 1.1 m planks on two stringers. It sags 0.8–1.8 m in the middle (a sin² curve with level 1.5 m leads, so it joins its neighbours with matching tangents). It has thin rope rails on slim posts, and a lantern on a post every 8–11 m, alternating sides, with an arm reaching over the walk.
- **The towers** (`AbyssTowers.tsx`): 12–16 of them stand round a ring just past the bridge's ends, 38–52 m out, except within 40° of the way in and out. Each is a stack of 6–9.5 m stories with flared roofs, rising 14–24 stories above a balcony near the bridge's height and sinking 18–30 stories below it, upside down (a roof under each story). There are three lit windows per face per story, and big lanterns hang at the roof corners every third story. All of it is four instanced draw calls: unlit materials in a thin haze (`applyDistantHaze` at 0.3× the fog), so the towers stay visible 40–150 m out and fade into black far up and far down. They reuse the distant castle's shaded box and flared roof.
- **The lights** (`AbyssGlow.tsx`, one shader for both): 1,500 lights far out beyond the towers, half scattered and half strung in columns like the windows of towers too far to see; and 700 embers inside the void, rising slowly (about 0.35 m/s) from 60 m below the bridge to 40 m above it and wrapping round. Each is one draw call, and all their motion is in the vertex shader.
- **Placement.** It never comes straight after a fork, and no Crossroads comes straight after it, so no room built down a Crossroads' other ways reaches into the ring. The distant castle keeps an endless column round the ring clear (`walkClearance.ts`). Its shaders compile when it mounts, a few rooms ahead.
- About 50–70 draw calls for the whole frame on the bridge.

Both are picked at random like any room (weights 0.35 and 0.3, `segments/registry.ts`), and both can be forced with **next kind**.

**The room shift: the biwa** (`state/biwa.ts`, `scene/shift/`, `world/shift/`, `WorldGenerator.rebuildAhead`):

- **When.** `ShiftDirector` emits a `biwa` event (`emitBiwa`, `onBiwa`, for audio later) in three cases:
  - after you've stood still for **2 s** (once per stop: you must walk at 0.6 m/s or more before it counts again, and a teleport doesn't count as walking)
  - **at random** while walking (on average once every 90 s, and only with at least 8 m of the room left ahead)
  - from **Dev → Special → biwa**

  Never within 12 s of the last one. Never in the opening, during the Fall, with the guide open, while stopped at or turning at a fork, or mid-roll in the Inverted Chamber.
- **The new walk.** `WorldGenerator.rebuildAhead(progress)` takes away every segment after the room you're in (after the walk out of it, at a fork already chosen). It generates the walk ahead again from a fresh random stream: seeds and React keys are salted with the number of shifts so far, so the new rooms differ and never share a key with the old ones. The new walk starts at the same joint with the same heading, so it always joins on. Every rule carries on: the junction schedule, no repeats, the fork rules. The first new room is never the next of a run (a Tatami echo, a false exit), so something really changes. At a fork still waiting for a choice there is nothing ahead to rebuild: you only get the lurch and the shake.
- **The motion** (1.5 s, GSAP, `world/shift/shiftMotions.ts`, `scene/shift/runSegmentMotion.ts`):
  - The rooms that were on screen stay mounted under their old keys and leave, nearest first, 0.1 s apart. Each one slides off sideways, swings down on a hinge at its near end like a trapdoor, or drops into the void.
  - The new rooms arrive one after another. Each one slides in from the side, swings up from below on the same hinge, rises out of the dark or comes down from above, and settles exactly in place.
  - The room you're in lurches around you: 0.22 m sideways, 0.1 m down, a 2° turn about where you stand, then back with a small overshoot.
  - The camera shakes (`cameraFx.shake`, off with `prefers-reduced-motion`).
  - A fork's previews move with their hall.
- **How it moves rooms.** `SegmentView` wraps every segment in two groups that stay at rest except during a move, which is a rigid turn about a world pivot plus a translation. Lanterns and pooled lights inside follow their room (`useSegmentMotion`): leaving rooms fade their lights out, arriving ones fade them in.
- **The walk is held** at the doorway (`generator.holdEnd`) until the new rooms have landed (about 2.1 s), so you never walk onto a room still in flight.
- The first time, the subtitle reads *A string is plucked. The rooms move.* / 琵琶が鳴る。部屋が動く。

**Checked** in Node, 60 seeds × 1.8 km each, with a room shift about every 33 m (about 3,000 rebuilds) and a random way at every fork:

- Every segment before the anchor is the same object after a rebuild.
- Ids, room numbers and distances stay consecutive.
- Joints still meet with the same heading: the worst kink is 0.30° (the halls' turns, as before) and 0.007° of pitch.
- Every key is unique, Crossroads previews included.
- Junction gaps are still exactly 3, 4 or 5 rooms (479 / 480 / 509). A room forced from the dev panel can make the next Forking Hall a room late, as **next kind** already can.
- No mounted walk, Crossroads previews included, comes within 14.8 m of a tower's corner in the Abyss.

**How to test:** run `npm run dev`, open `/?seed=42`, click **Enter in silence**, and skip past the Fall (**Dev → World → skip to next segment** four times, then let it land). Then check that:

1. **Dev → Special → inverted chamber**: you stand 1.2 m before a doorway in a lit, two-tiered shoji wall, with lanterns standing up from the floor inside. Walk in (W): two steps in, *The floor is above you.* appears and the view rolls over in about 3 s (**camera roll** reads 180°). You now stand on tatami among low tables and floor lanterns. The floorboards and lanterns are overhead, and the real doorway is high on the far wall. Drag to look: the view follows the drag. Keep walking: it rolls back before the door, and you walk out upright.
2. **Dev → Special → central abyss**: you're at the head of a long, thin bridge. Towers of lit windows stand on both sides and fade out far above and below. Embers drift up past the bridge, and faint lights hang far off in the dark. Drag to look up, down and sideways. **renderer** reads about 50–70 calls on the bridge, and the shader count stops climbing once the Abyss has mounted.
3. Walk, then stand still for 2 s: *A string is plucked. The rooms move.* appears, the room you're in jolts and settles, and the view shakes. Through the door ahead, the next room drops, slides or swings away, and a different one arrives (best seen from the end of the Abyss bridge or a walkway). Try to walk out during it: you stop at the doorway until it's over. Then walk on into the new room: the walk runs on smoothly.
4. **Dev → Special → biwa (room shift)** does the same at once. **biwa events** counts each one (*still*, *random* or *dev*).
5. Stop at a fork (the buttons showing) and wait: nothing shifts. Press **biwa** there: the hall lurches and shakes, but nothing ahead changes (nothing is built past an unchosen fork).
6. Walk back after a shift: the rooms behind you are as they were.

### The hidden figures

Six figures hide in the castle, one per area type. Find all six and the castle ends.

**The data** (`world/figures.ts`): each figure has an `id` (used to save progress), a `number` (1 to 6: its HUD circle and guide slot), a `name`, a `kanji` name, the `area` it can appear in, a placeholder `pose`, and three `lines` in English and Japanese. The names and lines are **TODO placeholders** (*TODO Name One*, *TODO: figure 1, line 1* / *（未定 1-1）*), to be replaced with original characters, and so is `FINALE_LINE`. The module checks that no two figures share an area and that the numbers run 1 to 6.

| No. | Area | Where it stands | Pose |
| --- | ---- | --------------- | ---- |
| 1 | The Threshold | On a broken piece of another deck floating 9–13 m off to one side, a little below, near the far end | standing, hooded |
| 2 | The Suspended Walkway | On a stretch of another walkway 10–15 m out in the void, crossing at an angle, below the walk | conical hat (kasa) |
| 3 | The Open Gallery | On a far balcony 11–14 m out from the open side, in front of a short wall of lit shoji under a roof | parasol |
| 4 | The Forking Hall | Up in a far corner, standing on the ceiling, head down (the other side from a hanging flight) | bowed, hair over the face |
| 5 | The Stairwell | On a platform floating 8–10 m beside the tower, ahead of where the walk stops | arm raised |
| 6 | The Central Abyss | On the waist balcony of a tower across the void, ahead of the middle of the bridge | ringed staff |

**The figure** (`scene/figures/`): a flat, near-black silhouette on a 1 × 2 m plane that turns about its vertical axis to face you, with a soft vermilion glow just behind it, and two narrow eye slits glowing a faint paper-white in the dark of the head (under the kasa's brim, deep in the hoods, through the bowed one's hair). The silhouettes and eyes are drawn on canvas in `silhouettes.ts` (robed figures in six poses, drawn in meters with SVG path data, colors from the palette). The eyes are a layer of their own just in front of the silhouette, additive and only just bright enough to bloom (`EYES_INTENSITY`), fading with the same haze as the glow but not breathing. Silhouette and glow are unlit and unfogged; the glow fades with a haze a third as thick as the fog, so a figure 50 m away still shows, and breathes slowly. Three draw calls per figure.

**Spawning** (`world/spawns/`):
- `spots.ts` works out each area's hiding place from the room's params, in the room's frame. Each spot can be centered in the view from a good stretch of the walk (the look reaches 60° either side), and perches stand at or below eye level, because from under a perch its floor hides the figure. Perches keep 9 m clear of floating pavilions; the Stairwell's keeps clear of the room after the flights.
- A room holds its figure with a chance per area (`tuning.ts`: 0.5 to 0.7, and always in the Abyss, which is rare already), decided from the room's seed, so a room is the same every time. Never in the fixed opening.
- `FigureSpawn` mounts inside `SegmentView`, so a figure and its perch move with their room in a room shift.
- A figure is only ever in one place (`claims.ts`): if two rooms of the same area are mounted, the first holds it and the other shows an empty perch. When the first unmounts, the other takes it.
- `perchLayout.ts` / `FigurePerch.tsx`: a deck is planks on edge beams with struts dangling into the void, boards sticking out of one broken end, railings with gaps (walkway and stairwell), and a standing lantern at the far end from the figure. A balcony is a floor and railing in front of three shoji panels (two or three lit), a door head, boards and a roof. 1 to 5 draw calls.

**Finding one** (`FigureWatcher.tsx`, `state/hiddenFigures.ts`):
- **By looking:** a figure within 60 m and 9° of the center of the view for 1 s is found. Looking away restarts the count. Before it counts, a ray from the eye checks the castle's solid meshes (`occlusion.ts`, only the mounted segments): the figure is hidden only if both its middle and its head are blocked, so a thin rail doesn't hide it. If it is hidden, the check runs again every 0.25 s.
- **By clicking** (the glow is the click target, so a far figure is still easy to hit): a press that moved less than 6 px finds it. The same wall check applies. The cursor turns to a pointer over a figure.
- **Found:** `useFigureStore` marks it and saves the found ids in `localStorage` (`endless-castle/found`). Its HUD circle fills, the **FOUND** card appears, and it says line 1 through `showSubtitle` (5 s).
- **Clicking a found figure** shows its card again and says its next line (2, 3, then 1 again).
- Nothing counts during the intro, the Fall or the finale, or with the guide open.

**The FOUND card** (`ui/hud/FoundCard.tsx`, styles in `HUD.css`): centered a little above the middle. **— FOUND —** between hairlines, the number in a filled vermilion circle (like its HUD circle), the name in large letter-spaced capitals, and the kanji name under it. It crossfades in over 0.8 s, stays 4.5 s and fades out. A new card crossfades over an old one. It never takes the pointer, and screen readers hear it through a `role="status"` region.

**The finale** (placeholder; `ui/FinaleOverlay.tsx`, `state/finaleFx.ts`, `scene/finale/RedShiftEffect.ts`): when the sixth figure is found, input locks (walking, looking, fork choices, the biwa), and saved progress is cleared, so the next visit starts with all six hidden again. After the sixth card has had its 4.5 s, every light turns red over 3.5 s. GSAP tweens `finaleFx.red`, and three things follow it: the light pool's point lights and the hemisphere fill turn from lantern amber to vermilion, and a red grade in post-processing (before tone mapping) keeps each pixel's brightness but gives it the vermilion hue, so lanterns, shoji and windows burn red while the void stays black. Then the final line appears for 5 s, the screen fades to black over 2.2 s, and the title screen comes back. Entering again resets every store (`state/session.ts`) and plays the intro from the start.

**Performance:** at most one figure per area is mounted at a time (usually one, now and then two). The gaze test is a few multiplies per mounted figure per frame, with no allocations. The ray test runs only when a figure has been held in view for 1 s.

**How to test:** run `npm run dev`, open `/?seed=42`, click **Enter in silence**, and skip past the Fall (**Dev → World → skip to next segment** four times, then let it land). Then check that:

1. **Dev → Figures → go to next hidden**: you stand at the door of a Threshold. Off to one side, a little ahead and below, a broken deck floats with a lantern on it and a dark robed figure in front of a red glow. Walk in a step, drag the view onto it and hold still: after about a second, circle 1 fills, **FOUND / 1 / TODO NAME ONE / 未定一** appears in the middle, and *TODO: figure 1, line 1* shows at the bottom.
2. Click the figure: the card shows again, now with *line 2*. Click again for *line 3*.
3. Reload the page and enter again: **HIDDEN ONES 1 / 6**, circle 1 still filled.
4. **go to next hidden** again for each of the others: a walkway out in the void (2), a balcony with lit shoji off the gallery's open side (3), a far corner of the Forking Hall's ceiling, head down (4; walk in to where the buttons appear and look up and to the side), a platform beside the Stairwell (5; from where the walk stops), and a tower balcony across the Abyss (6; walk onto the bridge). Find some by looking and some by clicking.
5. Before finding one, look at it through a wall or from behind a solid piece of the castle: it isn't found.
6. With the sixth: after its card, every lantern, paper wall and window turns red, *TODO: the final line* appears, the screen fades to black and the title screen returns. Scrolling and **W** do nothing during it. Enter again: the intro plays, **HIDDEN ONES 0 / 6**.
7. **find next** six times also plays the finale, without walking anywhere.
8. Turn **always appear** off and walk: figures turn up in only some rooms of their area, and the same room always has or hasn't one.

### Signs and presence

The castle warns you when one of the hidden ones is near. Everything lives in `scene/signs/`; the numbers are in `scene/signs/tuning.ts`.

**Presence** (`PresenceDirector.tsx`, `presenceFx.ts`):
- Each frame it finds the nearest unfound figure that is mounted. Within 40 m (it lets go at 43 m, so the edge doesn't flutter) its strength is 0.25 at the edge, rising in a straight line to 1 at 6 m. Walls don't block it: it is felt, not seen.
- The felt level eases toward that strength over about 3 s, and fades over about 5 s as you walk away. When the figure is found it drops away in about half a second, even if another figure is close, and only then can a new presence begin.
- **Heartbeat:** while present, a beat (lub, then dub 0.24 s later) at 54 bpm at the edge up to 116 bpm at full strength. Each beat darkens the vignette a little.
- **Dark ripple:** every 8 s at the edge, down to every 3.5 s up close (±1 s). It is a GSAP timeline in which a dark front (taking up to 80% of the light) with a fading wake rolls 2.6 screen heights across the view in 2.6 s. It starts on the figure if it is in view, otherwise just off the edge on its side. The front also bends the image slightly as it passes.
- It is off during the intro, the Fall and the finale, and holds still while the guide is open.

**The look** (`PostEffects.tsx`): the chain is now *presence warp → bloom → finale red → ACES → presence grade → vignette → grain*, all still in **one** pass.
- `PresenceWarpEffect.ts` is a custom convolution effect: it reads the frame at shifted points. A slow wave runs round the screen's rim and breathes in and out, always pulling inward, so nothing is read from off screen. Green and blue are drawn in toward the middle, so the rim splits into colored fringes (chromatic aberration). At full presence the rim is pulled in by up to 3.2% of the screen and splits by up to 1.8%. The effect starts about a third of the way out from the middle and is strongest in the corners. The wave cycles about every 5 s. It comes first because inside a merged pass a convolution effect sees the scene before the other effects.
- `PresenceGradeEffect.ts` (after tone mapping) takes up to 50% of the color out and draws the ripple's dark band, so lanterns and their bloom darken with it while the void stays black.
- The vignette comes in with the presence (offset 0.3 → 0.22, darkness 0.7 → 1). It is kept off the middle of the rim so the warp stays visible, and pulses 0.2 darker on each heartbeat.
- When nothing is present, both effects pass the frame through unchanged. With reduced motion turned on, the warp and the fringes are cut to 35% and the wave holds still.

**The guttering lantern** (`LanternGutterDirector.tsx`, `lanternGutter.ts`): every 12–28 s (the first not before 6 s), a lantern gutters. It must be within 12 m and on screen (inside 85% of the view from the middle), and nearer ones are likelier. If none is on screen, it looks again 2 s later. As a figure's presence grows, the wait runs up to 8× faster: about every 1.5–3.5 s up close. The gutter lasts 1.05 s. For the first half second the light cuts fully on and off (stepped 14 times a second, so it looks the same at any frame rate), then it holds at 6% and climbs back over the last 0.4 s. `LightPool` dims that source's point light, and its paper dims with it (down to 4%) (`LanternInstances`, and the Gate's single `Lantern` through `PooledLight`'s new `sourceRef`). Only one lantern gutters at a time. It doesn't happen in the intro, the Fall, the finale or with the guide open.

**Events for the audio step** (`state/signs.ts`): one channel, `onSign(listener)`, carries every sign:

| `kind` | When | Carries |
| ------ | ---- | ------- |
| `heartbeat` | Each beat while a figure is near | `bpm`, `level` (0 … 1), `figure` |
| `presence` | A presence begins, or ends (`reason`: `away` or `found`) | `state`, `figure`, `distance` |
| `ripple` | A dark ripple starts | `level`, `figure`, `duration` |
| `lantern` | A lantern starts to gutter | its world position, `distance`, `duration`, `presence` |
| `biwa` | A biwa string is plucked (forwarded from `emitBiwa`) | `reason` |

`presenceFx.bpm` and `presenceFx.level` can also be read every frame for a continuous layer.

**Performance:** no new draw calls or lights. The two effects merge into the existing effect pass, which adds three texture reads per pixel. The directors don't allocate per frame and never set React state. The gutter adds one comparison per light and per lantern.

**How to test:** run `npm run dev`, open `/?seed=42` and click **Enter in silence**.

1. At the Gate, **Dev → Signs → gutter a lantern**: one of the bridge lanterns in view stutters off and on, goes nearly dark and comes back within about a second, its paper as well as the light on the boards. **events** counts a lantern. With no lantern on screen (within 12 m), nothing happens: look toward one and press again.
2. Drag **force presence** to 1: over about 3 s the view darkens and drains of color, and the edges are pulled in and wave slowly, with red and blue fringes (clearest on the pagoda windows near the corners). The vignette pulses with a heartbeat (**presence** shows the bpm). Every few seconds a dark band rolls across from the right. **ripple** sends one at once. Set it back to 0: it all fades away.
3. Skip past the Fall, then **Dev → Figures → go to next hidden**. From the door, the figure is within 40 m: the presence begins and grows as you walk toward it (**presence** reads e.g. *0.60, No. 1 at 24.0 m, 91 bpm*), the ripples roll in from its side, and lanterns around you gutter every few seconds. Find it: everything is gone within about a second, and **events** shows *presence end (found)*.
4. Walk away from an unfound figure instead: the effects fade slowly as you pass 43 m.
5. With reduced motion turned on in the OS, the warp is much smaller and doesn't move.

### Audio

Every sound is made live with the Web Audio API: noise, oscillators, filters and buffers computed in JS. There are no audio files. Everything is in `src/audio/`, and all the levels and shapes are in `audio/tuning.ts`.

**The engine** (`AudioEngine.ts`, one shared `audioEngine`):
- The signal chain: *voices → (dry, and a send to the hall reverb) → muffle lowpass → compressor → master gain → speakers*. The hall is one `ConvolverNode` with a 2.6 s impulse response generated at startup (decaying, darkening stereo noise with a few early reflections). The compressor keeps the Fall and stacked one-shots from clipping.
- Browsers only allow sound to start from a click, so the `AudioContext` is created and resumed on the title screen's **Enter** click. That happens for **Enter in silence** too, so the HUD toggle can turn sound on later. The toggle's own click also resumes it.
- The master gain follows `soundEnabled`, with a 0.12 s fade. With sound off, the context is suspended 0.6 s after the fade and every one-shot is skipped, so nothing piles up and plays all at once when sound comes back.
- While the guide is open, everything is muffled through a 650 Hz lowpass.
- Lantern crackles and doors go through `PannerNode`s. They use the cheap equal-power model (no HRTF) with a linear roll-off: full level within 2.5 m, silent at 40 m. Each panner is placed once, in the camera's space, when its sound starts (`AudioListenerBinding.tsx` hands the engine the camera). The listener never moves, so nothing updates per frame.
- The engine has no per-frame work at all. `AudioDirector.tsx` (mounted with the castle) connects it to the game's events and stores.

**The sounds:**

| Sound | How it's made | Triggered by |
| ----- | ------------- | ------------ |
| Wind | Brown noise through a bandpass whose center drifts on a 0.045 Hz LFO, gusting on a second LFO at 0.11 Hz, with a thin drifting whistle on top | Always on. Fades in over about 4 s on entering and out on leaving. |
| Drone | A 41 Hz sine, a twin detuned 0.4% (slow beating), an octave triangle and a quiet sawtooth fifth, through a lowpass that breathes on its own LFO | Always on |
| Presence | The drone grows (up to +70%) and opens, a sour tritone pair beats in, and the wind drops by up to 45% | `presence` and `heartbeat` signs. It follows each beat's `level` and lets go when the presence ends. |
| Footsteps on wood | A 3 ms-attack noise burst through a bandpass (about 1 kHz walking, 1.5 kHz running), over a sine thump that drops from 120 to 58 Hz. Pitch varies by ±9% and level by ±15%. Running steps come faster (one per 0.8 m), louder, brighter and shorter. Left and right feet sit slightly apart in stereo, and about 1 walking step in 12 creaks a board. | `onFootstep` |
| Sliding shoji | A filtered noise sweep (a bandpass rising to about 1.3 kHz and back, following the panels' ease-in-out) over a low rumble in the track, then a soft knock. Shutting ends in a sharper clack. | New `onDoor` events (`state/doors.ts`). They come from the Tatami Room and Shoji Corridor doors as they slide open, and from the Forking Hall's doors as they slide shut. They are panned to the doorway. |
| The Gate's doors | A thud as the bar lets go, a deep sweep of air and timber, a groaning hinge (a sawtooth wandering through 45–110 Hz into a narrow band), and a thud as the leaves come to rest | `onDoor` (`gate`), panned |
| Lantern crackle | One noise source through a 3 kHz band, with dozens of tiny clicks written into its gain automation. They are dense during the light's 0.5 s stutter and sparse after it. Under them, a low flame "breath" dips with the light. A little louder near a hidden figure. | `lantern` sign, panned to the lantern |
| Biwa | Karplus-Strong strings in the miyako-bushi scale on E (E F A B C). The buffers are computed when the audio unlocks, with a little fret buzz (*sawari*). Each pluck starts slightly sharp, as the plectrum lets go, and some bend up a semitone. Each comes with a plectrum click and a knock on the body. It plays one of four short phrases from a random side, deep in the hall reverb. | `biwa` sign (every room shift, and **Dev → Special → biwa**) |
| Shift rumble | A low noise rumble over the shift's 1.5 s, with three heavy knocks as the rooms land | A room shift starting (`useShiftStore.active`) |
| Heartbeat | Two low sine thumps (64 → 40 Hz, then 56 → 35 Hz), lub then dub 0.24 s apart, the same gap as the vignette's pulse, over a soft noise thud. Rate comes from the sign: 54 bpm at the edge of the presence range up to 116 bpm up close. Stronger presence makes each beat louder, and faster beats are shorter. Dry and centered. | `heartbeat` sign |
| Ripple | A low noise swell that opens and closes over the ripple's 2.6 s, with a sub tone sinking from 58 to 36 Hz | `ripple` sign |
| The Fall | Scheduled all at once on the Fall's own clock (`fall/timing.ts`), so it stays in step with the camera. Planks crack ahead from 0.2 s and the floor gives with a crash at 1.35 s. From 1.4 s a wind roar rises: a lowpass opens from 220 Hz to 3.6 kHz over the 4.6 s of acceleration, a whistle climbs with it and a buffeting tremolo deepens. It falls away over the braking, and two soft thumps mark the landing. | `useFallStore` → `falling` |
| Finale | A last biwa phrase as the lights turn red, then the ambience dies away over about 9 s | `finale` |

**Performance:** the always-on bed is 10 oscillators (6 tones, 4 LFOs), 1 noise source and a few filters. A footstep is about 8 short-lived nodes, and a crackle is 1 source and 4 nodes (plus its panner) however many clicks it has. One convolver serves every sound. Nothing runs per frame, no React state changes, and with sound off the context is suspended.

**How to test:** run `npm run dev`, open `/?seed=42`, and click **Enter the castle** (use headphones to hear the panning).

1. As the intro plays, low wind and a deep drone fade in. The wind slowly swells and changes color.
2. Walk (W): footsteps on boards, a little different each time. Scroll fast to run: the steps come quicker and sharper. Now and then a board creaks.
3. Walk up to the Gate: the heavy doors open with a thud, a groan and a deep sweep.
4. Click **SOUND ON** in the HUD: everything fades out (**Dev → Audio → context** reads *suspended*). Click again to bring it back. Open the guide: the sound goes muffled until you close it.
5. Walk the first Threshold into the Fall: cracking planks, a crash, a roar that rises to a whistle as you speed up and fades as you slow, then a soft landing.
6. Past the Fall, stand still for 2 s: a biwa phrase rings out and the room rumbles as it shifts. Each time it is one of four phrases.
7. Walk into a Tatami Room: the shoji ahead slide open with a papery swish, panned to where they are. At a Forking Hall, choose a way: the other doors slide shut with a clack.
8. **Dev → Figures → go to next hidden** and walk toward it: the drone darkens, a sour tone creeps in, the wind thins, and a heartbeat comes in, faster as you get closer. Each ripple brings a low swell. Lanterns that gutter crackle from where they hang.
9. **Dev → Audio** plays each sound on its own. Doors and the crackle come from the front right.
10. Click **Enter in silence** instead: nothing plays until you turn sound on in the HUD.

### Kit dev view (`?kit`)

Open <http://localhost:5173/?kit> in `npm run dev` to skip the title screen and see every piece in a row along X, each under its own hanging lantern (lit through a `LightPool`), with OrbitControls, the usual fog, stars and post-processing, and the Dev panel. The buttons at the bottom (or ← →) glide the camera between pieces with GSAP. `?kit&focus=3` opens on the fourth piece. Like the Dev panel, the view only exists in dev builds and isn't in the production bundle.

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
  App.tsx               Shows the title screen, then the 3D canvas, intro overlay, HUD, guide and finale (+ dev panel in dev); entering resets the session; ?kit opens the kit view
  index.css             Global styles, font variables, .kanji and .label classes
  lib/
    palette.ts          The only source of colors (also exposed as --color-* CSS variables)
    color.ts            Blends of two palette colors (three Color or CSS string)
    random.ts           Seeded PRNG (mulberry32), seed hashing, and range / pick / weighted-pick helpers
    math.ts             clamp, smoothstep, damp, smoothDamp (critically damped spring)
  state/
    useGameStore.ts     zustand store (entered, soundEnabled, introComplete, guideOpen, guideSeen, finale)
    useSubtitleStore.ts The HUD's subtitle line: showSubtitle(en, ja, duration), clearSubtitle()
    useFigureStore.ts   Which of the six hidden figures have been found (saved in localStorage), the FOUND card, lines said
    hiddenFigures.ts    discoverFigure / revisitFigure / clickFigure: save, card, line, and the finale on the sixth
    finaleFx.ts         The finale's red (0 … 1), tweened by FinaleOverlay, read by the lights and the red grade
    session.ts          resetSession(): every store (and the presence and gutter state) back to its first state, for entering again after the finale
    usePlayerStore.ts   Progress along the walk: target, smoothed progress, speed, walkable bounds, walkBy(), jumpTo()
    useWorldStore.ts    Where you are: area, kanji, room number (and furthest), seed, dev's forced kind
    footsteps.ts        Footstep events (onFootstep / emitFootstep), for audio
    doors.ts            Door events (onDoor / emitDoor / emitDoorAt): shoji sliding open or shut, the Gate swinging open, with the doorway's world position
    useAtmosphereStore.ts  Fog and bloom values (+ defaults), written by the dev panel
    useFallStore.ts     The Fall's phase (idle / falling / done) and where the player stands on the deck
    useForkStore.ts     Forks: the one you're waiting at, the way being taken, the ways chosen; choose()
    scriptedWalk.ts     A stretch of walk carried out for the player (the turn at a fork), read by Player
    cameraFx.ts         The camera's roll (Inverted Chamber) and shake (room shift), tweened by GSAP, read by Player
    biwa.ts             Biwa events (onBiwa / emitBiwa): the rooms are about to shift (also sent on as a biwa sign)
    signs.ts            Every sign for audio (onSign / emitSign): heartbeat, presence, ripple, lantern, biwa
    useShiftStore.ts    The room shift under way (rooms leaving, every segment's move), rebuild version, dev room requests
  ui/
    TitleScreen.tsx     Title overlay: layout, intro fade, enter and fade-out logic
    TitleScreen.css
    InkEmblem.tsx       Procedural vermilion brush-stroke circle (SVG)
    Smoke.tsx           Drifting smoke background
    Smoke.css
    DevPanel.tsx        leva panel: fog and bloom, player monitors, world (seed, renderer stats, distant castle stats, room, area, next kind, skip), guide, Figures (found, mounted, always appear, go to next hidden, find next, reset), Signs (presence, events, force presence, ripple, gutter a lantern), HUD subtitle / sound buttons, Special (inverted chamber, central abyss, biwa, roll) (dev builds only)
    IntroOverlay.tsx    "You have been summoned." and the "Scroll to enter" hint, after the intro; fades once you walk
    IntroOverlay.css
    GuideScroll.tsx     The guide: hanging scroll, unroll / roll-up timeline, tabs, focus trap, Esc
    GuideScroll.css     Parchment, rollers, brass caps, stamps, tab content
    HUD.tsx             The in-game overlay: header, area plate, subtitles, FOUND card, guide and sound buttons
    FinaleOverlay.tsx   The placeholder finale's script (GSAP): lights to red, last line, fade to black, back to the title
    FinaleOverlay.css
    HUD.css             All HUD styles (em-based, one small-screen rule scales everything)
    Crossfade.tsx       Crossfades its children whenever contentKey changes
    CrossfadeLayer.tsx  One layer of a crossfade (GSAP fade in / out)
    Crossfade.css
    hud/
      HudHeader.tsx     Top left: title, HIDDEN ONES count, six circles
      AreaPlate.tsx     Bottom left: area name, kanji, hairline, room number (crossfades per room)
      GuideToggle.tsx   Bottom right: 案内 GUIDE
      SoundToggle.tsx   Bottom right: SOUND ON / OFF
      Equalizer.tsx     The five bars on the sound toggle
      SubtitleLine.tsx  Lower center: English and Japanese subtitle lines
      FoundCard.tsx     Center: FOUND, the figure's number in a vermilion circle, its name and kanji (crossfades)
      ForkChoice.tsx    Bottom center at a fork: ← ● → or ↑ ↓ round buttons with their keys
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
    CastleCanvas.tsx    The <Canvas>: renderer settings, camera, light pool, backdrop, distant castle, world generator (seeded), player, directors
    CastleCanvas.css    Full-screen layer behind the UI, fade-in
    Atmosphere.tsx      Void background and FogExp2
    Starfield.tsx       Twinkling star sphere (shader points)
    DriftingMotes.tsx   Rising, self-recycling particles (used for dust and embers)
    PostEffects.tsx     Presence warp, bloom, the finale's red grade, tone mapping, presence grade, vignette (closes in during the Fall and with a presence), grain
    signs/              The signs: a hidden figure's presence, and lanterns guttering
      PresenceDirector.tsx  The nearest unfound figure → presence level (ramps, resets when found), heartbeat, GSAP ripples, events
      presenceFx.ts     The presence right now (level, figure, bpm, pulse, ripple), read by the post effects; dev requests
      PresenceWarpEffect.ts  Convolution effect: slow wave and color split at the screen's rim, the ripple's bend
      PresenceGradeEffect.ts  Desaturation and the ripple's dark band, after tone mapping
      LanternGutterDirector.tsx  When a lantern gutters (faster with a presence), which one, the lantern event
      lanternGutter.ts  The lantern guttering now and its level; the stutter curve; paper dimming
      tuning.ts         Range, ramps, heartbeat, ripple, warp and gutter numbers
    figures/            The hidden figures (drawing and finding)
      HiddenFigure.tsx  One figure: silhouette and glow facing the camera, glow haze and breath, click to find
      FigureWatcher.tsx Finds a figure held near the middle of the view for 1 s (with the wall check)
      silhouettes.ts    Canvas silhouettes: six robed poses, their eye slits; the glow texture
      figureMaterials.ts  Shared silhouette materials, the glow's brightness
      liveFigures.ts    The figures mounted now, for the watcher (and the dev panel)
      occlusion.ts      Is a figure hidden behind the castle? Rays to its middle and head against the mounted segments
      tuning.ts         Sizes, glow, how close and how centered and how long, click slop
    finale/
      RedShiftEffect.ts The finale's post-processing grade: every light vermilion
    IntroCameraRig.tsx  GSAP dolly from far back to the start of the bridge
    Player.tsx          First-person walker: smoothing, camera on the path, head-bob (per riser on stairs), look, footsteps (stands down during the Fall, follows scripted walks at forks), roll and shake
    invert/
      InvertDirector.tsx  The Inverted Chamber's roll over onto the ceiling and back (GSAP)
    shift/
      ShiftDirector.tsx  The biwa: when it sounds (still, random, dev), the rebuild, the moves, shake, hold; dev room requests
      runSegmentMotion.ts  Plays one segment's move (GSAP) on its wrapper groups
      tuning.ts         Shift timing, triggers, shake and lurch sizes
    fork/
      ForkDirector.tsx  Where the walk divides: arrival, choosing (resolveFork), the GSAP turn
      useForkInput.ts   A / D / ← / → / W / ↑ / Space / fresh scroll in halls, E / Q on stairs
      tuning.ts         Arrive / leave distances, what counts as a fresh scroll
    fall/
      FallDirector.tsx  THE FALL's script: input lock, GSAP camera timeline, carried light, FOV / fog, landing, seal
      FallStreaks.tsx   Embers streaking upward during the fall (instanced shader quads)
      fallFx.ts         Current fall speed, read by the vignette and streaks each frame
      tuning.ts         Pitch, FOV kick, wobble, vignette, carried light, fog
    player/
      tuning.ts         Every movement and look constant (eye height, speeds, bob, limits)
      usePlayerInput.ts Wheel, keys, mouse drag, touch swipe and mouse look-around
      walkPath.ts       WalkPath: what the player walks along (a point for any distance)
    lighting/
      lightSources.ts   Registry of warm light sources (position, intensity, reach, flicker)
      LightPool.tsx     10 point lights handed to the nearest sources each frame, with fades; dims a guttering lantern; amber to vermilion in the finale
      PooledLight.tsx   Registers one source at its world position (instead of <pointLight>); follows its segment in a room shift; can hand its source out (sourceRef)
    AudioListenerBinding.tsx  Hands the camera to the sound engine, so panned sounds are placed around it
    RenderStats.tsx     Dev: draw calls, triangles and shader programs per frame
    frameStats.ts       Where RenderStats (and the distant castle) leave their numbers for the dev panel
    Pagoda.tsx          Distant multi-story pagoda with lit window grids
    flaredRoof.ts       Square hip roof with concave slopes and swept-up corners (pagodas, distant castle)
    distantHaze.ts      Thinner fog + low fog bank for far scenery (material patch)
    distant/            The distant castle (drawing)
      DistantCastle.tsx The component: four instanced meshes, one update per frame
      DistantCastleSystem.ts  Cells around the camera, spawn queue, recycling, near / far detail, stats
      InstanceBank.ts   An instanced mesh in fixed per-piece blocks with partial uploads; slot allocator
      distantMaterial.ts  Unlit material patch: motion, fades in / out, thin haze (all in the shader)
      distantGeometry.ts  Shaded unit box, window quad, story and cap roofs
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
      flicker.ts        The lantern flicker curve, shared by paper and light
      lanternGeometry.ts  Lantern frame / paper / cord shapes, shared per kind
      shojiGeometry.ts  Shoji frame and lattice builder, paper rectangle
      KitInstances.tsx  Any shared geometry drawn once per placement (one InstancedMesh)
      BoxInstances.tsx  Identical cedar boxes, instanced, with world-scaled grain
      MergedBoxes.tsx   One-off boxes merged into a single mesh
      ShojiInstances.tsx  A wall of identical shoji panels in three draw calls
      LanternInstances.tsx  A row of lanterns in three draw calls, per-instance flicker, pooled lights (they follow a moving segment); cords turn with pitch
      HangingScroll.tsx Vermilion hanging scroll
      WoodBeam.tsx      Horizontal beam
      Post.tsx          Vertical post
      FloorPlanks.tsx   Polished floorboards with gaps
      ShojiPanel.tsx    Frame, lattice and glowing paper
      Lantern.tsx       Hanging and standing lanterns with a flickering point light
      Railing.tsx       Posts, top rail, lower rail
      tatamiLayout.ts   Traditional tatami layout search (no four-corner meetings)
      TatamiFloor.tsx   Tatami mats with dark borders
      Roof.tsx          Curved, extruded temple roof with upturned corners
      roofGeometry.ts   The roof's geometry builder, shared by Roof and RoofInstances
      RoofInstances.tsx Identical roofs in three draw calls (any pitch, e.g. upside down)
  world/                Level generation
    segment.ts          Segment, SegmentDefinition, SegmentPlan, ForkSpec and BranchPlan types; placeSegment, straightPlan, toWorld, turnPoint
    figures.ts          The six hidden figures: id, number, name, kanji, area, pose, three lines (names and lines are TODO placeholders); the finale's line
    WorldGenerator.ts   Seeded generator: keeps 3+ ahead / 1 behind, stops at forks (resolveFork), Crossroads previews, the junction schedule, forgets old ones; rebuildAhead (room shifts), segmentAt, holdEnd
    WorldPath.ts        Every segment's path joined into one walk, by distance; sealBefore() closes it behind the Fall
    World.tsx           Mounts the window of segments (and Crossroads previews, and rooms leaving in a shift); updates walkable bounds (held during a shift) and the world store
    SegmentView.tsx     One segment's component (and any hidden figure) in a group at its start transform, inside wrappers that play a room shift's move
    spawns/             Where the hidden figures stand
      spots.ts          Each area's hiding place from the room's params; the spawn roll
      tuning.ts         Spawn chance per area, and the dev override
      claims.ts         One figure in one place: a queue per figure of the rooms that could hold it
      FigureSpawn.tsx   A segment's figure and perch, mounted by SegmentView
      perchLayout.ts    A floating deck or balcony, piece by piece
      FigurePerch.tsx   Draws it (merged boxes, shoji, roof, lantern)
    shift/
      segmentMotion.ts  A segment's move in a room shift (types), and the context lights read to follow it
      shiftMotions.ts   How rooms leave (slide, hinge, drop), arrive (slide, hinge, rise, descend) and lurch
    Backdrop.tsx        Never unmounts: the distant pagodas and the warm hemisphere fill (vermilion in the finale)
    backdropLayout.ts   Where the pagodas stand, and the space around them to keep clear
    distant/            The distant castle (what goes where)
      towerDesign.ts    Cell grid, one tower or room per cell from hash(seed, cell), its parts
      walkClearance.ts  The space the near castle needs: a slab per walk height, a column per drop, an endless column round the Abyss
    useProgressTrigger.ts  Fire once when the player reaches a distance (doors)
    pieces/
      pavilionLayout.ts Floating pavilion proportions and layout
      FloatingPavilion.tsx  A pavilion hanging in the void, gently bobbing
      hangingStairsLayout.ts  An upside-down flight for a hall ceiling: where, and its pieces
      HangingStairs.tsx A staircase hanging upside down from a ceiling, with an upside-down lantern
    segments/
      registry.ts       The kinds the generator places and their weights (the Gate and the Fall are scripted; the Forking Hall is scheduled; the two special chambers are rare)
      common.ts         Bay size, pier pairs, lantern phases
      shojiWall.ts      Shoji wall along the walk (posts, beams, panels, transoms) and lit patterns
      stairs.ts         The castle's one step (riser, tread), flights (treads, risers, stringers), the walking line
      threshold/        The Threshold: layout.ts, Threshold.tsx, definition.ts
      fall/             The Fall: layout.ts (dimensions, plan), timing.ts (the script's times), deckLayout.ts,
                        CollapsingDeck.tsx, shaftLayout.ts (placer + pillars, rooms, stairs, towers), FallShaft.tsx,
                        HangingPillars.tsx, InvertedRooms.tsx, FloatingStairs.tsx, LitTowers.tsx, TheFall.tsx, definition.ts
      walkway/          The Suspended Walkway: layout.ts (curve, planks, rails, posts, a point beside the walk), SuspendedWalkway.tsx, definition.ts
      corridor/         The Shoji Corridor: layout.ts (and the false exit), ShojiCorridor.tsx, definition.ts
      gallery/          The Open Gallery: layout.ts, OpenGallery.tsx, definition.ts
      tatami/           The Tatami Room: layout.ts (runs, scroll and lantern changes), TatamiRoom.tsx, SlidingDoorPair.tsx, definition.ts
      hall/             The tall hall both halls share: layout.ts (walls, vestibules, the turn plans), Hall.tsx, HallDoors.tsx
      junction/         The Forking Hall: JunctionHall.tsx (doors that close), definition.ts
      crossroads/       The Crossroads: Crossroads.tsx, definition.ts (previews)
      stairwell/        The Stairwell: layout.ts (deck, flights, landings, tower, the walk up or down), Stairwell.tsx, definition.ts
      branch/           The walk out of a fork: definition.ts, BranchWalk.tsx (draws nothing)
      inverted/         The Inverted Chamber: layout.ts (two-tier walls, furniture on the ceiling, roll points), InvertedChamber.tsx, definition.ts
      abyss/            The Central Abyss: layout.ts (sagging bridge, tower ring and its balconies (cached), distant lights, embers), CentralAbyss.tsx,
                        AbyssTowers.tsx (unlit hazed towers, 4 draw calls), AbyssGlow.tsx (shader points), definition.ts
      Gate.tsx          The opening segment: bridge, landing, gate, back glow
      gate/
        definition.ts   The Gate as segment 0
        layout.ts       Every dimension of the opening, the walk's points, when the doors open, and the intro camera path
        Bridge.tsx      Bridge deck, stringers, railings, piers, head lanterns
        Landing.tsx     The platform the gate stands on
        GateHouse.tsx   The two-story gate: posts, shoji, balcony, upper story, roof
        ShojiBay.tsx    A bay of shoji panels with an optional lit transom
        GateDoors.tsx   Board doors with light leaking through; they swing open as you approach
        DoorLightSpill.tsx  Additive light streak on the floor in front of the doors
        doorSpillMaterial.ts  Its shared material and canvas mask
        GateBackGlow.tsx  Faint warm haze behind the roof
  audio/                Sound: all synthesized live with the Web Audio API, no files
    AudioEngine.ts      The engine: context (unlocked on the Enter click), master gain following the toggle (suspends when off), muffle, compressor, hall reverb, panners; one method per sound
    AudioDirector.tsx   Connects the engine to footsteps, doors, signs, room shifts, the Fall, the guide, the toggle and the finale (mounted with the castle)
    tuning.ts           Every level and shape
    nodes.ts            Shared helpers: noise sources, envelopes, thumps, equal-power panners, glides
    buffers.ts          Computed buffers: white and brown noise, the hall's impulse response, Karplus-Strong plucks
    Ambience.ts         Wind (filtered brown noise, LFO on the cutoff, gusts) and drone; darkens with a presence
    footstep.ts         Footsteps on wood: bandpassed noise click and low thump, random pitch, run / walk
    door.ts             Sliding shoji (filtered noise sweep, knock or clack) and the Gate (thud, sweep, groaning hinge)
    crackle.ts          A guttering lantern's crackle (clicks written into gain automation) and flame breath
    biwa.ts             Biwa phrases on Karplus-Strong strings (miyako-bushi scale), plectrum, bends
    heartbeat.ts        Lub-dub: two low sine thumps and a soft thud
    swells.ts           A ripple's low swell, and a room shift's rumble
    FallRoar.ts         The Fall: deck cracking, the floor giving, the rising wind roar and whistle, the landing
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
- [x] 8. The endless segment system
- [x] 9. The HUD
- [x] 10. The Fall
- [x] 11. The distant castle
- [x] 12. Junctions and stairs
- [x] 13. Special chambers
- [x] 14. The hidden figures
- [x] 15. Signs and presence
- [x] 16. Audio
- [ ] 17. Mobile, performance and polish
- [ ] 18. Deploy
