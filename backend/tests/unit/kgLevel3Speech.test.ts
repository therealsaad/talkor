import { gradeLevel3Transcription, LEVEL3_LETTERS, LEVEL3_NARRATION, LEVEL3_WORDS } from '../../src/kg/level3-content'

describe('Level 3 K–P letter grading', () => {
  it('maps each letter to its example word and provides a letter-specific prompt', () => {
    expect(LEVEL3_LETTERS.map((letter) => LEVEL3_WORDS[letter])).toEqual([
      'kite', 'lion', 'monkey', 'nest', 'orange', 'parrot',
    ])
    expect(Object.keys(LEVEL3_NARRATION)).toHaveLength(18)
    expect(LEVEL3_NARRATION['prompt-p']).toBe('Say the letter P.')
    for (const letter of LEVEL3_LETTERS) {
      const suffix = letter.toLowerCase()
      expect(LEVEL3_NARRATION[`letter-${suffix}` as keyof typeof LEVEL3_NARRATION]).toContain(`letter ${letter}`)
      expect(LEVEL3_NARRATION[`prompt-${suffix}` as keyof typeof LEVEL3_NARRATION]).toBe(`Say the letter ${letter}.`)
    }
  })

  it.each([
    ['K', 'K'],
    ['kay!', 'K'],
    ['letter K', 'K'],
    ['L', 'L'],
    ['EL.', 'L'],
    ['M', 'M'],
    ['em!', 'M'],
    ['N', 'N'],
    ['en.', 'N'],
    ['O', 'O'],
    ['OH!', 'O'],
    ['P', 'P'],
    ['pee.', 'P'],
  ] as const)('accepts a normalized spoken letter %s for %s', (transcript, letter) => {
    expect(gradeLevel3Transcription(transcript, letter)).toBe('correct')
  })

  it.each([
    ['', 'K', false, 'unclear'],
    ['kay', 'K', true, 'unclear'],
    ['I said letter K', 'K', false, 'incorrect'],
    ['K L', 'K', false, 'incorrect'],
    ['L', 'K', false, 'incorrect'],
    ['kite', 'K', false, 'incorrect'],
  ] as const)('distinguishes unclear from incorrect for %s', (transcript, letter, uncertain, expected) => {
    expect(gradeLevel3Transcription(transcript, letter, uncertain)).toBe(expected)
  })
})
