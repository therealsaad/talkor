import { AUDIO_IDS, AUDIO_LINES, LETTERS, activityAt, audioKey, evaluateKGSpeech } from '../src/kg/alphabet-content'

describe('KG alphabet lesson v1', () => {
  it('teaches exactly A B C D, then tests four picture taps', () => {
    expect(LETTERS.map((letter) => letter.letter)).toEqual(['A', 'B', 'C', 'D'])
    expect(Array.from({ length: 8 }, (_, i) => activityAt(i)?.id)).toEqual([
      'say-a', 'say-b', 'say-c', 'say-d', 'find-a', 'find-b', 'find-c', 'find-d',
    ])
    expect(activityAt(8)).toBeNull()
  })
  it('accepts clear one-word and short-sentence responses', () => {
    expect(evaluateKGSpeech('Apple!', 'A')).toBe('correct')
    expect(evaluateKGSpeech('I see a ball', 'B')).toBe('correct')
    expect(evaluateKGSpeech('cat', 'C')).toBe('correct')
    expect(evaluateKGSpeech('dee', 'D')).toBe('correct')
  })
  it('never advances on wrong, blank, or filler speech', () => {
    expect(evaluateKGSpeech('dog', 'C')).toBe('incorrect')
    expect(evaluateKGSpeech('', 'A')).toBe('unclear')
    expect(evaluateKGSpeech('um', 'B')).toBe('unclear')
  })
  it('has a fixed offline audio manifest without student-specific speech', () => {
    expect(AUDIO_IDS).toContain('say-a')
    expect(AUDIO_IDS).toContain('try-again')
    expect(AUDIO_IDS).toContain('celebrate')
    for (const id of AUDIO_IDS) {
      expect(AUDIO_LINES[id].length).toBeGreaterThan(5)
      expect(audioKey(id)).toMatch(/^kg\/alphabet\/v1\/miss-julie\/[a-z-]+\.mp3$/)
    }
  })
})
