import type { LevelActivity, LearningMode } from '../../../types'

/**
 * Staff-only numbered-exercise checkpoint drafts for Balbharati 1.2–1.6.
 * One original Talkora prompt for each of the 19 numbered textbook tasks
 * audited in ../../../../curriculum-explorer/unit-one-coverage.ts.
 *
 * These are scaffolds for teacher rehearsal, NOT a complete digitized
 * textbook, finished illustrations, audio assets or machine-assessable tasks.
 * Writing, movement, group participation and workbook evidence require
 * educator inspection. None can award XP or unlock a student lesson.
 */
interface ExerciseCheckpoint {
  chapter: '1.2' | '1.3' | '1.4' | '1.5' | '1.6'
  number: number
  type: LearningMode
  prompt: string
  evidence: string
}
export const CLASS1_L2_NUMBERED_EXERCISE_CHECKPOINTS: readonly ExerciseCheckpoint[] = [
  // 1.2: actions and rhythm. Real movement needs an adult and accessible alternative.
  { chapter: '1.2', number: 1, type: 'repeat-after-julie',
    prompt: 'Let us practise counting to five with gentle actions. Listen, then say one action word with me.',
    evidence: 'Teacher observes the five-count action sequence or accessible alternatives, not just microphone speech.' },
  { chapter: '1.2', number: 2, type: 'guided-dialogue',
    prompt: 'Try a different movement in our own action game. Can you say wave, sing, touch or blink?',
    evidence: 'Teacher checks the complete set of action substitutions and safe access needs.' },
  { chapter: '1.2', number: 3, type: 'listen-and-find',
    prompt: 'Listen: knee. Find the knee picture. We will also learn bend, floor, turn and the other action words.',
    evidence: 'Teacher checks every target vocabulary item from the printed activity, not this sample word alone.' },
  // 1.3: alphabet, partner cards and middle vowel sound.
  { chapter: '1.3', number: 1, type: 'listen-and-find',
    prompt: 'Look at a big letter and its small partner. Find them together; trace them with your teacher.',
    evidence: 'Teacher checks all 26 uppercase/lowercase pairings and actual tracing work.' },
  { chapter: '1.3', number: 2, type: 'guided-dialogue',
    prompt: 'Imagine two letter cards looking for partners. Say a letter as your teacher helps you match it.',
    evidence: 'Teacher observes physical letter-card matching or an accessible alternative.' },
  { chapter: '1.3', number: 3, type: 'listen-and-find',
    prompt: 'Listen for the middle sound e in pen. Choose the matching picture as your teacher checks the path.',
    evidence: 'Teacher verifies each word choice along the full middle-e picture maze.' },
  // 1.4: complete phonics and writing are retained as teacher checkpoints.
  { chapter: '1.4', number: 1, type: 'repeat-after-julie',
    prompt: 'Hear short words like am, be, in and up. Read and write the full two-letter set with your teacher.',
    evidence: 'Teacher checks all assigned two-letter groups and notebook writing.' },
  { chapter: '1.4', number: 2, type: 'word-builder',
    prompt: 'Try making a word from the an family. Next practise en, in, op and un in your notebook.',
    evidence: 'Teacher verifies each word family and written examples, not just the initial word.' },
  { chapter: '1.4', number: 3, type: 'picture-choice',
    prompt: 'Study the picture and choose the sound that completes its word; write the letters with your teacher.',
    evidence: 'Teacher confirms all picture-letter choices and legible completed written words.' },
  { chapter: '1.4', number: 4, type: 'word-builder',
    prompt: 'Listen: sun, Sunday. Which little word begins the longer word? Try the other pairs too.',
    evidence: 'Teacher checks man/mango, pen/pencil, win/window, pop/popcorn and sun/Sunday.' },
  // 1.5: vowels, finding vowels and written missing-letter practice.
  { chapter: '1.5', number: 1, type: 'repeat-after-julie',
    prompt: 'Listen to the five vowel letters: a, e, i, o, u. Say them slowly with Miss Julie.',
    evidence: 'Teacher confirms the vowel-versus-consonant distinction; no accent scoring.' },
  { chapter: '1.5', number: 2, type: 'listen-and-find',
    prompt: 'Find the vowel in ball, then practise with dog, cup, ice, tree, onion, zebra and umbrella.',
    evidence: 'Teacher checks vowel identification across all eight pictured word examples.' },
  { chapter: '1.5', number: 3, type: 'word-builder',
    prompt: 'A letter is missing in s_n. Which vowel belongs there? Complete the remaining words on paper.',
    evidence: 'Teacher checks written missing vowels in sun, cat, fish, egg and owl.' },
  // 1.6: more than a colour game: literature, dictation and articles.
  { chapter: '1.6', number: 1, type: 'guided-dialogue',
    prompt: 'What colours do you notice in our original rainbow? Share a question, then sing with your teacher.',
    evidence: 'Teacher observes discussion and the textbook poem separately using permitted classroom materials.' },
  { chapter: '1.6', number: 2, type: 'listen-and-find',
    prompt: 'Find violet on the rainbow. Now locate all seven colours, including indigo.',
    evidence: 'Teacher verifies recognition of all seven colour words.' },
  { chapter: '1.6', number: 3, type: 'repeat-after-julie',
    prompt: 'Listen to the word sky. Say it, then write the full dictation list with your teacher.',
    evidence: 'Teacher checks rainbow, sky, peeping, clouds, orange and indigo in a notebook.' },
  { chapter: '1.6', number: 4, type: 'sentence-builder',
    prompt: 'Look at an original sky picture. Complete a short phrase with a word from the picture.',
    evidence: 'Teacher checks both printed phrases and corresponding written answers.' },
  { chapter: '1.6', number: 5, type: 'guided-dialogue',
    prompt: 'Listen: an apple, a cat and the sun. Notice how we choose a, an or the.',
    evidence: 'Teacher checks all printed article examples and explains introductory sound-based usage.' },
  { chapter: '1.6', number: 6, type: 'sentence-builder',
    prompt: 'Choose a, an or the for a practice picture. Complete the remaining workbook blanks with your teacher.',
    evidence: 'Teacher signs off all twelve article blanks on printed page 9; one speaking answer is not enough.' },
]

/** Distinct draft IDs prevent a single spoken response masquerading as an
 * entire textbook activity. This metadata is not consumed by a student engine.
 */
export const CLASS1_L2_NUMBERED_EXERCISE_ACTIVITIES: LevelActivity[] =
  CLASS1_L2_NUMBERED_EXERCISE_CHECKPOINTS.map(item => ({
    id: `class1-l02-ex-${item.chapter.replace('.', '-')}-${String(item.number).padStart(2, '0')}`,
    type: item.type,
    prompt: item.prompt,
    successCriteria: item.evidence,
    difficulty: 1,
    approved: false,
  }))
