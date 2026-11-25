import { lazy, Suspense } from 'react'
import CastleCanvas from './scene/CastleCanvas'
import { resetSession } from './state/session'
import { useGameStore } from './state/useGameStore'
import FinaleOverlay from './ui/FinaleOverlay'
import GuideScroll from './ui/GuideScroll'
import HUD from './ui/HUD'
import IntroOverlay from './ui/IntroOverlay'
import TitleScreen from './ui/TitleScreen'

const AUTHOR = 'Dsaar'

// `import.meta.env.DEV` is replaced with `false` in production builds, so this import
// (and leva with it) is dropped from the bundle.
const DevPanel = import.meta.env.DEV ? lazy(() => import('./ui/DevPanel')) : null

// `?kit` opens the building-kit dev view instead of the game (dev builds only).
const KitView =
  import.meta.env.DEV && new URLSearchParams(window.location.search).has('kit')
    ? lazy(() => import('./scene/KitView'))
    : null

/** Every visit starts from a clean slate: the castle is not mounted yet, so nothing sees the reset. */
function enterCastle() {
  resetSession()
  useGameStore.getState().enter()
}

export default function App() {
  const entered = useGameStore((s) => s.entered)

  if (KitView) {
    return (
      <Suspense fallback={null}>
        <KitView />
        {DevPanel && <DevPanel />}
      </Suspense>
    )
  }

  // The finale comes back here: the castle unmounts and the title screen fades in again.
  if (!entered) return <TitleScreen author={AUTHOR} onEnter={enterCastle} />

  return (
    <>
      <CastleCanvas />
      <IntroOverlay />
      <HUD />
      <GuideScroll />
      <FinaleOverlay />
      {DevPanel && (
        <Suspense fallback={null}>
          <DevPanel />
        </Suspense>
      )}
    </>
  )
}
