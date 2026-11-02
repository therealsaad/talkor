/* Run without credentials/network: node --test backend/tests/kg-feedback-audio.node.test.cjs */
const { test, beforeEach } = require('node:test')
const assert = require('node:assert/strict')
const { loadTS } = require('./helpers/load-ts.cjs')

const feedbackModule = loadTS('services/kg-feedback.service.ts', {
  '../config/env': { env: { groqApiKey: '', conversationGroqModel: 'test' } },
  './kg-teaching-hint': loadTS('services/kg-teaching-hint.ts'),
})
const { safeKGFeedback } = feedbackModule
const { KGFeedbackAudioService, isFixedFeedbackLine, feedbackCacheKey } = loadTS('services/kg-feedback-audio.service.ts', {
  '../providers/voice/AzureVoiceProvider': { AzureVoiceProvider: class {} },
  './fixed-line-cache': loadTS('services/fixed-line-cache.ts'),
  './kg-feedback.service': feedbackModule,
})

const AUDIO = Buffer.alloc(512, 7)

function fakeProvider({ delayMs = 0, fail = false } = {}) {
  const calls = []
  return {
    calls,
    async synthesizeUncached(text, options) {
      calls.push({ text, options })
      if (delayMs) await new Promise((resolve) => setTimeout(resolve, delayMs))
      if (fail) throw new Error('azure down')
      return { audio: AUDIO, contentType: 'audio/mpeg' }
    },
  }
}

// A child answered "billi" (a Hindi translation) to the cat card.
const billiTurn = { letter: 'C', mode: 'speak', outcome: 'supported', languageCode: 'hi-IN' }
const billiText = () => safeKGFeedback(billiTurn)

beforeEach(() => KGFeedbackAudioService.clearCacheForTests())

test('the saved "billi" sentence is recognised as a fixed line, Qwen text is not', () => {
  assert.equal(isFixedFeedbackLine(billiText(), billiTurn), true)
  assert.equal(isFixedFeedbackLine('Nice try! Cats say meow. Can you say cat for me?', billiTurn), false)
  // A sentence for a different outcome or language is not this turn's fixed line.
  assert.equal(isFixedFeedbackLine(safeKGFeedback({ ...billiTurn, outcome: 'correct' }), billiTurn), false)
  assert.equal(isFixedFeedbackLine(safeKGFeedback({ ...billiTurn, languageCode: 'mr-IN' }), billiTurn), false)
})

test('the first request speaks the line with the same call shape as before, then it is cached', async () => {
  const provider = fakeProvider()
  const first = await KGFeedbackAudioService.synthesize(billiText(), billiTurn, provider)
  assert.equal(first.source, 'azure')
  assert.equal(provider.calls.length, 1)
  assert.deepEqual(provider.calls[0], { text: billiText(), options: { language: 'hi-IN' } })

  const startedAt = Date.now()
  const second = await KGFeedbackAudioService.synthesize(billiText(), billiTurn, provider)
  assert.equal(second.source, 'cache')
  assert.equal(provider.calls.length, 1, 'a cache hit must not call Azure')
  assert.ok(Date.now() - startedAt < 20, 'a cache hit must be effectively instant')
})

test('an English line is spoken without a language option, exactly like the old route', async () => {
  const provider = fakeProvider()
  const turn = { letter: 'A', mode: 'speak', outcome: 'correct' }
  await KGFeedbackAudioService.synthesize(safeKGFeedback(turn), turn, provider)
  assert.equal(provider.calls[0].options, undefined)
})

test('a Qwen sentence is spoken each time and never cached', async () => {
  const provider = fakeProvider()
  const qwen = 'Nice try! Cats say meow. Can you say cat for me?'
  await KGFeedbackAudioService.synthesize(qwen, billiTurn, provider)
  await KGFeedbackAudioService.synthesize(qwen, billiTurn, provider)
  assert.equal(provider.calls.length, 2)
  assert.equal(KGFeedbackAudioService.cacheSize(), 0)
})

