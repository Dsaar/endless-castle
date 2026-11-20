import { useEffect, useLayoutEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import gsap from 'gsap'
import type { Camera } from 'three'
import { useGameStore } from '../state/useGameStore'
import { INTRO_DURATION, INTRO_END, INTRO_START, INTRO_START_PITCH } from '../world/segments/gate/layout'

/** Frames to wait before starting, so shader compiles and texture uploads don't eat the move. */
const WARMUP_FRAMES = 3

interface Pose {
  x: number
  y: number
  z: number
  pitch: number
}

function applyPose(camera: Camera, p: Pose) {
  camera.position.set(p.x, p.y, p.z)
  // Look straight down -Z, tilted by `pitch`.
  camera.lookAt(p.x, p.y + Math.tan(p.pitch) * 10, p.z - 10)
}

/**
 * The intro: the camera starts far back over the void and dollies to the start of the
 * bridge (GSAP, power2.out), then flags `introComplete`. With reduced motion it starts
 * at the end.
 */
export default function IntroCameraRig() {
  const camera = useThree((s) => s.camera)
  const setIntroComplete = useGameStore((s) => s.setIntroComplete)
  const pose = useRef<Pose>({ x: INTRO_START[0], y: INTRO_START[1], z: INTRO_START[2], pitch: INTRO_START_PITCH })
  const frames = useRef(0)
  const tween = useRef<gsap.core.Tween | null>(null)
  const reduced = useRef(window.matchMedia('(prefers-reduced-motion: reduce)').matches)

  // Place the camera before the first frame renders.
  useLayoutEffect(() => {
    if (reduced.current) {
      pose.current = { x: INTRO_END[0], y: INTRO_END[1], z: INTRO_END[2], pitch: 0 }
    }
    applyPose(camera, pose.current)
  }, [camera])

  useEffect(() => {
    setIntroComplete(false)
    if (reduced.current) setIntroComplete(true)
    return () => {
      tween.current?.kill()
      tween.current = null
      // If remounted (hot reload), carry on from wherever the camera got to.
      frames.current = 0
    }
  }, [setIntroComplete])

  useFrame(() => {
    if (reduced.current || frames.current > WARMUP_FRAMES) return
    if (++frames.current <= WARMUP_FRAMES) return
    const p = pose.current
    tween.current = gsap.to(p, {
      x: INTRO_END[0],
      y: INTRO_END[1],
      z: INTRO_END[2],
      pitch: 0,
      duration: INTRO_DURATION,
      ease: 'power2.out',
      onUpdate: () => applyPose(camera, p),
      onComplete: () => setIntroComplete(true),
    })
  })

  return null
}
