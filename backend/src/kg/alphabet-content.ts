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

/** Text is a script for offline generation, not a request to synthesize during a student lesson. */
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

function isPlausibleNearMatch(token: string, target: string): boolean {
  if (token.length >= 2 && target.startsWith(token)) return true
  if (Math.abs(token.length - target.length) > 1) return false
  let previous = Array.from({ length: target.length + 1 }, (_, index) => index)
  for (let row = 1; row <= token.length; row++) {
    const current = [row]
    for (let column = 1; column <= target.length; column++) {
      current[column] = Math.min(
        current[column - 1] + 1,
        previous[column] + 1,
        previous[column - 1] + (token[row - 1] === target[column - 1] ? 0 : 1),
      )
    }
    previous = current
  }
  return previous[target.length] <= 1
}

export function evaluateKGSpeech(raw: string, letter: Letter, target: 'word' | 'letter' | 'either' = 'either'): 'correct' | 'incorrect' | 'unclear' {
  // Whisper may write an English word in Devanagari during Hindi/English speech.
  // Accept that spelling, while still teaching the English curriculum word.
  const phonetic: Record<string, string> = {
    'एप्पल': 'apple', 'ऐप्पल': 'apple', 'ऐपल': 'apple', 'एपल': 'apple',
    'बॉल': 'ball', 'कैट': 'cat', 'डॉग': 'dog', 'डाग': 'dog',
    'ए': 'a', 'बी': 'b', 'सी': 'c', 'डी': 'd',
  }
  const normalized = raw.slice(0, 240).replace(/\p{L}[\p{L}\p{M}]*/gu, (token) => phonetic[token] || token).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z\s]/g, ' ').replace(/\s+/g, ' ').trim()
  if (!normalized) return 'unclear'
  const word = LETTERS.find((item) => item.letter === letter)!.word
  // A one-word answer or a simple sentence such as "It's an apple" is accepted.
  const mentioned = LETTERS.filter((item) => new RegExp(`\\b${item.word}\\b`).test(normalized))
  if (mentioned.length > 1 || /\b(not|no|isn t)\b/.test(normalized)) return 'unclear'
  if (target !== 'letter' && mentioned.some((item) => item.word === word)) return 'correct'
  // Single-letter speech is unreliable for four-year-olds. Accept common STT spellings
  // only when the response is exclusively the target letter sound.
  const aliases: Record<Letter, string[]> = {
    A: ['a', 'ay', 'hey'], B: ['b', 'bee', 'be'], C: ['c', 'see', 'sea'], D: ['d', 'dee'],
  }
  if (aliases[letter].includes(normalized)) return target === 'word' ? 'unclear' : 'correct'
  // Silence/Whisper fillers should never be recorded as a language mistake.
  if (/^(uh|um|hmm|hm|ah|hello|you|thank you|okay|ok)$/.test(normalized)) return 'unclear'
  // Groq Whisper does not return confidence. A short prefix or one-edit transcript
  // is plausible child pronunciation and should be repeated, not graded as wrong.
  const tokens = normalized.split(' ')
  if (tokens.length === 1 && isPlausibleNearMatch(tokens[0], word)) return 'unclear'
  return 'incorrect'
}

export function activityAt(index: number): { id: ActivityId; letter: Letter; mode: 'speak' | 'touch'; audioId: AudioId } | null {
  if (!Number.isInteger(index) || index < 0 || index > 7) return null
  const letter = LETTERS[index % 4].letter
  const mode = index < 4 ? 'speak' : 'touch'
  return { id: `${mode === 'speak' ? 'say' : 'find'}-${letter.toLowerCase()}` as ActivityId, letter, mode, audioId: `${mode === 'speak' ? 'say' : 'find'}-${letter.toLowerCase()}` as AudioId }
}
