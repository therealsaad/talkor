import { env } from '../../src/config/env'
import { SarvamSpeechProvider } from '../../src/providers/speech/SarvamSpeechProvider'

const settings = {
  key: env.sarvamApiKey,
  model: env.sarvamSttModel,
  language: env.sarvamSttLanguage,
  mode: env.sarvamSttMode,
}

afterEach(() => {
  env.sarvamApiKey = settings.key
  env.sarvamSttModel = settings.model
  env.sarvamSttLanguage = settings.language
  env.sarvamSttMode = settings.mode
  jest.restoreAllMocks()
})

it('posts Saaras v4 multilingual codemix audio without leaking the API key', async () => {
  env.sarvamApiKey = 'test-only-key'
  env.sarvamSttModel = 'saaras:v4'
  env.sarvamSttLanguage = 'unknown'
  env.sarvamSttMode = 'codemix'
  const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ transcript: 'सेब' }), { status: 200 }))

  const result = await new SarvamSpeechProvider().transcribe({
    audioBase64: Buffer.from('fake browser recording').toString('base64'), mimeType: 'audio/webm', durationMs: 900,
  })

  expect(fetchMock).toHaveBeenCalledTimes(1)
  const [url, options] = fetchMock.mock.calls[0]
  expect(url).toBe('https://api.sarvam.ai/speech-to-text')
  expect(options?.headers).toEqual({ 'api-subscription-key': 'test-only-key' })
  const body = options?.body as FormData
  expect(body.get('model')).toBe('saaras:v4')
  expect(body.get('mode')).toBe('codemix')
  expect(body.get('language_code')).toBe('unknown')
  expect(body.get('file')).toBeInstanceOf(Blob)
  expect(result).toMatchObject({ provider: 'sarvam', available: true, transcript: 'सेब' })
})

it('recognizes silence as a valid empty transcription rather than a provider outage', async () => {
  env.sarvamApiKey = 'test-only-key'
  jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ transcript: '' }), { status: 200 }))
  await expect(new SarvamSpeechProvider().transcribe({ audioBase64: Buffer.from('fake audio').toString('base64') }))
    .resolves.toMatchObject({ transcript: null, available: true })
})

it('rejects malformed recordings before making a billable request', async () => {
  env.sarvamApiKey = 'test-only-key'
  const fetchMock = jest.spyOn(globalThis, 'fetch')
  await expect(new SarvamSpeechProvider().transcribe({ audioBase64: 'not valid base64$' }))
    .rejects.toMatchObject({ statusCode: 400 })
  expect(fetchMock).not.toHaveBeenCalled()
})
