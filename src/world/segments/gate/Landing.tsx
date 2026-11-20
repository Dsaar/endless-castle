import FloorPlanks from '../../../scene/kit/FloorPlanks'
import Post from '../../../scene/kit/Post'
import Railing from '../../../scene/kit/Railing'
import WoodBeam from '../../../scene/kit/WoodBeam'
import { BRIDGE_END_Z, BRIDGE_WIDTH, LANDING_CENTER_Z, LANDING_DEPTH, LANDING_WIDTH } from './layout'

const HW = LANDING_WIDTH / 2
const FRONT_Z = BRIDGE_END_Z
const BACK_Z = BRIDGE_END_Z - LANDING_DEPTH
const ALONG_Z: [number, number, number] = [0, Math.PI / 2, 0]
const RAIL: [number, number] = [1, 0.12]
/** The front railing runs from the bridge's railing out to the corner, on each side. */
const FRONT_RAIL = HW - BRIDGE_WIDTH / 2
const PIER_DEPTH = 20

/** The platform the gate stands on: a wide deck with railings, held up by four tall piers. */
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

      {/* Railings: front (either side of the bridge), sides and back. */}
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
      <Railing position={[0, 0, BACK_Z + 0.1]} length={LANDING_WIDTH - 0.2} size={RAIL} />

      {/* Corner piers. */}
      {[-1, 1].map((sx) =>
        [FRONT_Z - 0.5, BACK_Z + 0.5].map((z) => (
          <Post key={`${sx}${z}`} position={[sx * (HW - 0.6), -0.6 - PIER_DEPTH, z]} size={[0.7, PIER_DEPTH, 0.7]} />
        )),
      )}
    </group>
  )
}
