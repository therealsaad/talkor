import type { LevelActivity, SuggestedActivity } from '../../../types'

/** Mirrors the eight reviewed activities in the authenticated KG alphabet runtime. */
export const activities: LevelActivity[] = [
  { id: 'say-a', type: 'repeat-after-julie', prompt: 'Say apple.', successCriteria: 'Child-friendly speech grading recognizes apple for A.', difficulty: 1, approved: true },
  { id: 'say-b', type: 'repeat-after-julie', prompt: 'Say ball.', successCriteria: 'Child-friendly speech grading recognizes ball for B.', difficulty: 1, approved: true },
  { id: 'say-c', type: 'repeat-after-julie', prompt: 'Say cat.', successCriteria: 'Child-friendly speech grading recognizes cat for C.', difficulty: 1, approved: true },
  { id: 'say-d', type: 'repeat-after-julie', prompt: 'Say dog.', successCriteria: 'Child-friendly speech grading recognizes dog for D.', difficulty: 1, approved: true },
  { id: 'find-a', type: 'listen-and-find', prompt: 'Find the apple.', successCriteria: 'Selects the approved apple picture.', difficulty: 1, approved: true },
  { id: 'find-b', type: 'listen-and-find', prompt: 'Find the ball.', successCriteria: 'Selects the approved ball picture.', difficulty: 1, approved: true },
  { id: 'find-c', type: 'listen-and-find', prompt: 'Find the cat.', successCriteria: 'Selects the approved cat picture.', difficulty: 1, approved: true },
  { id: 'find-d', type: 'listen-and-find', prompt: 'Find the dog.', successCriteria: 'Selects the approved dog picture and completes the level.', difficulty: 1, approved: true },
]

/** There are no speculative activities in the live Level 1 package. */
export const suggestedActivities: SuggestedActivity[] = []
