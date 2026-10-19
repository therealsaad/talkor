import type { LevelActivity, SuggestedActivity } from '../../../types'

/** Add reviewed, working exercises. Empty means NOT student-playable. */
export const activities: LevelActivity[] = []

/** Editorial ideas only; not exposed to students or grading. */
export const suggestedActivities: SuggestedActivity[] = [
  {
    "label": "Listen and explore: Mini Presentation",
    "mode": "picture-choice",
    "educatorNote": "Teacher defines visual scene and sound cues here."
  },
  {
    "label": "Speak about Mini Presentation",
    "mode": "guided-dialogue",
    "educatorNote": "Teacher supplies sample answer, corrective hints and language support."
  },
  {
    "label": "Show what you know about Mini Presentation",
    "mode": "word-builder",
    "educatorNote": "Teacher sets scoring rubric, touch choices and mastery threshold."
  }
]
