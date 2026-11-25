import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Euler, InstancedBufferAttribute, Vector3, type Group } from 'three'
import { addLightSources, type LightSource } from '../lighting/lightSources'
import { lanternFlicker, paperGlow } from './flicker'
import KitInstances from './KitInstances'
import { CORD_BASE, getCordGeometry, getLanternShape, LANTERN_LIGHT_DISTANCE, type LanternKind } from './lanternGeometry'
import { getInstancedLanternPaperMaterial, getWoodMaterial } from './materials'
import type { InstanceTransform, Vec3 } from './types'
import { useDisposable } from './useDisposable'

export interface LanternPlacement {
  /** Hanging: center of the body. Standing: center of the base. */
  position: Vec3
  yaw?: number
  /** Tilt about its own X after the yaw: `Math.PI` stands a lantern upside down (under a hanging landing). */
  pitch?: number
  /** Flicker phase, so neighbours pulse out of step. */
  phase: number
}

interface LanternInstancesProps {
  kind: LanternKind
  lanterns: readonly LanternPlacement[]
  /** Uniform scale shared by the row. */
  size?: number
  /** Hanging lanterns: cord length above the body (before scaling). */
  cord?: number
  /** Light intensity of each lantern (candela). */
  intensity?: number
}

const scratch = new Vector3()
const offset = new Vector3()
const turn = new Euler(0, 0, 0, 'YXZ')

/**
 * A row of identical lanterns in three draw calls (frames, paper, cords). Each lantern
 * flickers out of step through a per-instance glow attribute, and registers a light source
 * with the `LightPool`, which lights the nearest ones. The parent must not move after mount.
 */
export default function LanternInstances({ kind, lanterns, size = 1, cord = 0.8, intensity = 10 }: LanternInstancesProps) {
  const shape = getLanternShape(kind)
  const groupRef = useRef<Group>(null)
  const count = lanterns.length

  // Each row gets its own copy of the (tiny) paper box, to carry its glow attribute.
  const paper = useDisposable(() => {
    const geometry = shape.paper.clone()
    geometry.setAttribute('instanceGlow', new InstancedBufferAttribute(new Float32Array(Math.max(1, count)).fill(1), 1))
    return geometry
  }, [shape, count])

  const items = useMemo<InstanceTransform[]>(
    () => lanterns.map((l) => ({ position: l.position, yaw: l.yaw, pitch: l.pitch, scale: [size, size, size] })),
    [lanterns, size],
  )
  const cords = useMemo<InstanceTransform[]>(
    () =>
      kind === 'hanging' && cord > 0
        ? lanterns.map(({ position: [x, y, z] }) => ({ position: [x, y + CORD_BASE * size, z], scale: [size, cord * size, size] }))
        : [],
    [kind, lanterns, size, cord],
  )

  useLayoutEffect(() => {
    const group = groupRef.current
    if (!group) return
    group.updateWorldMatrix(true, false)
    const sources: LightSource[] = lanterns.map(({ position: [x, y, z], yaw = 0, pitch = 0, phase }) => {
      offset.set(0, shape.lightY * size, 0).applyEuler(turn.set(pitch, yaw, 0, 'YXZ'))
      scratch.set(x + offset.x, y + offset.y, z + offset.z).applyMatrix4(group.matrixWorld)
      return { x: scratch.x, y: scratch.y, z: scratch.z, intensity, distance: LANTERN_LIGHT_DISTANCE, flicker: true, phase }
    })
    return addLightSources(sources)
  }, [lanterns, size, intensity, shape])

  useFrame(({ clock }) => {
    const attribute = paper.getAttribute('instanceGlow') as InstancedBufferAttribute
    const glow = attribute.array as Float32Array
    const t = clock.elapsedTime
    for (let i = 0; i < count; i++) glow[i] = paperGlow(lanternFlicker(t, lanterns[i].phase))
    attribute.needsUpdate = true
  })

  return (
    <group ref={groupRef}>
      <KitInstances geometry={shape.frame} material={getWoodMaterial()} items={items} />
      <KitInstances geometry={paper} material={getInstancedLanternPaperMaterial()} items={items} />
      <KitInstances geometry={getCordGeometry()} material={getWoodMaterial()} items={cords} />
    </group>
  )
}
