import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import vm from 'node:vm'
import ts from 'typescript'

const source = await readFile(new URL('../../services/voice-service.ts', import.meta.url), 'utf8')
const engine = await readFile(new URL('../../components/lessons/lesson-experience.tsx', import.meta.url), 'utf8')
const receipt = 'v1.1794300000.' + 'a'.repeat(32) + '.' + 'b'.repeat(64)
const tick = () => new Promise(resolve => setImmediate(resolve))
function harness() {
  let token = 'fixture-A'
  const requests = [], acknowledgements = [], audios = []
  class Audio {
    src = ''; paused = true; muted = false; volume = 1; currentTime = 0
    constructor() { audios.push(this) }
    play() { this.paused = false; return Promise.resolve() }
    pause() { this.paused = true }
    removeAttribute(key) { if (key === 'src') this.src = '' }
  }
  const exports = {}
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020,
  } }).outputText, { exports, module: { exports }, Audio, Blob, Headers, DOMException,
    AbortController, performance, setTimeout, clearTimeout,
    process: { env: { NODE_ENV: 'production' } },
    window: { dispatchEvent() {}, addEventListener() {}, removeEventListener() {}, setTimeout, clearTimeout },
    Event, URL: { createObjectURL: () => 'blob:fixture', revokeObjectURL() {} },
    fetch: (url, options) => new Promise((resolve, reject) => requests.push({ url, options, resolve, reject })),
    require: id => {
      if (id === './silent-audio-unlock') return { createSilentUnlockWav: () => new Blob() }
      if (id === '@/lib/api-client') return {
        getStoredToken: () => token, getApiUrl: path => path,
        apiClient: async (url, options) => { acknowledgements.push({ url, options }); return { complete: true, acknowledged: true } },
      }
      throw Error('Unexpected dependency: ' + id)
    }, console })
  return { service: exports.voiceService, requests, acknowledgements, audios,
    setToken: value => { token = value },
    respond: (index = 0, signed = true) => requests[index].resolve(new Response(new Uint8Array(512), {
      headers: { 'content-type': 'audio/mpeg', ...(signed ? { 'X-Class1-Feedback-Receipt': receipt } : {}) },
    })) }
}
async function ready(h) {
  for (let i = 0; i < 20 && !h.audios.length; i++) await tick()
  assert.equal(h.audios.length, 1, 'Audio was constructed after validated generation')
  return h.audios[0]
}
function speak(h) {
  return h.service.speak('Server teacher caption', undefined, 'fixture-turn', 'CONVERSATION', 'activity-fixture', 'en-IN', 'session-fixture')
}

test('real teacher-turn normalization preserves the final session ID and Sarvam language for signed playback', () => {
  const tree = ts.createSourceFile('lesson-experience.tsx', engine, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  let declaration
  function visit(node) {
    if (ts.isFunctionDeclaration(node) && node.name?.text === 'normalizeTeacherTurnFromAi') declaration = node
    ts.forEachChild(node, visit)
  }
  visit(tree)
  assert(declaration, 'Actual runtime normalizer must exist')
  const exports = {}
  vm.runInNewContext(ts.transpileModule('exports.normalize = ' + declaration.getText(tree), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText, { exports, activity: { id: 'activity-fixture' }, teacherSequence: { current: 0 },
    experienceId: 'g01-l01', isConversation: true })
  const turn = exports.normalize({ message: 'Teacher response', activityComplete: true }, '', {
    id: 'turn', teacherAudioSessionId: 'session-fixture', voiceLanguage: 'mr-IN',
  })
  assert.equal(turn.teacherAudioSessionId, 'session-fixture')
  assert.equal(turn.voiceLanguage, 'mr-IN')
})

test('Class 1 sends the server session ID; ACK is impossible until audio ended', async () => {
  const h = harness()
  const playing = speak(h)
  assert.equal(JSON.parse(h.requests[0].options.body).teacherSessionId, 'session-fixture')
  await assert.rejects(h.service.acknowledgeTeacherAudio('session-fixture'), /Listen to the complete/)
  h.respond()
  const audio = await ready(h)
  await assert.rejects(h.service.acknowledgeTeacherAudio('session-fixture'), /Listen to the complete/)
  audio.onended()
  assert.equal(await playing, 'spoken')
  await h.service.acknowledgeTeacherAudio('session-fixture')
  assert.equal(h.acknowledgements.length, 1)
  assert.deepEqual(JSON.parse(h.acknowledgements[0].options.body), { feedbackReceipt: receipt })
})

test('missing signed receipt cannot start audio or acknowledge a final turn', async () => {
  const h = harness()
  const playing = speak(h)
  h.respond(0, false)
  assert.equal(await playing, 'unavailable')
  assert.equal(h.audios.length, 0)
  await assert.rejects(h.service.acknowledgeTeacherAudio('session-fixture'), /Listen to the complete/)
  assert.equal(h.acknowledgements.length, 0)
})

for (const outcome of ['error', 'abort', 'mute']) test(`${outcome} cannot create heard evidence, including a late ended event`, async () => {
  const h = harness()
  const playing = speak(h)
  h.respond()
  const audio = await ready(h)
  if (outcome === 'error') audio.onerror()
  else if (outcome === 'abort') h.service.stop()
  else audio.muted = true
  audio.onended()
  assert.equal(await playing, 'unavailable')
  await assert.rejects(h.service.acknowledgeTeacherAudio('session-fixture'), /Listen to the complete/)
  assert.equal(h.acknowledgements.length, 0)
})

test('delayed A audio cannot play in B login; B never inherits replay, cache or receipts', async () => {
  const h = harness()
  const playing = speak(h)
  h.setToken('fixture-B')
  h.respond()
  assert.equal(await playing, 'unavailable')
  assert.equal(h.audios.length, 0)
  h.service.resetForSession('fixture-B')
  assert.equal(await h.service.replay(), 'unavailable')
  assert.equal(h.service.audioCache.size, 0)
  assert.equal(h.service.playedTurns.size, 0)
  assert.equal(h.service.teacherReceipts.size, 0)
  await assert.rejects(h.service.acknowledgeTeacherAudio('session-fixture'), /Listen to the complete/)
})

test('switching accounts during playback stops the teacher and rejects old ended evidence', async () => {
  const h = harness()
  const playing = speak(h)
  h.respond()
  const audio = await ready(h)
  h.setToken('fixture-B')
  h.service.resetForSession('fixture-B')
  assert.equal(audio.paused, true)
  audio.onended()
  assert.equal(await playing, 'unavailable')
  assert.equal(h.service.teacherReceipts.size, 0)
})
