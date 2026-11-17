import type { LevelActivity } from '../../../types'

/**
 * Class 1 Level 2 authoring package. Mapped from the existing editorial
 * English Balbharati Standard One Chapter 1.2–1.6 references.
 * All prompts are ORIGINAL classroom teaching language, NOT a copy of
 * the textbook, illustrations, songs or publisher audio.
 *
 * Draft only. No real speech grading, publication or student unlock is granted.
 */
export const CLASS1_LEVEL2_SOURCE = {
  book: 'English Balbharati Standard One (2025; reprint 2026)',
  chapterReferences: [
    { chapter: '1.2', page: 2, topic: 'Clap your hands.', goal: 'Listen to an action word and say clap' },
    { chapter: '1.3', page: 3, topic: 'I know my alphabet.', goal: 'Recognize an English letter by listening' },
    { chapter: '1.4', page: 5, topic: 'Let us read.', goal: 'Blend familiar letters to make a short word' },
    { chapter: '1.5', page: 7, topic: 'Fun with Special Letters', goal: 'Identify vowels a, e, i, o, u in simple words' },
    { chapter: '1.6', page: 8, topic: 'The Rainbow', goal: 'Identify and describe an illustrated colour' },
  ],
  boardReviewRequired: true,
  syllabusVerified: false,
  introReviewRequired: true,
} as const

export const CLASS1_LEVEL2_STORYBOARD: readonly string[] = [
  'In a fresh original 60–90 second teacher-reviewed clip, Miss Julie walks through Rainbow Sound Garden, with no copied textbook song.',
  'Julie claps twice and shows a clap action card. The child sees large hands, hears clap, and gets a quiet repeat pause.',
  'Large letter cards A, B and D slide gently onto the board; Julie says the sound of B and points to it.',
  'Julie brings separate C A T picture-friendly letter blocks together without forcing reading fluency.',
  'Five large vowel cards a, e, i, o and u appear, then Julie highlights a in cat without demanding written fluency.',
  'Four bright solid colour cards appear. Julie points to red and invites an optional one-word response.',
  'End with a short original recap and instruction to listen, then try one English word at a time.',
]

export const CLASS1_LEVEL2_ART_BRIEFS: readonly string[] = [
  'Hands clapping as a safe illustrated action, crop never showing a real child identity',
  'Three high-contrast A B D teaching cards, font legible in school-lab landscape',
  'Separate large lowercase c/a/t blocks and neutral cat illustration, no publisher image',
  'Five clear original lowercase vowel cards and a cat word card with the vowel a highlighted',
  'Large individually labeled red, blue, green and yellow cards with colour + shape cues',
  'Miss Julie uses the existing brown-hair/light-blue-blazer neutral character, optimised transparent pose assets',
]

export const CLASS1_LEVEL2_TEACHING_STEPS = [
  { key: 'clap-invitation', chapter: '1.2', mode: 'repeat-after-julie',
    teacherLine: 'Miss Julie claps two times. Listen: clap. Now say clap!',
    expectedEvidence: 'Child attempts the English word clap, with no demand to clap physically.',
    hintHi: 'Clap मतलब ताली बजाना। अब कहो clap.',
    hintMr: 'Clap म्हणजे टाळी वाजवणे. आता clap म्हण.',
  },
  { key: 'letter-listening', chapter: '1.3', mode: 'listen-and-find',
    teacherLine: 'Look at A, B and D. Listen closely. Point to B.',
    expectedEvidence: 'Child identifies the heard letter B from mixed positions.',
    hintHi: 'यह letter B है। सुनो और B चुनो.',
    hintMr: 'हे B अक्षर आहे. ऐक आणि B निवड.',
  },
  { key: 'cat-building', chapter: '1.4', mode: 'word-builder',
    teacherLine: 'We have c, a and t. Say the word with me: cat.',
    expectedEvidence: 'Child sequences c a t or says cat after a model; do not score unassisted literacy before review.',
    hintHi: 'C, A, T साथ में cat बनता है।',
    hintMr: 'C, A, T मिळून cat हा शब्द होतो.',
  },
  { key: 'special-letters', chapter: '1.5', mode: 'listen-and-find',
    teacherLine: 'A, E, I, O and U are vowels. Look at cat. Find the vowel a.',
    expectedEvidence: 'Child identifies a in cat; adult-led written missing-vowel exercises remain required.',
    hintHi: 'A, E, I, O, U vowels हैं। Cat में a चुनो।',
    hintMr: 'A, E, I, O, U हे स्वर आहेत. Cat मध्ये a निवड.',
  },
  { key: 'rainbow-colour', chapter: '1.6', mode: 'picture-choice',
    teacherLine: 'Our rainbow picture has red and blue. Point to red.',
    expectedEvidence: 'Child identifies red against a colour and shape distractor.',
    hintHi: 'Red मतलब लाल। उस कार्ड को चुनो.',
    hintMr: 'Red म्हणजे लाल. ते कार्ड निवड.',
  },
] as const

