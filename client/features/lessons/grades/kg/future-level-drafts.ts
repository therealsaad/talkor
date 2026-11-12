import type { LearningMode, LevelActivity, SuggestedActivity } from '../../types'

/**
 * Staff-facing curriculum authoring ONLY for KG Levels 6–10.
 * These are ORIGINAL Talkora tasks. They are not syllabus-approved or playable,
 * do not reference unreviewed image/audio URLs and cannot authorize students.
 *
 * Every episode includes picture recognition, listening, English response,
 * brief spoken homework and a review checkpoint. Audio, pronunciation tolerance,
 * full intro media and picture assets still require adult/teacher validation.
 */
export type KGFutureLevel = 6 | 7 | 8 | 9 | 10
type DraftBeat = {
  mode: LearningMode
  prompt: string
  evidence: string
  difficulty?: 1 | 2
}
type KGFutureDraft = {
  level: KGFutureLevel
  title: string
  objective: string
  targetWords: readonly string[]
  reviewWords: readonly string[]
  visualBriefs: readonly string[]
  introStoryboard: readonly string[]
  teacherReview: string
  beats: readonly DraftBeat[]
}

export const KG_FUTURE_DRAFTS: readonly KGFutureDraft[] = [
  {
    level: 6, title: 'Family Words',
    objective: 'Recognize familiar people in an inclusive fictional picture family and use one-word English names.',
    targetWords: ['family', 'parent', 'baby', 'grandparent'],
    reviewWords: ['hello', 'cat'],
    visualBriefs: [
      'A friendly, culturally neutral cartoon family group with varied ages; do not imply any one household is required.',
      'One friendly adult holding a storybook; label the fictional adult parent.',
      'A laughing cartoon baby in a safe cot with no identifiable real-child imagery.',
      'A smiling older adult and child waving together, with no personal name or ethnicity cues.',
    ],
    introStoryboard: [
      'Miss Julie waves from Rainbow Valley with a neutral cartoon family picture.',
      'Julie introduces family, parent, baby and grandparent as words about fictional characters.',
      'One picture appears at a time; the child gets unhurried listening pauses.',
      'Julie invites speaking a word without asking who lives in the learner’s home.',
    ],
    teacherReview: 'Do not ask about family composition, absent relatives, names, addresses or personal circumstances. Accept one English target word; Hindi/Marathi may help comprehension but is not English mastery.',
    beats: [
      { mode: 'tap-picture', prompt: 'Look at our story picture. Touch the baby.', evidence: 'Learner identifies the baby picture.' },
      { mode: 'repeat-after-julie', prompt: 'Listen: family. Now you can say family.', evidence: 'An audible attempt at the word family after the model.' },
      { mode: 'listen-and-find', prompt: 'Miss Julie says grandparent. Find our smiling grandparent.', evidence: 'Learner points to the pictured older adult.' },
      { mode: 'repeat-after-julie', prompt: 'Listen: parent. Try saying parent.', evidence: 'An English attempt at parent; do not score accent.' },
      { mode: 'tap-picture', prompt: 'Which picture shows our friendly family group?', evidence: 'Learner identifies the whole family group.' },
      { mode: 'guided-dialogue', prompt: 'In our pretend story, the baby says hello. What would you say?', evidence: 'Learner attempts hello with a model if requested.', difficulty: 2 },
      { mode: 'listen-and-find', prompt: 'Let us review. Miss Julie says baby. Can you find the baby again?', evidence: 'Learner recognizes the word on a new arrangement.' },
      { mode: 'repeat-after-julie', prompt: 'Tiny homework: Say family and hello when you practise later.', evidence: 'Spoken homework is assigned, not graded or recorded for XP.' },
    ],
  },
  {
    level: 7, title: 'My Classroom',
    objective: 'Identify classroom tools and use short, polite English requests.',
    targetWords: ['book', 'pencil', 'bag', 'chair', 'desk', 'board'],
    reviewWords: ['hello', 'please'],
    visualBriefs: [
      'Bright classroom corner containing one book, pencil, bag, chair and desk, with no text on walls.',
      'Large simple isolated book and pencil icons with distinct silhouettes.',
      'Clear chair-versus-desk picture pair, with child-safe proportions.',
      'A chalkboard with no student names, logos or copyrighted textbook images.',
    ],
    introStoryboard: [
      'Miss Julie welcomes the student to a playful classroom.',
      'Julie reveals book, pencil, bag and desk as friendly animated picture cards.',
      'The board opens to show one simple object at a time.',
      'Julie models: A book, please, before inviting an optional repeat.',
    ],
    teacherReview: 'The lesson concerns fictional classroom objects; never demand school name, roll number, actual possessions or recording of the room.',
    beats: [
      { mode: 'tap-picture', prompt: 'Touch the picture of a book.', evidence: 'Identifies the displayed book.' },
      { mode: 'repeat-after-julie', prompt: 'Miss Julie says pencil. Can you say pencil?', evidence: 'Tries the target English word.' },
      { mode: 'listen-and-find', prompt: 'I say chair. Which picture shows a chair?', evidence: 'Distinguishes chair from desk.' },
      { mode: 'repeat-after-julie', prompt: 'Look at the school bag. Say bag.', evidence: 'Says or attempts bag after hearing it.' },
      { mode: 'tap-picture', prompt: 'Find our classroom board.', evidence: 'Locates the board in the original scene.' },
      { mode: 'guided-dialogue', prompt: 'Pretend you need a book. Say: A book, please.', evidence: 'Tries a polite English request without forced full-sentence fluency.', difficulty: 2 },
      { mode: 'listen-and-find', prompt: 'Review time! I say pencil. Tap the pencil, not the book.', evidence: 'Recognizes the target across a reshuffled pair.' },
      { mode: 'repeat-after-julie', prompt: 'Tiny homework: Point to a book picture and say book.', evidence: 'The assignment is spoken and offline-friendly.' },
    ],
  },
  {
    level: 8, title: 'Feelings and Greetings',
    objective: 'Recognize a fictional character’s expressions and practise simple friendly greetings.',
    targetWords: ['happy', 'sad', 'hello', 'goodbye', 'please', 'thank you'],
    reviewWords: ['family', 'friend'],
    visualBriefs: [
      'One fictional child character smiling, with non-photographic warm expression.',
      'The same fictional character looking disappointed but safe and supported.',
      'Two friendly cartoon characters waving hello with clear facial cues.',
      'A waving goodbye scene and a cartoon character politely giving a book.',
    ],
    introStoryboard: [
      'Miss Julie waves hello and greets a fictional friend.',
      'Julie models happy and sad from pictures without asking about the learner’s emotions.',
      'A fictional character gives a book; Julie models thank you.',
      'Julie closes with goodbye and a gentle invitation to repeat.',
    ],
    teacherReview: 'Do not infer or label a real child’s mood, require personal disclosures or penalize neurodivergent expression. Treat greeting pronunciation support as non-shaming.',
    beats: [
      { mode: 'tap-picture', prompt: 'Which cartoon face looks happy?', evidence: 'Selects the smiling fictional character.' },
      { mode: 'repeat-after-julie', prompt: 'Wave with me and say hello.', evidence: 'Tries hello in English.' },
      { mode: 'listen-and-find', prompt: 'I say sad. Find the cartoon character who looks sad.', evidence: 'Matches a word to a fictional illustrated expression.' },
      { mode: 'repeat-after-julie', prompt: 'Miss Julie waves goodbye. Say goodbye!', evidence: 'Attempts goodbye in a simple social situation.' },
      { mode: 'tap-picture', prompt: 'Someone hands over a book. Tap the picture of a kind thank you.', evidence: 'Selects the polite-exchange picture.' },
      { mode: 'guided-dialogue', prompt: 'A pretend friend offers you a pencil. What can you say? Try thank you.', evidence: 'Uses or repeats a kind response with a model.', difficulty: 2 },
      { mode: 'listen-and-find', prompt: 'Review: Miss Julie says hello. Find the waving hello picture.', evidence: 'Responds to the known greeting in a new visual order.' },
      { mode: 'repeat-after-julie', prompt: 'Tiny homework: Practise hello, please and thank you with a toy.', evidence: 'Spoken homework, no family evidence submission.' },
    ],
  },
  {
    level: 9, title: 'Opposites and Directions',
    objective: 'Identify illustrated contrasting concepts and understand basic left/right with visual hints.',
    targetWords: ['big', 'small', 'up', 'down', 'left', 'right'],
    reviewWords: ['ball', 'cat'],
    visualBriefs: [
      'One very big and one very small cartoon ball on an uncluttered neutral background.',
      'A cartoon bird high above a tree, and a safe ball at the bottom beside it.',
      'Two clear arrows pointing left and right with large 48px minimum tap targets.',
      'An oversized cat-and-ball picture where the object relationships are unmistakable.',
    ],
    introStoryboard: [
      'Miss Julie holds two different sized cartoon balls: big and small.',
      'Julie moves one ball up and down on a stable board.',
      'Left and right are shown with clear arrows; no body-side assumptions.',
      'A short repeated contrast helps the child speak one word at a time.',
    ],
    teacherReview: 'Use directional arrows rather than asking a child to move physically. Provide mirrored displays and avoid failing for motor ability or accent.',
    beats: [
      { mode: 'tap-picture', prompt: 'Touch the big ball.', evidence: 'Selects big rather than small.' },
      { mode: 'repeat-after-julie', prompt: 'See the tiny ball. Say small.', evidence: 'Attempts the English contrast word.' },
      { mode: 'listen-and-find', prompt: 'Julie says up. Find the arrow pointing up.', evidence: 'Recognizes up on the board.' },
      { mode: 'repeat-after-julie', prompt: 'Miss Julie points down. Say down.', evidence: 'Attempts the English direction word.' },
      { mode: 'tap-picture', prompt: 'Find the left arrow.', evidence: 'Correctly identifies a clearly labelled left-pointing arrow.' },
      { mode: 'guided-dialogue', prompt: 'Our toy cat sees a big ball. Try: Big ball!', evidence: 'Uses a supported two-word English phrase.', difficulty: 2 },
      { mode: 'listen-and-find', prompt: 'Review time: Miss Julie says small. Which ball is small?', evidence: 'Identifies small with the positions swapped.' },
      { mode: 'repeat-after-julie', prompt: 'Tiny homework: Say big and small with any two toy pictures.', evidence: 'Offline-friendly non-recorded speaking homework.' },
    ],
  },
  {
    level: 10, title: 'Mini Story and Revision',
    objective: 'Use previous KG picture vocabulary to follow and retell one original three-scene mini story.',
    targetWords: ['cat', 'ball', 'book', 'sun'],
    reviewWords: ['hello', 'big', 'small', 'happy'],
    visualBriefs: [
      'Scene one: friendly fictional cartoon cat sees a red ball, with large object silhouettes.',
      'Scene two: the cat meets a book beside a bright window, no readable copyrighted content.',
      'Scene three: the cat plays with the ball under a simple smiling sunshine illustration.',
      'Picture-order cards one, two and three, with no personally identifiable student portrait.',
    ],
    introStoryboard: [
      'Miss Julie introduces an original cartoon cat character and its ball.',
      'The cat visits a book and then plays outside under the sun.',
      'Julie asks one short what-do-you-see question for each of three scenes.',
      'End with a cheerful revision of known KG words and a small speaking homework.',
    ],
    teacherReview: 'This is an original Talkora fiction, not a textbook excerpt. Only prior covered vocabulary is tested. Avoid unapproved recorded free-form speech or a phantom extra level.',
    beats: [
      { mode: 'tap-picture', prompt: 'In our first story picture, tap the cat.', evidence: 'Recognizes cat in scene one.' },
      { mode: 'repeat-after-julie', prompt: 'The cat sees a ball. Say ball.', evidence: 'Attempts the known word ball.' },
      { mode: 'listen-and-find', prompt: 'In story picture two, Miss Julie says book. Find the book.', evidence: 'Identifies book in the second scene.' },
      { mode: 'repeat-after-julie', prompt: 'The cat plays under the sun. Say sun.', evidence: 'Attempts the English word sun.' },
      { mode: 'tap-picture', prompt: 'Which picture came first: cat and ball, cat and book, or cat and sun?', evidence: 'Recognizes first scene; child does not need to read.' },
      { mode: 'guided-dialogue', prompt: 'Tell Miss Julie one word from the story: cat, ball, book or sun.', evidence: 'Learner tries a known English word; a Hindi/Marathi hint never counts as English mastery.', difficulty: 2 },
      { mode: 'listen-and-find', prompt: 'Our final review: I say cat. Which of the shuffled cards shows the cat?', evidence: 'Identifies a known word across different visual arrangements.' },
      { mode: 'repeat-after-julie', prompt: 'Tiny homework: Tell a toy one story word and wave goodbye.', evidence: 'Spoken homework without video or audio upload.' },
    ],
  },
]

