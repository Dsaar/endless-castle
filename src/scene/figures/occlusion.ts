import { Raycaster, Vector3, type Intersection, type Material, type Mesh, type Object3D } from 'three'
import { FIGURE_HEAD_ABOVE_CENTER } from './tuning'

/** The group in `CastleCanvas` that holds the castle's segments: the only things that can stand in a figure's way. */
export const WORLD_GROUP_NAME = 'castle-world'

/** Marks a figure's own meshes, so they never hide it. */
export const FIGURE_USER_DATA = 'hiddenFigure'

const raycaster = new Raycaster()
const direction = new Vector3()
const point = new Vector3()
const hits: Intersection[] = []
const meshes: Object3D[] = []

/** Solid meshes only: no points, no figure parts, no additive glows that don't write depth. */
function solid(object: Object3D): boolean {
  if (!(object as Mesh).isMesh || object.userData[FIGURE_USER_DATA]) return false
  const material = (object as Mesh).material as Material | Material[]
  const first = Array.isArray(material) ? material[0] : material
  return first?.depthWrite !== false
}

/**
 * True if the castle hides a figure from `eye`: both its middle (`anchor`) and its head are
 * behind something solid. Two points, so a thin rail across its middle doesn't hide it. Not
 * cheap (it walks the mounted segments and casts up to two rays): call it for a figure that is
 * otherwise found, not every frame.
 */
export function isFigureHidden(scene: Object3D, eye: Vector3, anchor: Object3D): boolean {
  const world = scene.getObjectByName(WORLD_GROUP_NAME)
  if (!world) return false
  meshes.length = 0
  world.traverseVisible((o) => {
    if (solid(o)) meshes.push(o)
  })
  // The head is "up" in the figure's own frame, so it is below the middle for one on a ceiling.
  const hidden =
    blocked(eye, anchor.getWorldPosition(point)) && blocked(eye, anchor.localToWorld(point.set(0, FIGURE_HEAD_ABOVE_CENTER, 0)))
  meshes.length = 0
  return hidden
}

/** True if any of `meshes` lies between `from` and `to` (world space). */
function blocked(from: Vector3, to: Vector3): boolean {
  direction.subVectors(to, from)
  const distance = direction.length()
  if (distance < 0.5) return false
  direction.divideScalar(distance)
  raycaster.set(from, direction)
  raycaster.near = 0.05
  // Stop short of the figure, so its own perch's floor under its feet never counts.
  raycaster.far = distance - 0.4
  hits.length = 0
  raycaster.intersectObjects(meshes, false, hits)
  const any = hits.length > 0
  hits.length = 0
  return any
}
