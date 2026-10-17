import { afterEach, describe, expect, it, jest } from '@jest/globals'
import { env } from '../../src/config/env'
import type { MissJulieContext } from '../../src/providers/ai/AIProvider'
import { GroqProvider } from '../../src/providers/ai/GroqProvider'
import { logger } from '../../src/utils/logger'

const context: MissJulieContext = {
  studentName: 'Aarav',
  grade: 4,
  levelTitle: 'Talkora Adventure',
  lessonTitle: 'English Practice',
  recentMistakes: [],
  memoryFacts: [],
  promptContext: 'conversation',
  studentMessage: 'I enjoy playing cricket.',
}

const previousGroqKey = env.groqApiKey

afterEach(() => {
  env.groqApiKey = previousGroqKey
  jest.restoreAllMocks()
})

describe('Groq conversation provider failures', () => {
  it('gives a safe key hint on 401 without logging the raw provider payload', async () => {
    env.groqApiKey = 'test-only-groq-key'
    const privateProviderText = 'raw provider message must not escape'
    const loggerError = jest.spyOn(logger, 'error').mockImplementation(() => undefined)
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(
      JSON.stringify({ error: { type: 'authentication_error', message: privateProviderText } }),
      { status: 401, headers: { 'Content-Type': 'application/json' } },
    ))

    await expect(new GroqProvider().generate(context)).rejects.toMatchObject({
      statusCode: 502,
      code: 'PROVIDER_ERROR',
      message: expect.stringContaining('GROQ_API_KEY'),
    })
    expect(loggerError).toHaveBeenCalledWith('Groq returned an error', expect.objectContaining({ status: 401 }))
    expect(JSON.stringify(loggerError.mock.calls)).not.toContain(privateProviderText)
  })

  it('returns HTTP 429 when Groq rate-limits a turn', async () => {
    env.groqApiKey = 'test-only-groq-key'
    jest.spyOn(logger, 'warn').mockImplementation(() => undefined)
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 429 }))

    await expect(new GroqProvider().generate(context)).rejects.toMatchObject({
      statusCode: 429,
      code: 'RATE_LIMITED',
    })
  })

  it('maps network timeouts to a safe retryable provider error', async () => {
    env.groqApiKey = 'test-only-groq-key'
    const loggerWarn = jest.spyOn(logger, 'warn').mockImplementation(() => undefined)
    const timeout = Object.assign(new Error('private transport detail'), { name: 'TimeoutError' })
    jest.spyOn(globalThis, 'fetch').mockRejectedValue(timeout)

    await expect(new GroqProvider().generate(context)).rejects.toMatchObject({
      statusCode: 504,
      code: 'GATEWAY_TIMEOUT',
      message: expect.stringMatching(/timed out.*try again/i),
    })
    expect(JSON.stringify(loggerWarn.mock.calls)).not.toContain('private transport detail')
  })

  it('does not return or log a raw Groq 5xx response body', async () => {
    env.groqApiKey = 'test-only-groq-key'
    const privateProviderText = 'private upstream diagnostic body'
    const loggerError = jest.spyOn(logger, 'error').mockImplementation(() => undefined)
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(privateProviderText, { status: 503 }))

    await expect(new GroqProvider().generate(context)).rejects.toMatchObject({
      statusCode: 502,
      message: expect.stringContaining('HTTP 503'),
    })
    expect(JSON.stringify(loggerError.mock.calls)).not.toContain(privateProviderText)
  })
})
