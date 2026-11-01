import { KGQwenFeedbackService } from '../../src/services/kg-qwen-feedback.service'
import { safeKGFeedback } from '../../src/services/kg-feedback.service'

afterEach(() => jest.restoreAllMocks())

describe('KG rule-first response routing', () => {
  const base = { letter: 'C' as const, mode: 'speak' as const }

  it.each([
    { outcome: 'correct' as const, transcript: 'cat' },
    { outcome: 'supported' as const, transcript: 'billi' },
    { outcome: 'unclear' as const, transcript: 'hmm' },
    { outcome: 'incorrect' as const, transcript: '' },
    { outcome: 'incorrect' as const, transcript: 'dog', noSpeech: true },
  ])('answers $outcome without invoking Qwen for deterministic cases', async (sample) => {
    const fetch = jest.spyOn(globalThis, 'fetch')
    const result = await KGQwenFeedbackService.compose({ ...base, ...sample })
    expect(result.source).toBe('guided')
    expect(result.text.toLowerCase()).toContain('cat')
    expect(fetch).not.toHaveBeenCalled()
  })

  it('never invokes Qwen for a wrong picture tap', async () => {
    const fetch = jest.spyOn(globalThis, 'fetch')
    const actual = await KGQwenFeedbackService.compose({ ...base, mode: 'touch', outcome: 'incorrect', selected: 'dog' })
    expect(actual.source).toBe('guided')
    expect(fetch).not.toHaveBeenCalled()
  })

  it.each([
    ['hi-IN', 'अंग्रेज़ी', 'बिल्ली'],
    ['mr-IN', 'इंग्रजीत', 'मांजर'],
    ['en-IN', 'In English', 'billi'],
  ] as const)('gives an honest %s known-translation bridge without English mastery', (languageCode, fragment, transcript) => {
    const reply = safeKGFeedback({ ...base, outcome: 'supported', transcript, languageCode })
    expect(reply).toContain(fragment)
    expect(reply.toLowerCase()).toContain('cat')
    expect(reply).not.toMatch(/perfect answer|correct answer|you got it/i)
  })

  it('uses Qwen for an actual unexpected spoken English word', async () => {
    const fetch = jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(
      JSON.stringify({ message: 'Good try! The word is cat. Say cat.' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    ))
    const result = await KGQwenFeedbackService.compose({ ...base, outcome: 'incorrect', transcript: 'dog', languageCode: 'en-IN' })
    expect(fetch).toHaveBeenCalledTimes(1)
    const options = fetch.mock.calls[0][1]
    const payload = JSON.parse(String(options?.body))
    expect(payload.currentQuestion).toContain('cat')
    expect(payload.grade).toBe(0)
    expect(payload.preferredExplanationLanguage).toBe('English')
    expect(result.source).toBe('qwen-8002')
    expect(result.text).toContain('cat')
    expect(options?.signal).toBeDefined()
  })

  it('fails safely when Qwen is offline or gives wrong-praise feedback', async () => {
    const fetch = jest.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        message: 'Perfect answer! You got it. Say cat.',
      }), { status: 200, headers: { 'Content-Type': 'application/json' } }))
    const input = { ...base, outcome: 'incorrect' as const, transcript: 'dog' }
    expect((await KGQwenFeedbackService.compose(input)).source).toBe('guided')
    expect((await KGQwenFeedbackService.compose(input)).source).toBe('guided')
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it('rejects English-only Qwen advice for a Hindi utterance', async () => {
    const fetch = jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(
      JSON.stringify({ message: 'Nice try! In English that is cat. Say cat.' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    ))
    const result = await KGQwenFeedbackService.compose({
      ...base, outcome: 'incorrect', transcript: 'dog', languageCode: 'hi-IN',
    })
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(result.source).toBe('guided')
    expect(result.text).toMatch(/[\u0900-\u097f]/)
    expect(result.text).toContain('Say cat.')
  })
})
