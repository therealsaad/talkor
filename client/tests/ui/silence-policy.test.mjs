import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import vm from 'node:vm'
import { test } from 'node:test'
import ts from 'typescript'

async function load(path) {
  const source = await readFile(new URL(path, import.meta.url), 'utf8')
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText
  const exports = {}
  vm.runInNewContext(compiled, { exports, Number, Math }, { filename: path })
  return exports
}
const policy = await load('../../lib/silence-policy.ts')
const { shouldStopRecording, silenceLimitMs, parseSilenceMs, MIN_SILENCE_MS } = policy

const base = { startedAt: 0, minimumSpeechMs: 350, noSpeechTimeoutMs: 6500, silenceMs: 1100 }

test('without the new option the decision is identical to the old inline rule', () => {
  // The rule that lived in voice-activity.ts before this change.
  const legacy = (i) => (i.heardVoice && i.now - i.startedAt >= i.minimumSpeechMs && i.now - i.lastVoiceAt > i.silenceMs) ||
    (!i.heardVoice && i.now - i.startedAt > i.noSpeechTimeoutMs)
  let checked = 0
  for (const heardVoice of [false, true]) {
    for (const now of [0, 200, 349, 350, 900, 1500, 2600, 6500, 6501, 9000]) {
      for (const lastVoiceAt of [0, 300, 1000, 2000]) {
        for (const voicedMs of [0, 200, 450, 2000]) {
          const input = { ...base, now, lastVoiceAt, heardVoice, voicedMs }
          assert.equal(shouldStopRecording(input), legacy(input), JSON.stringify(input))
          checked += 1
        }
      }
    }
  }
  assert.ok(checked > 300)
})

test('a child who has spoken for a while is cut off sooner, but only after the shorter silence', () => {
  const input = { ...base, heardVoice: true, voicedMs: 600, silenceAfterSpeechMs: 750, lastVoiceAt: 1000 }
  assert.equal(shouldStopRecording({ ...input, now: 1700 }), false, '700 ms of silence is still waiting')
  assert.equal(shouldStopRecording({ ...input, now: 1751 }), true, 'over 750 ms of silence ends the turn')
  // The cautious window would still be waiting at that moment.
  assert.equal(shouldStopRecording({ ...input, silenceAfterSpeechMs: undefined, now: 1751 }), false)
})

test('hesitant or very short speech keeps the cautious window', () => {
  const input = { ...base, heardVoice: true, silenceAfterSpeechMs: 750, lastVoiceAt: 1000, now: 1800 }
  assert.equal(shouldStopRecording({ ...input, voicedMs: 300 }), false, 'under 450 ms of speech: keep waiting')
  assert.equal(shouldStopRecording({ ...input, voicedMs: 450 }), true)
  assert.equal(silenceLimitMs(449, 1100, 750), 1100)
  assert.equal(silenceLimitMs(450, 1100, 750), 750)
  assert.equal(silenceLimitMs(449, 1100, 750, 300), 750, 'quickSpeechMs is configurable')
})

test('the safe floor cannot be bypassed and the short window can never be longer than the cautious one', () => {
  assert.equal(silenceLimitMs(1000, 1100, 100), MIN_SILENCE_MS)
  assert.equal(silenceLimitMs(1000, 1100, -50), MIN_SILENCE_MS)
  assert.equal(silenceLimitMs(1000, 1100, 5000), 1100)
  assert.equal(silenceLimitMs(1000, 1100, Number.NaN), 1100)
  assert.equal(silenceLimitMs(1000, 1100, undefined), 1100)
  const tooShort = { ...base, heardVoice: true, voicedMs: 1000, silenceAfterSpeechMs: 100, lastVoiceAt: 1000 }
  assert.equal(shouldStopRecording({ ...tooShort, now: 1400 }), false, 'a 400 ms pause never ends a turn')
  assert.equal(shouldStopRecording({ ...tooShort, now: 1501 }), true)
})

test('the minimum speech length and the no-speech timeout still apply', () => {
  const quick = { ...base, heardVoice: true, voicedMs: 1000, silenceAfterSpeechMs: 500, lastVoiceAt: 0 }
  assert.equal(shouldStopRecording({ ...quick, now: 340 }), false, 'never stops before the minimum recording length')
  assert.equal(shouldStopRecording({ ...base, heardVoice: false, voicedMs: 0, lastVoiceAt: 0, now: 6500 }), false)
  assert.equal(shouldStopRecording({ ...base, heardVoice: false, voicedMs: 0, lastVoiceAt: 0, now: 6501 }), true)
})

test('the tunable value falls back on bad input and is clamped to the safe range', () => {
  assert.equal(parseSilenceMs(undefined, 750, 1100), 750)
  assert.equal(parseSilenceMs('', 750, 1100), 750)
  assert.equal(parseSilenceMs('abc', 750, 1100), 750)
  assert.equal(parseSilenceMs('800', 750, 1100), 800)
  assert.equal(parseSilenceMs('50', 750, 1100), MIN_SILENCE_MS)
  assert.equal(parseSilenceMs('9000', 750, 1100), 1100)
})

test('KG Level 1 uses the policy and the watcher delegates to it', async () => {
  const lesson = await readFile(new URL('../../features/lessons/grades/kg/level-01/LevelExperience.tsx', import.meta.url), 'utf8')
  assert.match(lesson, /silenceMs: 1100, silenceAfterSpeechMs: KG_SILENCE_AFTER_SPEECH_MS/)
  assert.match(lesson, /parseSilenceMs\(process\.env\.NEXT_PUBLIC_KG_SILENCE_AFTER_SPEECH_MS, 750, 1100\)/)
  const watcher = await readFile(new URL('../../lib/voice-activity.ts', import.meta.url), 'utf8')
  assert.match(watcher, /shouldStopRecording\(\{/)
  assert.match(watcher, /Math\.min\(250, now - lastTickAt\)/)
})
