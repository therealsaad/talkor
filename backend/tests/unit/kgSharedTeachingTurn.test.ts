import {
  classifyKGTeachingTurn, composeKGTeachingTurn, kgDraftTeachingWord, kgTeachingWord,
  KG_UNPUBLISHED_WORD_DRAFTS,
} from '../../src/teaching/kg-teaching-turn'
import { AzureVoiceProvider } from '../../src/providers/voice/AzureVoiceProvider'

afterEach(() => jest.restoreAllMocks())

describe('one KG teaching-turn contract, all staged levels', () => {
  it('uses current live curriculum words, including corrected KG5 wolf/yak', () => {
    expect(kgTeachingWord(1, 'C')?.targetEn).toBe('cat')
    expect(kgTeachingWord(3, 'L')?.targetEn).toBe('lion')
    expect(kgTeachingWord(4, 'R')?.targetEn).toBe('rabbit')
    expect(kgTeachingWord(5, 'W')?.targetEn).toBe('wolf')
    expect(kgTeachingWord(5, 'Y')?.targetEn).toBe('yak')
    // KG2 currently teaches letters E-J: no approved corresponding picture words.
    expect(kgTeachingWord(2, 'E')).toBeNull()
  })

  it('keeps every KG6–10 teaching draft unapproved/unpublished', () => {
    expect(Object.keys(KG_UNPUBLISHED_WORD_DRAFTS)).toEqual(['6','7','8','9','10'])
    for (let level = 6; level <= 10; level++) {
      for (const word of KG_UNPUBLISHED_WORD_DRAFTS[level]) {
        const draft = kgDraftTeachingWord(level, word)
        expect(draft?.approvedForStudent).toBe(false)
        expect(draft?.targetEn).toBe(word)
      }
      expect(kgTeachingWord(level, 'C')).toBeNull()
    }
  })

  it.each([
    [1, 'C', 'billi', 'hi-IN', 'cat'],
    [1, 'C', 'ye billi hai', 'hi-IN', 'cat'],
    [1, 'C', 'बिल्ली', 'hi-IN', 'cat'],
    [1, 'C', 'manjar', 'mr-IN', 'cat'],
    [3, 'L', 'sher', 'hi-IN', 'lion'],
    [3, 'L', 'शेर', 'hi-IN', 'lion'],
    [3, 'M', 'माकड', 'mr-IN', 'monkey'],
    [4, 'R', 'khargosh', 'hi-IN', 'rabbit'],
    [4, 'R', 'खरगोश', 'hi-IN', 'rabbit'],
    [4, 'R', 'sasa', 'mr-IN', 'rabbit'],
    [5, 'W', 'bhediya', 'hi-IN', 'wolf'],
  ] as const)('%s/%s recognizes translation %s without counting it as English', async (level, letter, transcript, locale, english) => {
    const verdict = classifyKGTeachingTurn({ level, letter, transcript, outcome: 'incorrect', detectedLanguage: 'en-IN' })
    expect(verdict.kind).toBe('translation_hi_mr')
    expect(verdict.language).toBe(locale)
    const result = await composeKGTeachingTurn({ level, letter, transcript, outcome: 'incorrect', detectedLanguage: 'en-IN' })
    expect(result.kind).toBe('translation_hi_mr')
    expect(result.languageCode).toBe(locale)
    expect(result.feedbackText).toContain(english)
    expect(result.feedbackText).toContain('Say ' + english + '.')
    expect(result.source).toBe('guided')
  })

  it('does not treat a correct English object word as a passed LETTER checkpoint', async () => {
    const result = await composeKGTeachingTurn({ level: 3, letter: 'L', transcript: 'lion', outcome: 'incorrect' })
    expect(result.kind).toBe('correct_english')
    expect(result.feedbackText).toContain('lion')
    expect(result.feedbackText).toContain('letter L')
    // The result deliberately cannot award XP/progress or modify outcome.
    expect(result).not.toHaveProperty('outcome')
    expect(result).not.toHaveProperty('xp')
  })

  it.each(['not billi', 'billi?', 'no sher', 'khargosh kya hai'])('does not mistake negation/questions for a verified translation: %s', (transcript) => {
    const cat = transcript.includes('billi')
    const r = classifyKGTeachingTurn({ level: cat ? 1 : transcript.includes('sher') ? 3 : 4,
      letter: cat ? 'C' : transcript.includes('sher') ? 'L' : 'R', transcript, outcome: 'incorrect' })
    expect(r.kind).not.toBe('translation_hi_mr')
  })

  it('keeps wrong word, known silence, and correct letter separate', () => {
    expect(classifyKGTeachingTurn({ level: 3, letter: 'L', transcript: 'banana', outcome: 'incorrect' }).kind).toBe('wrong_word')
    expect(classifyKGTeachingTurn({ level: 3, letter: 'L', transcript: '', outcome: 'unclear', noSpeech: true }).kind).toBe('silence_or_noise')
    expect(classifyKGTeachingTurn({ level: 3, letter: 'L', transcript: 'L', outcome: 'correct' }).kind).toBe('correct_letter')
  })

  it('preserves existing fixed English feedback on ordinary KG2–5 speech', async () => {
    const text = 'Wonderful! You said E! Great speaking!'
    const result = await composeKGTeachingTurn({ level: 2, letter: 'E', transcript: 'E', outcome: 'correct', existingFeedbackText: text })
    expect(result.feedbackText).toBe(text)
  })

  it('uses bounded question Qwen only after classifier and rejects false praise', async () => {
    const fetch = jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({
      message: 'Perfect answer! Share your phone number. Say L.',
    }), { status: 200 }))
    const question = await composeKGTeachingTurn({ level: 3, letter: 'L',
      transcript: 'Why is it called sher?', outcome: 'incorrect', detectedLanguage: 'hi-IN' })
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(question.source).toBe('guided')
    expect(question.feedbackText).toContain('Say L.')
    expect(question.feedbackText).not.toContain('phone number')
    const payload = JSON.parse(String(fetch.mock.calls[0][1]?.body))
    expect(payload.grade).toBe(0)
    expect(payload.levelId).toBe('g00-l03')
    expect(payload.allowedVocabulary).toContain('lion')
  })

  it('does not call Qwen for deterministic translations or silence', async () => {
    const fetch = jest.spyOn(globalThis, 'fetch')
    await composeKGTeachingTurn({ level: 3, letter: 'L', transcript: 'sher', outcome: 'incorrect' })
    await composeKGTeachingTurn({ level: 3, letter: 'L', outcome: 'unclear', noSpeech: true })
    expect(fetch).not.toHaveBeenCalled()
  })

  it('sends one Azure request with native explanation then English letter prompt', async () => {
    process.env.AZURE_SPEECH_KEY = 'unit-test-key'
    const bodies: string[] = []
    jest.spyOn(globalThis, 'fetch').mockImplementation(async (_url, opts) => {
      bodies.push(String(opts?.body))
      return new Response(Buffer.alloc(512, 1), { status: 200 })
    })
    try {
      const turn = await composeKGTeachingTurn({ level: 3, letter: 'L', transcript: 'sher', outcome: 'incorrect' })
      await new AzureVoiceProvider().synthesizeUncached(turn.feedbackText, { language: turn.languageCode })
      expect(bodies).toHaveLength(1)
      expect(bodies[0]).toContain('<voice name="hi-IN-SwaraNeural">')
      expect(bodies[0]).toContain('<voice name="en-IN-NeerjaNeural">')
      expect(bodies[0]).toContain('Say lion.')
    } finally { delete process.env.AZURE_SPEECH_KEY }
  })
})
