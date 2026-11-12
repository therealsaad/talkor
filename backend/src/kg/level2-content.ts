export const LEVEL2_LETTERS = ['E', 'F', 'G', 'H', 'I', 'J'] as const
export type Level2Letter = (typeof LEVEL2_LETTERS)[number]

export const LEVEL2_NARRATION = {
  'letter-e': 'This is the letter E.',
  'prompt-e': 'Say the letter E.',
  'letter-f': 'This is the letter F.',
  'prompt-f': 'Say the letter F.',
  'letter-g': 'This is the letter G.',
  'prompt-g': 'Say the letter G.',
  'letter-h': 'This is the letter H.',
  'prompt-h': 'Say the letter H.',
  'letter-i': 'This is the letter I.',
  'prompt-i': 'Say the letter I.',
  'letter-j': 'This is the letter J.',
  'prompt-j': 'Say the letter J.',
} as const

export type Level2NarrationId = keyof typeof LEVEL2_NARRATION

const LEVEL2_LETTER_NAMES: Record<Level2Letter, readonly string[]> = {
  E: ['e', 'ee'],
  F: ['f', 'eff'],
  G: ['g', 'gee', 'jee'],
  H: ['h', 'aitch', 'haitch'],
  I: ['i', 'eye'],
  J: ['j', 'jay'],
}

export function gradeLevel2Transcription(
  raw: string,
  letter: Level2Letter,
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
  const accepted = new Set(LEVEL2_LETTER_NAMES[letter].flatMap((name) => [
    name,
    `letter ${name}`,
    `the letter ${name}`,
  ]))
  accepted.add(lowerLetter)
  accepted.add(`letter ${lowerLetter}`)
  accepted.add(`the letter ${lowerLetter}`)
  return accepted.has(normalized) ? 'correct' : 'incorrect'
}
