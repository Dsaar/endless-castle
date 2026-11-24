import { palette } from '../lib/palette'
import Pagoda from '../scene/Pagoda'
import { PAGODAS } from './backdropLayout'

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
      {PAGODAS.map((p) => (
        <Pagoda key={p.seed} {...p} />
      ))}
    </group>
  )
}
