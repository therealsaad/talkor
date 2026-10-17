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
const { kgRequest } = await load('../lib/kg-request.ts')
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
  const { kgAlphabetService } = await load('../services/kg-alphabet-service.ts', {
    '@/lib/api-client': { apiClient: async () => { posts++; return {} }, apiClientBlob: async () => new Blob(['test audio'], { type: 'audio/mpeg' }) },
    '@/lib/kg-request': { kgRequest: (operation, signal) => kgRequest(operation, signal, quickly) },
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
