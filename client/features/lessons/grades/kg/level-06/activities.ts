import type { LevelActivity, SuggestedActivity } from '../../../types'

/** Approved staff-preview order. It does not publish or enable student access. */
export const activities: LevelActivity[] = [
  { id: 'say-a-apple', type: 'repeat-after-julie', prompt: 'Look at the picture. A for apple. Now you say: A for apple.', successCriteria: 'Say A for apple', difficulty: 1, approved: true },
  { id: 'say-e-elephant', type: 'repeat-after-julie', prompt: 'Look at the picture. E for elephant. Now you say: E for elephant.', successCriteria: 'Say E for elephant', difficulty: 1, approved: true },
  { id: 'say-i-igloo', type: 'repeat-after-julie', prompt: 'Look at the picture. I for igloo. Now you say: I for igloo.', successCriteria: 'Say I for igloo', difficulty: 1, approved: true },
  { id: 'say-o-orange', type: 'repeat-after-julie', prompt: 'Look at the picture. O for orange. Now you say: O for orange.', successCriteria: 'Say O for orange', difficulty: 1, approved: true },
  { id: 'say-u-umbrella', type: 'repeat-after-julie', prompt: 'Look at the picture. U for umbrella. Now you say: U for umbrella.', successCriteria: 'Say U for umbrella', difficulty: 1, approved: true },
]

/** No speculative or unapproved extra activities. */
export const suggestedActivities: SuggestedActivity[] = []
