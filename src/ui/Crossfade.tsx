import { useCallback, useState, type ReactNode } from 'react'
import CrossfadeLayer from './CrossfadeLayer'
import './Crossfade.css'

interface CrossfadeProps {
  /**
   * Identifies the content. Change it whenever the content changes: the old content then
   * fades out while the new fades in, stacked in the same spot.
   */
  contentKey: string | number
  /** Seconds for each fade. */
  duration: number
  className?: string
  children?: ReactNode
}

interface Layer {
  id: number
  /** What the layer showed when it was replaced. Only read once it is leaving. */
  node: ReactNode
  leaving: boolean
  /** False for the very first layer, which is simply there (its parent fades in as a whole). */
  appear: boolean
}

interface CrossfadeState {
  key: string | number
  nextId: number
  layers: Layer[]
}

/** Crossfades its children whenever `contentKey` changes (GSAP, in CrossfadeLayer). */
export default function Crossfade({ contentKey, duration, className, children }: CrossfadeProps) {
  const [state, setState] = useState<CrossfadeState>(() => ({
    key: contentKey,
    nextId: 1,
    layers: [{ id: 0, node: children, leaving: false, appear: false }],
  }))

  // A new key: everything showing starts to leave and a new layer comes in on top. Done while
  // rendering (React's pattern for adjusting state to a prop), so the swap never flashes.
  if (state.key !== contentKey) {
    setState({
      key: contentKey,
      nextId: state.nextId + 1,
      layers: [
        ...state.layers.map((l) => (l.leaving ? l : { ...l, leaving: true })),
        { id: state.nextId, node: children, leaving: false, appear: true },
      ],
    })
  }

  const remove = useCallback((id: number) => {
    setState((s) => ({ ...s, layers: s.layers.filter((l) => l.id !== id) }))
  }, [])

  return (
    <div className={className ? `crossfade ${className}` : 'crossfade'}>
      {state.layers.map((layer) => (
        <CrossfadeLayer
          key={layer.id}
          id={layer.id}
          leaving={layer.leaving}
          appear={layer.appear}
          duration={duration}
          onGone={remove}
        >
          {layer.leaving ? layer.node : children}
        </CrossfadeLayer>
      ))}
    </div>
  )
}
