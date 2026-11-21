import Bridge from './gate/Bridge'
import GateBackGlow from './gate/GateBackGlow'
import GateHouse from './gate/GateHouse'
import { BACK_GLOW_FADE, GATE_Z } from './gate/layout'
import Landing from './gate/Landing'

/**
 * The opening segment: a long bridge over the void to a two-story gate whose heavy doors
 * swing open as the player nears, and a landing behind it where the endless castle begins.
 * (The distant pagodas and the faint warm fill live in `Backdrop`, which never unmounts.)
 */
export default function Gate() {
  return (
    <group>
      <Bridge />
      <Landing />
      <GateHouse />
      {/* Behind the roof, so its curve reads against the void. Fades before the walk reaches it. */}
      <GateBackGlow position={[0, 7, GATE_Z - 14]} size={[46, 26]} fadeOut={BACK_GLOW_FADE} />
    </group>
  )
}
