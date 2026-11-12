import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const read = p => readFile(new URL(p, import.meta.url), 'utf8')

test('Class 1 live diagnostics check First Day scenes, not obsolete little words', async () => {
  const fixture = await read('../../../backend/src/scripts/smoke-class1-demo-student.ts')
  const bridge = await read('../../../backend/src/scripts/check-class1-ai-bridge.ts')
  const audio = await read('../../../backend/src/scripts/audit-class1-level1-audio.ts')
  const intro = await read('../../features/lessons/grades/class-01/level-01/Class1LessonIntro.tsx')
  assert.match(fixture, /lesson\.activities\.length !== 10/)
  assert.match(fixture, /class1-l01-v3-/)
  assert.match(fixture, /class-01\/level-01\/v3\//)
  assert.doesNotMatch(fixture, /v2-review-little-words/)
  assert.match(bridge, /activityTitle: 'Skip like a bunny'/)
  assert.match(bridge, /response\.shouldRetry !== true/)
  assert.match(bridge, /Outdated 8002 scripted First Day response detected/)
  assert.match(audio, /firstDay from '.\/class1-first-day-voice-v3.json'/)
  assert.match(audio, /educatorReviewVerified: false/)
  assert.match(intro, /school actions and English/)
})

test('Class 1 smoke test uses real word boundaries for skip, not escaped literal backslashes', async () => {
  const bridge = await read('../../../backend/src/scripts/check-class1-ai-bridge.ts')
  assert.ok(bridge.includes(String.raw`!/\bskip\b/i.test(response.message)`))
  assert.ok(!bridge.includes(String.raw`!/\\bskip\\b/i.test(response.message)`))
  assert.match('I can skip.', /\bskip\b/i)
  assert.doesNotMatch('I can jump.', /\bskip\b/i)
})
