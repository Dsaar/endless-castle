import { palette } from '../lib/palette'
import { useAtmosphereStore } from '../state/useAtmosphereStore'

/** Scene background and exponential fog, both in the void color so everything dissolves into black. */
export default function Atmosphere() {
  const fogDensity = useAtmosphereStore((s) => s.fogDensity)

  return (
    <>
      <color attach="background" args={[palette.void]} />
      <fogExp2 attach="fog" args={[palette.void, fogDensity]} density={fogDensity} />
    </>
  )
}
