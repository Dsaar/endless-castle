import { useGameStore } from '../../state/useGameStore'
import Equalizer from './Equalizer'

/** Bottom right: equalizer bars and SOUND ON / SOUND OFF. Toggles `soundEnabled`. */
export default function SoundToggle() {
  const on = useGameStore((s) => s.soundEnabled)
  const setSoundEnabled = useGameStore((s) => s.setSoundEnabled)

  return (
    <button
      type="button"
      className="hud__button hud__sound"
      aria-pressed={on}
      onClick={() => setSoundEnabled(!on)}
    >
      <Equalizer playing={on} />
      {/* Named "Sound"; aria-pressed carries on / off for screen readers. */}
      <span className="label">
        Sound <span aria-hidden="true">{on ? 'On' : 'Off'}</span>
      </span>
    </button>
  )
}
