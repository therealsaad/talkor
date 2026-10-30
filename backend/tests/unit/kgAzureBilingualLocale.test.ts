import { AzureVoiceProvider } from '../../src/providers/voice/AzureVoiceProvider'
import { KGQwenFeedbackService } from '../../src/services/kg-qwen-feedback.service'

const originalKey = process.env.AZURE_SPEECH_KEY
afterEach(() => {
  if (originalKey === undefined) delete process.env.AZURE_SPEECH_KEY
  else process.env.AZURE_SPEECH_KEY = originalKey
  jest.restoreAllMocks()
})

it.each([
  ['hi-IN', 'hi-IN-SwaraNeural', 'बिल्ली का मतलब cat है। Say cat.'],
  ['mr-IN', 'mr-IN-AarohiNeural', 'मांजर म्हणजे cat. Say cat.'],
  ['en-IN', 'en-IN-NeerjaNeural', 'Great try. C is for cat.'],
] as const)('Azure speaks KG coaching with %s instead of English-only fallback', async (locale, voice, sentence) => {
  process.env.AZURE_SPEECH_KEY = 'test-only-key'
  const captured: string[] = []
  jest.spyOn(globalThis, 'fetch').mockImplementation(async (_url, init) => {
    captured.push(String(init?.body))
    return new Response(Buffer.alloc(500, 65), { status: 200 })
  })
  const actual = await new AzureVoiceProvider().synthesizeUncached(sentence, { language: locale })
  expect(actual.audio.length).toBe(500)
  expect(captured).toHaveLength(1)
  expect(captured[0]).toContain(`<voice name="${voice}">`)
  expect(captured[0]).toContain(`xml:lang="${locale}"`)
})

it('explicit Sarvam locale overrides ambiguous Romanized Hindi/Marathi and does not generate twice', async () => {
  process.env.AZURE_SPEECH_KEY = 'test-only-key'
  const captured: string[] = []
  const f = jest.spyOn(globalThis, 'fetch').mockImplementation(async (_url, init) => {
    captured.push(String(init?.body))
    return new Response(Buffer.alloc(500, 65), { status: 200 })
  })
  const p = new AzureVoiceProvider()
  await p.synthesizeUncached('Billi means cat! Say cat.', { language: 'hi-IN' })
  await p.synthesizeUncached('Mala cat mhana. Say cat.', { language: 'mr-IN' })
  expect(f).toHaveBeenCalledTimes(2)
  expect(captured[0]).toContain('hi-IN-SwaraNeural')
  expect(captured[1]).toContain('mr-IN-AarohiNeural')
})

it('KG Qwen coaching forwards Sarvam language, not any browser-supplied voice preference', async () => {
  const f = jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(
    JSON.stringify({ message: 'Nice try! In English we say apple. Say apple with me.' }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  ))
  await KGQwenFeedbackService.compose({
    letter: 'A', mode: 'speak', outcome: 'incorrect', transcript: 'seb', languageCode: 'hi-IN',
  })
  expect(f).toHaveBeenCalledTimes(1)
  const body = JSON.parse(String(f.mock.calls[0]?.[1]?.body))
  expect(body.preferredExplanationLanguage).toBe('Hindi')
})
