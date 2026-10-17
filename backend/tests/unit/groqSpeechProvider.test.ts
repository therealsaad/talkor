import { afterEach, describe, expect, it, jest } from '@jest/globals'
import { env } from '../../src/config/env'
import { GroqSpeechProvider } from '../../src/providers/speech/GroqSpeechProvider'
import { logger } from '../../src/utils/logger'
import { ApiError } from '../../src/utils/ApiError'

const previousKey = env.groqApiKey
const previousFastModel = env.groqSttModel

async function captureApiError(operation: Promise<unknown>): Promise<ApiError> {
  try {
    await operation
  } catch (error) {
    if (error instanceof ApiError) return error
    throw error
  }
  throw new Error('Expected an API error')
}

afterEach(() => {
  env.groqApiKey = previousKey
  env.groqSttModel = previousFastModel
  jest.restoreAllMocks()
})

describe('Groq Whisper transcription', () => {
  it('flags uncertain KG speech from real verbose segment fields and preserves ordinary JSON requests', async () => {
    env.groqApiKey = 'test-only-groq-key'
    jest.spyOn(logger, 'info').mockImplementation(() => undefined)
    const fetchMock = jest.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify({ text: 'apple', segments: [{ avg_logprob: -1.2, no_speech_prob: 0.1 }] })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ text: 'apple', segments: [{ avg_logprob: -0.1, no_speech_prob: 0.01, compression_ratio: 1.2 }] })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ text: '' })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ text: 'apple', segments: [{ avg_logprob: -0.1, no_speech_prob: -1 }] })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ text: 'apple', segments: {} })))
    const input = { audioBase64: 'dGVzdA==', mimeType: 'audio/webm', qualityMetadata: true }
    await expect(new GroqSpeechProvider().transcribe(input)).resolves.toMatchObject({ transcript: 'apple', uncertain: true })
    await expect(new GroqSpeechProvider().transcribe(input)).resolves.toMatchObject({ transcript: 'apple', uncertain: false })
    await expect(new GroqSpeechProvider().transcribe(input)).resolves.toMatchObject({ transcript: '', uncertain: true })
    await expect(new GroqSpeechProvider().transcribe(input)).resolves.toMatchObject({ transcript: 'apple', uncertain: true })
    await expect(new GroqSpeechProvider().transcribe(input)).resolves.toMatchObject({ transcript: 'apple', uncertain: true })
    expect((fetchMock.mock.calls[0][1]?.body as FormData).get('response_format')).toBe('verbose_json')
    expect((fetchMock.mock.calls[0][1]?.body as FormData).has('prompt')).toBe(false)
  })
  it('uploads browser WebM/Opus with the configured fast model', async () => {
    env.groqApiKey = 'test-only-groq-key'
    env.groqSttModel = 'test-only-whisper-model'
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(
      JSON.stringify({ text: 'I enjoy playing cricket.' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    ))
    jest.spyOn(logger, 'info').mockImplementation(() => undefined)

    await expect(new GroqSpeechProvider().transcribe({
      audioBase64: Buffer.from('audio bytes').toString('base64'),
      mimeType: 'audio/webm;codecs=opus',
      durationMs: 1200,
    })).resolves.toMatchObject({ transcript: 'I enjoy playing cricket.', model: 'test-only-whisper-model' })

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    const form = init.body as FormData
    expect((form.get('file') as File).name).toBe('student-speech.webm')
    expect(form.get('model')).toBe('test-only-whisper-model')
    expect(form.get('response_format')).toBe('json')
  })

  it('rejects empty or malformed base64 audio before contacting Groq', async () => {
    env.groqApiKey = 'test-only-groq-key'
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 500 }))

    await expect(new GroqSpeechProvider().transcribe({ audioBase64: '' }))
      .rejects.toMatchObject({ statusCode: 400 })
    await expect(new GroqSpeechProvider().transcribe({ audioBase64: 'not-base64?' }))
      .rejects.toMatchObject({ statusCode: 400 })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('rejects unsupported media types before contacting Groq', async () => {
    env.groqApiKey = 'test-only-groq-key'
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 500 }))

    await expect(new GroqSpeechProvider().transcribe({
      audioBase64: Buffer.from('audio bytes').toString('base64'),
      mimeType: 'image/png',
    })).rejects.toMatchObject({ statusCode: 400 })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('reports a rejected Groq key without returning or logging its raw error body', async () => {
    env.groqApiKey = 'test-only-groq-key'
    const privateProviderText = 'private upstream API key diagnostic'
    const loggerError = jest.spyOn(logger, 'error').mockImplementation(() => undefined)
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(
      JSON.stringify({ error: { type: 'authentication_error', message: privateProviderText } }),
      { status: 401, headers: { 'Content-Type': 'application/json' } },
    ))

    const error = await captureApiError(new GroqSpeechProvider().transcribe({ audioBase64: 'dGVzdA==', mimeType: 'audio/webm' }))
    expect(error.statusCode).toBe(502)
    expect(error.message).toContain('configured key')
    expect(loggerError).toHaveBeenCalledWith('Groq STT returned an error', expect.objectContaining({ status: 401 }))
    expect(JSON.stringify(loggerError.mock.calls)).not.toContain(privateProviderText)
  })

  it('preserves Groq rate limits as HTTP 429', async () => {
    env.groqApiKey = 'test-only-groq-key'
    jest.spyOn(logger, 'warn').mockImplementation(() => undefined)
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 429 }))

    await expect(new GroqSpeechProvider().transcribe({ audioBase64: 'dGVzdA==', mimeType: 'audio/webm' }))
      .rejects.toMatchObject({ statusCode: 429, code: 'RATE_LIMITED' })
  })

  it('maps upstream timeouts to 504 and other upstream failures to safe 502 errors', async () => {
    env.groqApiKey = 'test-only-groq-key'
    jest.spyOn(logger, 'warn').mockImplementation(() => undefined)
    const loggerError = jest.spyOn(logger, 'error').mockImplementation(() => undefined)
    const timeout = Object.assign(new Error('private transport detail'), { name: 'TimeoutError' })
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockRejectedValueOnce(timeout).mockResolvedValueOnce(
      new Response('private 503 provider body', { status: 503 }),
    )

    const timeoutError = await captureApiError(new GroqSpeechProvider().transcribe({ audioBase64: 'dGVzdA==', mimeType: 'audio/webm' }))
    expect(timeoutError.statusCode).toBe(504)
    const upstreamError = await captureApiError(new GroqSpeechProvider().transcribe({ audioBase64: 'dGVzdA==', mimeType: 'audio/webm' }))
    expect(upstreamError.statusCode).toBe(502)
    expect(upstreamError.message).toContain('HTTP 503')
    expect(JSON.stringify(loggerError.mock.calls)).not.toContain('private transport detail')
    expect(JSON.stringify(loggerError.mock.calls)).not.toContain('private 503 provider body')
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})
