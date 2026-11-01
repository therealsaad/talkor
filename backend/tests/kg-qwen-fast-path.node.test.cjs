/* Run without credentials/network: node --test backend/tests/kg-qwen-fast-path.node.test.cjs */
const { test, beforeEach, afterEach } = require('node:test')
const assert = require('node:assert/strict')
const { loadTS } = require('./helpers/load-ts.cjs')

const env = { talkoraServiceKey: '', isProd: false }
const warnings = []
const { KGQwenFeedbackService } = loadTS('services/kg-qwen-feedback.service.ts', {
  '../config/env': { env },
  '../utils/logger': { logger: { warn: (...args) => warnings.push(args) } },
  '../kg/kg-bilingual-feedback': loadTS('kg/kg-bilingual-feedback.ts'),
  './turn-deadline': loadTS('services/turn-deadline.ts'),
})

const realFetch = globalThis.fetch
let fetchCalls
beforeEach(() => { fetchCalls = []; warnings.length = 0; env.isProd = false; env.talkoraServiceKey = ''; delete process.env.KG_QWEN_TIMEOUT_MS })
afterEach(() => { globalThis.fetch = realFetch; delete process.env.KG_QWEN_TIMEOUT_MS })
const qwenReplies = (message, status = 200) => { globalThis.fetch = async (url, init) => { fetchCalls.push({ url, init }); return new Response(JSON.stringify({ message }), { status }) } }

test('rule-handled turns never call Qwen and return reviewed segments instantly', async () => {
  globalThis.fetch = async () => { throw new Error('Qwen must not be called for this turn') }
  const turns = [
    { letter: 'C', mode: 'speak', outcome: 'correct', transcript: 'cat' },
    { letter: 'C', mode: 'speak', outcome: 'supported', transcript: 'billi', languageCode: 'hi-IN' },
    { letter: 'C', mode: 'speak', outcome: 'unclear', noSpeech: true },
    { letter: 'C', mode: 'touch', outcome: 'incorrect', selected: 'dog' },
    { letter: 'C', mode: 'touch', outcome: 'supported', selected: 'cat' },
  ]
  for (const turn of turns) {
    const startedAt = Date.now()
    const result = await KGQwenFeedbackService.compose(turn)
    assert.equal(result.source, 'guided', JSON.stringify(turn))
    assert.ok(result.segments && result.segments.length > 0)
    assert.ok(result.text.length > 0)
    assert.ok(Date.now() - startedAt < 50, 'a rule turn must not wait on I/O')
  }
})

test('"billi" in Hindi answers with Hindi praise and the English word, with no model call', async () => {
  globalThis.fetch = async () => { throw new Error('no network') }
  const result = await KGQwenFeedbackService.compose({ letter: 'C', mode: 'speak', outcome: 'supported', transcript: 'billi', languageCode: 'hi-IN' })
  assert.match(result.text, /बिल्ली/)
  assert.match(result.text, /cat कहते हैं। बोलो, cat!/)
  assert.deepEqual(result.segments.map((s) => s.locale), ['hi-IN', 'en-IN', 'hi-IN', 'en-IN'])
})

test('a wrong spoken word is the case Qwen coaches, and a valid reply is used', async () => {
  qwenReplies('Good try! Listen closely, this one is a cat. Can you say cat with me?')
  const result = await KGQwenFeedbackService.compose({ letter: 'C', mode: 'speak', outcome: 'incorrect', transcript: 'dog' })
  assert.equal(fetchCalls.length, 1)
  assert.equal(result.source, 'qwen-8002')
  assert.match(result.text, /cat/)
  assert.equal(result.segments, undefined)
})

test('Qwen is capped: a stalled model returns the reviewed line near the deadline, not after 7 seconds', async () => {
  process.env.KG_QWEN_TIMEOUT_MS = '500'
  globalThis.fetch = (url, init) => new Promise((_resolve, reject) => {
    fetchCalls.push({ url, init })
    init.signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')))
  })
  const startedAt = Date.now()
  const result = await KGQwenFeedbackService.compose({ letter: 'C', mode: 'speak', outcome: 'incorrect', transcript: 'dog', languageCode: 'hi-IN' })
  const elapsed = Date.now() - startedAt
  assert.ok(elapsed >= 450 && elapsed < 900, `expected ~500ms, got ${elapsed}ms`)
  assert.equal(result.source, 'guided')
  assert.match(result.text, /cat/)
  assert.ok(fetchCalls[0].init.signal.aborted, 'the stalled request must be aborted')
  assert.equal(warnings.length, 1)
})

test('Qwen cannot praise a wrong attempt as correct; the reviewed line is used instead', async () => {
  qwenReplies('Perfect! You got it, exactly right, it is a cat!')
  const result = await KGQwenFeedbackService.compose({ letter: 'C', mode: 'speak', outcome: 'incorrect', transcript: 'dog' })
  assert.equal(result.source, 'guided')
  assert.doesNotMatch(result.text, /perfect|you got it/i)
})

test('a reply that skips the target word, or a Qwen server error, falls back to the reviewed line', async () => {
  qwenReplies('That was a lovely try, let us continue with our lesson together today.')
  assert.equal((await KGQwenFeedbackService.compose({ letter: 'C', mode: 'speak', outcome: 'unclear', transcript: 'um' })).source, 'guided')
  qwenReplies('boom', 502)
  assert.equal((await KGQwenFeedbackService.compose({ letter: 'C', mode: 'speak', outcome: 'unclear', transcript: 'um' })).source, 'guided')
})

test('production without a strong service key never calls Qwen', async () => {
  env.isProd = true
  env.talkoraServiceKey = 'short'
  globalThis.fetch = async () => { throw new Error('no network') }
  const result = await KGQwenFeedbackService.compose({ letter: 'C', mode: 'speak', outcome: 'incorrect', transcript: 'dog' })
  assert.equal(result.source, 'guided')
})

test('Sarvam language is forwarded to Qwen as the explanation language', async () => {
  qwenReplies('Nice try! This is a cat. Say cat with me!')
  await KGQwenFeedbackService.compose({ letter: 'C', mode: 'speak', outcome: 'incorrect', transcript: 'dog', languageCode: 'mr-IN' })
  assert.equal(JSON.parse(fetchCalls[0].init.body).preferredExplanationLanguage, 'Marathi')
})
