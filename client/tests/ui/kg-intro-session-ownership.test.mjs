import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import vm from 'node:vm'
import { test } from 'node:test'
import ts from 'typescript'

const source = await readFile(
  new URL('../../features/lessons/grades/kg/level-01/services/kg-alphabet-service.ts', import.meta.url),
  'utf8',
)
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText

function makeHarness() {
  let token = 'student-token-A'
  const starts = []
  const requests = []
  const apiClient = (path) => {
    requests.push({ path, token })
    if (path === '/kg-alphabet/intro/start') {
      let resolve
      const promise = new Promise((finish) => { resolve = finish })
      starts.push({ resolve, token })
      return promise
    }
    return Promise.resolve({ success: true })
  }
  const exports = {}
  const context = {
    exports,
    module: { exports },
    require: (id) => {
      if (id === '@/lib/api-client') {
        return { apiClient, apiClientBlob: async () => new Blob(), getStoredToken: () => token }
      }
      if (id === './kg-request') return { kgRequest: (fn) => fn() }
      throw new Error('Unexpected module import: ' + id)
    },
    URL,
    DOMException,
    setTimeout,
    clearTimeout,
    console,
  }
  vm.runInNewContext(compiled, context, { filename: 'kg-alphabet-service.js' })
  return {
    service: exports.kgAlphabetService,
    starts,
    requests,
    setToken: (next) => { token = next },
  }
}

test('simultaneous intro starts for one student share the same backend request', async () => {
  const h = makeHarness()
  const first = h.service.beginIntro()
  const second = h.service.beginIntro()
  assert.equal(h.starts.length, 1)
  h.starts[0].resolve({ playbackId: 'ticket-A' })
  await Promise.all([first, second])
  assert.equal(h.service.hasIntroTicket(), true)
})

test('late response from student A cannot replace the pending ticket of student B', async () => {
  const h = makeHarness()
  const first = h.service.beginIntro()
  h.setToken('student-token-B')
  const second = h.service.beginIntro()
  assert.equal(h.starts.length, 2)
  h.starts[0].resolve({ playbackId: 'ticket-A' })
  await first
  assert.equal(h.service.hasIntroTicket(), false)
  h.starts[1].resolve({ playbackId: 'ticket-B' })
  await second
  assert.equal(h.service.hasIntroTicket(), true)
  h.setToken('student-token-A')
  assert.equal(h.service.hasIntroTicket(), false)
  assert.throws(() => h.service.introSeen(), /Start the full story first/)
  assert.equal(h.requests.filter((r) => r.path === '/kg-alphabet/intro-seen').length, 0)
})

test('completed ticket is invalidated when a shared computer changes login', async () => {
  const h = makeHarness()
  const initial = h.service.beginIntro()
  h.starts[0].resolve({ playbackId: 'ticket-A' })
  await initial
  assert.equal(h.service.hasIntroTicket(), true)
  h.setToken('student-token-B')
  assert.equal(h.service.hasIntroTicket(), false)
  assert.throws(() => h.service.introSeen(), /Start the full story first/)
  assert.throws(() => h.service.acknowledgeFeedback('submission-A'), /intro ticket missing or belongs to another login/)
  assert.equal(h.requests.some((r) => r.path.includes('feedback-played')), false)
})