/** The next five canonical speaking beats, one per source chapter, in strict
 * Balbharati 1.2–1.6 order. These are original model sentences for a
 * teacher-approved *future* student runtime. The authenticated backend must
 * supply the active chapter and own all evidence, progress and unlocking;
 * this module cannot mark an activity, chapter or level completed.
 *
 * The 19 accompanying numbered textbook exercises require separately
 * supervised reading, writing, movement and listening review. Five spoken
 * words cannot certify all 19 exercises or the level.
 */
export const CLASS1_LEVEL2_VOICE_SCENES = [
  { chapter: '1.2', stepKey: 'clap-invitation', englishTarget: 'clap',
    modelEnglish: 'I can clap.', retryEnglish: 'Listen: clap. Now say clap.',
    translationEnglish: 'Clap means bringing your hands together.',
    teacherReviewRequired: true, audioReviewRequired: true, deviceTestRequired: true,
    reviewed: false, studentPlayable: false },
  { chapter: '1.3', stepKey: 'letter-listening', englishTarget: 'B',
    modelEnglish: 'This is the letter B.', retryEnglish: 'Listen to B. Try saying B.',
    translationEnglish: 'B is one letter of the English alphabet.',
    teacherReviewRequired: true, audioReviewRequired: true, deviceTestRequired: true,
    reviewed: false, studentPlayable: false },
  { chapter: '1.4', stepKey: 'cat-building', englishTarget: 'cat',
    modelEnglish: 'I see a cat.', retryEnglish: 'Listen: c, a, t. Together: cat.',
    translationEnglish: 'We can join c, a and t to make cat.',
    teacherReviewRequired: true, audioReviewRequired: true, deviceTestRequired: true,
    reviewed: false, studentPlayable: false },
  { chapter: '1.5', stepKey: 'special-letters', englishTarget: 'a',
    modelEnglish: 'The vowel a is in cat.', retryEnglish: 'Find the letter a in cat.',
    translationEnglish: 'The five vowel letters are a, e, i, o and u.',
    teacherReviewRequired: true, audioReviewRequired: true, deviceTestRequired: true,
    reviewed: false, studentPlayable: false },
  { chapter: '1.6', stepKey: 'rainbow-colour', englishTarget: 'red',
    modelEnglish: 'It is red.', retryEnglish: 'Look at the red card. Say red.',
    translationEnglish: 'Red is a colour of the rainbow.',
    teacherReviewRequired: true, audioReviewRequired: true, deviceTestRequired: true,
    reviewed: false, studentPlayable: false },
] as const

/** Short supports reuse the same already-authored Hindi/Marathi lesson cue.
 * Student-language recognition is Sarvam; these preview strings are not
 * evidence that an English word was spoken or that a child mastered it. */
export const CLASS1_LEVEL2_LANGUAGE_SCAFFOLDS = CLASS1_LEVEL2_VOICE_SCENES.map(scene => {
  const step = CLASS1_LEVEL2_TEACHING_STEPS.find(item => item.key === scene.stepKey)
  if (!step || step.chapter !== scene.chapter)
    throw new Error('Class 1 Level 2 authoring step and voice model disagree: ' + scene.stepKey)
  return {
    chapter: scene.chapter, stepKey: scene.stepKey,
    teacherEnglish: step.teacherLine, modelEnglish: scene.modelEnglish,
    hintHindi: step.hintHi, hintMarathi: step.hintMr,
    retryEnglish: scene.retryEnglish,
    teacherReviewRequired: true as const,
    studentPlayable: false as const,
  }
})

/** Original supplementary review activities, not replacement of the 1.2–1.6
 * syllabus tasks. All need teacher signoff and real audio approval.
 */
export const CLASS1_LEVEL2_REVIEW_ACTIVITIES: LevelActivity[] = [
  { id: 'class1-l02-clap-say-again', type: 'repeat-after-julie',
    prompt: 'Miss Julie claps once. Can you say clap without me?',
    successCriteria: 'Independent spoken English attempt at clap, with a model on request.', difficulty: 1, approved: false },
  { id: 'class1-l02-letter-b-mixed', type: 'listen-and-find',
    prompt: 'Listen for B. Find B after the letters move to new places.',
    successCriteria: 'Locates B in a new randomized visible order.', difficulty: 1, approved: false },
  { id: 'class1-l02-cat-in-speech', type: 'guided-dialogue',
    prompt: 'Miss Julie points to an original cat picture. Say: I see a cat.',
    successCriteria: 'An English word or short model phrase about the pictured cat; no accent score.', difficulty: 2, approved: false },
  { id: 'class1-l02-vowel-a-find', type: 'listen-and-find',
    prompt: 'Listen: a is a vowel. Find a in cat, then try finding e in pen.',
    successCriteria: 'Identifies a and e as vowels in two new authored word cards.', difficulty: 1, approved: false },
  { id: 'class1-l02-rainbow-say-red', type: 'guided-dialogue',
    prompt: 'Miss Julie holds a red colour card. Say: It is red.',
    successCriteria: 'Attempts red or the supported short sentence in English.', difficulty: 2, approved: false },
  { id: 'class1-l02-homework', type: 'speaking-reflection',
    prompt: 'Tiny homework: Find one colour around you later and say its English name.',
    successCriteria: 'Receives short spoken offline homework; no family recording, upload or XP grant.', difficulty: 1, approved: false },
]
