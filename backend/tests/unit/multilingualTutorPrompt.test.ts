import { buildSystemPrompt, buildUserPrompt, detectLearnerLanguage } from '../../src/providers/ai/GroqProvider'

describe('Miss Julie multilingual English teaching', () => {
  it('recognizes Hindi, Marathi, Urdu and Romanized utterances without assuming every Devanagari child speaks Hindi', () => {
    expect(detectLearnerLanguage('कैसे हो')).toBe('HINDI')
    expect(detectLearnerLanguage('बिल्ली')).toBe('HINDI')
    expect(detectLearnerLanguage('मला समजत नाही')).toBe('MARATHI')
    expect(detectLearnerLanguage('शाळा')).toBe('MARATHI')
    expect(detectLearnerLanguage('मांजर')).toBe('MARATHI')
    expect(detectLearnerLanguage('किताब')).toBe('DEVANAGARI_UNDETERMINED')
    expect(detectLearnerLanguage('मला हिंदी नहीं')).toBe('DEVANAGARI_UNDETERMINED')
    expect(detectLearnerLanguage('آپ کیسے ہیں')).toBe('URDU')
    expect(detectLearnerLanguage('kaise ho')).toBe('ROMANIZED_HINDUSTANI')
    expect(detectLearnerLanguage('mala samjat nahi')).toBe('ROMANIZED_MARATHI')
    expect(detectLearnerLanguage('How are you?')).toBe('ENGLISH_OR_OTHER')
  })

  it('asks Groq to teach English while offering short Hindi or Marathi help', () => {
    const prompt = buildSystemPrompt()
    expect(prompt).toContain('kaise ho')
    expect(prompt).toContain('How are you?')
    expect(prompt).toContain('Urdu')
    expect(prompt).toContain('Marathi')
    expect(prompt).toContain('DEVANAGARI_UNDETERMINED')
    expect(prompt).toContain('corrected English sentence')
    expect(prompt).toContain('Speak in brief, age-appropriate English')
    expect(prompt).toContain('short Hindi or Marathi explanations')
  })

  it('passes the authenticated Class 1 support preference into the actual Groq prompt', () => {
    const prompt = JSON.parse(buildUserPrompt({
      studentName: 'Learner', grade: 1, levelTitle: 'First Day',
      lessonTitle: 'My First Day', activityTitle: 'At school',
      recentMistakes: [], memoryFacts: [], promptContext: 'speaking',
      studentMessage: 'मला समजत नाही',
      preferredExplanationLanguage: 'Marathi',
    }))
    expect(prompt.preferredExplanationLanguage).toBe('Marathi')
    expect(prompt.studentLanguageHint).toBe('MARATHI')
    expect(prompt.studentMessage).toBe('मला समजत नाही')
  })
})
