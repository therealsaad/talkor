import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import vm from 'node:vm'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const ts = require('typescript')
const moduleFile = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../features/lessons/grades/kg/level-01/services/kg-voice-fallback.ts')
const js = ts.transpileModule(readFileSync(moduleFile, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
function setup() {
  let cancelled = 0
  let spoken = null
  class Utterance { constructor(text) { this.text = text; this.onend = null; this.onerror = null } }
  const engine = { getVoices: () => [{ lang: 'en-IN', name: 'Indian female' }], cancel: () => { cancelled++ }, speak: (v) => { spoken = v } }
  const window = { speechSynthesis: engine, SpeechSynthesisUtterance: Utterance, setTimeout }
  const exports = {}
  vm.runInNewContext(js, { window, SpeechSynthesisUtterance: Utterance, exports, DOMException, clearTimeout, setTimeout })
  return { speak: exports.speakKGOnDevice, spoken: () => spoken, cancelled: () => cancelled }
}
test('on-device fallback selects an en-IN voice and resolves when utterance ends', async () => {
 const h = setup()
 const pending = h.speak('A for apple!')
 assert.equal(h.spoken().text, 'A for apple!')
 assert.equal(h.spoken().voice.lang, 'en-IN')
 assert.equal(h.spoken().rate, 0.84)
 h.spoken().onend()
 await pending
})
test('abort stops the on-device voice before microphone capture', async () => {
 const h = setup()
 const ctrl = new AbortController()
 const pending = h.speak('B for ball', ctrl.signal)
 ctrl.abort()
 await assert.rejects(pending, /Cancelled/)
 assert.ok(h.cancelled() >= 2)
})
test('empty script cannot silently complete with no voice', async () => {
 const h = setup()
 await assert.rejects(h.speak('   '), /No on-device voice/)
})
