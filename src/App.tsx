import { lazy, Suspense, useState } from 'react'
import CastleCanvas from './scene/CastleCanvas'
import TitleScreen from './ui/TitleScreen'

const AUTHOR = 'Dsaar'

// `import.meta.env.DEV` is replaced with `false` in production builds, so this import
// (and leva with it) is dropped from the bundle.
const DevPanel = import.meta.env.DEV ? lazy(() => import('./ui/DevPanel')) : null

export default function App() {
  const [entered, setEntered] = useState(false)

  if (!entered) return <TitleScreen author={AUTHOR} onEnter={() => setEntered(true)} />

  return (
    <>
      <CastleCanvas />
      {DevPanel && (
        <Suspense fallback={null}>
          <DevPanel />
        </Suspense>
      )}
    </>
  )
}
