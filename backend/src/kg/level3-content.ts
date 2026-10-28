export const LEVEL3_LETTERS = ['K', 'L', 'M', 'N', 'O', 'P'] as const
export type Level3Letter = typeof LEVEL3_LETTERS[number]

export const LEVEL3_WORDS: Record<Level3Letter, string> = {
  K: 'kite',
  L: 'lion',
  M: 'monkey',
  N: 'nest',
  O: 'orange',
  P: 'parrot',
}

export const LEVEL3_NARRATION = {
  'letter-k': 'This is the letter K.',
  'word-k': 'Kite.',
  'prompt-k': 'Say the letter K.',
  'letter-l': 'This is the letter L.',
  'word-l': 'Lion.',
  'prompt-l': 'Say the letter L.',
  'letter-m': 'This is the letter M.',
  'word-m': 'Monkey.',
  'prompt-m': 'Say the letter M.',
  'letter-n': 'This is the letter N.',
  'word-n': 'Nest.',
  'prompt-n': 'Say the letter N.',
  'letter-o': 'This is the letter O.',
  'word-o': 'Orange.',
  'prompt-o': 'Say the letter O.',
  'letter-p': 'This is the letter P.',
  'word-p': 'Parrot.',
  'prompt-p': 'Say the letter P.',
} as const

export type Level3NarrationId = keyof typeof LEVEL3_NARRATION

const LEVEL3_LETTER_NAMES: Record<Level3Letter, string> = {
  K: 'kay',
  L: 'el',
  M: 'em',
  N: 'en',
  O: 'oh',
  P: 'pee',
}

export function narrationIdsForLevel3Letter(letter: Level3Letter): Level3NarrationId[] {
  const suffix = letter.toLowerCase()
  return [`letter-${suffix}`, `word-${suffix}`, `prompt-${suffix}`] as Level3NarrationId[]
}

export function gradeLevel3Transcription(
  raw: string,
  letter: Level3Letter,
  uncertain = false,
): 'correct' | 'incorrect' | 'unclear' {
  const normalized = raw
    .slice(0, 240)
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (!normalized || uncertain) return 'unclear'
  const lowerLetter = letter.toLowerCase()
  const spokenName = LEVEL3_LETTER_NAMES[letter]
  const accepted = new Set([
    lowerLetter,
    spokenName,
    `letter ${lowerLetter}`,
    `letter ${spokenName}`,
    `the letter ${lowerLetter}`,
    `the letter ${spokenName}`,
  ])
  return accepted.has(normalized) ? 'correct' : 'incorrect'
}
