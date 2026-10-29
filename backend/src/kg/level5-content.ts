export const LEVEL5_LETTERS = ['W', 'X', 'Y', 'Z'] as const
export type Level5Letter = typeof LEVEL5_LETTERS[number]

export const LEVEL5_WORDS: Record<Level5Letter, string> = {
  W: 'whale', X: 'xylophone', Y: 'yo-yo', Z: 'zebra',
}

export const LEVEL5_NARRATION = Object.fromEntries(
  LEVEL5_LETTERS.flatMap((letter) => {
    const lower = letter.toLowerCase()
    const word = LEVEL5_WORDS[letter]
    return [
      [`letter-${lower}`, `This is the letter ${letter}.`],
      [`word-${lower}`, `${word}.`],
      [`prompt-${lower}`, `Can you say the letter ${letter}?`],
    ]
  }),
) as Record<Level5NarrationId, string>

export type Level5NarrationId =
  `letter-${Lowercase<Level5Letter>}` |
  `word-${Lowercase<Level5Letter>}` |
  `prompt-${Lowercase<Level5Letter>}`

const LEVEL5_LETTER_NAMES: Record<Level5Letter, string> = {
  W: 'double you', X: 'ex', Y: 'why', Z: 'zee',
}

export function gradeLevel5Transcription(raw: string, letter: Level5Letter, uncertain = false) {
  const normalized = raw.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, ' ').replace(/\s+/g, ' ').trim()
  if (!normalized || uncertain) return 'unclear' as const
  const accepted = new Set([letter.toLowerCase(), LEVEL5_LETTER_NAMES[letter], `letter ${letter.toLowerCase()}`, `letter ${LEVEL5_LETTER_NAMES[letter]}`])
  return accepted.has(normalized) ? 'correct' as const : 'incorrect' as const
}
