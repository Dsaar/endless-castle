import { useMemo } from 'react'
import { useWorldStore } from '../../../state/useWorldStore'
import type { SegmentProps } from '../../segment'
import CollapsingDeck from './CollapsingDeck'
import { buildDeckLayout } from './deckLayout'
import FallShaft from './FallShaft'
import type { FallParams } from './layout'

/**
 * THE FALL as a segment: the old plank deck the first Threshold runs out onto, and the shaft
 * below it, full of things to fall past. The script itself (camera, input lock, landing) is
 * `FallDirector`'s. The shaft only mounts once the player is on the Threshold before it, so
 * it costs nothing at the Gate.
 */
export default function TheFall({ segment }: SegmentProps<FallParams>) {
  const { seed } = segment.params
  const deck = useMemo(() => buildDeckLayout(seed), [seed])
  const near = useWorldStore((s) => s.room >= segment.id - 1)

  return (
    <group>
      <CollapsingDeck layout={deck} seed={seed} />
      {near && <FallShaft seed={seed} />}
    </group>
  )
}
