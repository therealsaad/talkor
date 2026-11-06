import { isKGTeachingLanguage, stableKGTeachingLanguage } from '../../src/services/kg-teaching-language'

describe('KG per-introduction reply language', () => {
  it('starts from Sarvam, never browser language preferences', () => {
    expect(stableKGTeachingLanguage('hi-IN', [])).toBe('hi-IN')
    expect(stableKGTeachingLanguage('mr-IN', [])).toBe('mr-IN')
    expect(stableKGTeachingLanguage(undefined, [])).toBe('en-IN')
    expect(isKGTeachingLanguage('hi-IN')).toBe(true)
    expect(isKGTeachingLanguage('fr-FR')).toBe(false)
    expect(isKGTeachingLanguage('Hindi')).toBe(false)
  })

  it('does not flip a stable language on one anomalous detection', () => {
    expect(stableKGTeachingLanguage('en-IN', ['hi-IN', 'hi-IN'])).toBe('hi-IN')
    expect(stableKGTeachingLanguage('mr-IN', ['en-IN', 'en-IN'])).toBe('en-IN')
    expect(stableKGTeachingLanguage(undefined, ['mr-IN', 'mr-IN'])).toBe('mr-IN')
  })

  it('switches only after repeated detections', () => {
    expect(stableKGTeachingLanguage('hi-IN', ['en-IN', 'en-IN'])).toBe('en-IN')
    expect(stableKGTeachingLanguage('hi-IN', ['hi-IN', 'en-IN'])).toBe('hi-IN')
    expect(stableKGTeachingLanguage('mr-IN', ['mr-IN', 'hi-IN'])).toBe('mr-IN')
  })

  it('does not carry uncertain or unknown languages into grading', () => {
    expect(stableKGTeachingLanguage(undefined, [undefined, 'en-IN'])).toBe('en-IN')
    expect(stableKGTeachingLanguage('hi-IN', ['mr-IN'])).toBe('mr-IN')
  })
})
