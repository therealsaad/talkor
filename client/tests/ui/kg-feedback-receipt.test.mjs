import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import vm from 'node:vm'
import ts from 'typescript'

const source = await readFile(
  new URL('../../features/lessons/grades/kg/level-01/services/kg-alphabet-service.ts', import.meta.url),
  'utf8',
)
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText

function harness() {
  let token = 'student-A'
  let ticketNumber = 0
  const posts = []
  const fetches = []
  const receipts = ['v1.1793534400.' + 'a'.repeat(32) + '.' + 'b'.repeat(64),
    'v1.1793534400.' + 'c'.repeat(32) + '.' + 'd'.repeat(64)]
  let urlNumber = 0
  const apiClient = (path, options = {}) => {
    posts.push({ path, options, token })
    if (path === '/kg-alphabet/intro/start') {
      ticketNumber += 1
      return Promise.resolve({ playbackId: 'ticket-' + ticketNumber })
    }
    return Promise.resolve({ state: { currentIndex: 1 } })
  }
  const apiClientBlob = async (path, options, onHeaders) => {
    const receipt = receipts[Math.min(fetches.length, receipts.length - 1)]
    fetches.push({ path, token, receipt })
    onHeaders?.(new Headers({ 'X-KG-Feedback-Receipt': receipt }))
    return new Blob(['ID3 simulated audio'], { type: 'audio/mpeg' })
  }
  const exports = {}
  const context = {
    exports, module: { exports }, console, setTimeout, clearTimeout, DOMException, Blob, Headers,
    URL: { createObjectURL: () => 'blob:kg-' + ++urlNumber, revokeObjectURL: () => undefined },
    window: { setTimeout },
    require: (id) => {
      if (id === '@/lib/api-client') return { apiClient, apiClientBlob, getStoredToken: () => token }
      if (id === './kg-request') return { kgRequest: (fn) => fn() }
      throw new Error('Unexpected dependency: ' + id)
    },
  }
  vm.runInNewContext(compiled, context, { filename: 'kg-alphabet-service.js' })
  const audio = {
    onended: null, onerror: null, src: '', currentTime: 0,
    pause: () => undefined, play: () => Promise.resolve(),
  }
  return { service: exports.kgAlphabetService, audio, posts, fetches, setToken: (value) => { token = value } }
}

async function waitForPlayback(audio) {
  for (let i = 0; i < 30 && typeof audio.onended !== 'function'; i += 1) {
    await new Promise((resolve) => setImmediate(resolve))
  }
  assert.equal(typeof audio.onended, 'function', 'audio should be ready for real playback')
}

test('KG ACK is impossible before audio.onended, then includes the generated receipt', async () => {
  const h = harness()
  await h.service.beginIntro()
  const pending = h.service.playAttemptFeedback('say-a-abc123456789', h.audio)
  await waitForPlayback(h.audio)
  assert.throws(() => h.service.acknowledgeFeedback('say-a-abc123456789'), /Listen to Miss Julie/)
  assert.equal(h.posts.filter((p) => p.path.includes('feedback-played')).length, 0)
  h.audio.onended()
  await pending
  await h.service.acknowledgeFeedback('say-a-abc123456789')
  const ack = h.posts.find((p) => p.path.includes('feedback-played'))
  assert.ok(ack)
  assert.equal(ack.options.headers['X-KG-Intro-Playback'], 'ticket-1')
  assert.deepEqual(JSON.parse(ack.options.body), { feedbackReceipt: h.fetches[0].receipt })
})

test('a changed lab login cannot ACK a prior student playback or reuse its cached audio', async () => {
  const h = harness()
  await h.service.beginIntro()
  const oldPlayback = h.service.playAttemptFeedback('say-a-abc123456789', h.audio)
  await waitForPlayback(h.audio)
  h.setToken('student-B')
  h.audio.onended()
  await assert.rejects(oldPlayback, /Student session changed/)
  assert.throws(() => h.service.acknowledgeFeedback('say-a-abc123456789'), /intro ticket missing/)
  await h.service.beginIntro()
  const newPlayback = h.service.playAttemptFeedback('say-a-abc123456789', h.audio)
  await waitForPlayback(h.audio)
  h.audio.onended()
  await newPlayback
  await h.service.acknowledgeFeedback('say-a-abc123456789')
  assert.equal(h.fetches.length, 2)
  assert.deepEqual(h.fetches.map((f) => f.token), ['student-A', 'student-B'])
  assert.equal(h.posts.findLast((p) => p.path.includes('feedback-played')).token, 'student-B')
})

test('a failed audio.onended path cannot mint a client ACK', async () => {
  const h = harness()
  await h.service.beginIntro()
  const failed = h.service.playAttemptFeedback('say-a-abc123456789', h.audio)
  await waitForPlayback(h.audio)
  h.audio.onerror()
  await assert.rejects(failed, /audio could not play/)
  assert.throws(() => h.service.acknowledgeFeedback('say-a-abc123456789'), /Listen to Miss Julie/)
})
