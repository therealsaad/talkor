import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

function read(path) {
  return readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8')
}
const intro = read('../../features/lessons/grades/class-01/level-01/Class1LessonIntro.tsx')
const page = read('../../app/student/lesson/[id]/page.tsx')
const engine = read('../../components/lessons/lesson-experience.tsx')
const installer = read('../../../backend/src/scripts/stage-class1-first-day-poem.ts')

test('authenticated poem lesson supports the exact bundled reviewed media source', () => {
  assert.match(intro, /candidate === CLASS1_FIRST_DAY_VIDEO_BUNDLED/)
  assert.match(intro, /src=\{videoSource \|\| undefined\}/)
  assert.match(intro, /const MIN_DURATION_SECONDS = 87/)
  assert.match(intro, /const MAX_DURATION_SECONDS = 93/)
  assert.match(intro, /const REQUIRED_WATCH_SECONDS = 85/)
  assert.match(intro, /if \(video\.current\?\.muted \|\| watchedUntil\.current < REQUIRED_WATCH_SECONDS\)/)
  assert.match(page, /lesson\.activities\.length === 6/)
  assert.match(page, /class1IntroVideoUrl=\{firstDayReady/)
  assert.match(engine, /introVideoKey && introState !== 'done'/)
})

test('stage command refuses fake video, writes no old attempts or progress, checks local file', () => {
  assert.match(installer, /TALKORA_FIRST_DAY_INTRO_REVIEWED/)
  assert.match(installer, /TALKORA_FIRST_DAY_USE_BUNDLED_INTRO/)
  assert.match(installer, /inspectBundledIntro\(\)/)
  assert.match(installer, /BUNDLED_CLASS1_INTRO_MISSING/)
  assert.match(installer, /databaseName !== 'test'/)
  assert.match(installer, /existingStudentRecordsWillBeUpdated:false/)
  assert.doesNotMatch(installer, /Activity\.deleteMany|Progress\.deleteMany|ActivityAttempt\.deleteMany/)
})
