/**
 * Sprint 3.1 HTTP transport contract test using an ephemeral *fake* local
 * Python-harness responder. This validates actual Node HTTP headers, scope,
 * timeouts and response parsing. It does NOT run the real Qwen/Python server.
 */
import { createServer, type Server } from 'node:http'
import { sendSyntheticTeachingTurn, SYNTHETIC_TEACHING_SCOPE } from '../../src/services/synthetic-teaching-harness.service'

const studentSessionId = '00000000-0000-4000-8000-000000000001'
const requestId = '00000000-0000-4000-8000-000000000002'
const key = 'local-sprint31-contract-test-key-1234567890'
const input = {
  sessionId: studentSessionId,
  requestId,
  expectedRevision: 0,
  event: 'INTRODUCE',
  transcript: '',
  inputStatus: 'TEXT',
  language: 'en',
} as const

let server: Server
let onRequest: (payload: any, req: any) => object
const observed: Array<{ headers: Record<string, any>; payload: any }> = []
const envNames = [
  'NODE_ENV', 'TALKORA_ENV', 'ENVIRONMENT',
  'TALKORA_ENABLE_TEACHING_HARNESS', 'TALKORA_NODE_SYNTHETIC_TEACHING_OPT_IN',
  'TALKORA_SERVICE_KEY', 'TALKORA_DEV_TEACHING_PORT',
] as const
const previous = Object.fromEntries(envNames.map(name => [name, process.env[name]]))

function success(payload: any) {
  return {
    message: 'The ball is under the box.',
    reaction: 'encouraging',
    responseQuality: 'UNCLEAR',
    followUpQuestion: 'Which position word fits?',
    correction: { needed: false, original: '', corrected: '', explanation: '' },
    memoryUpdates: [], recommendedAction: 'ASK_FOLLOW_UP',
    teachingAction: 'ASK_FOLLOW_UP', modelSentence: null,
    activityComplete: false, shouldRetry: false, hintLevel: 1,
    detectedSkills: [], remainingSkills: [],
    teaching: {
      contractVersion: 'teaching.dev.v1', synthetic: true,
      scope: SYNTHETIC_TEACHING_SCOPE,
      sessionId: payload.sessionId, requestId: payload.requestId,
      revision: payload.expectedRevision + 1, strategyCandidate: 'EXPLAIN',
      lexicalObservation: 'UNAVAILABLE', answerSupport: 'UNKNOWN',
      validatedLearning: false, acceptedEvidence: [],
      independentCheckRequested: false, suppliesAnswer: true,
      providerStatus: 'generated', rejectionReason: null,
      targetAnchored: true, wordingSource: 'qwen-generated',
      latency: { providerMs: 1, bridgeMs: 2 },
    },
  }
}

beforeAll(async () => {
  process.env.NODE_ENV = 'test'
  delete process.env.TALKORA_ENV
  delete process.env.ENVIRONMENT
  process.env.TALKORA_ENABLE_TEACHING_HARNESS = 'true'
  process.env.TALKORA_NODE_SYNTHETIC_TEACHING_OPT_IN = 'true'
  process.env.TALKORA_SERVICE_KEY = key
  process.env.TALKORA_DEV_TEACHING_PORT = '18152'
  onRequest = (payload) => success(payload)
  server = createServer(async (req, res) => {
    const parts: Buffer[] = []
    for await (const chunk of req) parts.push(Buffer.from(chunk))
    const payload = JSON.parse(Buffer.concat(parts).toString('utf8'))
    observed.push({ headers: { ...req.headers }, payload })
    const result = onRequest(payload, req)
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(result))
  })
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(18152, '127.0.0.1', resolve)
  })
})

afterAll(async () => {
  await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()))
  for (const name of envNames) {
    const value = previous[name]
    if (value === undefined) delete process.env[name]
    else process.env[name] = value
  }
})

beforeEach(() => {
  observed.length = 0
  onRequest = (payload) => success(payload)
})

describe('real loopback HTTP transport to synthetic Python-compatible fixture', () => {
  it('posts a bounded fixture to the only allowed localhost URL with server-secret header', async () => {
    const output = await sendSyntheticTeachingTurn(input)
    expect(output.teaching.revision).toBe(1)
    expect(output.activityComplete).toBe(false)
    expect(output.teaching.validatedLearning).toBe(false)
    expect(output.teaching.acceptedEvidence).toHaveLength(0)
    expect(observed).toHaveLength(1)
    expect(observed[0].headers['x-talkora-service-key']).toBe(key)
    expect(observed[0].payload.scope).toEqual(SYNTHETIC_TEACHING_SCOPE)
    expect(observed[0].payload).toEqual({
      contractVersion: 'teaching.dev.v1', ...input, scope: SYNTHETIC_TEACHING_SCOPE,
    })
    expect(JSON.stringify(observed[0].payload)).not.toContain(key)
    expect(JSON.stringify(observed[0].payload)).not.toMatch(/studentId|studentPin|progress|xpAwarded/i)
  })

  it('fails closed over an actual HTTP response if an upstream process claims mastery or changes identity', async () => {
    onRequest = payload => ({ ...success(payload), activityComplete: true })
    await expect(sendSyntheticTeachingTurn(input)).rejects.toThrow('SYNTHETIC_TEACHING_INVALID_ADVISORY')
    onRequest = payload => ({
      ...success(payload),
      teaching: { ...success(payload).teaching, requestId: '00000000-0000-4000-8000-000000000099' },
    })
    await expect(sendSyntheticTeachingTurn(input)).rejects.toThrow('SYNTHETIC_TEACHING_INVALID_ADVISORY')
    onRequest = payload => ({
      ...success(payload),
      teaching: { ...success(payload).teaching, acceptedEvidence: ['faked-correct'] },
    })
    await expect(sendSyntheticTeachingTurn(input)).rejects.toThrow('SYNTHETIC_TEACHING_INVALID_ADVISORY')
  })

  it('refuses production even if a Python-compatible development responder is listening', async () => {
    process.env.TALKORA_ENV = 'production'
    try {
      await expect(sendSyntheticTeachingTurn(input)).rejects.toThrow('SYNTHETIC_TEACHING_DISABLED')
      expect(observed).toHaveLength(0)
    } finally {
      delete process.env.TALKORA_ENV
    }
  })
})
