import type { LevelActivity, SuggestedActivity } from '../../../types'

/** Add reviewed, working exercises. Empty means NOT student-playable. */
export const activities: LevelActivity[] = []

/** Editorial ideas only; not exposed to students or grading. */
export const suggestedActivities: SuggestedActivity[] = [
  {
    "label": "Listen and explore: Describing Experiences",
    "mode": "role-play",
    "educatorNote": "Teacher defines visual scene and sound cues here."
  },
  {
    "label": "Speak about Describing Experiences",
    "mode": "sentence-builder",
    "educatorNote": "Teacher supplies sample answer, corrective hints and language support."
  },
  {
    "label": "Show what you know about Describing Experiences",
    "mode": "listen-and-answer",
    "educatorNote": "Teacher sets scoring rubric, touch choices and mastery threshold."
  }
]
