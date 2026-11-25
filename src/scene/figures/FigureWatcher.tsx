import { useFrame } from '@react-three/fiber'
import { Vector3 } from 'three'
import { discoverFigure } from '../../state/hiddenFigures'
import { useFallStore } from '../../state/useFallStore'
import { useFigureStore } from '../../state/useFigureStore'
import { useGameStore } from '../../state/useGameStore'
import { getLiveFigures } from './liveFigures'
import { isFigureHidden } from './occlusion'
import { FOUND_CONE, FOUND_DISTANCE, FOUND_DWELL, OCCLUSION_RECHECK } from './tuning'

const COS_CONE = Math.cos(FOUND_CONE)
const forward = new Vector3()
const center = new Vector3()

/**
 * Finds a hidden figure by looking at it: when one stays within FOUND_DISTANCE and FOUND_CONE
 * of the center of the view for FOUND_DWELL seconds, with nothing of the castle in between, it
 * is found (`discoverFigure`). Looking away, or it slipping out of range, starts the count again.
 * Nothing counts during the intro, the Fall, the finale or with the guide open. No allocations.
 */
export default function FigureWatcher() {
  useFrame(({ camera, scene }, delta) => {
    const figures = getLiveFigures()
    if (figures.length === 0) return
    const game = useGameStore.getState()
    const paused = !game.introComplete || game.guideOpen || game.finale || useFallStore.getState().phase === 'falling'
    const found = useFigureStore.getState().found
    camera.getWorldDirection(forward)

    for (const figure of figures) {
      figure.anchor.getWorldPosition(center)
      const dx = center.x - camera.position.x
      const dy = center.y - camera.position.y
      const dz = center.z - camera.position.z
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)
      figure.distance = distance
      if (paused || found[figure.index]) {
        figure.dwell = 0
        continue
      }
      const facing = distance > 1e-4 ? (dx * forward.x + dy * forward.y + dz * forward.z) / distance : 1
      if (distance > FOUND_DISTANCE || facing < COS_CONE) {
        figure.dwell = 0
        continue
      }
      figure.dwell += Math.min(delta, 0.1)
      if (figure.dwell < FOUND_DWELL) continue
      if (isFigureHidden(scene, camera.position, figure.anchor)) {
        // Something is in the way: keep watching, and look again shortly.
        figure.dwell = FOUND_DWELL - OCCLUSION_RECHECK
        continue
      }
      figure.dwell = 0
      discoverFigure(figure.index)
    }
  })

  return null
}
