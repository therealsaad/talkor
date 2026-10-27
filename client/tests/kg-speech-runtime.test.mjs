import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import ts from 'typescript'

async function load(path, dependencies = {}) {
  const source = await readFile(new URL(path, import.meta.url), 'utf8')
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  const exports = {}
  new Function('exports', 'require', compiled)(exports, (name) => {
    if (!(name in dependencies)) throw new Error(`Unexpected import: ${name}`)
    return dependencies[name]
  })
  return exports
}
const { kgRequest } = await load('../features/lessons/grades/kg/level-01/services/kg-request.ts')
const { requestKGMicrophone } = await load('../lib/kg-microphone.ts')
const { watchVoiceActivity } = await load('../lib/voice-activity.ts')
const quickly = { retries: 2, timeoutMs: 50, delayMs: 1 }

test('network retries reuse the submitted payload, while authorization and validation errors are not retried', async () => {
  const bodies = []
  const result = await kgRequest(async () => {
    bodies.push('same-body-and-submission-id')
    if (bodies.length === 1) throw new TypeError('network response lost')
    return 'correct'
  }, undefined, quickly)
  assert.equal(result, 'correct'); assert.equal(bodies.length, 2); assert.equal(new Set(bodies).size, 1)
  for (const status of [400, 401, 403, 409]) {
    let count = 0
    await assert.rejects(kgRequest(async () => { count++; throw { status } }, undefined, quickly))
    assert.equal(count, 1)
  }
  let missingCalls = 0
  await assert.rejects(kgRequest(async () => { missingCalls++; throw { status: 404, code: 'KG_AUDIO_MISSING' } }, undefined, quickly))
  assert.equal(missingCalls, 1)
  let deniedCalls = 0
  await assert.rejects(kgRequest(async () => { deniedCalls++; throw { status: 502, details: { retryable: false } } }, undefined, quickly))
  assert.equal(deniedCalls, 1)
  let transientCalls = 0
  const recovered = await kgRequest(async () => {
    transientCalls++
    if (transientCalls === 1) throw { status: 503, details: { retryable: true } }
    return 'audio'
  }, undefined, { retries: 1, delayMs: 1 })
  assert.equal(recovered, 'audio'); assert.equal(transientCalls, 2)
})

test('a request timeout retries a bounded number of times and navigation cancels immediately', async () => {
  let count = 0
  await assert.rejects(kgRequest((signal) => {
    count++
    return new Promise((resolve, reject) => signal.addEventListener('abort', () => reject(signal.reason), { once: true }))
  }, undefined, { retries: 1, timeoutMs: 5, delayMs: 1 }), { name: 'TimeoutError' })
  assert.equal(count, 2)
  const controller = new AbortController()
  controller.abort()
  await assert.rejects(kgRequest(async () => { throw new Error('must not run') }, controller.signal, quickly), { name: 'AbortError' })
})

test('late microphone permission is released after navigation and denied permission never opens a recorder', async () => {
  const oldNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator')
  const oldRecorder = globalThis.MediaRecorder
  let grant
  let stops = 0
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { mediaDevices: { getUserMedia: () => new Promise((resolve) => { grant = resolve }) } } })
  globalThis.MediaRecorder = class {}
  try {
    const controller = new AbortController()
    const pending = requestKGMicrophone(controller.signal)
    controller.abort()
    await assert.rejects(pending, { name: 'AbortError' })
    grant({ getTracks: () => [{ stop: () => stops++ }] })
    await new Promise((resolve) => setTimeout(resolve, 0))
    assert.equal(stops, 1)
    navigator.mediaDevices.getUserMedia = async () => { throw new DOMException('Denied', 'NotAllowedError') }
    await assert.rejects(requestKGMicrophone(new AbortController().signal), { name: 'NotAllowedError' })
  } finally {
    if (oldNavigator) Object.defineProperty(globalThis, 'navigator', oldNavigator)
    else delete globalThis.navigator
    globalThis.MediaRecorder = oldRecorder
  }
})

