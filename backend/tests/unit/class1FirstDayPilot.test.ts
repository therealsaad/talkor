import manifest from '../../src/scripts/class1-level1-ai4bharat-lines.json'

describe('Class 1 Level 1 foundation-to-Balbharati pilot', () => {
  it('uses a fresh immutable S3 revision and lists the little-word and school narration', () => {
    const keys = manifest.lines.map(line => line.s3Key)
    expect(new Set(keys).size).toBe(keys.length)
    expect(manifest.levelId).toBe('g01-l01')
    expect(manifest.status).toBe('requires-human-voice-review')
    expect(manifest.revision).toBe('v2')
    expect(keys.slice(0, 6)).toEqual([
      'listen-am', 'build-an', 'listen-at', 'listen-in', 'use-on', 'it-is-up',
    ].map(id => `class-01/level-01/v2/${id}.wav`))
    for (const id of ['review-little-words', 'say-walk', 'find-school', 'school-talk', 'homework-first-day']) {
      expect(keys).toContain(`class-01/level-01/v2/${id}.wav`)
    }
    expect(manifest.lines.every(line => line.text.trim() && line.language === 'en-IN')).toBe(true)
  })
})
