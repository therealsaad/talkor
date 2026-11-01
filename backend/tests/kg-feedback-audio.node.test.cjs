/* Run without credentials/network: node --test backend/tests/kg-feedback-audio.node.test.cjs */
const { test, beforeEach } = require('node:test')
const assert = require('node:assert/strict')
const { loadTS } = require('./helpers/load-ts.cjs')

const feedbackModule = loadTS('kg/kg-bilingual-feedback.ts')
const { KGFeedbackAudioService, matchGuidedSegments, segmentsCacheKey } = loadTS('services/kg-feedback-audio.service.ts', {
  '../providers/voice/AzureVoiceProvider': { AzureVoiceProvider: class {} },
  './fixed-line-cache': loadTS('services/fixed-line-cache.ts'),
  '../kg/kg-bilingual-feedback': feedbackModule,
})
const { guidedFeedbackSegments, segmentsToText } = feedbackModule

const AUDIO = Buffer.alloc(512, 7)

function fakeProvider({ delayMs = 0, failSegments = false } = {}) {
  const calls = { single: [], multi: [] }
  return {
    calls,
    async synthesizeUncached(text, options) {
      calls.single.push({ text, options })
      if (delayMs) await new Promise((resolve) => setTimeout(resolve, delayMs))
      return { audio: AUDIO, contentType: 'audio/mpeg' }
    },
    async synthesizeSegmentsUncached(segments) {
      calls.multi.push(segments)
      if (delayMs) await new Promise((resolve) => setTimeout(resolve, delayMs))
      if (failSegments) throw new Error('azure down')
      return { audio: AUDIO, contentType: 'audio/mpeg' }
    },
  }
}

const billiTurn = { letter: 'C', mode: 'speak', outcome: 'supported', languageCode: 'hi-IN' }
const billiText = () => segmentsToText(guidedFeedbackSegments(billiTurn))

beforeEach(() => KGFeedbackAudioService.clearCacheForTests())

test('the "billi" reply is recognised as a reviewed line and spoken with one multi-voice request', async () => {
  const provider = fakeProvider()
  const result = await KGFeedbackAudioService.synthesize(billiText(), billiTurn, provider)
  assert.equal(result.multiVoice, true)
  assert.equal(result.source, 'azure')
  assert.equal(provider.calls.multi.length, 1)
  assert.equal(provider.calls.single.length, 0)
  const locales = provider.calls.multi[0].map((segment) => segment.locale)
  assert.ok(locales.includes('hi-IN') && locales.includes('en-IN'), `expected both voices, got ${locales}`)
})

test('the second child who needs the same line gets audio from memory with no Azure call', async () => {
  const provider = fakeProvider()
  await KGFeedbackAudioService.synthesize(billiText(), billiTurn, provider)
  const startedAt = Date.now()
  const again = await KGFeedbackAudioService.synthesize(billiText(), billiTurn, provider)
  assert.equal(again.source, 'cache')
  assert.equal(provider.calls.multi.length, 1)
  assert.ok(Date.now() - startedAt < 20, 'a cache hit must be effectively instant')
})

test('a Qwen sentence is spoken once, never cached and never treated as a reviewed line', async () => {
  const provider = fakeProvider()
  const qwen = 'Nice try! Cats say meow. Can you say cat for me?'
  assert.equal(matchGuidedSegments(qwen, billiTurn), null)
  await KGFeedbackAudioService.synthesize(qwen, billiTurn, provider)
  await KGFeedbackAudioService.synthesize(qwen, billiTurn, provider)
  assert.equal(provider.calls.single.length, 2, 'personalised text must be synthesized each time')
  assert.deepEqual(provider.calls.single[0].options, { language: 'hi-IN' })
  assert.equal(KGFeedbackAudioService.cacheSize(), 0)
})

test('replay finds the reviewed line even when smoothing chose another language than the attempt detected', () => {
  // The attempt stored languageCode undefined (nothing detected), but the child's last
  // detection was Marathi, so the saved sentence is the Marathi one.
  const saved = segmentsToText(guidedFeedbackSegments({ letter: 'D', mode: 'speak', outcome: 'unclear', noSpeech: true, languageCode: 'mr-IN' }))
  const matched = matchGuidedSegments(saved, { letter: 'D', mode: 'speak', outcome: 'unclear', noSpeech: true, languageCode: undefined })
  assert.ok(matched, 'saved Marathi silence line must be re-derived')
  assert.ok(matched.some((segment) => segment.locale === 'mr-IN'))
})

test('a single-language English line uses the plain single-voice path', async () => {
  const provider = fakeProvider()
  const turn = { letter: 'A', mode: 'speak', outcome: 'correct' }
  const text = segmentsToText(guidedFeedbackSegments(turn))
  const result = await KGFeedbackAudioService.synthesize(text, turn, provider)
  assert.equal(result.multiVoice, false)
  assert.equal(provider.calls.single.length, 1)
  assert.equal(provider.calls.single[0].options, undefined)
  assert.equal(provider.calls.multi.length, 0)
})

test('concurrent children asking for one new line share a single Azure request', async () => {
  const provider = fakeProvider({ delayMs: 25 })
  await Promise.all(Array.from({ length: 6 }, () => KGFeedbackAudioService.synthesize(billiText(), billiTurn, provider)))
  assert.equal(provider.calls.multi.length, 1)
})

test('when Azure fails the service returns null so the controller can use Priya, and nothing is cached', async () => {
  const provider = fakeProvider({ failSegments: true })
  const result = await KGFeedbackAudioService.synthesize(billiText(), billiTurn, provider)
  assert.equal(result, null)
  assert.equal(KGFeedbackAudioService.cacheSize(), 0)
})

test('prewarm covers every reviewed line, then every first turn is a cache hit', async () => {
  const provider = fakeProvider()
  const lines = KGFeedbackAudioService.guidedLines()
  assert.ok(lines.length > 40 && lines.length < 160, `unexpected number of reviewed lines: ${lines.length}`)
  assert.equal(new Set(lines.map(segmentsCacheKey)).size, lines.length, 'lines must be de-duplicated')

  const { warmed, failed } = await KGFeedbackAudioService.prewarm({ concurrency: 3, provider })
  assert.equal(failed, 0)
  assert.equal(warmed, lines.length)

  const before = provider.calls.single.length + provider.calls.multi.length
  const result = await KGFeedbackAudioService.synthesize(billiText(), billiTurn, provider)
  assert.equal(result.source, 'cache')
  assert.equal(provider.calls.single.length + provider.calls.multi.length, before)
})

test('prewarm reports failures instead of throwing and leaves the line uncached for a later retry', async () => {
  const provider = fakeProvider({ failSegments: true })
  const { warmed, failed } = await KGFeedbackAudioService.prewarm({ concurrency: 2, provider })
  assert.ok(failed > 0)
  assert.ok(warmed > 0, 'single-language English lines do not need the multi-voice path')
})
