import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { audioEngine } from '../audio/AudioEngine'

/**
 * Hands the camera to the sound engine, so lantern crackles and doors can be placed around
 * it when they start. Nothing per frame: the engine reads the camera only at those moments.
 */
export default function AudioListenerBinding() {
  const camera = useThree((s) => s.camera)
  useEffect(() => {
    audioEngine.setCamera(camera)
    return () => audioEngine.setCamera(null)
  }, [camera])
  return null
}
