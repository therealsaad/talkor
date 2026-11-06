import { sendSyntheticTeachingTurn, SYNTHETIC_TEACHING_SCOPE } from '../../src/services/synthetic-teaching-harness.service'

const SESSION = '00000000-0000-4000-8000-000000000001'
const REQUEST = '00000000-0000-4000-8000-000000000002'

const fixture = {
  sessionId: SESSION,
  requestId: REQUEST,
  expectedRevision: 0,
  event: 'INTRODUCE',
  transcript: '',
  inputStatus: 'TEXT',
  language: 'en',
} as const

function advisory(body: Record<string, unknown> = {}) {
  const request = { ...fixture, ...body }
  return {
    message: 'Under means below something. The ball is under the box.',
    reaction: 'encouraging',
    responseQuality: 'UNCLEAR',
    followUpQuestion: 'Which position word fits?',
    correction: { needed: false, original: '', corrected: '', explanation: '' },
    memoryUpdates: [],
    recommendedAction: 'ASK_FOLLOW_UP',
    teachingAction: 'ASK_FOLLOW_UP',
    modelSentence: null,
    activityComplete: false,
    shouldRetry: false,
    hintLevel: 1,
    detectedSkills: [],
    remainingSkills: [],
    teaching: {
      contractVersion: 'teaching.dev.v1',
      synthetic: true,
      scope: { ...SYNTHETIC_TEACHING_SCOPE },
      sessionId: request.sessionId,
      requestId: request.requestId,
      revision: request.expectedRevision + 1,
      strategyCandidate: 'EXPLAIN',
      lexicalObservation: 'UNAVAILABLE',
      answerSupport: 'UNKNOWN',
      validatedLearning: false,
      acceptedEvidence: [],
      independentCheckRequested: false,
      suppliesAnswer: true,
      providerStatus: 'generated',
      rejectionReason: null,
      targetAnchored: false,
      wordingSource: 'qwen-generated',
      latency: { providerMs: 12, bridgeMs: 16 },
    },
  }
}

function jsonResponse(body: unknown, options: { ok?: boolean; status?: number; contentType?: string } = {}): Response {
  const serialized = typeof body === 'string' ? body : JSON.stringify(body)
  return {
    ok: options.ok ?? true,
    status: options.status ?? 200,
    headers: {
      get: (name: string) => name.toLowerCase() === 'content-type'
        ? (options.contentType ?? 'application/json')
        : null,
    },
    text: async () => serialized,
  } as unknown as Response
}

const environmentVariables = [
  'NODE_ENV', 'TALKORA_ENV', 'ENVIRONMENT',
  'TALKORA_NODE_SYNTHETIC_TEACHING_OPT_IN',
  'TALKORA_ENABLE_TEACHING_HARNESS',
  'TALKORA_SERVICE_KEY', 'TALKORA_DEV_TEACHING_PORT',
] as const
const previous = Object.fromEntries(
  environmentVariables.map(key => [key, process.env[key]]),
) as Record<(typeof environmentVariables)[number], string | undefined>

beforeEach(() => {
  process.env.NODE_ENV = 'test'
  delete process.env.TALKORA_ENV
  delete process.env.ENVIRONMENT
  process.env.TALKORA_NODE_SYNTHETIC_TEACHING_OPT_IN = 'true'
  process.env.TALKORA_ENABLE_TEACHING_HARNESS = 'true'
  process.env.TALKORA_SERVICE_KEY = 'synthetic-dev-service-key-for-testing-only-123456'
  process.env.TALKORA_DEV_TEACHING_PORT = '18152'
})

afterEach(() => {
  environmentVariables.forEach(key => {
    if (previous[key] === undefined) delete process.env[key]
    else process.env[key] = previous[key]
  })
  jest.restoreAllMocks()
})

