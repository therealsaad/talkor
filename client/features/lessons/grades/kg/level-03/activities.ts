import type { LevelActivity, SuggestedActivity } from '../../../types'

/** Add reviewed, working exercises. Empty means NOT student-playable. */
export const activities: LevelActivity[] = []

/** Editorial ideas only; not exposed to students or grading. */
export const suggestedActivities: SuggestedActivity[] = [
  {
    "label": "Explore letters K to P",
    "mode": "tap-picture",
    "educatorNote": "Editorial preview only; add no student activity until letter visuals and prompts are reviewed."
  },
  {
    "label": "Listen and say the letter names K to P",
    "mode": "repeat-after-julie",
    "educatorNote": "Teacher reviews pronunciation models and beginner support before authoring an activity."
  },
  {
    "label": "Find a named letter from K to P",
    "mode": "listen-and-find",
    "educatorNote": "Keep as an editorial idea until approved letter choices and scoring are authored."
  }
]
