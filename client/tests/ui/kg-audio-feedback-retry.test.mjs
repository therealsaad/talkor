import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

function read(path) {
  return readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8')
}
const service = read('../../features/lessons/grades/kg/level-01/services/kg-alphabet-service.ts')
const lesson = read('../../features/lessons/grades/kg/level-01/LevelExperience.tsx')
const controller = read('../../../backend/src/controllers/kg-alphabet.controller.ts')
const attempt = read('../../../backend/src/models/KGAlphabetAttempt.ts')

test('KG dynamic Azure audio has adequate bounded fetch time and idempotent retry', () => {
  assert.match(service, /kind === 'dynamic_tts' \? 35000 : 30000/)
  assert.match(service, /attempt\/\$\{encodeURIComponent\(submissionId\)\}\/feedback-audio/)
  assert.match(service, /audio\.onended = \(\) => \{ clean\(\); resolve\(\) \}/)
  assert.match(lesson, /await kgAlphabetService\.playAttemptFeedback\(/)
  assert.match(lesson, /await kgAlphabetService\.acknowledgeFeedback\(/)
})

test('KG voice request reuses original model text and never repeats Qwen for playback', () => {
  const audioRoute = controller.split('  feedbackAudio: catchAsync(')[1]?.split('  previewAttempt:')[0]
  assert.ok(audioRoute)
  assert.doesNotMatch(audioRoute, /kgDynamicFeedback\(/)
  assert.match(audioRoute, /attempt\.feedbackText/)
  assert.match(audioRoute, /sendKGAzure\(res, words\)/)
  assert.match(attempt, /feedbackText: \{ type: String, maxlength: 280 \}/)
})

test('KG retries show a single lesson-card CTA, not overlapping bottom alerts', () => {
  // The map's independent connectivity alert is valid. Only the
  // overlapping *lesson feedback* banner must be absent.
  assert.doesNotMatch(lesson, /phase === 'error' && current \? <div className="kg-alpha-recoverable"/)
  assert.match(lesson, /mapError \? <p className="kg-alpha-recoverable"/)
  assert.match(lesson, /phase === 'error' \? <button type="button" className="kg-story-play" onClick=\{\(\) => void retryLesson\(\)\}/)
  assert.match(lesson, /pendingResultRef\.current = \{ result, stepIndex \}/)
})
