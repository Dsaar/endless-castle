import FloorPlanks from '../../../scene/kit/FloorPlanks'
import Post from '../../../scene/kit/Post'
import Railing from '../../../scene/kit/Railing'
import WoodBeam from '../../../scene/kit/WoodBeam'
import { BRIDGE_END_Z, BRIDGE_WIDTH, LANDING_CENTER_Z, LANDING_DEPTH, LANDING_EXIT_WIDTH, LANDING_WIDTH } from './layout'

const HW = LANDING_WIDTH / 2
const FRONT_Z = BRIDGE_END_Z
const BACK_Z = BRIDGE_END_Z - LANDING_DEPTH
const ALONG_Z: [number, number, number] = [0, Math.PI / 2, 0]
const RAIL: [number, number] = [1, 0.12]
/** The front railing runs from the bridge's railing out to the corner, on each side. */
const FRONT_RAIL = HW - BRIDGE_WIDTH / 2
const PIER_DEPTH = 20
/** The back railing runs from the corner in to the exit gap, on each side. */
const BACK_RAIL = HW - 0.1 - LANDING_EXIT_WIDTH / 2

/**
 * The platform the gate stands on: a wide deck with railings, held up by four tall piers.
 * The back railing leaves a gap where the castle's first Threshold carries on.
 */
export default function Landing() {
  return (
    <group>
      <FloorPlanks position={[0, 0, LANDING_CENTER_Z]} size={[LANDING_WIDTH, LANDING_DEPTH]} plankWidth={0.24} />

      {/* Deep edge beams give the platform some thickness. */}
      <WoodBeam position={[0, -0.32, FRONT_Z - 0.15]} size={[LANDING_WIDTH, 0.56, 0.3]} />
      <WoodBeam position={[0, -0.32, BACK_Z + 0.15]} size={[LANDING_WIDTH, 0.56, 0.3]} />
      {[-1, 1].map((side) => (
        <WoodBeam
          key={side}
          position={[side * (HW - 0.15), -0.32, LANDING_CENTER_Z]}
          rotation={ALONG_Z}
          size={[LANDING_DEPTH - 0.6, 0.56, 0.3]}
        />
      ))}

      {/* Railings: front (either side of the bridge), sides, and back (either side of the exit). */}
      {[-1, 1].map((side) => (
        <group key={side}>
          <Railing
            position={[side * (BRIDGE_WIDTH / 2 + FRONT_RAIL / 2), 0, FRONT_Z - 0.1]}
            length={FRONT_RAIL}
            size={RAIL}
          />
          <Railing
            position={[side * (HW - 0.1), 0, LANDING_CENTER_Z]}
            rotation={ALONG_Z}
            length={LANDING_DEPTH - 0.2}
            size={RAIL}
          />
        </group>
      ))}
      {[-1, 1].map((side) => (
        <Railing
          key={side}
          position={[side * (LANDING_EXIT_WIDTH / 2 + BACK_RAIL / 2), 0, BACK_Z + 0.1]}
          length={BACK_RAIL}
          size={RAIL}
        />
      ))}

      {/* Corner piers. */}
      {[-1, 1].map((sx) =>
        [FRONT_Z - 0.5, BACK_Z + 0.5].map((z) => (
          <Post key={`${sx}${z}`} position={[sx * (HW - 0.6), -0.6 - PIER_DEPTH, z]} size={[0.7, PIER_DEPTH, 0.7]} />
        )),
      )}
    </group>
  )
}
