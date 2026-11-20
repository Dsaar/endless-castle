/** Everything the guide scroll says. Kept apart from the components so the words are easy to edit. */

export type GuideTabId = 'castle' | 'moving' | 'hidden' | 'signs'

export const GUIDE_TABS: readonly { id: GuideTabId; label: string }[] = [
  { id: 'castle', label: 'The Castle' },
  { id: 'moving', label: 'Moving' },
  { id: 'hidden', label: 'Hidden Ones' },
  { id: 'signs', label: 'Signs' },
]

// --- The Castle -----------------------------------------------------------------------------

export const LORE =
  'No one built this castle. It builds itself, hall after hall and stair after stair, ' +
  'hung in a dark that has no floor and no sky. Its lanterns are never allowed to go out. ' +
  'Every door opens onto more of it. You were summoned here, and somewhere in its turning ' +
  'corridors six others are hiding, waiting for someone patient enough to find them.'

export const AREAS = ['The Gate', 'The Long Halls', 'The Turning Stairs', 'The Lantern Rooms', 'The Fall', 'The Far Keep']

export const NO_EXIT = 'There is no exit.'

// --- Moving ---------------------------------------------------------------------------------

export interface KeyBinding {
  /** Key caps, in order. */
  keys: readonly string[]
  /** Show a slash between the caps ("these are alternatives") or not ("this set of keys"). */
  slashed?: boolean
  description: string
}

/** Two columns of controls. */
export const KEY_COLUMNS: readonly (readonly KeyBinding[])[] = [
  [
    { keys: ['Scroll', 'W', '↑'], slashed: true, description: 'Walk forward. Scroll harder to run.' },
    { keys: ['Space'], description: 'Take one stride. Hold Shift to step back.' },
    { keys: ['S', '↓'], slashed: true, description: 'Walk back the way you came.' },
    { keys: ['A', 'D', '←', '→'], description: 'Choose a way where the halls divide.' },
  ],
  [
    { keys: ['Q', 'E'], description: 'Glance left or right.' },
    { keys: ['Drag'], description: 'Look around.' },
    { keys: ['Click'], description: 'Reach for what you find.' },
    { keys: ['Esc'], description: 'Roll this scroll back up.' },
  ],
]

export const TOUCH_NOTE = 'On a touch screen, swipe up to walk and swipe sideways to look.'

// --- Hidden Ones ----------------------------------------------------------------------------

export const HIDDEN_INTRO =
  'Six figures hide in the castle. They do not wish to be found. Each one you find is marked here.'

/** Shown in a slot once its figure has been found. */
export const FOUND_GLYPH = '見'

// --- Signs ----------------------------------------------------------------------------------

export interface Omen {
  glyph: string
  name: string
  meaning: string
}

export const SIGNS_INTRO = 'The castle does not speak, but it gives signs. Learn the four omens.'

export const OMENS: readonly Omen[] = [
  {
    glyph: '灯',
    name: 'The guttering lantern',
    meaning: 'The lanterns around you dim and shiver. One of the hidden ones is near.',
  },
  {
    glyph: '鈴',
    name: 'A bell with no bell',
    meaning: 'A single note rings somewhere far off. The halls behind you have changed.',
  },
  {
    glyph: '影',
    name: 'A shadow on the paper',
    meaning: 'Something passes behind the shoji. You are being watched. Keep walking.',
  },
  {
    glyph: '朱',
    name: 'The vermilion door',
    meaning: 'A red door where there was none. A chamber waits beyond it, but not for long.',
  },
]
