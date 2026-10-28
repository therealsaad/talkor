import type { LevelActivity, SuggestedActivity } from '../../../types'

/** Foundation first, then an ORIGINAL lesson inspired by the learning outcomes
 * of Balbharati Grade One (2025), Unit One 1.1, page 1. This is not a copy of
 * the textbook's protected rhyme. Student publication still needs teacher QA. */
export const activities: LevelActivity[] = [
  { id: 'class1-l01-listen-am', type: 'listen-and-find', prompt: 'Listen for am. Choose the word you hear.', successCriteria: 'Select am from three choices.', difficulty: 1, approved: true },
  { id: 'class1-l01-build-an', type: 'word-builder', prompt: 'Put a and n together to make an.', successCriteria: 'Build an in order.', difficulty: 1, approved: true },
  { id: 'class1-l01-listen-at', type: 'listen-and-find', prompt: 'Listen for at. Choose the word you hear.', successCriteria: 'Select at from three choices.', difficulty: 1, approved: true },
  { id: 'class1-l01-listen-in', type: 'listen-and-find', prompt: 'Listen for in. Choose the word you hear.', successCriteria: 'Select in from three choices.', difficulty: 1, approved: true },
  { id: 'class1-l01-use-on', type: 'listen-and-answer', prompt: 'The book is __ the table. Choose the little word.', successCriteria: 'Use on to tell where the book is.', difficulty: 1, approved: true },
  { id: 'class1-l01-it-is-up', type: 'listen-and-answer', prompt: 'Read: It is up. Which little word says where?', successCriteria: 'Choose up from the sentence.', difficulty: 1, approved: true },
  { id: 'class1-l01-review-little-words', type: 'guided-dialogue', prompt: 'Practise am, an, at, in, is, it, on, and up with Miss Julie.', successCriteria: 'Complete two short, activity-grounded turns using a little word.', difficulty: 2, approved: true },
  { id: 'class1-l01-say-walk', type: 'repeat-after-julie', prompt: 'Look at Miss Julie walking. Can you say walk?', successCriteria: 'Try the English action word walk with supportive retries.', difficulty: 1, approved: true },
  { id: 'class1-l01-find-school', type: 'listen-and-find', prompt: 'Look at the pictures. Which one is a school?', successCriteria: 'Recognize school from three choices.', difficulty: 1, approved: true },
  { id: 'class1-l01-school-talk', type: 'guided-dialogue', prompt: 'Tell Miss Julie one thing you do at school.', successCriteria: 'Complete a short supported conversation using beginner English.', difficulty: 2, approved: true },
]

export const suggestedActivities: SuggestedActivity[] = [
  { label: 'Balbharati Unit One, 1.1 My First Day', mode: 'listen-and-answer', educatorNote: 'Teacher review required: 2025 Grade One edition (2026 reprint), page 1. Teach the vocabulary and actions through original narration, never a copied poem or textbook illustrations.' },
]
