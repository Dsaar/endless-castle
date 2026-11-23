import { useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { useGameStore } from '../state/useGameStore'
import { useWorldStore } from '../state/useWorldStore'
import Backdrop from '../world/Backdrop'
import { INTRO_START } from '../world/segments/gate/layout'
import World from '../world/World'
import { WorldGenerator } from '../world/WorldGenerator'
import Atmosphere from './Atmosphere'
import DriftingMotes from './DriftingMotes'
import FallDirector from './fall/FallDirector'
import FallStreaks from './fall/FallStreaks'
import IntroCameraRig from './IntroCameraRig'
import LightPool from './lighting/LightPool'
import Player from './Player'
import PostEffects from './PostEffects'
import { CANVAS_DPR, GL_OPTIONS } from './renderer'
import RenderStats from './RenderStats'
import Starfield from './Starfield'
import './CastleCanvas.css'

/** `?seed=123` pins the castle's layout; otherwise every visit builds a new one. */
function worldSeed() {
  const param = new URLSearchParams(window.location.search).get('seed')
  const n = param === null ? Number.NaN : Number(param)
  return Number.isInteger(n) ? n >>> 0 : (Math.random() * 2 ** 32) >>> 0
}

/** The full-screen WebGL layer. Sits behind every HTML overlay. Dims and blurs while the guide is open. */
export default function CastleCanvas() {
  const rootRef = useRef<HTMLDivElement>(null)
  const [generator] = useState(() => {
    const seed = worldSeed()
    useWorldStore.getState().setSeed(seed)
    return new WorldGenerator(seed, { forcedKind: () => useWorldStore.getState().forcedKind })
  })

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
        {/* Embers streaking upward past the camera, only during the Fall. */}
        <FallStreaks />
        {/* Every lantern borrows one of these lights; the count never changes, so shaders compile once. */}
        <LightPool />
        <Backdrop />
        {/* The Gate, then the endless castle: about 3 segments ahead and 1 behind. */}
        <World generator={generator} />
        <IntroCameraRig />
        {/* Takes the camera over from the intro rig once it arrives. */}
        <Player path={generator.path} />
        {/* The scripted drop after the first Threshold: owns the camera while it runs. */}
        <FallDirector generator={generator} />
        <PostEffects />
        {import.meta.env.DEV && <RenderStats />}
      </Canvas>
    </div>
  )
}
