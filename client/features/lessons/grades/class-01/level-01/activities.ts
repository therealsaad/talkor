import type { LevelActivity, SuggestedActivity } from '../../../types'

/** Foundation first, then an ORIGINAL lesson inspired by the learning outcomes
 * of Balbharati Grade One (2025), Unit One 1.1, page 1. This is not a copy of
 * the textbook's protected rhyme. Student publication still needs teacher QA. */
export const activities: LevelActivity[] = [
  { id: 'class1-l01-listen-at', type: 'listen-and-find', prompt: 'Listen to the word at. Find at.', successCriteria: 'Select at from three choices.', difficulty: 1, approved: true },
  { id: 'class1-l01-build-at', type: 'word-builder', prompt: 'Put a and t together to make at.', successCriteria: 'Build at in order.', difficulty: 1, approved: true },
  { id: 'class1-l01-listen-in', type: 'listen-and-find', prompt: 'Listen to the word in. Find in.', successCriteria: 'Select in from three choices.', difficulty: 1, approved: true },
  { id: 'class1-l01-build-in', type: 'word-builder', prompt: 'Put i and n together to make in.', successCriteria: 'Build in in order.', difficulty: 1, approved: true },
  { id: 'class1-l01-look-at-me', type: 'picture-choice', prompt: 'Choose the missing word: Look __ me.', successCriteria: 'Select at.', difficulty: 2, approved: true },
  { id: 'class1-l01-i-am-sam', type: 'sentence-builder', prompt: 'Put these words in order: I / am / Sam.', successCriteria: 'Build I am Sam.', difficulty: 2, approved: true },
  { id: 'class1-l01-repeat-at', type: 'guided-dialogue', prompt: 'Say at, then use it with Miss Julie.', successCriteria: 'Complete two short, activity-grounded turns.', difficulty: 2, approved: true },
  { id: 'class1-l01-say-walk', type: 'repeat-after-julie', prompt: 'Look at Miss Julie walking. Can you say walk?', successCriteria: 'Try the English action word walk with supportive retries.', difficulty: 1, approved: true },
  { id: 'class1-l01-find-school', type: 'listen-and-find', prompt: 'Look at the pictures. Which one is a school?', successCriteria: 'Recognize school from three choices.', difficulty: 1, approved: true },
  { id: 'class1-l01-school-talk', type: 'guided-dialogue', prompt: 'Tell Miss Julie one thing you do at school.', successCriteria: 'Complete a short supported conversation using beginner English.', difficulty: 2, approved: true },
]

export const suggestedActivities: SuggestedActivity[] = [
  { label: 'Balbharati Unit One, 1.1 My First Day', mode: 'listen-and-answer', educatorNote: 'Teacher review required: 2025 Grade One edition (2026 reprint), page 1. Teach the vocabulary and actions through original narration, never a copied poem or textbook illustrations.' },
]
