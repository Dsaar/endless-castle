import { useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { palette } from '../lib/palette'
import KitOverlay from '../ui/KitOverlay'
import Atmosphere from './Atmosphere'
import FloorPlanks from './kit/FloorPlanks'
import Lantern from './kit/Lantern'
import Post from './kit/Post'
import Railing from './kit/Railing'
import Roof from './kit/Roof'
import ShojiPanel from './kit/ShojiPanel'
import TatamiFloor from './kit/TatamiFloor'
import WoodBeam from './kit/WoodBeam'
import KitCameraRig from './KitCameraRig'
import LightPool from './lighting/LightPool'
import { KIT_EXHIBITS, KIT_SPACING } from './kitExhibits'
import PostEffects from './PostEffects'
import { CANVAS_DPR, GL_OPTIONS } from './renderer'
import Starfield from './Starfield'
import './CastleCanvas.css'

const at = (i: number) => i * KIT_SPACING

/** Height of the lantern hanging over each exhibit. */
const OVERHEAD = 2.4

/** `?kit&focus=3` opens the view on the fourth exhibit. */
function initialFocus() {
  const n = Number(new URLSearchParams(window.location.search).get('focus'))
  return Number.isInteger(n) && n >= 0 && n < KIT_EXHIBITS.length ? n : 0
}

/**
 * Dev view at `?kit`: every building-kit piece in a row along X, each under its own
 * hanging lantern, with OrbitControls. Buttons (or ← →) glide the camera between them.
 */
export default function KitView() {
  const [focus, setFocus] = useState(initialFocus)

  return (
    <>
      <div className="castle-canvas" aria-hidden="true">
        <Canvas dpr={CANVAS_DPR} gl={GL_OPTIONS} camera={{ fov: 50, near: 0.05, far: 1500, position: [2, 2, 6] }}>
          <Atmosphere />
          <Starfield />
          {/* A whisper of fill so the unlit sides of pieces don't vanish entirely. */}
          <hemisphereLight args={[palette.lantern, palette.void, 0.12]} />
          {/* Each exhibit's lantern borrows one of the pooled lights. */}
          <LightPool />

          {/* 0: beam */}
          <WoodBeam position={[at(0), 1.3, 0]} size={[3, 0.24, 0.24]} />
          <Lantern position={[at(0) + 0.6, OVERHEAD, 1.3]} phase={0} />

          {/* 1: post */}
          <Post position={[at(1), 0, 0]} size={[0.3, 2.6, 0.3]} />
          <Lantern position={[at(1) + 0.6, OVERHEAD, 1.2]} phase={1} />

          {/* 2: floorboards; the lantern sits low so its hot spot shows on the polish */}
          <FloorPlanks position={[at(2), 0, 0]} size={[3.4, 3.4]} />
          <Lantern position={[at(2), 1.5, -0.6]} phase={2} />

          {/* 3: shoji, lit and unlit */}
          <ShojiPanel position={[at(3) - 0.55, 0, 0]} lit />
          <ShojiPanel position={[at(3) + 0.55, 0, 0]} lit={false} />
          <Lantern position={[at(3) + 0.3, OVERHEAD, 1.2]} phase={3} />

          {/* 4: the two lanterns themselves */}
          <Lantern position={[at(4) - 0.5, 1.6, 0]} kind="hanging" cord={1.2} phase={4} />
          <Lantern position={[at(4) + 0.6, 0, 0]} kind="standing" phase={5} />

          {/* 5: railing */}
          <Railing position={[at(5), 0, 0]} length={3.2} />
          <Lantern position={[at(5) + 0.4, 1.9, 1.3]} phase={6} />

          {/* 6: tatami, eight mats */}
          <TatamiFloor position={[at(6), 0, 0]} size={[3.64, 3.64]} />
          <Lantern position={[at(6), 1.8, 0]} phase={7} />

          {/* 7: roof, lit from below the eaves and from above */}
          <Roof position={[at(7) + 1, 0.9, 0]} size={[5, 1.6, 4]} />
          <Lantern position={[at(7) + 1, 0, 0.6]} kind="standing" phase={8} />
          <Lantern position={[at(7) + 2.4, 4.4, 2.4]} phase={9} cord={0} />

          <KitCameraRig focus={focus} />
          <PostEffects />
        </Canvas>
      </div>
      <KitOverlay focus={focus} onFocus={setFocus} />
    </>
  )
}
