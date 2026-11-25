import { useEffect, useMemo, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import type { Group } from 'three'
import BoxInstances from '../../../scene/kit/BoxInstances'
import LanternInstances from '../../../scene/kit/LanternInstances'
import type { SegmentProps } from '../../segment'
import AbyssGlow from './AbyssGlow'
import AbyssTowers from './AbyssTowers'
import {
  ARM,
  buildBridgeLayout,
  buildEmbers,
  buildFarLights,
  EMBER_LOW,
  EMBER_SPAN,
  LANTERN_CORD,
  LANTERN_POST,
  LANTERN_SIZE,
  PLANK,
  RAIL,
  RAIL_POST,
  STRINGER,
  type AbyssParams,
} from './layout'

/**
 * The Central Abyss: one long, thin bridge across a huge round void, a lantern on a post every
 * 8–11 m. All round, towers of lit stories rise and sink out of sight; beyond them, lights hang
 * far off in the dark, and embers drift slowly up from below. About 20 draw calls. Its shaders
 * compile as soon as it mounts (a few rooms ahead), not when it comes into view.
 */
export default function CentralAbyss({ segment }: SegmentProps<AbyssParams>) {
  const p = segment.params
  const bridge = useMemo(() => buildBridgeLayout(p), [p])
  const far = useMemo(() => buildFarLights(p), [p])
  const embers = useMemo(() => buildEmbers(p), [p])
  const groupRef = useRef<Group>(null)
  const gl = useThree((s) => s.gl)
  const camera = useThree((s) => s.camera)
  const scene = useThree((s) => s.scene)

  useEffect(() => {
    if (groupRef.current) void gl.compileAsync(groupRef.current, camera, scene)
  }, [gl, camera, scene])

  return (
    <group ref={groupRef}>
      <BoxInstances size={PLANK} grain={0} items={bridge.planks} seed={p.seed} />
      <BoxInstances size={STRINGER} grain={2} items={bridge.stringers} seed={p.seed + 1} />
      <BoxInstances size={RAIL_POST} grain={1} items={bridge.railPosts} seed={p.seed + 2} />
      <BoxInstances size={RAIL} grain={2} items={bridge.rails} seed={p.seed + 3} />
      <BoxInstances size={LANTERN_POST} anchor="base" grain={1} items={bridge.lanternPosts} seed={p.seed + 4} />
      <BoxInstances size={ARM} grain={0} items={bridge.arms} seed={p.seed + 5} />
      <LanternInstances kind="hanging" lanterns={bridge.lanterns} size={LANTERN_SIZE} cord={LANTERN_CORD} intensity={8} />
      <AbyssTowers params={p} />
      {/* Lights far off beyond the towers. */}
      <AbyssGlow cloud={far} size={0.9} brightness={1.7} flicker={0.3} near={30} far={320} />
      {/* Embers rising slowly through the void. */}
      <AbyssGlow cloud={embers} rise={0.35} low={EMBER_LOW} span={EMBER_SPAN} size={0.13} brightness={2.6} flicker={1} near={1.2} far={90} />
    </group>
  )
}
