/* Run without credentials/network: node --test backend/tests/multi-voice-ssml.node.test.cjs */
const { test } = require('node:test')
const assert = require('node:assert/strict')
const { loadTS } = require('./helpers/load-ts.cjs')

const ssml = loadTS('providers/voice/multi-voice-ssml.ts')
const voices = ssml.resolveSsmlVoices({})
const opts = { voices, rate: '+5%', pitch: '+6%' }

test('one document, one voice element per language switch, in spoken order', () => {
  const xml = ssml.buildMultiVoiceSsml([
    { text: 'अच्छा बेटा! बिल्ली!', locale: 'hi-IN' },
    { text: 'cat', locale: 'en-IN' },
    { text: 'कहते हैं।', locale: 'hi-IN' },
  ], opts)
  assert.equal((xml.match(/<speak /g) || []).length, 1)
  const names = [...xml.matchAll(/<voice name="([^"]+)"/g)].map((m) => m[1])
  assert.deepEqual(names, ['hi-IN-SwaraNeural', 'en-IN-NeerjaNeural', 'hi-IN-SwaraNeural'])
  assert.ok(xml.indexOf('अच्छा') < xml.indexOf('>cat<') && xml.indexOf('>cat<') < xml.indexOf('कहते'))
  assert.match(xml, /xml:lang="hi-IN"/)
})

test('Marathi segments use the Marathi voice', () => {
  const xml = ssml.buildMultiVoiceSsml([{ text: 'छान बेटा!', locale: 'mr-IN' }, { text: 'cat!', locale: 'en-IN' }], opts)
  assert.match(xml, /mr-IN-AarohiNeural/)
})

test('deployment env can override voices without touching code', () => {
  const custom = ssml.resolveSsmlVoices({ AZURE_SPEECH_VOICE: 'en-IN-AartiNeural', AZURE_HI_SPEECH_VOICE: ' hi-IN-AnanyaNeural ' })
  assert.equal(custom['en-IN'], 'en-IN-AartiNeural')
  assert.equal(custom['hi-IN'], 'hi-IN-AnanyaNeural')
  assert.equal(custom['mr-IN'], 'mr-IN-AarohiNeural')
})

test('text is XML-escaped so a segment cannot inject SSML', () => {
  const xml = ssml.buildMultiVoiceSsml([{ text: `</prosody></voice><voice name="evil">x & "y" <b>`, locale: 'en-IN' }], opts)
  assert.equal((xml.match(/<voice /g) || []).length, 1)
  assert.ok(!xml.includes('name="evil"'), 'an injected voice element must not survive escaping')
  assert.match(xml, /&lt;\/prosody&gt;&lt;\/voice&gt;/)
  assert.match(xml, /x &amp; &quot;y&quot; &lt;b&gt;/)
})

test('rejects empty input, empty segments, unsafe prosody and over-long text', () => {
  assert.throws(() => ssml.buildMultiVoiceSsml([], opts), /At least one/)
  assert.throws(() => ssml.buildMultiVoiceSsml([{ text: '   ', locale: 'en-IN' }], opts), /empty/)
  assert.throws(() => ssml.buildMultiVoiceSsml([{ text: 'hi', locale: 'en-IN' }], { ...opts, rate: '+5%"><x' }), /prosody/)
  assert.throws(() => ssml.buildMultiVoiceSsml([{ text: 'a'.repeat(321), locale: 'en-IN' }], opts), /too long/)
  assert.throws(() => ssml.buildMultiVoiceSsml(Array.from({ length: 13 }, () => ({ text: 'a', locale: 'en-IN' })), opts), /Too many/)
})