test('the language hint is part of the cache key, so Hindi and Marathi audio never mix', async () => {
  assert.notEqual(feedbackCacheKey('x', 'hi-IN'), feedbackCacheKey('x', 'mr-IN'))
  assert.notEqual(feedbackCacheKey('x', undefined), feedbackCacheKey('x', 'en-IN'))
  const provider = fakeProvider()
  const hi = { letter: 'D', mode: 'speak', outcome: 'correct', languageCode: 'hi-IN' }
  const mr = { letter: 'D', mode: 'speak', outcome: 'correct', languageCode: 'mr-IN' }
  await KGFeedbackAudioService.synthesize(safeKGFeedback(hi), hi, provider)
  await KGFeedbackAudioService.synthesize(safeKGFeedback(mr), mr, provider)
  assert.equal(provider.calls.length, 2)
})

test('concurrent children asking for one new line share a single Azure request', async () => {
  const provider = fakeProvider({ delayMs: 25 })
  await Promise.all(Array.from({ length: 6 }, () => KGFeedbackAudioService.synthesize(billiText(), billiTurn, provider)))
  assert.equal(provider.calls.length, 1)
})

test('when Azure fails the service returns null so the controller can use Priya, and nothing is cached', async () => {
  const provider = fakeProvider({ fail: true })
  assert.equal(await KGFeedbackAudioService.synthesize(billiText(), billiTurn, provider), null)
  assert.equal(await KGFeedbackAudioService.synthesize('Some Qwen sentence about a cat.', billiTurn, provider), null)
  assert.equal(KGFeedbackAudioService.cacheSize(), 0)
})

test('warm starts a fixed line without waiting, and the later audio request shares that call', async () => {
  const provider = fakeProvider({ delayMs: 40 })
  const startedAt = Date.now()
  KGFeedbackAudioService.warm(billiText(), billiTurn, provider)
  assert.ok(Date.now() - startedAt < 10, 'warm must not wait for Azure')
  const result = await KGFeedbackAudioService.synthesize(billiText(), billiTurn, provider)
  assert.ok(result.audio.length > 0)
  assert.equal(provider.calls.length, 1, 'warm + request must share one Azure call')
  assert.equal((await KGFeedbackAudioService.synthesize(billiText(), billiTurn, provider)).source, 'cache')
})

test('warm ignores Qwen text and never throws when the provider fails', async () => {
  const provider = fakeProvider({ fail: true })
  KGFeedbackAudioService.warm('Nice try! Cats say meow. Can you say cat?', billiTurn, provider)
  KGFeedbackAudioService.warm(billiText(), billiTurn, provider)
  await new Promise((resolve) => setTimeout(resolve, 20))
  assert.equal(provider.calls.length, 1, 'only the fixed line may be synthesized by warm')
  assert.equal(KGFeedbackAudioService.cacheSize(), 0)
})

test('every fixed line matches its own turn, is de-duplicated, and prewarm turns first requests into hits', async () => {
  const lines = KGFeedbackAudioService.fixedLines()
  assert.ok(lines.length > 20 && lines.length < 200, `unexpected number of fixed lines: ${lines.length}`)
  for (const line of lines) assert.equal(isFixedFeedbackLine(line.text, line.turn), true, line.text)
  const keys = lines.map((line) => feedbackCacheKey(line.text, line.turn.languageCode))
  assert.equal(new Set(keys).size, lines.length)

  const provider = fakeProvider()
  const { warmed, failed } = await KGFeedbackAudioService.prewarm({ concurrency: 3, provider })
  assert.deepEqual({ warmed, failed }, { warmed: lines.length, failed: 0 })
  const before = provider.calls.length
  assert.equal((await KGFeedbackAudioService.synthesize(billiText(), billiTurn, provider)).source, 'cache')
  assert.equal(provider.calls.length, before)
})

test('prewarm reports failures instead of throwing and leaves lines uncached for a later retry', async () => {
  const { warmed, failed } = await KGFeedbackAudioService.prewarm({ concurrency: 2, provider: fakeProvider({ fail: true }) })
  assert.equal(warmed, 0)
  assert.ok(failed > 0)
  assert.equal(KGFeedbackAudioService.cacheSize(), 0)
})
