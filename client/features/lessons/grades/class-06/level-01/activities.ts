import type { LevelActivity, SuggestedActivity } from '../../../types'

/** Add reviewed, working exercises. Empty means NOT student-playable. */
export const activities: LevelActivity[] = []

/** Editorial ideas only; not exposed to students or grading. */
export const suggestedActivities: SuggestedActivity[] = [
  {
    "label": "Listen and explore: Express Opinions",
    "mode": "role-play",
    "educatorNote": "Teacher defines visual scene and sound cues here."
  },
  {
    "label": "Speak about Express Opinions",
    "mode": "sentence-builder",
    "educatorNote": "Teacher supplies sample answer, corrective hints and language support."
  },
  {
    "label": "Show what you know about Express Opinions",
    "mode": "listen-and-answer",
    "educatorNote": "Teacher sets scoring rubric, touch choices and mastery threshold."
  }
]
