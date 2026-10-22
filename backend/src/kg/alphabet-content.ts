/** Level 1 is ABCD, not the older KG Picture Garden pilot unit. No answer key is sent to the client. */
export const KG_ALPHABET_VERSION = 'kg-alphabet-v1'
export const KG_AUDIO_VERSION = 'v1'
export const LETTERS = [
  { letter: 'A', word: 'apple', emoji: '🍎', color: '#ff6f82' },
  { letter: 'B', word: 'ball', emoji: '⚽', color: '#ffbc56' },
  { letter: 'C', word: 'cat', emoji: '🐱', color: '#aa8afa' },
  { letter: 'D', word: 'dog', emoji: '🐶', color: '#67cbb5' },
] as const
export type Letter = typeof LETTERS[number]['letter']
export type ActivityId = `say-${Lowercase<Letter>}` | `find-${Lowercase<Letter>}`

/** Authoritative KG script lines: prerecorded S3 mode or uncached Azure live synthesis. */
export const AUDIO_LINES = {
  'welcome': 'Hello, superstar! Welcome to our ABCD adventure!',
  'how-to-play': 'Listen to me, then say the word. I am listening!',
  'letter-a': 'This is the letter A. Say A with me!',
  'letter-b': 'This is the letter B. Say B with me!',
  'letter-c': 'This is the letter C. Say C with me!',
  'letter-d': 'This is the letter D. Say D with me!',
  'word-apple': 'Apple. Apple begins with A. Say apple with me!',
  'word-ball': 'Ball. Ball begins with B. Say ball with me!',
  'word-cat': 'Cat. Cat begins with C. Say cat with me!',
  'word-dog': 'Dog. Dog begins with D. Say dog with me!',
  'say-a': 'A! A for apple! Can you say apple?',
  'say-b': 'B! B for ball! Can you say ball?',
  'say-c': 'C! C for cat! Can you say cat?',
  'say-d': 'D! D for dog! Can you say dog?',
  'puzzle-intro': 'Amazing! Now touch the picture I say!',
  'recognize-intro': 'Look at each picture. Listen, then touch the one I say!',
  'find-a': 'Can you find the apple? Touch the apple!',
  'find-b': 'Can you find the ball? Touch the ball!',
  'find-c': 'Can you find the cat? Touch the cat!',
  'find-d': 'Can you find the dog? Touch the dog!',
  'great': 'Yay! You got it! Well done!',
  'try-again': 'Nice try! Listen once more and try again!',
  'repeat': 'I did not hear clearly. Can you say it again?',
  'silence': 'I am still listening. Take your time, then say it for me!',
  'celebrate': 'Hooray! You know A, B, C, and D! You are a superstar!',
  'level-complete': 'You finished Level 1! You learned A, B, C, and D. Hooray!',
  'homework-abcd': 'Your tiny homework: at home, point to an apple, a ball, a cat or a dog picture. Say its English name and tell someone its first letter. Do your best! See you soon!',
  'navigation-map': 'Let us go back to your letter garden!',
  'replay-intro': 'Would you like to watch Miss Julie’s story again? Let’s play!',
  'replay-level': 'Welcome back, superstar! Let’s play the ABCD adventure again!',
} as const
export type AudioId = keyof typeof AUDIO_LINES
export const AUDIO_IDS = Object.keys(AUDIO_LINES) as AudioId[]
export const audioKey = (id: AudioId) => `kg/level-1/miss-julie/${KG_AUDIO_VERSION}/${id}.mp3`

/** Each activity points at the voice clips that teach or prompt it. Shared feedback and
 * navigation clips are tied to every relevant activity instead of copied into a second script. */
export const ACTIVITY_AUDIO_IDS: Record<ActivityId, AudioId[]> = {
  'say-a': ['letter-a', 'word-apple', 'say-a'],
  'say-b': ['letter-b', 'word-ball', 'say-b'],
  'say-c': ['letter-c', 'word-cat', 'say-c'],
  'say-d': ['letter-d', 'word-dog', 'say-d'],
  'find-a': ['recognize-intro', 'puzzle-intro', 'find-a'],
  'find-b': ['recognize-intro', 'puzzle-intro', 'find-b'],
  'find-c': ['recognize-intro', 'puzzle-intro', 'find-c'],
  'find-d': ['recognize-intro', 'puzzle-intro', 'find-d'],
}

const SHARED_FEEDBACK_IDS: AudioId[] = ['great', 'try-again', 'repeat', 'silence']
const COMMON_NAVIGATION_IDS: AudioId[] = ['welcome', 'how-to-play', 'level-complete', 'navigation-map', 'replay-intro', 'replay-level', 'celebrate', 'homework-abcd']

export const AUDIO_MANIFEST = AUDIO_IDS.map((id) => {
  let activityIds = (Object.entries(ACTIVITY_AUDIO_IDS) as [ActivityId, AudioId[]][])
    .filter(([, ids]) => ids.includes(id))
    .map(([activityId]) => activityId)
  if (SHARED_FEEDBACK_IDS.includes(id)) activityIds = Object.keys(ACTIVITY_AUDIO_IDS) as ActivityId[]
  return {
    id,
    text: AUDIO_LINES[id],
    activityIds,
    scope: activityIds.length ? 'activity' as const : COMMON_NAVIGATION_IDS.includes(id) ? 'level' as const : 'feedback' as const,
    output: `${id}.mp3`,
    s3Key: audioKey(id),
    voicePreset: 'miss-julie-priya-v6',
  }
})

