import FloorPlanks from '../../../scene/kit/FloorPlanks'
import Lantern from '../../../scene/kit/Lantern'
import Post from '../../../scene/kit/Post'
import Railing from '../../../scene/kit/Railing'
import Roof from '../../../scene/kit/Roof'
import WoodBeam from '../../../scene/kit/WoodBeam'
import PooledLight from '../../../scene/lighting/PooledLight'
import {
  DOOR_HEIGHT,
  DOORS_OPEN_AT,
  GATE_BAY,
  GATE_CENTER_Z,
  GATE_DEPTH,
  GATE_POST,
  GATE_POSTS_X,
  GATE_Z,
  LOWER_HEIGHT,
  UPPER_FLOOR,
  UPPER_TOP,
} from './layout'
import ShojiBay from './ShojiBay'
import GateDoors from './GateDoors'

const ALONG_Z: [number, number, number] = [0, Math.PI / 2, 0]
const OUTER_X = GATE_POSTS_X[3]
/** Full width across the outer faces of the corner posts. */
const SPAN = OUTER_X * 2 + GATE_POST
const BACK_Z = GATE_Z - GATE_DEPTH
/** Centers of the two side bays (doors in the middle bay). */
const SIDE_BAYS_X = [(GATE_POSTS_X[0] + GATE_POSTS_X[1]) / 2, (GATE_POSTS_X[2] + GATE_POSTS_X[3]) / 2]
const ALL_BAYS_X = [SIDE_BAYS_X[0], 0, SIDE_BAYS_X[1]]
const SILL = 0.06
const LINTEL = 0.4

/** The balcony deck overhangs the lower story by this much on every side. */
const DECK_OVERHANG = 0.7
const UPPER_POST = 0.32
const UPPER_SHOJI = UPPER_TOP - UPPER_FLOOR - SILL - 0.32

/** Roof: eave tips sit below the top of the upper walls and sweep well past them. */
const ROOF_Y = 5.81
const ROOF_SIZE: [number, number, number] = [9.6, 3.4, 15.8]

/** Lanterns hang under the balcony, either side of the doors. */
const LANTERN_X = 2.6
const LANTERN_Y = 2.5
const LANTERN_SIZE = 1.5

/** The doorway through the back wall: as wide as the middle bay and as tall as the doors. */
const BACK_SIDE_WALL = SPAN / 2 - 0.05 - GATE_BAY / 2

/**
 * The two-story gate (rōmon). Lower story: heavy board doors in the middle bay and glowing
 * shoji with lit transoms either side, two hanging lanterns in front. The doors swing open as
 * the player nears, and an open doorway in the back wall leads on. A balcony with a railing
 * wraps the upper story, which is lit shoji all across. A large curved roof with swept-up
 * corners crowns it, on a band of stacked bracket beams.
 */
