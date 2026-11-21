import { useFrame } from '@react-three/fiber'
import { frameStats } from './frameStats'

/**
 * Dev only: counts draw calls and triangles over a whole frame, post-processing passes
 * included (the renderer's own counter resets on every pass), plus the number of shader
 * programs, which should stay flat while walking.
 */
export default function RenderStats() {
  // Runs first each frame: record what the previous frame drew, then start counting afresh.
  useFrame(({ gl }) => {
    const { info } = gl
    info.autoReset = false
    frameStats.calls = info.render.calls
    frameStats.triangles = info.render.triangles
    frameStats.programs = info.programs?.length ?? 0
    info.reset()
  }, -100)

  return null
}
