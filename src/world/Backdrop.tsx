import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Color, type HemisphereLight } from 'three'
import { palette } from '../lib/palette'
import Pagoda from '../scene/Pagoda'
import { finaleFx } from '../state/finaleFx'
import { PAGODAS } from './backdropLayout'

const LANTERN = new Color(palette.lantern)
const FINALE_RED = new Color(palette.vermilion)

/**
 * Scenery that stays put while segments come and go: the two distant pagodas either side of
 * the gate, and a whisper of warm hemisphere fill so unlit wood still reads against the void.
 * Kept out of the segments because unmounting a light would recompile every lit shader, and
 * the pagodas stay in view long after the Gate itself is gone. The fill turns vermilion in the finale.
 */
export default function Backdrop() {
  const fill = useRef<HemisphereLight>(null)
  const red = useRef(0)

  useFrame(() => {
    if (!fill.current || finaleFx.red === red.current) return
    red.current = finaleFx.red
    fill.current.color.copy(LANTERN).lerp(FINALE_RED, red.current)
  })

  return (
    <group>
      <hemisphereLight ref={fill} args={[palette.lantern, palette.void, 0.1]} />
      {PAGODAS.map((p) => (
        <Pagoda key={p.seed} {...p} />
      ))}
    </group>
  )
}
