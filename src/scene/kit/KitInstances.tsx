import { useLayoutEffect, useRef } from 'react'
import { Euler, Matrix4, Quaternion, Vector3, type BufferGeometry, type InstancedMesh, type Material } from 'three'
import type { InstanceTransform } from './types'

interface KitInstancesProps {
  /** Shared geometry, drawn once per item. Not disposed here. */
  geometry: BufferGeometry
  /** One material, or one per geometry group. */
  material: Material | Material[]
  items: readonly InstanceTransform[]
}

const matrix = new Matrix4()
const position = new Vector3()
const quaternion = new Quaternion()
const euler = new Euler(0, 0, 0, 'YXZ')
const scale = new Vector3()

/** Writes `item`'s transform into a matrix (yaw about Y, then pitch about the local X). */
function composeInstance(item: InstanceTransform, target: Matrix4) {
  position.set(item.position[0], item.position[1], item.position[2])
  euler.set(item.pitch ?? 0, item.yaw ?? 0, 0, 'YXZ')
  quaternion.setFromEuler(euler)
  if (item.scale) scale.set(item.scale[0], item.scale[1], item.scale[2])
  else scale.set(1, 1, 1)
  return target.compose(position, quaternion, scale)
}

/**
 * Many copies of one piece in a single draw call. The matrices are written once when the
 * items change; the bounding sphere covers every copy, so the whole set is culled together.
 */
export default function KitInstances({ geometry, material, items }: KitInstancesProps) {
  const ref = useRef<InstancedMesh>(null)

  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    for (let i = 0; i < items.length; i++) mesh.setMatrixAt(i, composeInstance(items[i], matrix))
    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [items, geometry])

  if (items.length === 0) return null
  // A new count needs a new InstancedMesh, so the count is part of the key.
  return <instancedMesh key={items.length} ref={ref} args={[geometry, material, items.length]} />
}