export function kgFutureDraft(level: KGFutureLevel): KGFutureDraft {
  const draft = KG_FUTURE_DRAFTS.find((entry) => entry.level === level)
  if (!draft) throw Error('Unknown KG draft level')
  return draft
}

export function kgFutureDraftActivities(level: KGFutureLevel): LevelActivity[] {
  const draft = kgFutureDraft(level)
  return draft.beats.map((beat, index) => ({
    id: `kg-l${String(level).padStart(2, '0')}-draft-${index + 1}`,
    type: beat.mode,
    prompt: beat.prompt,
    successCriteria: beat.evidence,
    difficulty: beat.difficulty ?? 1,
    approved: false,
  }))
}

export function kgFutureDraftSuggestions(level: KGFutureLevel): SuggestedActivity[] {
  const draft = kgFutureDraft(level)
  return [
    { label: 'Teacher intro: ' + draft.title, mode: 'guided-dialogue',
      educatorNote: draft.introStoryboard.join(' ') + ' FULL INTRO VIDEO MISSING AND UNAPPROVED.' },
    { label: 'Artwork production and accessibility', mode: 'tap-picture',
      educatorNote: draft.visualBriefs.join(' ') + ' Optimize assets and review every picture before adding a live URL.' },
    { label: 'Rubric, voice and school approval', mode: 'repeat-after-julie',
      educatorNote: draft.teacherReview + ' No student unlock until intro, art, real mic/Azure, S3 and syllabus sign-off.' },
  ]
}
