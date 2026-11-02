import type { LevelActivity, SuggestedActivity } from '../../../types'

/** Add reviewed, working exercises. Empty means NOT student-playable. */
export const activities: LevelActivity[] = []

/** Editorial ideas only; not exposed to students or grading. */
export const suggestedActivities: SuggestedActivity[] = [
  {
    "label": "Listen and explore: Vowel Sounds",
    "mode": "tap-picture",
    "educatorNote": "Teacher explains vowels as open speech sounds."
  },
  {
    "label": "Practice the vowel sounds",
    "mode": "repeat-after-julie",
    "educatorNote": "Learner listens to and repeats isolated vowel sounds."
  },
  {
    "label": "Show what you know about vowel sounds",
    "mode": "listen-and-find",
    "educatorNote": "Review short vowel sound practice."
  }
]
