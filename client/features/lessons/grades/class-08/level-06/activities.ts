import type { LevelActivity, SuggestedActivity } from '../../../types'

/** Add reviewed, working exercises. Empty means NOT student-playable. */
export const activities: LevelActivity[] = []

/** Editorial ideas only; not exposed to students or grading. */
export const suggestedActivities: SuggestedActivity[] = [
  {
    "label": "Listen and explore: Everyday Problem Solving",
    "mode": "conversation",
    "educatorNote": "Teacher defines visual scene and sound cues here."
  },
  {
    "label": "Speak about Everyday Problem Solving",
    "mode": "scenario-decision",
    "educatorNote": "Teacher supplies sample answer, corrective hints and language support."
  },
  {
    "label": "Show what you know about Everyday Problem Solving",
    "mode": "speaking-reflection",
    "educatorNote": "Teacher sets scoring rubric, touch choices and mastery threshold."
  }
]
