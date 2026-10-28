import { class1SupportFromSarvam } from '../../src/providers/ai/class1-stt-language'
import { submitVoiceTranscriptSchema } from '../../src/schemas/voice.schema'
import { env } from '../../src/config/env'
import { SarvamSpeechProvider } from '../../src/providers/speech/SarvamSpeechProvider'

describe('Class 1 speech language handoff', () => {
  it('only sends a known Sarvam language to the canonical Class 1 conversation', () => {
    expect(class1SupportFromSarvam('class1-l01-v2-review-little-words', 'mr-IN')).toBe('Marathi')
    expect(class1SupportFromSarvam('class1-l01-v2-review-little-words', 'hi-IN')).toBe('Hindi')
    expect(class1SupportFromSarvam('class1-l01-v2-review-little-words', 'en-IN')).toBe('English')
    expect(class1SupportFromSarvam('class1-l02-review', 'mr-IN')).toBeUndefined()
    expect(class1SupportFromSarvam('kg-l01-hello', 'mr-IN')).toBeUndefined()
    expect(class1SupportFromSarvam('class1-l01-v2-review-little-words', 'mr_IN')).toBeUndefined()
    expect(class1SupportFromSarvam('class1-l01-v2-review-little-words', undefined)).toBeUndefined()
  })

  it('accepts the optional bounded language hint but rejects arbitrary text', () => {
    const body = { transcript: 'मला समजत नाही', inputMode: 'MIC' }
    expect(submitVoiceTranscriptSchema.safeParse({ body, params: { sessionId: 'id' } }).success).toBe(true)
    expect(submitVoiceTranscriptSchema.safeParse({ body: { ...body, detectedLanguage: 'mr-IN' }, params: { sessionId: 'id' } }).success).toBe(true)
    expect(submitVoiceTranscriptSchema.safeParse({ body: { ...body, detectedLanguage: 'unsupported' }, params: { sessionId: 'id' } }).success).toBe(false)
  })

  it('does not issue a second Sarvam call to preserve detected language', async () => {
    const previous = {
      key: env.sarvamApiKey, model: env.sarvamSttModel,
      language: env.sarvamSttLanguage, mode: env.sarvamSttMode,
    }
    env.sarvamApiKey = 'test-only-key'
    env.sarvamSttModel = 'saaras:v4'
    env.sarvamSttLanguage = 'unknown'
    env.sarvamSttMode = 'codemix'
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ transcript: 'शाळा', language_code: 'mr-IN' }), { status: 200 }),
    )
    try {
      const result = await new SarvamSpeechProvider().transcribe({
        audioBase64: Buffer.from('synthetic audio').toString('base64'),
        mimeType: 'audio/webm', durationMs: 900,
      })
      expect(fetchMock).toHaveBeenCalledTimes(1)
      expect(result.transcript).toBe('शाळा')
      expect(result.languageCode).toBe('mr-IN')
    } finally {
      Object.assign(env, {
        sarvamApiKey: previous.key, sarvamSttModel: previous.model,
        sarvamSttLanguage: previous.language, sarvamSttMode: previous.mode,
      })
      fetchMock.mockRestore()
    }
  })
})
