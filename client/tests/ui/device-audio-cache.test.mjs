import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import vm from 'node:vm'
import { test } from 'node:test'
import ts from 'typescript'

async function load(path, extra = {}) {
  const source = await readFile(new URL(path, import.meta.url), 'utf8')
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText
  const exports = {}
  vm.runInNewContext(compiled, { exports, Math, Number, Boolean, Set, encodeURIComponent, ...extra }, { filename: path })
  return exports
}

// Minimal Response/Blob stand-ins: enough for the cache logic without a browser.
class FakeBlob { constructor(size, type) { this.size = size; this.type = type } }
class FakeResponse { constructor(blob) { this.blob_ = blob } async blob() { return this.blob_ } }
const fakeStorage = () => {
  const store = new Map()
  const cache = {
    match: async (url) => store.has(url) ? new FakeResponse(store.get(url)) : undefined,
    put: async (url, response) => { store.set(url, response.blob_) },
    delete: async (url) => store.delete(url),
    keys: async () => [...store.keys()].map((url) => ({ url })),
  }
  return { store, storage: { open: async () => cache } }
}

const mod = await load('../../lib/device-audio-cache.ts', { Response: FakeResponse })
const { createDeviceAudioCache, clipKey, textHash, isCacheableClip, shouldSkipBackgroundDownload } = mod
const clip = () => new FakeBlob(4000, 'audio/mpeg')

test('the key changes with the audio version, the id and the exact text', () => {
  const base = clipKey('v1', 'say-c', 'Say cat!')
  assert.notEqual(base, clipKey('v2', 'say-c', 'Say cat!'))
  assert.notEqual(base, clipKey('v1', 'say-d', 'Say cat!'))
  assert.notEqual(base, clipKey('v1', 'say-c', 'Say cat.'))
  assert.equal(base, clipKey('v1', 'say-c', 'Say cat!'))
  assert.equal(textHash('abc'), textHash('abc'))
})

test('a stored clip comes back and an unknown one does not', async () => {
  const { storage } = fakeStorage()
  const cache = createDeviceAudioCache(() => storage)
  assert.equal(await cache.get('k1'), null)
  assert.equal(await cache.put('k1', clip()), true)
  assert.equal((await cache.get('k1')).size, 4000)
  assert.equal(await cache.has('k1'), true)
  assert.equal(await cache.has('k2'), false)
})

test('only real audio of a sensible size is stored', async () => {
  const { storage, store } = fakeStorage()
  const cache = createDeviceAudioCache(() => storage)
  assert.equal(isCacheableClip(new FakeBlob(100, 'audio/mpeg')), false, 'too small (an error body)')
  assert.equal(isCacheableClip(new FakeBlob(3 * 1024 * 1024, 'audio/mpeg')), false, 'too large')
  assert.equal(isCacheableClip(new FakeBlob(4000, 'application/json')), false, 'not audio')
  assert.equal(await cache.put('bad', new FakeBlob(4000, 'text/html')), false)
  assert.equal(store.size, 0)
})

test('prune removes clips that are no longer in the lesson, and only those', async () => {
  const { storage } = fakeStorage()
  const cache = createDeviceAudioCache(() => storage)
  for (const key of ['v1/a/1', 'v1/b/2', 'v0/old/3']) await cache.put(key, clip())
  assert.equal(await cache.prune(new Set(['v1/a/1', 'v1/b/2'])), 1)
  assert.equal(await cache.has('v0/old/3'), false)
  assert.equal(await cache.has('v1/a/1'), true)
})

test('it never throws: no storage, a failing storage, a failing read', async () => {
  const none = createDeviceAudioCache(() => undefined)
  assert.equal(await none.get('k'), null)
  assert.equal(await none.put('k', clip()), false)
  assert.equal(await none.prune(new Set()), 0)
  const broken = createDeviceAudioCache(() => ({ open: async () => { throw new Error('private window') } }))
  assert.equal(await broken.get('k'), null)
  assert.equal(await broken.put('k', clip()), false)
  assert.equal(await broken.has('k'), false)
  const bad = createDeviceAudioCache(() => ({ open: async () => ({
    match: async () => { throw new Error('boom') }, put: async () => { throw new Error('full') },
    delete: async () => false, keys: async () => { throw new Error('boom') } }) }))
  assert.equal(await bad.get('k'), null)
  assert.equal(await bad.put('k', clip()), false)
  assert.equal(await bad.prune(new Set()), 0)
})

test('background downloads are skipped on data saver and 2G only', () => {
  assert.equal(shouldSkipBackgroundDownload(undefined), false)
  assert.equal(shouldSkipBackgroundDownload({ saveData: true }), true)
  assert.equal(shouldSkipBackgroundDownload({ effectiveType: '2g' }), true)
  assert.equal(shouldSkipBackgroundDownload({ effectiveType: 'slow-2g' }), true)
  assert.equal(shouldSkipBackgroundDownload({ effectiveType: '3g' }), false)
  assert.equal(shouldSkipBackgroundDownload({ effectiveType: '4g', saveData: false }), false)
})

test('wiring: only fixed curriculum audio is device-cached, never feedback or receipts, and the lesson preloads once', async () => {
  const service = await readFile(new URL('../../features/lessons/grades/kg/level-01/services/kg-alphabet-service.ts', import.meta.url), 'utf8')
  assert.match(service, /if \(line\.kind !== 'curriculum_static'\) continue/)
  assert.match(service, /const deviceKey = !onReceipt && kind === 'curriculum_static' \? manifest\?\.clips\.get\(key\)\?\.key : undefined/)
  assert.match(service, /clipKey\(state\.audioVersion, id, line\.text\)/)
  assert.match(service, /rememberManifest\(state\)/)
  const lesson = await readFile(new URL('../../features/lessons/grades/kg/level-01/LevelExperience.tsx', import.meta.url), 'utf8')
  assert.match(lesson, /!preview && stepIndex === 0 && \(!preloadRef\.current \|\| preloadRef\.current\.signal\.aborted\)/)
  assert.match(lesson, /preloadRef\.current\?\.abort\(\)/)
})
