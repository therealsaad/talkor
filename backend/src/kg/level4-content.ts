export const LEVEL4_LETTERS = ['Q', 'R', 'S', 'T', 'U', 'V'] as const
export type Level4Letter = typeof LEVEL4_LETTERS[number]

export const LEVEL4_WORDS: Record<Level4Letter, string> = {
  Q: 'queen',
  R: 'rabbit',
  S: 'sun',
  T: 'tiger',
  U: 'umbrella',
  V: 'van',
}

export const LEVEL4_NARRATION = Object.fromEntries(
  LEVEL4_LETTERS.flatMap((letter) => {
    const lower = letter.toLowerCase()
    const word = LEVEL4_WORDS[letter]
    return [
      [`letter-${lower}`, `This is the letter ${letter}.`],
      [`word-${lower}`, `${word}.`],
      [`prompt-${lower}`, `Can you say the letter ${letter}?`],
    ]
  }),
) as Record<Level4NarrationId, string>

export type Level4NarrationId =
  `letter-${Lowercase<Level4Letter>}` |
  `word-${Lowercase<Level4Letter>}` |
  `prompt-${Lowercase<Level4Letter>}`

const LEVEL4_LETTER_NAMES: Record<Level4Letter, string> = {
  Q: 'cue',
  R: 'ar',
  S: 'ess',
  T: 'tee',
  U: 'you',
  V: 'vee',
}

export function gradeLevel4Transcription(
  raw: string,
  letter: Level4Letter,
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
  const spokenName = LEVEL4_LETTER_NAMES[letter]
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
