/* Run without credentials/network: node --test backend/tests/kg-bilingual-feedback.node.test.cjs */
const { test } = require('node:test')
const assert = require('node:assert/strict')
const { loadTS } = require('./helpers/load-ts.cjs')

const fb = loadTS('kg/kg-bilingual-feedback.ts')
const text = (segments) => fb.segmentsToText(segments)
const letters = ['A', 'B', 'C', 'D']

test('"billi" (supported speak) in Hindi praises the Hindi word, then models English cat in the English voice', () => {
  const segments = fb.guidedFeedbackSegments({ letter: 'C', mode: 'speak', outcome: 'supported', languageCode: 'hi-IN' })
  assert.deepEqual(segments.map((s) => s.locale), ['hi-IN', 'en-IN', 'hi-IN', 'en-IN'])
  assert.equal(segments[1].text, 'cat')
  assert.equal(segments[3].text, 'cat!')
  assert.match(segments[0].text, /बिल्ली/)
  assert.match(segments[0].text, /अच्छा बेटा/)
})

test('Marathi detection routes the coaching to the Marathi voice and keeps English for the target word', () => {
  const segments = fb.guidedFeedbackSegments({ letter: 'C', mode: 'speak', outcome: 'supported', languageCode: 'mr-IN' })
  assert.deepEqual(segments.map((s) => s.locale), ['mr-IN', 'en-IN', 'mr-IN', 'en-IN'])
  assert.match(segments[0].text, /मांजर/)
  assert.equal(segments[1].text, 'cat')
})

test('with no detected language, the translation line is Hinglish in one English-voice segment', () => {
  const segments = fb.guidedFeedbackSegments({ letter: 'C', mode: 'speak', outcome: 'supported' })
  assert.equal(segments.length, 1)
  assert.equal(segments[0].locale, 'en-IN')
  assert.match(segments[0].text, /Billi!.*English mein hum ise cat kehte hain\. Bolo, cat!/)
})

test('a supported answer never reads as independent English mastery', () => {
  for (const letter of letters) for (const languageCode of [undefined, 'hi-IN', 'mr-IN']) {
    const line = text(fb.guidedFeedbackSegments({ letter, mode: 'speak', outcome: 'supported', languageCode }))
    assert.ok(line.includes(fb.englishWordFor(letter)), `${letter}/${languageCode} must model the English word`)
    assert.doesNotMatch(line, /you got it|exactly right|correct answer|perfect|well done/i)
  }
})

test('every outcome, mode and language produces non-empty segments that include the English target word', () => {
  for (const letter of letters) for (const mode of ['speak', 'touch'])
    for (const outcome of ['correct', 'incorrect', 'unclear', 'supported'])
      for (const noSpeech of [false, true]) for (const languageCode of [undefined, 'en-IN', 'hi-IN', 'mr-IN']) {
        const segments = fb.guidedFeedbackSegments({ letter, mode, outcome, noSpeech, languageCode })
        assert.ok(segments.length > 0)
        assert.ok(segments.every((s) => s.text.trim().length > 0))
        const joined = text(segments).toLowerCase()
        assert.ok(joined.includes(fb.englishWordFor(letter)) || outcome === 'correct',
          `missing target word for ${letter}/${mode}/${outcome}/${noSpeech}/${languageCode}: ${joined}`)
      }
})

test('correct and silence stay deterministic; only a failed spoken attempt asks Qwen', () => {
  const ask = (mode, outcome, noSpeech = false) => fb.needsQwenCoaching({ mode, outcome, noSpeech })
  assert.equal(ask('speak', 'correct'), false)
  assert.equal(ask('speak', 'supported'), false)
  assert.equal(ask('speak', 'unclear', true), false)
  assert.equal(ask('touch', 'incorrect'), false)
  assert.equal(ask('speak', 'incorrect'), true)
  assert.equal(ask('speak', 'unclear'), true)
})

test('adjacent segments in the same voice merge so the voice only changes when the language does', () => {
  const merged = fb.mergeAdjacentSegments([
    { text: 'a', locale: 'hi-IN' }, { text: ' b ', locale: 'hi-IN' }, { text: '', locale: 'en-IN' }, { text: 'c', locale: 'en-IN' },
  ])
  assert.deepEqual(merged, [{ text: 'a b', locale: 'hi-IN' }, { text: 'c', locale: 'en-IN' }])
})

test('language falls back to the last known one only when this attempt has none', () => {
  assert.equal(fb.resolveFeedbackLanguage('en-IN', 'hi-IN'), 'en-IN')
  assert.equal(fb.resolveFeedbackLanguage(undefined, 'hi-IN'), 'hi-IN')
  assert.equal(fb.resolveFeedbackLanguage(undefined, undefined), undefined)
})
