import { useEffect, useRef, type ComponentRef } from 'react'
import { OrbitControls } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import gsap from 'gsap'
import { KIT_EXHIBITS } from './kitExhibits'

interface KitCameraRigProps {
  /** Index into KIT_EXHIBITS to look at. */
  focus: number
}

/** OrbitControls for the kit view, gliding (GSAP) to the focused exhibit when it changes. */
export default function KitCameraRig({ focus }: KitCameraRigProps) {
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null)
  const camera = useThree((s) => s.camera)
  const first = useRef(true)

  useEffect(() => {
    const c = controls.current
    if (!c) return
    const { target, view } = KIT_EXHIBITS[focus]
    const to = { x: target[0] + view[0], y: target[1] + view[1], z: target[2] + view[2] }

    // Jump straight to the first exhibit; glide between later ones.
    if (first.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      first.current = false
      c.target.set(...target)
      camera.position.set(to.x, to.y, to.z)
      c.update()
      return
    }

    const tl = gsap.timeline({ defaults: { duration: 1.1, ease: 'power2.inOut' }, onUpdate: () => c.update() })
    tl.to(c.target, { x: target[0], y: target[1], z: target[2] }, 0)
    tl.to(camera.position, to, 0)
    return () => {
      tl.kill()
    }
  }, [focus, camera])

  return <OrbitControls ref={controls} makeDefault enableDamping dampingFactor={0.08} maxDistance={30} />
}
