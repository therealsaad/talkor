import manifest from '../../src/scripts/class1-level1-ai4bharat-lines.json'

describe('Class 1 Level 1 foundation-to-Balbharati pilot', () => {
  it('preserves the nine existing immutable S3 recording keys and adds new reviewed lines', () => {
    const keys = manifest.lines.map(line => line.s3Key)
    expect(new Set(keys).size).toBe(keys.length)
    expect(manifest.levelId).toBe('g01-l01')
    expect(manifest.status).toBe('requires-human-voice-review')
    expect(keys.slice(0, 9)).toEqual([
      'listen-at', 'build-at', 'listen-in', 'build-in', 'look-at-me',
      'i-am-sam', 'try-again', 'well-done', 'homework',
    ].map(id => `class-01/level-01/v1/${id}.wav`))
    for (const id of ['repeat-at', 'say-walk', 'find-school', 'school-talk', 'homework-first-day']) {
      expect(keys).toContain(`class-01/level-01/v1/${id}.wav`)
    }
    expect(manifest.lines.every(line => line.text.trim() && line.language === 'en-IN')).toBe(true)
  })
})
