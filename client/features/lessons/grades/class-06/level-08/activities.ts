import type { LevelActivity, SuggestedActivity } from '../../../types'

/** Add reviewed, working exercises. Empty means NOT student-playable. */
export const activities: LevelActivity[] = []

/** Editorial ideas only; not exposed to students or grading. */
export const suggestedActivities: SuggestedActivity[] = [
  {
    "label": "Listen and explore: Comparing Choices",
    "mode": "role-play",
    "educatorNote": "Teacher defines visual scene and sound cues here."
  },
  {
    "label": "Speak about Comparing Choices",
    "mode": "sentence-builder",
    "educatorNote": "Teacher supplies sample answer, corrective hints and language support."
  },
  {
    "label": "Show what you know about Comparing Choices",
    "mode": "listen-and-answer",
    "educatorNote": "Teacher sets scoring rubric, touch choices and mastery threshold."
  }
]
