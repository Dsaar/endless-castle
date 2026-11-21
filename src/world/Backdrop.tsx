import { palette } from '../lib/palette'
import Pagoda from '../scene/Pagoda'

/**
 * Scenery that stays put while segments come and go: the two distant pagodas either side of
 * the gate, and a whisper of warm hemisphere fill so unlit wood still reads against the void.
 * Kept out of the segments because unmounting a light would recompile every lit shader, and
 * the pagodas stay in view long after the Gate itself is gone.
 */
export default function Backdrop() {
  return (
    <group>
      <hemisphereLight args={[palette.lantern, palette.void, 0.1]} />
      <Pagoda position={[-44, -12, -82]} rotationY={0.38} seed={7} />
      <Pagoda position={[47, -14, -90]} rotationY={-0.3} baseWidth={12} tierHeight={6.4} seed={19} />
    </group>
  )
}