export const ACTIVITY_AUDIO_MANIFEST = Object.fromEntries(
  Object.entries(ACTIVITY_AUDIO_IDS).map(([activityId, audioIds]) => [
    activityId,
    [...audioIds, ...SHARED_FEEDBACK_IDS].map((id) => ({ id, text: AUDIO_LINES[id], s3Key: audioKey(id) })),
  ]),
) as Record<ActivityId, Array<{ id: AudioId; text: string; s3Key: string }>>

/**
 * KG recognises the INTENDED word, not a phonetic examination.
 * These aliases are deliberately narrow. Do not add ordinary unrelated words
 * (such as "fall" for ball, "hat" for cat or "fog" for dog): they false-pass.
 * Separate Hindi translations from English attempts so reports stay truthful.
 */
const CHILD_WORD_ALIASES: Record<Letter, readonly string[]> = {
  A: ['aaple', 'aapple', 'aple', 'appl', 'appel', 'appul', 'epple', 'eple', 'epal', 'applee', 'applle', 'apleey'],
  B: ['bol', 'bawl', 'baal', 'boll', 'bal', 'balll'],
  C: ['kat', 'kaat', 'catt', 'katt'],
  D: ['dhog', 'dawg', 'daug', 'dogg', 'doggy', 'dohg', 'dug'],
}

const HINDI_WORDS: Record<string, string> = {
  'एप्पल': 'apple', 'ऐप्पल': 'apple', 'ऐपल': 'apple', 'एपल': 'apple',
  'बॉल': 'ball', 'कैट': 'cat', 'डॉग': 'dog', 'डाग': 'dog',
  'ए': 'a', 'बी': 'b', 'सी': 'c', 'डी': 'd',
  'सेब': 'seb',
}

const LETTER_ALIASES: Record<Letter, readonly string[]> = {
  A: ['a', 'ay', 'hey'], B: ['b', 'bee', 'be'],
  C: ['c', 'see', 'sea'], D: ['d', 'dee'],
}

function normalizeKGWords(raw: string): string[] {
  const text = raw.slice(0, 240)
    .replace(/\p{L}[\p{L}\p{M}]*/gu, (token) => HINDI_WORDS[token] || token)
    .toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z\s]/g, ' ').replace(/\s+/g, ' ').trim()
  if (!text) return []
  // "aaaapple" and "appppple" are normal preschool stretching, not mistakes.
  return text.split(' ').map((word) => word.replace(/([a-z])\1{2,}/g, '$1$1'))
}

function matchesWord(token: string, letter: Letter): boolean {
  const expected = LETTERS.find((item) => item.letter === letter)!.word
  // Stretching consonants and vowels should not make an otherwise clear apple wrong.
  if (letter === 'A' && /^a+p+l+e+$/.test(token) && token.length >= 4 && token.length <= 20) return true
  return token === expected || CHILD_WORD_ALIASES[letter].includes(token)
}

/** Hindi "seb/saib/sayb" expresses the right MEANING, not an English "apple" pronunciation. */
export function isKGBilingualBridge(raw: string, letter: Letter): boolean {
  if (letter !== 'A') return false
  const tokens = normalizeKGWords(raw)
  if (!tokens.length || tokens.length > 6) return false
  if (tokens.some((token) => ['no', 'not', 'never', 'dont', 'wrong'].includes(token))) return false
  if (LETTERS.some(({ letter: other }) => other !== letter && tokens.some((token) => matchesWord(token, other)))) return false
  const bridge = tokens.filter((token) => ['seb', 'saib', 'sayb', 'seib'].includes(token))
  if (bridge.length !== 1) return false
  return tokens.every((token) => ['seb', 'saib', 'sayb', 'seib', 'i', 'said', 'say', 'it', 'is', 'a', 'the', 'this'].includes(token))
}

export function evaluateKGSpeech(raw: string, letter: Letter, target: 'word' | 'letter' | 'either' = 'either'): 'correct' | 'incorrect' | 'unclear' {
  const tokens = normalizeKGWords(raw)
  if (!tokens.length) return 'unclear'
  // Several different target words, negation or recorded prompt echo is ambiguous.
  if (tokens.some((token) => ['no', 'not', 'never', 'dont', 'wrong'].includes(token))) return 'unclear'
  const mentioned = LETTERS.filter(({ letter: candidate }) => tokens.some((token) => matchesWord(token, candidate)))
  if (mentioned.length > 1) return 'unclear'
  if (mentioned.length === 1) return mentioned[0].letter === letter ? 'correct' : 'incorrect'
  if (tokens.length === 1) {
    const spokenLetter = (Object.entries(LETTER_ALIASES) as [Letter, readonly string[]][])
      .find(([, aliases]) => aliases.includes(tokens[0]))?.[0]
    if (spokenLetter) return spokenLetter === letter ? 'correct' : 'incorrect'
  }
  if (isKGBilingualBridge(raw, letter)) return 'unclear'
  if (tokens.every((token) => ['uh', 'um', 'hmm', 'hm', 'ah', 'hello', 'okay', 'ok'].includes(token))) return 'unclear'
  // No unrestricted edit distance: cat->hat and dog->fog are different words.
  return 'incorrect'
}

export function activityAt(index: number): { id: ActivityId; letter: Letter; mode: 'speak' | 'touch'; audioId: AudioId } | null {
  if (!Number.isInteger(index) || index < 0 || index > 7) return null
  const letter = LETTERS[index % 4].letter
  const mode = index < 4 ? 'speak' : 'touch'
  return { id: `${mode === 'speak' ? 'say' : 'find'}-${letter.toLowerCase()}` as ActivityId, letter, mode, audioId: `${mode === 'speak' ? 'say' : 'find'}-${letter.toLowerCase()}` as AudioId }
}
