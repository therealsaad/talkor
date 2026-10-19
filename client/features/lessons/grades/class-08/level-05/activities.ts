import type { LevelActivity, SuggestedActivity } from '../../../types'

/** Add reviewed, working exercises. Empty means NOT student-playable. */
export const activities: LevelActivity[] = []

/** Editorial ideas only; not exposed to students or grading. */
export const suggestedActivities: SuggestedActivity[] = [
  {
    "label": "Listen and explore: Listening and Inference",
    "mode": "conversation",
    "educatorNote": "Teacher defines visual scene and sound cues here."
  },
  {
    "label": "Speak about Listening and Inference",
    "mode": "scenario-decision",
    "educatorNote": "Teacher supplies sample answer, corrective hints and language support."
  },
  {
    "label": "Show what you know about Listening and Inference",
    "mode": "speaking-reflection",
    "educatorNote": "Teacher sets scoring rubric, touch choices and mastery threshold."
  }
]
