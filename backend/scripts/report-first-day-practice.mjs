/** Local wording measurement only: no database, providers, credentials or audio.
 * Build the backend first. Prints synthetic before/after spoken-text counts;
 * these are not microphone/STT/Qwen/TTS latency or hearing measurements.
 */
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const backend = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(path.join(backend, 'package.json'))
const { FIRST_DAY_POEM_LINES, FIRST_DAY_POEM_STEPS } = require(path.join(backend, 'dist/curriculum/class1-first-day-poem.js'))
const { buildLessonTeachingContext, selectLessonSupport } = require(path.join(backend, 'dist/services/lesson-teaching-context.js'))
const { guardFirstDayPoemTurn } = require(path.join(backend, 'dist/services/class1-poem-teacher-guard.js'))
const { scaffoldFirstDayPractice } = require(path.join(backend, 'dist/services/first-day-practice-scaffold.js'))
const spokenText = response => [response.message, response.followUpQuestion].filter(Boolean).join(' ')
const cases = []
for (const step of FIRST_DAY_POEM_STEPS) {
  const context = buildLessonTeachingContext({ grade: 1, lessonKey: 'g01-l01',
    support: selectLessonSupport({ attempts: [] }), activity: {
      activityKey: 'class1-l01-v4-' + step.key, prompt: 'Recite the current approved lines.',
      content: { poemLines: FIRST_DAY_POEM_LINES.slice(step.start, step.end) },
      metadata: { sceneKey: step.key, teaching: { version: 1,
        hints: { en: null, hi: step.hintHi, mr: step.hintMr } } },
    } })
  for (const language of ['English', 'Hindi', 'Marathi']) {
    const before = guardFirstDayPoemTurn(step.key, 'At at.', language)
    const after = scaffoldFirstDayPractice({ context, response: before, transcript: 'At at.', language,
      previous: { waiting: true, attempt: 2 } })
    assert(after, 'Third unsuccessful reply must receive a small practice step')
    assert.equal(after.state.stage, 'LINE')
    assert.equal(after.state.lineIndex, 0)
    assert.equal(after.response.modelSentence, before.modelSentence)
    assert.equal(after.response.activityComplete, false)
    assert.equal(after.response.xpAwarded, 0)
    cases.push({ sceneKey: step.key, language, lessonLines: context.modelLines.length,
      practiceLines: 1, beforeSpokenTextCharacters: spokenText(before).length,
      afterSpokenTextCharacters: spokenText(after.response).length,
      modelUnchanged: true, activityComplete: false, xpAwarded: 0 })
  }
}
console.log(JSON.stringify({ scope: 'Local synthetic Node policy; JavaScript UTF-16 character counts',
  providerCalls: 0, audioTested: false, latencyMeasured: false, productionTested: false, cases }, null, 2))
