import { useEffect, useRef } from 'react'
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { AdditiveBlending, Vector3, type Group, type MeshBasicMaterial } from 'three'
import { clickFigure } from '../../state/hiddenFigures'
import { useAtmosphereStore } from '../../state/useAtmosphereStore'
import { useFallStore } from '../../state/useFallStore'
import { useGameStore } from '../../state/useGameStore'
import type { FigurePose } from '../../world/figures'
import { getUnitPlane } from '../kit/geometry'
import type { Vec3 } from '../kit/types'
import { EYES_COLOR, GLOW_COLOR, getSilhouetteMaterial } from './figureMaterials'
import { getEyesTexture, getGlowTexture } from './silhouettes'
import { addLiveFigure } from './liveFigures'
import { FIGURE_USER_DATA, isFigureHidden } from './occlusion'
import {
  CLICK_SLOP,
  EYES_IN_FRONT,
  FIGURE_CENTER,
  FIGURE_HEIGHT,
  FIGURE_WIDTH,
  GLOW_BEHIND,
  GLOW_BREATH,
  GLOW_BREATH_DEPTH,
  GLOW_HAZE,
  GLOW_SIZE,
} from './tuning'

interface HiddenFigureProps {
  /** Index into FIGURES. */
  index: number
  pose: FigurePose
  /** Where its feet are, in the parent's frame. */
  position: Vec3
  /** Stands on a ceiling, head down. */
  upsideDown?: boolean
}

const FIGURE_DATA = { [FIGURE_USER_DATA]: true }
// Scratch vectors: reused every frame, never allocated in the loop.
const eye = new Vector3()
const center = new Vector3()

function setCursor(element: HTMLElement, cursor: string) {
  element.style.cursor = cursor
}

/** Whether the player may find or click anything right now. */
function canInteract() {
  const game = useGameStore.getState()
  return game.introComplete && !game.guideOpen && !game.finale && useFallStore.getState().phase !== 'falling'
}

/**
 * One hidden figure: a flat dark silhouette on a plane that turns about its vertical axis to
 * face the camera, with a soft vermilion glow just behind it. The glow fades with a thinner
 * haze than the scene's and breathes slowly. Two narrow eye slits glow faintly white in the
 * dark of its head, fading with the same haze (they don't breathe). Clicking it (the glow is the target, so it is not
 * too small to hit far off) finds it, or shows its card again; nothing behind a wall counts.
 * It registers with `liveFigures` so `FigureWatcher` can tell when it is looked at.
 */
export default function HiddenFigure({ index, pose, position, upsideDown = false }: HiddenFigureProps) {
  const turn = useRef<Group>(null)
  const anchor = useRef<Group>(null)
  const glow = useRef<MeshBasicMaterial>(null)
  const eyes = useRef<MeshBasicMaterial>(null)
  const scene = useThree((s) => s.scene)
  const camera = useThree((s) => s.camera)
  const canvas = useThree((s) => s.gl.domElement)
  // Each figure breathes out of step.
  const phase = index * 1.7

  useEffect(() => {
    if (!anchor.current) return
    return addLiveFigure({ index, anchor: anchor.current, dwell: 0, distance: Number.POSITIVE_INFINITY })
  }, [index])

  // Leave the cursor as it was if the figure goes while hovered.
  useEffect(() => () => setCursor(canvas, ''), [canvas])

  useFrame(({ clock }) => {
    const group = turn.current
    const parent = group?.parent
    if (!group || !parent || !anchor.current || !glow.current || !eyes.current) return
    // Face the camera, turning about the vertical only (in the parent's frame).
    parent.worldToLocal(eye.copy(camera.position))
    group.rotation.y = Math.atan2(eye.x - group.position.x, eye.z - group.position.z)

    anchor.current.getWorldPosition(center)
    const haze = useAtmosphereStore.getState().fogDensity * GLOW_HAZE * center.distanceTo(camera.position)
    const breath = 1 - GLOW_BREATH_DEPTH * (0.5 + 0.5 * Math.sin((clock.elapsedTime * Math.PI * 2) / GLOW_BREATH + phase))
    const clear = Math.exp(-haze * haze)
    glow.current.opacity = clear * breath
    eyes.current.opacity = clear
  })

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    if (e.delta > CLICK_SLOP || !anchor.current) return
    e.stopPropagation()
    if (!canInteract() || isFigureHidden(scene, camera.position, anchor.current)) return
    clickFigure(index)
  }

  return (
    <group ref={turn} position={position}>
      <group rotation={[0, 0, upsideDown ? Math.PI : 0]}>
        <group ref={anchor} position={[0, FIGURE_CENTER, 0]} />
        <mesh
          geometry={getUnitPlane()}
          position={[0, FIGURE_CENTER, -GLOW_BEHIND]}
          scale={[GLOW_SIZE[0], GLOW_SIZE[1], 1]}
          renderOrder={1}
          userData={FIGURE_DATA}
          onClick={onClick}
          onPointerOver={() => setCursor(canvas, 'pointer')}
          onPointerOut={() => setCursor(canvas, '')}
        >
          {/* Its own material: each figure fades its glow with its own distance. */}
          <meshBasicMaterial
            ref={glow}
            color={GLOW_COLOR}
            map={getGlowTexture()}
            transparent
            blending={AdditiveBlending}
            depthWrite={false}
            fog={false}
          />
        </mesh>
        <mesh
          geometry={getUnitPlane()}
          material={getSilhouetteMaterial(pose)}
          position={[0, FIGURE_HEIGHT / 2, 0]}
          scale={[FIGURE_WIDTH, FIGURE_HEIGHT, 1]}
          renderOrder={2}
          userData={FIGURE_DATA}
        />
        {/* The eyes: the same frame as the silhouette, a hair in front, added on top. */}
        <mesh
          geometry={getUnitPlane()}
          position={[0, FIGURE_HEIGHT / 2, EYES_IN_FRONT]}
          scale={[FIGURE_WIDTH, FIGURE_HEIGHT, 1]}
          renderOrder={3}
          userData={FIGURE_DATA}
        >
          <meshBasicMaterial
            ref={eyes}
            color={EYES_COLOR}
            map={getEyesTexture(pose)}
            transparent
            blending={AdditiveBlending}
            depthWrite={false}
            fog={false}
          />
        </mesh>
      </group>
    </group>
  )
}
