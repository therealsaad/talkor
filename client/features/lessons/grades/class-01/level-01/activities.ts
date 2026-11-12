import type { LevelActivity, SuggestedActivity } from '../../../types'

/**
 * Staff-only teaching overview of the REAL ten-scene First Day v3 adventure.
 * Canonical authorized activity records, media keys, attempts and progress
 * come from MongoDB: backend/src/scripts/class1-first-day-scenes.ts and the
 * published lesson, NEVER from this local preview array.
 *
 * These curriculum previews are original Talkora prompts. No textbook poem
 * or publisher imagery is embedded. They are not publication approvals.
 */
export const activities: LevelActivity[] = [
  { id: 'class1-l01-v3-hello-school', type: 'guided-dialogue',
    prompt: 'Miss Julie welcomes you at the school gate. Say school or a short phrase about your first day.',
    successCriteria: 'Learner independently attempts a relevant English word about school; Hindi/Marathi requests receive an English model.',
    difficulty: 1, approved: false },
  { id: 'class1-l01-v3-skip-bunny', type: 'guided-dialogue',
    prompt: 'Watch the bunny skip. Miss Julie says I can skip. Try the action word or short English sentence.',
    successCriteria: 'Attempts skip/skipping in English; a question, silence or unrelated word must lead to support and retry.',
    difficulty: 1, approved: false },
  { id: 'class1-l01-v3-run-race', type: 'guided-dialogue',
    prompt: 'Make your fingers run on a table with Miss Julie. Say I can run.',
    successCriteria: 'Attempts run/running in a relevant spoken English phrase without requiring physical movement.',
    difficulty: 1, approved: false },
  { id: 'class1-l01-v3-walk-school', type: 'guided-dialogue',
    prompt: 'We are walking to school. Tell Miss Julie I walk to school.',
    successCriteria: 'Attempts walk in a school-related English statement with optional Marathi/Hindi explanation.',
    difficulty: 1, approved: false },
  { id: 'class1-l01-v3-big-grin', type: 'guided-dialogue',
    prompt: 'Miss Julie smiles and shows a big grin. Say smile or I can smile.',
    successCriteria: 'Understands grin as smile and tries an English word or phrase.',
    difficulty: 1, approved: false },
  { id: 'class1-l01-v3-school-bell', type: 'guided-dialogue',
    prompt: 'Ding dong! The school bell rings. Tell Miss Julie what you hear at school.',
    successCriteria: 'Attempts bell/rings/hear in a relevant English response. A child may ask about the sound without earning premature mastery.',
    difficulty: 1, approved: false },
  { id: 'class1-l01-v3-jump-frog', type: 'guided-dialogue',
    prompt: 'Miss Julie plays a jumping-frog game with two fingers. Say I can jump.',
    successCriteria: 'Attempts jump/jumping in an English response, with retries and no compulsory jumping.',
    difficulty: 1, approved: false },
  { id: 'class1-l01-v3-play-friends', type: 'guided-dialogue',
    prompt: 'Our friends play with a ball at school. Say I can play or ask a short play question.',
    successCriteria: 'Attempts play or a related school-play phrase in English.',
    difficulty: 1, approved: false },
  { id: 'class1-l01-v3-enter-class', type: 'guided-dialogue',
    prompt: 'The bell rings and we go into the classroom. Where do we go?',
    successCriteria: 'Uses classroom/go/school in a relevant English response, with an English model if needed.',
    difficulty: 2, approved: false },
  { id: 'class1-l01-v3-grade-one', type: 'guided-dialogue',
    prompt: 'Hooray, Grade One! Tell Miss Julie one school action you learnt today.',
    successCriteria: 'Recalls one school action in English, receives spoken homework and closes only after saved attempt and audible teacher response.',
    difficulty: 2, approved: false },
]

export const suggestedActivities: SuggestedActivity[] = [
  { label: 'English Balbharati 1.1 My First Day, printed page 1',
    mode: 'guided-dialogue',
    educatorNote: 'Rehearse the ten original First Day speaking scenes. The actual required textbook listening-and-singing and look-and-say exercises, and movement participation, also need teacher checks. The 90-second intro and fixed Priya/S3 narration require media approval before production publishing.' },
  { label: 'Historic little-word foundation (retained separately)',
    mode: 'word-builder',
    educatorNote: 'Previous am/an/at/in/is/it/on/up activities and their saved attempts remain in the database, but must not replace the ten-scene First Day syllabus or falsely count as completing Balbharati 1.1.' },
]
