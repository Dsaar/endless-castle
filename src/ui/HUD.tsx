import { useGameStore } from '../state/useGameStore'
import AreaPlate from './hud/AreaPlate'
import ForkChoice from './hud/ForkChoice'
import GuideToggle from './hud/GuideToggle'
import HudHeader from './hud/HudHeader'
import SoundToggle from './hud/SoundToggle'
import SubtitleLine from './hud/SubtitleLine'
import './HUD.css'

/**
 * The in-game overlay: title and hidden-ones counter (top left), area and room (bottom left),
 * guide and sound (bottom right), subtitles (lower center), and the way to go at a fork
 * (bottom center). Only its buttons take pointer
 * events; everything else lets input through to the castle. The corners fade in once the
 * intro camera has arrived; subtitles can show at any time.
 */
export default function HUD() {
  const introComplete = useGameStore((s) => s.introComplete)
  const guideOpen = useGameStore((s) => s.guideOpen)

  return (
    <div className={introComplete ? 'hud hud--shown' : 'hud'} inert={!introComplete || guideOpen}>
      <HudHeader />
      <AreaPlate />
      <SubtitleLine />
      <ForkChoice />
      <div className="hud__panel hud__controls">
        <GuideToggle />
        <SoundToggle />
      </div>
    </div>
  )
}
