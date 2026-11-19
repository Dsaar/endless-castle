import { useState } from 'react'
import TitleScreen from './ui/TitleScreen'

const AUTHOR = 'Dsaar'

export default function App() {
  const [entered, setEntered] = useState(false)

  // The 3D castle mounts here once it exists; for now, entering leaves the void.
  return entered ? <main /> : <TitleScreen author={AUTHOR} onEnter={() => setEntered(true)} />
}