test('VAD ends short speech, treats quiet background as silence, and closes the audio graph', async () => {
  const oldWindow = globalThis.window
  let rms = 0.003; let closed = 0; let disconnected = 0
  class Context {
    state = 'running'
    createMediaStreamSource() { return { connect() {}, disconnect() { disconnected++ } } }
    createAnalyser() { return { fftSize: 1024, getFloatTimeDomainData(samples) { samples.fill(rms) } } }
    async close() { closed++ }
  }
  globalThis.window = { AudioContext: Context, setInterval, clearInterval }
  try {
    let heard = 0
    let cleanup
    const noSpeech = new Promise((resolve) => {
      cleanup = watchVoiceActivity({}, resolve, { sampleIntervalMs: 5, noSpeechTimeoutMs: 35, onSpeech: () => heard++ })
    })
    await noSpeech; cleanup(); assert.equal(heard, 0)
    rms = 0.06
    const speech = new Promise((resolve) => {
      cleanup = watchVoiceActivity({}, resolve, { sampleIntervalMs: 5, minimumSpeechMs: 20, silenceMs: 25, onSpeech: () => { heard++; rms = 0.002 } })
    })
    await speech; cleanup()
    assert.equal(heard, 1); assert.equal(closed, 2); assert.equal(disconnected, 2)
  } finally { globalThis.window = oldWindow }
})

test('audio completion resolves playback only, and aborted playback releases its handlers', async () => {
  const oldWindow = globalThis.window
  globalThis.window = { setTimeout, clearTimeout }
  let posts = 0
  const { kgAlphabetService } = await load('../features/lessons/grades/kg/level-01/services/kg-alphabet-service.ts', {
    '@/lib/api-client': { apiClient: async () => { posts++; return {} }, apiClientBlob: async () => new Blob(['test audio'], { type: 'audio/mpeg' }) },
    './kg-request': { kgRequest: (operation, signal, options = {}) => kgRequest(operation, signal, { ...options, timeoutMs: 50, delayMs: 1 }) },
  })
  try {
    const audio = { paused: true, play: async () => { audio.paused = false }, pause: () => { audio.paused = true } }
    const playing = kgAlphabetService.play('say-a', audio)
    await new Promise((resolve) => setTimeout(resolve, 0))
    audio.onended(); await playing
    assert.equal(posts, 0)
    const controller = new AbortController()
    const cancelled = kgAlphabetService.play('say-a', audio, undefined, controller.signal)
    await new Promise((resolve) => setTimeout(resolve, 0))
    controller.abort()
    await assert.rejects(cancelled, { name: 'AbortError' })
    assert.equal(audio.paused, true); assert.equal(audio.onended, null)
    kgAlphabetService.clearAudioCache()
  } finally { globalThis.window = oldWindow }
})

test('audio requests deduplicate in flight, negative-cache missing clips, and retry a retryable TTS outage once', async () => {
  const oldCreate = URL.createObjectURL
  const oldRevoke = URL.revokeObjectURL
  URL.createObjectURL = () => 'blob:kg-test'
  URL.revokeObjectURL = () => {}
  let missingCalls = 0
  let dynamicCalls = 0
  const missing = Object.assign(new Error('missing'), { code: 'KG_AUDIO_MISSING', status: 404 })
  const outage = Object.assign(new Error('Priya unavailable'), { code: 'TTS_SERVICE_UNAVAILABLE', status: 503, details: { retryable: true } })
  const { kgAlphabetService } = await load('../features/lessons/grades/kg/level-01/services/kg-alphabet-service.ts', {
    '@/lib/api-client': {
      apiClient: async () => ({}),
      apiClientBlob: async (key) => {
        if (key.endsWith('/say-a')) { missingCalls++; throw missing }
        dynamicCalls++
        if (dynamicCalls === 1) throw outage
        return new Blob(['live Priya audio'], { type: 'audio/wav' })
      },
    },
    './kg-request': { kgRequest: (operation, signal, options = {}) => kgRequest(operation, signal, { ...options, delayMs: 1, timeoutMs: 50 }) },
  })
  try {
    const first = kgAlphabetService.ensure('say-a')
    const concurrent = kgAlphabetService.ensure('say-a')
    await Promise.all([assert.rejects(first, { code: 'KG_AUDIO_MISSING' }), assert.rejects(concurrent, { code: 'KG_AUDIO_MISSING' })])
    await assert.rejects(kgAlphabetService.ensure('say-a'), { code: 'KG_AUDIO_MISSING' })
    assert.equal(missingCalls, 1)

    await kgAlphabetService.ensure('bridge-c', undefined, 'dynamic_tts')
    assert.equal(dynamicCalls, 2)
  } finally {
    kgAlphabetService.clearAudioCache()
    URL.createObjectURL = oldCreate
    URL.revokeObjectURL = oldRevoke
  }
})
