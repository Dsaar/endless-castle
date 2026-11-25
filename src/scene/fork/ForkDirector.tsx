import { useEffect } from 'react'
import gsap from 'gsap'
import { scriptedWalk } from '../../state/scriptedWalk'
import { useForkStore } from '../../state/useForkStore'
import { usePlayerStore } from '../../state/usePlayerStore'
import type { BranchChoice } from '../../world/segment'
import { forkOf, type WorldGenerator } from '../../world/WorldGenerator'
import { STRIDE } from '../player/tuning'
import { ARRIVE_DISTANCE, LEAVE_DISTANCE } from './tuning'
import { useForkInput } from './useForkInput'

/**
 * Where the walk divides. The generator builds nothing past a fork, so the walk ends there
 * and the player comes to rest at its end. Arriving there sets `useForkStore.waiting` (the
 * HUD shows the buttons); walking back away clears it.
 *
 * A choice builds that way (`resolveFork`) and the walk runs on. A side way in a hall, or a
 * flight in the Stairwell, begins with a short stretch walked for the player: GSAP carries
 * `scriptedWalk` round the tight quarter turn in 0.8 s (the camera follows the path, so it
 * swings smoothly to face the doorway), or across the deck to the foot of the flight. Straight
 * on just takes a stride. Halls close their other doors from `chosen`.
 */
export default function ForkDirector({ generator }: { generator: WorldGenerator }) {
  useForkInput()

  useEffect(() => {
    let tween: gsap.core.Tween | null = null

    const check = (progress: number) => {
      const forks = useForkStore.getState()
      if (forks.taking) return
      const fork = generator.pendingFork()
      const spec = fork && forkOf(fork)
      if (!fork || !spec) {
        if (forks.waiting) forks.leave()
        return
      }
      const end = fork.startDistance + fork.length
      if (progress >= end - ARRIVE_DISTANCE) {
        if (forks.waiting?.id !== fork.id) forks.arrive({ id: fork.id, picker: spec.picker, choices: spec.choices })
      } else if (forks.waiting && progress < end - LEAVE_DISTANCE) {
        forks.leave()
      }
    }

    const take = (id: number, choice: BranchChoice) => {
      if (generator.pendingFork()?.id !== id) return
      const branch = generator.resolveFork(choice)
      if (!branch) return
      // World hears this and extends the walk past the fork.
      useForkStore.getState().commit(id, choice)

      const { drive, driveTime } = branch.params.plan
      const from = usePlayerStore.getState().progress
      const to = branch.startDistance + drive
      if (drive <= 0 || to <= from) {
        usePlayerStore.getState().walkBy(STRIDE)
        useForkStore.getState().settle()
        return
      }
      scriptedWalk.progress = from
      scriptedWalk.active = true
      tween = gsap.to(scriptedWalk, {
        progress: to,
        duration: driveTime,
        ease: 'power2.inOut',
        onComplete: () => {
          scriptedWalk.active = false
          usePlayerStore.setState({ targetProgress: to })
          useForkStore.getState().settle()
          tween = null
        },
      })
    }

    // A teleport (dev tools) ends any walk being carried out: the player is somewhere else now.
    const cancel = () => {
      if (!tween) return
      tween.kill()
      tween = null
      scriptedWalk.active = false
      useForkStore.getState().settle()
    }

    check(usePlayerStore.getState().progress)
    const unsubscribePlayer = usePlayerStore.subscribe((s, prev) => {
      if (s.jumps !== prev.jumps) cancel()
      if (s.progress !== prev.progress || s.pathEnd !== prev.pathEnd) check(s.progress)
    })
    const unsubscribeFork = useForkStore.subscribe((s, prev) => {
      if (s.request && s.request !== prev.request) take(s.request.id, s.request.choice)
    })
    return () => {
      unsubscribePlayer()
      unsubscribeFork()
      tween?.kill()
      scriptedWalk.active = false
    }
  }, [generator])

  return null
}
