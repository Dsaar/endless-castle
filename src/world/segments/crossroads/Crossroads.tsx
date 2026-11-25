import { useMemo } from 'react'
import type { SegmentProps } from '../../segment'
import Hall from '../hall/Hall'
import { buildHallLayout, type HallParams } from '../hall/layout'

/**
 * The Crossroads: the same tall hall as the Forking Hall, but with no doors at all. Every way
 * is open, and the room beyond each one is already built (see `WorldGenerator`), so you can
 * look down all three before you choose. Nothing closes after.
 */
export default function Crossroads({ segment }: SegmentProps<HallParams>) {
  const p = segment.params
  const layout = useMemo(() => buildHallLayout(p), [p])
  return <Hall params={p} layout={layout} />
}
