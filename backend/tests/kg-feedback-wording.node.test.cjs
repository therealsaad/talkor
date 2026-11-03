const assert = require('node:assert/strict')
const { test } = require('node:test')
const { loadTS } = require('./helpers/load-ts.cjs')

const { safeKGFeedback } = loadTS('services/kg-feedback.service.ts', {
  '../config/env': { env: {} },
  './kg-teaching-hint': { kgTeachingHint: () => '' },
})
const say = (letter, languageCode, mode = 'speak') => safeKGFeedback({ letter, mode, outcome: 'supported', languageCode })

test('a spoken Hindi word is named first, praised, then the English word is taught and practised', () => {
  assert.equal(say('C', 'hi-IN'), 'बिल्ली, अच्छा बेटा! पर अंग्रेज़ी में इसे cat कहते हैं। Say cat.')
  assert.equal(say('A', 'hi-IN'), 'सेब, अच्छा बेटा! पर अंग्रेज़ी में इसे apple कहते हैं। Say apple.')
})

test('a spoken Marathi word is named first', () => {
  assert.equal(say('C', 'mr-IN'), 'मांजर, छान बाळा! पण इंग्रजीत याला cat म्हणतात। Say cat.')
  assert.equal(say('D', 'mr-IN'), 'कुत्रा, छान बाळा! पण इंग्रजीत याला dog म्हणतात। Say dog.')
})

test('every letter names its own word and ends by asking for the English word', () => {
  for (const [letter, english] of [['A', 'apple'], ['B', 'ball'], ['C', 'cat'], ['D', 'dog']]) {
    for (const language of ['hi-IN', 'mr-IN']) {
      const line = say(letter, language)
      assert.ok(line.includes(` ${english} `), line)
      assert.ok(line.endsWith(` Say ${english}.`), line)
    }
  }
})

test('picture help (nothing was said) keeps the old line, and the English line is unchanged', () => {
  assert.equal(say('C', 'hi-IN', 'touch'), 'अच्छी कोशिश! अंग्रेज़ी में इसे cat कहते हैं। Say cat.')
  assert.equal(say('C', 'mr-IN', 'touch'), 'छान प्रयत्न! इंग्रजीत याला cat म्हणतात। Say cat.')
  assert.equal(say('C', undefined), 'Nice try! In English, we say cat. Say cat.')
})

test('a supported line never says the child was right in English', () => {
  for (const language of ['hi-IN', 'mr-IN']) assert.ok(!/शाबाश|खूप छान|Yay/.test(say('C', language)))
})
