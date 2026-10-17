
/**
 * Local matching for spoken answers to published lesson choices.
 * Only determines which visible option the child *said*; correctness is
 * ALWAYS checked by the existing backend attempt endpoint.
 * No AI call and no answer key is shipped to the browser.
 */
const WORD_NUMBERS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten']

export function normalizeSpokenWords(value: string): string {
  return String(value || '')
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ').trim()
}

/** Returns a choice label only when the transcript identifies exactly one option. */
export function matchSpokenChoice(transcript: string, choices: readonly string[]): string | null {
  const spoken = normalizeSpokenWords(transcript)
  if (!spoken || !choices.length) return null
  const cleaned = choices.map(normalizeSpokenWords)
  const hits = new Set<number>()
  // If multiple answer labels occur, do not guess and accidentally score one.
  cleaned.forEach((answer, index) => {
    if (answer && (` ${spoken} `).includes(` ${answer} `)) hits.add(index)
  })
  if (hits.size === 1) return choices[[...hits][0]]
  if (hits.size > 1) return null

  // "number two", "option 2", "second one" work for visual/MCQ choices.
  const ordinal = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth']
  const positionHits = new Set<number>()
  for (let index = 0; index < Math.min(choices.length, 6); index++) {
    const number = index + 1
    const word = WORD_NUMBERS[number]
    if (new RegExp(`\\b(?:option|number|choice|picture) (?:${number}|${word})\\b`).test(spoken) ||
        new RegExp(`\\b${ordinal[index]} (?:one|option|picture)?\\b`).test(spoken)) {
      positionHits.add(index)
    }
  }
  if (positionHits.size === 1) return choices[[...positionHits][0]]
  if (positionHits.size > 1) return null
  const bareNumber = WORD_NUMBERS.indexOf(spoken)
  if (bareNumber >= 1 && bareNumber <= choices.length) return choices[bareNumber - 1]
  if (/^[1-6]$/.test(spoken) && Number(spoken) <= choices.length) return choices[Number(spoken) - 1]
  return null
}

export function matchSpokenYesNo(transcript: string): boolean | null {
  const spoken = normalizeSpokenWords(transcript)
  if (!spoken) return null
  if (/\b(no|nope|nah|dont|don t|do not|not really|i dislike)\b/.test(spoken)) return false
  if (/\b(yes|yeah|yep|sure|i do|i like|i love)\b/.test(spoken)) return true
  return null
}

export function isReplayCommand(text: string): boolean {
  return /^(repeat|repeat please|say again|again please|once more|please repeat|can you repeat)$/.test(normalizeSpokenWords(text))
}

/** Commands are exact phrases so ordinary lesson answers are never intercepted. */
export function isExitLessonCommand(text: string): boolean {
  return /^(stop lesson|exit lesson|end lesson|go home|finish lesson)$/.test(normalizeSpokenWords(text))
}
