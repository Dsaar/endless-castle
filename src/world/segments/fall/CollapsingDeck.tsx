import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import gsap from 'gsap'
import { DynamicDrawUsage, Euler, Matrix4, Quaternion, Vector3, type InstancedMesh } from 'three'
import { createRandom, randRange, type Random } from '../../../lib/random'
import { texturedBox, uvOffsets } from '../../../scene/kit/geometry'
import { getWoodMaterial } from '../../../scene/kit/materials'
import { useDisposable } from '../../../scene/kit/useDisposable'
import { useFallStore } from '../../../state/useFallStore'
import { DECK_PLANK, DECK_STRINGER, type DeckLayout, type DeckPiece } from './deckLayout'
import { PLANK_CRACK, PLANK_DROP, PLANK_FALL, plankDropTime } from './timing'

/** How far one piece has moved from its place: GSAP tweens these. */
interface Motion {
  x: number
  y: number
  z: number
  rx: number
  ry: number
  rz: number
  gone: boolean
}

interface CollapsingDeckProps {
  layout: DeckLayout
  seed: number
}

const matrix = new Matrix4()
const position = new Vector3()
const quaternion = new Quaternion()
const euler = new Euler(0, 0, 0, 'YXZ')
const ONE = new Vector3(1, 1, 1)
const ZERO = new Vector3(0, 0, 0)

const still = (): Motion => ({ x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, gone: false })

function writeMatrices(mesh: InstancedMesh | null, pieces: readonly DeckPiece[], motions: readonly Motion[]) {
  if (!mesh) return
  for (let i = 0; i < pieces.length; i++) {
    const p = pieces[i].position
    const m = motions[i]
    position.set(p[0] + m.x, p[1] + m.y, p[2] + m.z)
    quaternion.setFromEuler(euler.set(m.rx, pieces[i].yaw + m.ry, m.rz, 'YXZ'))
    mesh.setMatrixAt(i, matrix.compose(position, quaternion, m.gone ? ZERO : ONE))
  }
  mesh.instanceMatrix.needsUpdate = true
}

/**
 * One piece's part in the collapse: it splits (the halves part, their inner ends dip), then
 * drops away into the dark, accelerating, turning a little, and is hidden far below.
 */
function addPieceFall(tl: gsap.core.Timeline, m: Motion, side: number, at: number, rand: Random) {
  tl.to(m, { x: side * 0.04, y: -0.035, rz: side * 0.07, duration: PLANK_CRACK, ease: 'power1.out' }, at)
  tl.to(
    m,
    {
      x: side * randRange(rand, 0.3, 1.2),
      y: -PLANK_DROP,
      z: randRange(rand, -0.4, 0.4),
      rx: randRange(rand, -0.45, 0.45),
      ry: randRange(rand, -0.3, 0.3),
      rz: side * randRange(rand, 0.25, 0.8),
      duration: PLANK_FALL,
      ease: 'power1.in',
    },
    at + PLANK_CRACK,
  )
  tl.call(() => void (m.gone = true), [], at + PLANK_CRACK + PLANK_FALL)
}

/**
 * The Fall's deck: split cross planks over short stringers, two instanced draw calls. When the
 * Fall begins (`useFallStore`), the planks ahead split and drop away in a ripple running from
 * the player's feet, then the island they stand on and the planks behind go with them (GSAP,
 * a slight random turn per plank). Matrices are only rewritten while that plays. Once the Fall
 * is over the deck is gone, also when it mounts again later.
 */
export default function CollapsingDeck({ layout, seed }: CollapsingDeckProps) {
  const plankRef = useRef<InstancedMesh>(null)
  const stringerRef = useRef<InstancedMesh>(null)
  const playing = useRef(false)

  const off = useMemo(() => uvOffsets(seed), [seed])
  const plankGeometry = useDisposable(() => texturedBox(DECK_PLANK, [0, 0, 0], { grain: 0, uvOffset: off() }), [off])
  const stringerGeometry = useDisposable(() => texturedBox(DECK_STRINGER, [0, 0, 0], { grain: 2, uvOffset: off() }), [off])

  const motions = useMemo(
    () => ({ planks: layout.planks.map(still), stringers: layout.stringers.map(still) }),
    [layout],
  )

  // The geometries are deps because a new one means a new InstancedMesh to fill.
  useLayoutEffect(() => {
    for (const mesh of [plankRef.current, stringerRef.current]) mesh?.instanceMatrix.setUsage(DynamicDrawUsage)
    writeMatrices(plankRef.current, layout.planks, motions.planks)
    writeMatrices(stringerRef.current, layout.stringers, motions.stringers)
  }, [layout, motions, plankGeometry, stringerGeometry])

  useEffect(() => {
    let timeline: gsap.core.Timeline | null = null
    const hide = () => {
      for (const mesh of [plankRef.current, stringerRef.current]) if (mesh) mesh.visible = false
    }

    const play = (standZ: number) => {
      const rand = createRandom(seed ^ 0x2c1b3c6d)
      const tl = gsap.timeline({
        onComplete: () => {
          playing.current = false
          hide()
        },
      })
      const times = layout.planks.map((p) => plankDropTime(p.position[2], standZ, rand()))
      layout.planks.forEach((p, i) => addPieceFall(tl, motions.planks[i], p.side, times[i], rand))
      // A stringer goes once the last plank on it has.
      layout.stringers.forEach((s, i) => {
        let at = 0
        layout.planks.forEach((p, j) => {
          if (Math.abs(p.position[2] - s.position[2]) <= DECK_STRINGER[2] / 2) at = Math.max(at, times[j])
        })
        addPieceFall(tl, motions.stringers[i], s.side, at + 0.05, rand)
      })
      timeline = tl
      playing.current = true
    }

    if (useFallStore.getState().phase !== 'idle') {
      hide()
      return
    }
    const unsubscribe = useFallStore.subscribe((s, prev) => {
      if (s.phase === prev.phase) return
      if (s.phase === 'falling') play(s.standZ)
      else if (s.phase === 'done' && !timeline) hide()
    })
    return () => {
      unsubscribe()
      timeline?.kill()
      playing.current = false
    }
  }, [layout, motions, seed])

  useFrame(() => {
    if (!playing.current) return
    writeMatrices(plankRef.current, layout.planks, motions.planks)
    writeMatrices(stringerRef.current, layout.stringers, motions.stringers)
  })

  return (
    <>
      {/* Not culled: falling pieces leave the bounding sphere they started in. */}
      <instancedMesh
        ref={plankRef}
        args={[plankGeometry, getWoodMaterial(), layout.planks.length]}
        frustumCulled={false}
      />
      <instancedMesh
        ref={stringerRef}
        args={[stringerGeometry, getWoodMaterial(), layout.stringers.length]}
        frustumCulled={false}
      />
    </>
  )
}
