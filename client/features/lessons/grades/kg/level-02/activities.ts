import type { LevelActivity, SuggestedActivity } from '../../../types'

/** Working staff-preview activities; the draft remains unavailable to students. */
export const activities: LevelActivity[] = [
  ...(['E', 'F', 'G', 'H', 'I', 'J'] as const).map((letter) => ({
    id: `say-${letter.toLowerCase()}`,
    type: 'repeat-after-julie' as const,
    prompt: `Listen to Miss Julie, then say the letter ${letter}.`,
    successCriteria: `Server-side speech recognition identifies the letter ${letter}.`,
    difficulty: 1,
    approved: false,
  })),
]

/** Editorial ideas only; not exposed to student routes or grading. */
export const suggestedActivities: SuggestedActivity[] = [
  {
    "label": "Listen and say letters E to J",
    "mode": "repeat-after-julie",
    "educatorNote": "The staff preview uses authenticated server-side speech grading for E–J."
  },
  {
    "label": "Practise one letter at a time",
    "mode": "repeat-after-julie",
    "educatorNote": "Incorrect, unclear, and silent answers stay on the same letter for another try."
  }
]
