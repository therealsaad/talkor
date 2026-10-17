import { AUDIO_IDS, AUDIO_LINES, AUDIO_MANIFEST, LETTERS, activityAt, audioKey, evaluateKGSpeech } from '../../src/kg/alphabet-content'

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
    expect(evaluateKGSpeech('appl', 'A')).toBe('unclear')
    expect(evaluateKGSpeech('app', 'A')).toBe('unclear')
    expect(evaluateKGSpeech('bell', 'B')).toBe('unclear')
  })
  it('has a fixed offline audio manifest without student-specific speech', () => {
    expect(AUDIO_IDS).toContain('say-a')
    expect(AUDIO_IDS).toContain('try-again')
    expect(AUDIO_IDS).toContain('celebrate')
    for (const id of AUDIO_IDS) {
      expect(AUDIO_LINES[id].length).toBeGreaterThan(5)
      expect(audioKey(id)).toMatch(/^kg\/level-1\/miss-julie\/v1\/[a-z-]+\.mp3$/)
    }
  })

  it('exports all required classroom and navigation lines from the activity-linked manifest', () => {
    const byId = new Map<string, (typeof AUDIO_MANIFEST)[number]>(AUDIO_MANIFEST.map((line) => [line.id, line]))
    for (const id of [
      'letter-a', 'letter-b', 'letter-c', 'letter-d', 'word-apple', 'word-ball', 'word-cat', 'word-dog',
      'recognize-intro', 'puzzle-intro', 'great', 'try-again', 'repeat', 'silence', 'celebrate',
      'level-complete', 'navigation-map', 'replay-intro', 'replay-level',
    ]) expect(byId.has(id)).toBe(true)
    expect(byId.get('letter-a')?.activityIds).toContain('say-a')
    expect(byId.get('find-a')?.activityIds).toContain('find-a')
    expect(byId.get('try-again')?.activityIds).toContain('say-a')
    expect(new Set(AUDIO_MANIFEST.map((line) => line.id)).size).toBe(AUDIO_MANIFEST.length)
  })
})
