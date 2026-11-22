import { useEffect, useLayoutEffect, useRef, type ReactNode } from 'react'
import gsap from 'gsap'

interface CrossfadeLayerProps {
  id: number
  leaving: boolean
  appear: boolean
  duration: number
  onGone: (id: number) => void
  children?: ReactNode
}

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** One stacked layer of a Crossfade: fades in on mount (if `appear`), out once `leaving`. */
export default function CrossfadeLayer({ id, leaving, appear, duration, onGone, children }: CrossfadeLayerProps) {
  const ref = useRef<HTMLDivElement>(null)

  // Before paint, so a new layer never shows at full opacity for a frame.
  useLayoutEffect(() => {
    if (!appear) return
    const tween = gsap.fromTo(
      ref.current,
      { autoAlpha: 0 },
      { autoAlpha: 1, duration: reducedMotion() ? 0 : duration, ease: 'power1.inOut' },
    )
    return () => {
      tween.kill()
    }
  }, [appear, duration])

  useEffect(() => {
    if (!leaving) return
    // `overwrite` stops a fade-in that is still running, so this picks up from where it is.
    const tween = gsap.to(ref.current, {
      autoAlpha: 0,
      duration: reducedMotion() ? 0 : duration,
      ease: 'power1.inOut',
      overwrite: true,
      onComplete: () => onGone(id),
    })
    return () => {
      tween.kill()
    }
  }, [leaving, duration, id, onGone])

  return (
    <div ref={ref} className="crossfade__layer" aria-hidden={leaving || undefined}>
      {children}
    </div>
  )
}
