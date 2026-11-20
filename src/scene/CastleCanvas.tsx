import { useEffect, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import Atmosphere from './Atmosphere'
import DriftingMotes from './DriftingMotes'
import IntroCameraRig from './IntroCameraRig'
import Player from './Player'
import PostEffects from './PostEffects'
import { CANVAS_DPR, GL_OPTIONS } from './renderer'
import Starfield from './Starfield'
import { useGameStore } from '../state/useGameStore'
import Gate from '../world/segments/Gate'
import { INTRO_START } from '../world/segments/gate/layout'
import { GATE_PATH } from '../world/segments/gate/path'
import './CastleCanvas.css'

/** The full-screen WebGL layer. Sits behind every HTML overlay. Dims and blurs while the guide is open. */
export default function CastleCanvas() {
  const rootRef = useRef<HTMLDivElement>(null)

  // Toggled with a class, not React state, so opening the guide doesn't re-render the scene.
  useEffect(() => {
    const apply = (dimmed: boolean) => rootRef.current?.classList.toggle('castle-canvas--dimmed', dimmed)
    apply(useGameStore.getState().guideOpen)
    return useGameStore.subscribe((s) => apply(s.guideOpen))
  }, [])

  return (
    <div ref={rootRef} className="castle-canvas" aria-hidden="true">
      <Canvas
        dpr={CANVAS_DPR}
        gl={GL_OPTIONS}
        // IntroCameraRig takes over the position and aim before the first frame, then Player.
        camera={{ fov: 55, near: 0.1, far: 1500, position: INTRO_START }}
      >
        <Atmosphere />
        <Starfield />
        {/* Dust: many faint, slow motes that never bloom. */}
        <DriftingMotes count={500} volume={[14, 8, 14]} rise={0.05} size={0.035} brightness={0.35} flicker={0} seed={2} />
        {/* Embers: a few bright, flickering sparks that rise faster and glow. */}
        <DriftingMotes count={160} volume={[16, 10, 16]} rise={0.22} size={0.07} brightness={2.5} flicker={1} seed={3} />
        <Gate />
        <IntroCameraRig />
        {/* Takes the camera over from the intro rig once it arrives. */}
        <Player path={GATE_PATH} />
        <PostEffects />
      </Canvas>
    </div>
  )
}