describe('Node -> isolated synthetic Miss Julie Python teaching contract', () => {
  it('denies by default and cannot accidentally call a student route', async () => {
    delete process.env.TALKORA_NODE_SYNTHETIC_TEACHING_OPT_IN
    const request = jest.spyOn(globalThis, 'fetch')
    await expect(sendSyntheticTeachingTurn(fixture)).rejects.toThrow('SYNTHETIC_TEACHING_DISABLED')
    expect(request).not.toHaveBeenCalled()
  })

  it.each(['NODE_ENV', 'TALKORA_ENV', 'ENVIRONMENT'])('fails closed when %s is production', async key => {
    process.env[key] = 'production'
    const request = jest.spyOn(globalThis, 'fetch')
    await expect(sendSyntheticTeachingTurn(fixture)).rejects.toThrow('SYNTHETIC_TEACHING_DISABLED')
    expect(request).not.toHaveBeenCalled()
  })

  it('requires the Python harness opt-in and strong service key', async () => {
    process.env.TALKORA_ENABLE_TEACHING_HARNESS = 'false'
    await expect(sendSyntheticTeachingTurn(fixture)).rejects.toThrow('SYNTHETIC_TEACHING_DISABLED')
    process.env.TALKORA_ENABLE_TEACHING_HARNESS = 'true'
    process.env.TALKORA_SERVICE_KEY = 'short'
    await expect(sendSyntheticTeachingTurn(fixture)).rejects.toThrow('SYNTHETIC_TEACHING_SERVICE_KEY_REQUIRED')
  })

  it.each(['8002', '3000', '18999:8080', 'http://evil.example', '65535', '1800'])(
    'never permits a production or external port: %s',
    async port => {
      process.env.TALKORA_DEV_TEACHING_PORT = port
      const request = jest.spyOn(globalThis, 'fetch')
      await expect(sendSyntheticTeachingTurn(fixture)).rejects.toThrow('SYNTHETIC_TEACHING_INVALID_PORT')
      expect(request).not.toHaveBeenCalled()
    },
  )

  it('calls only the disposable localhost synthetic fixture, with a server-only key', async () => {
    const spy = jest.spyOn(globalThis, 'fetch').mockImplementation(async (_url, init) => {
      const sent = JSON.parse(init?.body as string)
      expect(sent.scope).toEqual(SYNTHETIC_TEACHING_SCOPE)
      expect(sent.contractVersion).toBe('teaching.dev.v1')
      expect(sent).not.toHaveProperty('studentId')
      expect(sent).not.toHaveProperty('studentName')
      expect(sent).not.toHaveProperty('studentPin')
      expect(sent).not.toHaveProperty('xpAwarded')
      expect(sent).not.toHaveProperty('approvedRevision')
      expect(JSON.stringify(sent)).not.toContain(process.env.TALKORA_SERVICE_KEY)
      return jsonResponse(advisory(sent))
    })
    const result = await sendSyntheticTeachingTurn(fixture)
    expect(result.teaching.synthetic).toBe(true)
    expect(result.activityComplete).toBe(false)
    expect(result.teaching.validatedLearning).toBe(false)
    expect(result.teaching.acceptedEvidence).toEqual([])
    expect(spy).toHaveBeenCalledWith('http://127.0.0.1:18152/dev/teaching/turn',
      expect.objectContaining({
        redirect: 'error',
        headers: {
          'Content-Type': 'application/json',
          'X-Talkora-Service-Key': process.env.TALKORA_SERVICE_KEY,
        },
      }))
  })

  it('rejects arbitrary user speech and personal fields instead of forwarding them', async () => {
    const request = jest.spyOn(globalThis, 'fetch')
    await expect(sendSyntheticTeachingTurn({
      ...fixture, event: 'ANSWER', transcript: 'My phone is 1234567890',
    } as any)).rejects.toThrow('SYNTHETIC_TEACHING_INVALID_FIXTURE')
    await expect(sendSyntheticTeachingTurn({
      ...fixture, studentId: 'real-student-id',
    } as any)).rejects.toThrow('SYNTHETIC_TEACHING_INVALID_FIXTURE')
    await expect(sendSyntheticTeachingTurn({
      ...fixture, transcript: 'under', inputStatus: 'STT_FAILED',
    } as any)).rejects.toThrow('SYNTHETIC_TEACHING_INVALID_FIXTURE')
    expect(request).not.toHaveBeenCalled()
  })

  it('does not accept made-up curriculum tracks or version identity', async () => {
    const request = jest.spyOn(globalThis, 'fetch')
    await expect(sendSyntheticTeachingTurn({
      ...fixture, scope: { ...SYNTHETIC_TEACHING_SCOPE, bookId: 'real-school-book' },
    } as any)).rejects.toThrow('SYNTHETIC_TEACHING_INVALID_FIXTURE')
    expect(request).not.toHaveBeenCalled()
  })

  it('rejects falsified completion, evidence, XP and identity claims from upstream', async () => {
    const unsafe = [
      { activityComplete: true },
      { xpAwarded: 15 },
      { teaching: { ...advisory().teaching, validatedLearning: true } },
      { teaching: { ...advisory().teaching, acceptedEvidence: ['under'] } },
      { teaching: { ...advisory().teaching, synthetic: false } },
      { teaching: { ...advisory().teaching, scope: { ...SYNTHETIC_TEACHING_SCOPE, trackId: 'live' } } },
      { teaching: { ...advisory().teaching, requestId: '00000000-0000-4000-8000-000000000099' } },
      { teaching: { ...advisory().teaching, revision: 16 } },
    ]
    for (const change of unsafe) {
      jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce(jsonResponse({ ...advisory(), ...change }))
      await expect(sendSyntheticTeachingTurn(fixture)).rejects.toThrow('SYNTHETIC_TEACHING_INVALID_ADVISORY')
    }
  })

  it('fails on malformed JSON, wrong media type, and oversized response', async () => {
    const spy = jest.spyOn(globalThis, 'fetch')
    spy.mockResolvedValueOnce(jsonResponse('{ bad-json'))
    await expect(sendSyntheticTeachingTurn(fixture)).rejects.toThrow('SYNTHETIC_TEACHING_INVALID_JSON')
    spy.mockResolvedValueOnce(jsonResponse(advisory(), { contentType: 'text/html' }))
    await expect(sendSyntheticTeachingTurn(fixture)).rejects.toThrow('SYNTHETIC_TEACHING_INVALID_CONTENT_TYPE')
    spy.mockResolvedValueOnce(jsonResponse('x'.repeat(16385)))
    await expect(sendSyntheticTeachingTurn(fixture)).rejects.toThrow('SYNTHETIC_TEACHING_OVERSIZED_RESPONSE')
    spy.mockResolvedValueOnce(jsonResponse({}, { ok: false, status: 503 }))
    await expect(sendSyntheticTeachingTurn(fixture)).rejects.toThrow('SYNTHETIC_TEACHING_HTTP_503')
  })

  it('preserves request identity for safe Python-side replay without claiming durable Node state', async () => {
    const requests: unknown[] = []
    jest.spyOn(globalThis, 'fetch').mockImplementation(async (_url, init) => {
      const sent = JSON.parse(init?.body as string)
      requests.push(sent)
      return jsonResponse(advisory(sent))
    })
    await sendSyntheticTeachingTurn(fixture)
    await sendSyntheticTeachingTurn(fixture)
    expect(requests).toHaveLength(2)
    expect(requests[0]).toEqual(requests[1])
  })
})
