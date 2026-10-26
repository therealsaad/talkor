/* Run without credentials/network: node --test backend/tests/kg-live-voice.node.test.cjs */
const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')

function loadTS(file, modules) {
  const full = path.resolve(__dirname, '..', 'src', file)
  const js = ts.transpileModule(fs.readFileSync(full, 'utf8'), { fileName: full, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  const output = { exports: {} }
  Function('require', 'module', 'exports', 'Buffer', js)((name) => {
    if (!(name in modules)) throw new Error('Unmocked dependency: ' + name)
    return modules[name]
  }, output, output.exports, Buffer)
  return output.exports
}
const env = { groqApiKey: '', conversationGroqModel: 'test-model' }
const feedback = loadTS('services/kg-feedback.service.ts', {
  '../config/env': { env },
  './kg-teaching-hint': { kgTeachingHint: (_letter, _mode, outcome) => outcome === 'correct' ? null : 'Try apple again.' },
})

test('without Groq, incorrect speech is corrected deterministically, not automatically praised', async () => {
  env.groqApiKey = ''
  const result = await feedback.generateKGFeedback({ letter: 'A', mode: 'speak', outcome: 'incorrect', transcript: 'banana' })
  assert.equal(result.source, 'guided')
  assert.match(result.text.toLowerCase(), /apple/)
  assert.doesNotMatch(result.text, /Wonderful! You did it/)
})

test('Groq can vary encouraging response wording, but cannot change the backend verdict', async () => {
  env.groqApiKey = 'test-key'
  const original = globalThis.fetch
  globalThis.fetch = async (_url, options) => {
    const message = JSON.parse(options.body)
    assert.equal(JSON.parse(message.messages[1].content).verifiedOutcome, 'incorrect')
    return { ok: true, json: async () => ({ choices: [{ message: { content: JSON.stringify({ text: 'Good try! Apple starts with A. Can you say apple?' }) } }] }) }
  }
  try {
    const result = await feedback.generateKGFeedback({ letter: 'A', mode: 'speak', outcome: 'incorrect', transcript: 'banana' })
    assert.equal(result.source, 'groq')
    assert.match(result.text, /apple/i)
  } finally { globalThis.fetch = original; env.groqApiKey = '' }
})

test('rejects misleading hallucinated Groq corrections and preserves safe fallback', async () => {
  env.groqApiKey = 'test-key'
  const original = globalThis.fetch
  globalThis.fetch = async () => ({ ok: true, json: async () => ({ choices: [{ message: { content: '{"text":"Wonderful! You got everything right!"}' } }] }) })
  try {
    const result = await feedback.generateKGFeedback({ letter: 'C', mode: 'speak', outcome: 'incorrect', transcript: 'dog' })
    assert.equal(result.source, 'guided')
    assert.match(result.text, /apple|cat/i)
  } finally { globalThis.fetch = original; env.groqApiKey = '' }
})

test('Azure KG synthesis is transient: no AudioCacheService read/write, and XML is escaped', async () => {
  const calls = { get: 0, put: 0, fetch: 0 }
  const original = globalThis.fetch
  globalThis.fetch = async (_url, options) => {
    calls.fetch++
    assert.match(options.body, /&lt;there&gt;/)
    assert.match(options.body, /prosody rate="\+5%" pitch="\+6%"/)
    return { ok: true, arrayBuffer: async () => Uint8Array.from([1,2,3]).buffer }
  }
  process.env.AZURE_SPEECH_KEY = 'unit-test-only'
  const { AzureVoiceProvider } = loadTS('providers/voice/AzureVoiceProvider.ts', {
    '../../utils/ApiError': { ApiError: { badRequest: (m) => new Error(m), provider: (m) => new Error(m) } },
    '../../utils/logger': { logger: { warn() {} } },
    '../../services/AudioCacheService': { AudioCacheService: { get: async () => { calls.get++; throw Error('should not read persistent cache') }, put: async () => { calls.put++; throw Error('should not write persistent cache') } } },
  })
  try {
    const value = await new AzureVoiceProvider().synthesizeUncached('Hi <there>!')
    assert.equal(value.audio.length, 3)
    assert.equal(value.contentType, 'audio/mpeg')
    assert.deepEqual(calls, { get: 0, put: 0, fetch: 1 })
  } finally { globalThis.fetch = original; delete process.env.AZURE_SPEECH_KEY }
})

test('staff preview routes audio through STT and returns reusable Priya/S3 feedback, no progress writes', async () => {
  const calls = { stt: 0, azure: 0, db: 0 }
  const blockDatabase = new Proxy({}, { get() { calls.db++; throw new Error('Preview must not access student MongoDB') } })
  const { KGAlphabetController } = loadTS('controllers/kg-alphabet.controller.ts', {
    'node:crypto': require('node:crypto'),
    mongoose: { Types: class {} },
    '../utils/catchAsync': { catchAsync: (fn) => fn },
    '../utils/ApiResponse': { ok: (res, payload) => { res.payload = payload; return payload } },
    '../utils/ApiError': { ApiError: { badRequest: (m) => new Error(m), provider: (m) => new Error(m) } },
    '../models/Student': { Student: blockDatabase },
    '../models/KGAlphabetProgress': { KGAlphabetProgress: blockDatabase },
    '../models/KGAlphabetAttempt': { KGAlphabetAttempt: blockDatabase },
    '../models/KGAlphabetSubmission': { KGAlphabetSubmission: blockDatabase },
    '../models/KGIntroPlayback': { KGIntroPlayback: blockDatabase },
    '../kg/alphabet-content': {
      AUDIO_IDS: ['say-a', 'model-a'], AUDIO_LINES: { 'say-a': 'Say apple!', 'model-a': 'Nice try, beta ji! Listen: apple.' }, LETTERS: [{ letter: 'A', word: 'apple' }],
      audioKey: () => '', KG_ALPHABET_VERSION: 'v1', KG_AUDIO_VERSION: 'v1',
      activityAt: (i) => i === 0 ? { id: 'say-a', letter: 'A', mode: 'speak' } : null,
      evaluateKGSpeech: (transcript) => transcript === 'apple' ? 'correct' : 'incorrect',
    },
    '../kg/kg-child-grading': { gradeKGTranscription: ({ transcript }) => transcript === 'apple' ? 'correct' : 'incorrect' },
    '../services/kg-pilot-access': { isAuthorizedKGAlphabetStudent: () => true },
    '../services/kg-static-audio-cache': { getKGStaticAudio: async () => null },
    '../providers/voice/AzureVoiceProvider': { AzureVoiceProvider: class { async synthesizeUncached() { calls.azure++; return { audio: Buffer.from([9,8,7]), contentType: 'audio/mpeg' } } } },
    '../services/kg-speech.service': { KGSpeechService: { transcribe: async () => { calls.stt++; return { available: true, transcript: 'banana', provider: 'groq' } } } },
    '../services/kg-teaching-hint': { kgTeachingHint: () => 'Say apple!' },
    '../config/env': { env: { sttTimeoutMs: 18000 } },
    '../schemas/voice.schema': { isSupportedVoiceAudioMimeType: (type) => type === 'audio/webm' },
  })
  const req = { body: { activityId: 'say-a', durationMs: 1000, mimeType: 'audio/webm', audioBase64: 'Q'.repeat(160) } }
  const res = { setHeader() {} }
  await KGAlphabetController.previewAttempt(req, res)
  assert.equal(res.payload.outcome, 'incorrect')
  assert.equal(res.payload.transcript, 'banana')
  assert.equal(res.payload.feedbackVoice, 's3')
  assert.equal(res.payload.feedbackAudioId, 'model-a')
  assert.equal(res.payload.feedbackAudioBase64, null)
  assert.equal(res.payload.advance, false)
  assert.deepEqual(calls, { stt: 1, azure: 0, db: 0 })
})
