import type { LevelActivity, SuggestedActivity } from '../../../types'

/** Add reviewed, working exercises. Empty means NOT student-playable. */
export const activities: LevelActivity[] = []

/** Editorial ideas only; not exposed to students or grading. */
export const suggestedActivities: SuggestedActivity[] = [
  {
    "label": "Listen and explore: Feelings and Greetings",
    "mode": "tap-picture",
    "educatorNote": "Teacher defines visual scene and sound cues here."
  },
  {
    "label": "Speak about Feelings and Greetings",
    "mode": "repeat-after-julie",
    "educatorNote": "Teacher supplies sample answer, corrective hints and language support."
  },
  {
    "label": "Show what you know about Feelings and Greetings",
    "mode": "listen-and-find",
    "educatorNote": "Teacher sets scoring rubric, touch choices and mastery threshold."
  }
]
