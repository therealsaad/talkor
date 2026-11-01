/* Run without credentials/network: node --test backend/tests/turn-speed.node.test.cjs */
const { test } = require('node:test')
const assert = require('node:assert/strict')
const { loadTS } = require('./helpers/load-ts.cjs')

const { withDeadline, resolveDeadlineMs, DEFAULT_QWEN_DEADLINE_MS } = loadTS('services/turn-deadline.ts')
const { createFixedLineCache } = loadTS('services/fixed-line-cache.ts')
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

test('a fast collaborator wins and is not replaced by the fallback', async () => {
  const result = await withDeadline(async () => 'qwen reply', 200, () => 'canned')
  assert.equal(result.value, 'qwen reply')
  assert.equal(result.source, 'work')
})

test('a slow collaborator is cut off at the deadline, aborted, and the canned line is used', async () => {
  let aborted = false
  const started = Date.now()
  const result = await withDeadline((signal) => new Promise((resolve) => {
    signal.addEventListener('abort', () => { aborted = true })
    setTimeout(() => resolve('too late'), 800)
  }), 60, () => 'canned')
  assert.equal(result.value, 'canned')
  assert.equal(result.source, 'timeout')
  assert.ok(Date.now() - started < 400, 'must not wait for the slow work')
  assert.equal(aborted, true)
})

test('a collaborator that throws also yields the canned line', async () => {
  const result = await withDeadline(async () => { throw new Error('502') }, 200, () => 'canned')
  assert.equal(result.value, 'canned')
  assert.equal(result.source, 'error')
})

test('deadline config is clamped and falls back safely', () => {
  assert.equal(DEFAULT_QWEN_DEADLINE_MS, 1500)
  assert.equal(resolveDeadlineMs(undefined), 1500)
  assert.equal(resolveDeadlineMs('abc'), 1500)
  assert.equal(resolveDeadlineMs('10'), 500)
  assert.equal(resolveDeadlineMs('60000'), 5000)
  assert.equal(resolveDeadlineMs('2000'), 2000)
})

test('fixed-line cache: hit, miss and TTL expiry', async () => {
  let clock = 1000
  const cache = createFixedLineCache({ ttlMs: 100, now: () => clock })
  assert.equal(cache.peek('a'), undefined)
  cache.set('a', 'audio-a')
  assert.equal(cache.peek('a'), 'audio-a')
  clock += 101
  assert.equal(cache.peek('a'), undefined)
})

test('fixed-line cache evicts the least recently used entry', () => {
  const cache = createFixedLineCache({ maxItems: 2 })
  cache.set('a', 1); cache.set('b', 2)
  cache.peek('a') // a is now the most recently used
  cache.set('c', 3)
  assert.equal(cache.peek('b'), undefined)
  assert.equal(cache.peek('a'), 1)
  assert.equal(cache.peek('c'), 3)
})

test('concurrent requests for one line share a single synthesis call', async () => {
  const cache = createFixedLineCache()
  let calls = 0
  const create = async () => { calls += 1; await sleep(20); return 'mp3' }
  const results = await Promise.all([cache.getOrCreate('k', create), cache.getOrCreate('k', create), cache.getOrCreate('k', create)])
  assert.deepEqual(results, ['mp3', 'mp3', 'mp3'])
  assert.equal(calls, 1)
  assert.equal(await cache.getOrCreate('k', create), 'mp3')
  assert.equal(calls, 1)
})

test('a failed or empty synthesis is never cached, so the next request retries', async () => {
  const cache = createFixedLineCache()
  let calls = 0
  assert.equal(await cache.getOrCreate('k', async () => { calls += 1; throw new Error('azure down') }), null)
  assert.equal(await cache.getOrCreate('k', async () => { calls += 1; return null }), null)
  assert.equal(cache.size(), 0)
  assert.equal(await cache.getOrCreate('k', async () => { calls += 1; return 'ok' }), 'ok')
  assert.equal(calls, 3)
})
