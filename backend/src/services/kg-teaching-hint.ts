import type { Letter } from '../kg/alphabet-content'

/** Predictable, age-appropriate bilingual reassurance, not a fabricated AI evaluation. */
export function kgTeachingHint(
  letter: Letter, mode: 'speak' | 'touch',
  outcome: 'correct' | 'incorrect' | 'unclear' | 'supported',
): string | null {
  if (outcome === 'correct' || outcome === 'supported') return null
  if (outcome === 'unclear') return 'Take your time! Koi baat nahi. Listen to Miss Julie and try again.'
  const pictures: Record<Letter, string> = { A: 'apple', B: 'ball', C: 'cat', D: 'dog' }
  const word = pictures[letter]
  return mode === 'speak'
    ? `Listen slowly: ${letter} for ${word}. ${letter} se ${word}! Now say ${word}.`
    : `Look at the pictures. Find ${word}. ${word} ki tasveer chuno!`
}