export default function GateHouse() {
  return (
    <group>
      {/* ---- Lower story ---- */}
      {GATE_POSTS_X.map((x) =>
        [GATE_Z, BACK_Z].map((z) => (
          <Post key={`${x}${z}`} position={[x, 0, z]} size={[GATE_POST, LOWER_HEIGHT, GATE_POST]} />
        )),
      )}
      {/* Sills under the shoji (the doors bring their own), and the lintel band the balcony rests on. */}
      {SIDE_BAYS_X.map((x) => (
        <WoodBeam key={x} position={[x, SILL / 2, GATE_Z]} size={[GATE_BAY, SILL, 0.2]} />
      ))}
      <WoodBeam position={[0, LOWER_HEIGHT - LINTEL / 2, GATE_Z]} size={[SPAN, LINTEL, 0.3]} />

      <GateDoors position={[0, 0, GATE_Z]} width={GATE_BAY} height={DOOR_HEIGHT} openAt={DOORS_OPEN_AT} />
      {SIDE_BAYS_X.map((x) => (
        <ShojiBay
          key={x}
          position={[x, SILL, GATE_Z]}
          width={GATE_BAY}
          height={2.4}
          transom={LOWER_HEIGHT - LINTEL - SILL - 2.4 - 0.14}
        />
      ))}

      {/* Plain board walls close the sides and back; the back wall has a doorway behind the doors. */}
      {[-1, 1].map((side) => (
        <group key={side}>
          <Post position={[side * OUTER_X, 0, GATE_CENTER_Z]} size={[0.12, LOWER_HEIGHT, GATE_DEPTH]} />
          <Post
            position={[side * (GATE_BAY / 2 + BACK_SIDE_WALL / 2), 0, BACK_Z]}
            size={[BACK_SIDE_WALL, LOWER_HEIGHT, 0.12]}
          />
        </group>
      ))}
      <Post position={[0, DOOR_HEIGHT, BACK_Z]} size={[GATE_BAY, LOWER_HEIGHT - DOOR_HEIGHT, 0.12]} />
      <WoodBeam position={[0, DOOR_HEIGHT + 0.1, BACK_Z + 0.08]} size={[GATE_BAY + 0.3, 0.2, 0.08]} />

      <Lantern position={[-LANTERN_X, LANTERN_Y, GATE_Z + 0.45]} size={LANTERN_SIZE} cord={0.48} intensity={11} phase={1} />
      <Lantern position={[LANTERN_X, LANTERN_Y, GATE_Z + 0.45]} size={LANTERN_SIZE} cord={0.48} intensity={11} phase={2} />

      {/* ---- Balcony ---- */}
      {/* Bracket beams poke out under the deck at every post. */}
      {GATE_POSTS_X.map((x) => (
        <WoodBeam key={x} position={[x, LOWER_HEIGHT - 0.12, GATE_Z + 0.3]} rotation={ALONG_Z} size={[1.05, 0.24, 0.22]} />
      ))}
      <FloorPlanks
        position={[0, UPPER_FLOOR, GATE_CENTER_Z]}
        size={[SPAN + DECK_OVERHANG * 2, GATE_DEPTH + DECK_OVERHANG * 2]}
      />
      <WoodBeam
        position={[0, UPPER_FLOOR - 0.09, GATE_Z + DECK_OVERHANG + 0.03]}
        size={[SPAN + DECK_OVERHANG * 2, 0.14, 0.06]}
      />
      <Railing position={[0, UPPER_FLOOR, GATE_Z + DECK_OVERHANG - 0.1]} length={SPAN + DECK_OVERHANG * 2 - 0.2} size={[0.78, 0.09]} />
      {[-1, 1].map((side) => (
        <Railing
          key={side}
          position={[side * (SPAN / 2 + DECK_OVERHANG - 0.1), UPPER_FLOOR, GATE_CENTER_Z]}
          rotation={ALONG_Z}
          length={GATE_DEPTH + DECK_OVERHANG * 2 - 0.2}
          size={[0.78, 0.09]}
        />
      ))}

      {/* ---- Upper story ---- */}
      {GATE_POSTS_X.map((x) =>
        [GATE_Z, BACK_Z].map((z) => (
          <Post key={`${x}${z}`} position={[x, UPPER_FLOOR, z]} size={[UPPER_POST, UPPER_TOP - UPPER_FLOOR, UPPER_POST]} />
        )),
      )}
      <WoodBeam position={[0, UPPER_FLOOR + SILL / 2, GATE_Z]} size={[SPAN, SILL, 0.18]} />
      {ALL_BAYS_X.map((x) => (
        <ShojiBay
          key={x}
          position={[x, UPPER_FLOOR + SILL, GATE_Z]}
          width={GATE_POSTS_X[2] - GATE_POSTS_X[1] - UPPER_POST}
          height={UPPER_SHOJI}
        />
      ))}
      <WoodBeam position={[0, UPPER_TOP - 0.16, GATE_Z]} size={[SPAN, 0.32, 0.28]} />
      {[-1, 1].map((side) => (
        <Post
          key={side}
          position={[side * OUTER_X, UPPER_FLOOR, GATE_CENTER_Z]}
          size={[0.12, UPPER_TOP - UPPER_FLOOR, GATE_DEPTH]}
        />
      ))}
      <Post position={[0, UPPER_FLOOR, BACK_Z]} size={[SPAN - 0.1, UPPER_TOP - UPPER_FLOOR, 0.12]} />

      {/* ---- Bracket band and roof ---- */}
      {/* Stacked beams step outward to meet the eaves; a frieze closes the gap above them. */}
      <WoodBeam position={[0, UPPER_TOP + 0.13, GATE_Z + 0.03]} size={[SPAN + 0.3, 0.26, 0.36]} />
      <WoodBeam position={[0, UPPER_TOP + 0.39, GATE_Z + 0.08]} size={[SPAN + 0.8, 0.26, 0.46]} />
      <WoodBeam position={[0, UPPER_TOP + 0.72, GATE_Z + 0.1]} size={[SPAN + 1.2, 0.4, 0.1]} />
      {[-1, 1].map((side) => (
        <WoodBeam
          key={side}
          position={[side * (OUTER_X + 0.2), UPPER_TOP + 0.4, GATE_CENTER_Z]}
          rotation={ALONG_Z}
          size={[GATE_DEPTH + 0.6, 0.8, 0.12]}
        />
      ))}
      <WoodBeam position={[0, UPPER_TOP + 0.5, BACK_Z - 0.05]} size={[SPAN + 0.8, 0.9, 0.12]} />

      {/* The upper shoji wall's own glow, thrown onto the balcony, brackets and eaves soffit
          so the roof reads against the void. */}
      <PooledLight position={[0, UPPER_FLOOR + 1.1, GATE_Z + 1.1]} intensity={22} distance={11} />

      <Roof position={[0, ROOF_Y, GATE_CENTER_Z]} rotation={ALONG_Z} size={ROOF_SIZE} />
    </group>
  )
}
