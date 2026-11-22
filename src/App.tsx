import { lazy, Suspense, useState } from 'react'
import CastleCanvas from './scene/CastleCanvas'
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

export default function App() {
  const [entered, setEntered] = useState(false)

  if (KitView) {
    return (
      <Suspense fallback={null}>
        <KitView />
        {DevPanel && <DevPanel />}
      </Suspense>
    )
  }

  if (!entered) return <TitleScreen author={AUTHOR} onEnter={() => setEntered(true)} />

  return (
    <>
      <CastleCanvas />
      <IntroOverlay />
      <HUD />
      <GuideScroll />
      {DevPanel && (
        <Suspense fallback={null}>
          <DevPanel />
        </Suspense>
      )}
    </>
  )
}
