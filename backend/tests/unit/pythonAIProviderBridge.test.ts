import { PythonAIProvider } from '../../src/providers/ai/PythonAIProvider'
import { GroqProvider } from '../../src/providers/ai/GroqProvider'
import { env } from '../../src/config/env'
import type { MissJulieContext } from '../../src/providers/ai/AIProvider'

const class1Context: MissJulieContext = {
  studentName: 'Synthetic Demo',
  grade: 1,
  levelId: 'g01-l01',
  levelTitle: 'First Day',
  lessonTitle: 'Little Words',
  activityTitle: 'Say am',
  activityTarget: 'Say the word am.',
  recentMistakes: [],
  memoryFacts: [],
  promptContext: 'speaking',
  studentMessage: 'am',
}

const response = {
  message: 'I heard am. Nice effort!',
  reaction: 'encouraging',
  responseQuality: 'ADEQUATE',
  activityComplete: false,
  memoryUpdates: [],
}

describe('Class 1 Node to Python production bridge', () => {
  const previousPilot = process.env.TALKORA_CLASS1_QWEN_PILOT
  const previousUrl = process.env.TALKORA_CLASS1_AI_URL
  const previousKey = env.talkoraServiceKey
  const previousProd = env.isProd
  const previousGroqKey = env.groqApiKey

  beforeEach(() => {
    process.env.TALKORA_CLASS1_QWEN_PILOT = 'true'
    process.env.TALKORA_CLASS1_AI_URL = 'http://127.0.0.1:8002'
    env.talkoraServiceKey = 'server-only-secret-should-be-at-least-32-characters'
    env.isProd = false
    env.groqApiKey = ''
  })

  afterEach(() => {
    if (previousPilot === undefined) delete process.env.TALKORA_CLASS1_QWEN_PILOT
    else process.env.TALKORA_CLASS1_QWEN_PILOT = previousPilot
    if (previousUrl === undefined) delete process.env.TALKORA_CLASS1_AI_URL
    else process.env.TALKORA_CLASS1_AI_URL = previousUrl
    env.talkoraServiceKey = previousKey
    env.isProd = previousProd
    env.groqApiKey = previousGroqKey
    jest.restoreAllMocks()
  })

  it('passes the service key only as a server-to-server header', async () => {
    const request = jest.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => response,
    } as Response)

    const answer = await new PythonAIProvider().generate(class1Context)

    expect(answer.activityComplete).toBe(false)
    expect(request).toHaveBeenCalledWith(
      'http://127.0.0.1:8002/v1/brain/respond',
      expect.objectContaining({
        headers: {
          'Content-Type': 'application/json',
          'X-Talkora-Service-Key': env.talkoraServiceKey,
        },
      }),
    )
  })

  it('rejects production pilot requests without a strong service key', async () => {
    env.isProd = true
    env.talkoraServiceKey = ''
    const request = jest.spyOn(globalThis, 'fetch')
    await expect(new PythonAIProvider().generate(class1Context)).rejects.toMatchObject({
      code: 'PROVIDER_ERROR',
    })
    expect(request).not.toHaveBeenCalled()
  })

  it('never switches Class 1 syllabus turns to Groq when the bridge fails', async () => {
    env.groqApiKey = 'synthetic-fallback-config'
    jest.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 503,
      text: async () => 'service unavailable',
    } as Response)
    const groq = jest.spyOn(GroqProvider.prototype, 'generate')

    await expect(new PythonAIProvider().generate(class1Context)).rejects.toMatchObject({
      code: 'PROVIDER_ERROR',
    })
    expect(groq).not.toHaveBeenCalled()
  })
})
