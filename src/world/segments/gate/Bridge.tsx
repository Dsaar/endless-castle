import FloorPlanks from '../../../scene/kit/FloorPlanks'
import Lantern from '../../../scene/kit/Lantern'
import Post from '../../../scene/kit/Post'
import Railing from '../../../scene/kit/Railing'
import WoodBeam from '../../../scene/kit/WoodBeam'
import { BRIDGE_LENGTH, BRIDGE_WIDTH } from './layout'

const HALF = BRIDGE_WIDTH / 2
const MID_Z = -BRIDGE_LENGTH / 2
const ALONG_Z: [number, number, number] = [0, Math.PI / 2, 0]
/** Piers drop this far into the void; the fog swallows them long before the end. */
const PIER_DEPTH = 16
const PIERS_Z = [-3, -7.5, -12, -16.5]

/**
 * The long bridge from z = 0 to the landing: cross planks on two stringers, railings on both
 * sides, piers dropping into the void, and a pair of floor lanterns at its head.
 */
export default function Bridge() {
  return (
    <group>
      {/* Boards run across the bridge (local X), rows march along Z. */}
      <FloorPlanks position={[0, 0, MID_Z]} size={[BRIDGE_WIDTH, BRIDGE_LENGTH]} plankWidth={0.24} />

      {/* Stringers under the deck edges. */}
      {[-1, 1].map((side) => (
        <WoodBeam
          key={side}
          position={[side * (HALF - 0.12), -0.22, MID_Z]}
          rotation={ALONG_Z}
          size={[BRIDGE_LENGTH, 0.36, 0.22]}
        />
      ))}

      {/* Railings, set just inside the deck edge. */}
      {[-1, 1].map((side) => (
        <Railing
          key={side}
          position={[side * (HALF - 0.08), 0, MID_Z]}
          rotation={ALONG_Z}
          length={BRIDGE_LENGTH}
          size={[1, 0.12]}
        />
      ))}

      {/* Piers: a pair of posts and a cross beam every few meters. */}
      {PIERS_Z.map((z) => (
        <group key={z}>
          <WoodBeam position={[0, -0.53, z]} size={[BRIDGE_WIDTH + 0.4, 0.26, 0.28]} />
          <Post position={[-HALF + 0.2, -0.66 - PIER_DEPTH, z]} size={[0.32, PIER_DEPTH, 0.32]} />
          <Post position={[HALF - 0.2, -0.66 - PIER_DEPTH, z]} size={[0.32, PIER_DEPTH, 0.32]} />
          <WoodBeam position={[0, -3.2, z]} size={[BRIDGE_WIDTH - 0.4, 0.2, 0.2]} />
        </group>
      ))}

      {/* Floor lanterns at the bridge head: the first warm light the player stands in. */}
      <Lantern kind="standing" position={[-HALF + 0.38, 0, -3.6]} size={1.1} intensity={5} phase={11} />
      <Lantern kind="standing" position={[HALF - 0.38, 0, -3.6]} size={1.1} intensity={5} phase={12} />
    </group>
  )
}
