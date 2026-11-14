import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import ts from 'typescript'

async function load(path, dependencies) {
  const source = await readFile(new URL(path, import.meta.url), 'utf8')
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  const exports = {}
  new Function('exports', 'require', compiled)(exports, (name) => {
    if (!(name in dependencies)) throw new Error(`Unexpected import: ${name}`)
    return dependencies[name]
  })
  return exports
}

function deferred() {
  let resolve
  let reject
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}

const serviceDependencies = {
  '@/lib/lesson-turn-telemetry': {
    lessonTurnTelemetry: { bind() {}, mark() {}, markFor() {} },
    setTelemetrySession() {},
  },
  '@/lib/device-audio-cache': {
    clipKey: (...parts) => parts.join(':'),
    createDeviceAudioCache: () => ({
      get: async () => null, put: async () => false, prune: async () => {}, has: async () => false,
    }),
    shouldSkipBackgroundDownload: () => false,
  },
}

test('concurrent KG state consumers share one request without caching errors', async () => {
  const pendingBySession = [deferred(), deferred()]
  let requests = 0
  let token = 'student-session-a'
  const { kgAlphabetService } = await load(
    '../features/lessons/grades/kg/level-01/services/kg-alphabet-service.ts',
    {
      ...serviceDependencies,
      '@/lib/api-client': {
        apiClient: () => { const request = requests++; return pendingBySession[request].promise },
        apiClientBlob: async () => new Blob(),
        getStoredToken: () => token,
      },
      './kg-request': { kgRequest: (operation) => operation(new AbortController().signal) },
    },
  )

  const first = kgAlphabetService.state()
  const second = kgAlphabetService.state()
  assert.strictEqual(second, first)
  assert.equal(requests, 1)

  token = 'different-student-session'
  const otherSession = kgAlphabetService.state()
  assert.notStrictEqual(otherSession, first)
  assert.equal(requests, 2)

  const state = { currentIndex: 2 }
  const stateA = { currentIndex: 2 }
  const stateB = { currentIndex: 4 }
  pendingBySession[0].resolve(stateA)
  pendingBySession[1].resolve(stateB)
  await assert.rejects(first, /previous login/)
  await assert.rejects(second, /previous login/)
  assert.strictEqual(await otherSession, stateB)

  const failure = new Error('Forbidden')
  let retryRequests = 0
  const { kgAlphabetService: retryService } = await load(
    '../features/lessons/grades/kg/level-01/services/kg-alphabet-service.ts',
    {
      ...serviceDependencies,
      '@/lib/api-client': {
        apiClient: () => {
          retryRequests += 1
          return retryRequests === 1 ? Promise.reject(failure) : Promise.resolve(state)
        },
        apiClientBlob: async () => new Blob(),
        getStoredToken: () => 'student-session',
      },
      './kg-request': { kgRequest: (operation) => operation(new AbortController().signal) },
    },
  )

  await assert.rejects(retryService.state(), failure)
  assert.strictEqual(await retryService.state(), state)
  assert.equal(retryRequests, 2)
})
