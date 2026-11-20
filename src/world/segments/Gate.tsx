import { palette } from '../../lib/palette'
import Pagoda from '../../scene/Pagoda'
import Bridge from './gate/Bridge'
import GateBackGlow from './gate/GateBackGlow'
import GateHouse from './gate/GateHouse'
import { GATE_Z } from './gate/layout'
import Landing from './gate/Landing'

/**
 * The opening scene: a long bridge over the void to a two-story gate with closed, glowing
 * doors, and two distant pagodas, left and right, half lost in the fog.
 */
export default function Gate() {
  return (
    <group>
      {/* A whisper of warm fill so the unlit stretch of bridge still reads against the void. */}
      <hemisphereLight args={[palette.lantern, palette.void, 0.1]} />
      <Bridge />
      <Landing />
      <GateHouse />
      {/* Behind the roof, so its curve reads against the void. */}
      <GateBackGlow position={[0, 7, GATE_Z - 14]} size={[46, 26]} />
      <Pagoda position={[-44, -12, -82]} rotationY={0.38} seed={7} />
      <Pagoda position={[47, -14, -90]} rotationY={-0.3} baseWidth={12} tierHeight={6.4} seed={19} />
    </group>
  )
}
