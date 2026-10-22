import type { LevelActivity, SuggestedActivity } from '../../../types'

/** Teacher-authored foundations content. Keep the level draft until authenticated
 * progress, microphone assessment and S3 voice delivery pass end-to-end QA. */
export const activities: LevelActivity[] = [
  { id: 'class1-l01-listen-at', type: 'listen-and-find', prompt: 'Listen to the word at. Find at.', successCriteria: 'Select at from three choices.', difficulty: 1, approved: true },
  { id: 'class1-l01-build-at', type: 'word-builder', prompt: 'Put a and t together to make at.', successCriteria: 'Build at in order.', difficulty: 1, approved: true },
  { id: 'class1-l01-listen-in', type: 'listen-and-find', prompt: 'Listen to the word in. Find in.', successCriteria: 'Select in from three choices.', difficulty: 1, approved: true },
  { id: 'class1-l01-build-in', type: 'word-builder', prompt: 'Put i and n together to make in.', successCriteria: 'Build in in order.', difficulty: 1, approved: true },
  { id: 'class1-l01-look-at-me', type: 'picture-choice', prompt: 'Choose the missing word: Look __ me.', successCriteria: 'Select at.', difficulty: 2, approved: true },
  { id: 'class1-l01-i-am-sam', type: 'sentence-builder', prompt: 'Put these words in order: I / am / Sam.', successCriteria: 'Build I am Sam.', difficulty: 2, approved: true },
  { id: 'class1-l01-repeat-at', type: 'guided-dialogue', prompt: 'Say at, then use it with Miss Julie.', successCriteria: 'Complete two short, activity-grounded turns.', difficulty: 2, approved: true },
]

export const suggestedActivities: SuggestedActivity[] = [
  { label: 'Balbharati textbook connection', mode: 'listen-and-answer', educatorNote: 'Attach a verified Class 1 English Balbharati edition, unit, page, and teacher-approved activity; no textbook claim is made yet.' },
]
