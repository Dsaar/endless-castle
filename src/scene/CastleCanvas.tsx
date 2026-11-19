import { Canvas } from '@react-three/fiber'
import { ACESFilmicToneMapping, SRGBColorSpace } from 'three'
import Atmosphere from './Atmosphere'
import BloomTestRig from './BloomTestRig'
import DriftingMotes from './DriftingMotes'
import PostEffects from './PostEffects'
import Starfield from './Starfield'
import './CastleCanvas.css'

const EYE_HEIGHT = 1.6

/** The full-screen WebGL layer. Sits behind every HTML overlay. */
export default function CastleCanvas() {
  return (
    <div className="castle-canvas" aria-hidden="true">
      <Canvas
        dpr={[1, 2]}
        // MSAA happens in the EffectComposer, so the default framebuffer doesn't need it.
        // ACES here is the fallback when post-processing is off; see PostEffects.
        gl={{
          antialias: false,
          powerPreference: 'high-performance',
          toneMapping: ACESFilmicToneMapping,
          outputColorSpace: SRGBColorSpace,
        }}
        camera={{ fov: 55, near: 0.1, far: 1500, position: [0, EYE_HEIGHT, 6] }}
        // R3F aims the default camera at the origin; look straight ahead at eye height instead.
        onCreated={({ camera }) => camera.lookAt(0, EYE_HEIGHT, 0)}
      >
        <Atmosphere />
        <Starfield />
        {/* Dust: many faint, slow motes that never bloom. */}
        <DriftingMotes count={500} volume={[14, 8, 14]} rise={0.05} size={0.035} brightness={0.35} flicker={0} seed={2} />
        {/* Embers: a few bright, flickering sparks that rise faster and glow. */}
        <DriftingMotes count={160} volume={[16, 10, 16]} rise={0.22} size={0.07} brightness={2.5} flicker={1} seed={3} />
        <BloomTestRig />
        <PostEffects />
      </Canvas>
    </div>
  )
}
