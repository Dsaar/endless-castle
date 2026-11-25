import { useMemo } from 'react'
import LanternInstances from '../../scene/kit/LanternInstances'
import MergedBoxes from '../../scene/kit/MergedBoxes'
import Roof from '../../scene/kit/Roof'
import ShojiInstances from '../../scene/kit/ShojiInstances'
import { WALL_PANEL_SIZE } from '../segments/shojiWall'
import { buildPerchLayout } from './perchLayout'
import type { PerchSpec } from './spots'

const LANTERN_SIZE = 0.8
const LANTERN_INTENSITY = 5

/**
 * A piece of floor floating in the void where a hidden figure stands (see `perchLayout`). It
 * stays there whether or not its figure does. 1 to 5 draw calls; a deck's lantern takes a
 * light from the pool when it is among the nearest. Holds still, so the figure on it does too.
 */
export default function FigurePerch({ perch }: { perch: PerchSpec }) {
  const layout = useMemo(() => buildPerchLayout(perch), [perch])

  return (
    <group position={perch.position} rotation={[0, perch.yaw, 0]}>
      <MergedBoxes boxes={layout.boxes} seed={perch.seed} />
      {layout.panels.length > 0 && <ShojiInstances size={WALL_PANEL_SIZE} panels={layout.panels} seed={perch.seed} />}
      {layout.roof && (
        <Roof position={layout.roof.position} rotation={[0, Math.PI / 2, 0]} size={layout.roof.size} seed={perch.seed} />
      )}
      {layout.lanterns.length > 0 && (
        <LanternInstances kind="standing" lanterns={layout.lanterns} size={LANTERN_SIZE} intensity={LANTERN_INTENSITY} />
      )}
    </group>
  )
}
