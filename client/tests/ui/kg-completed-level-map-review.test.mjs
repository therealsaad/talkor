import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8')
const [map, mapPage, resume, reviewPage, review, kg1, level2Route, continuationPage, level2Router, continuationRouter, level2Controller, continuationController] =
  await Promise.all([
    read('../../components/student/kg-adventure-map.tsx'),
    read('../../app/student/kg/map/page.tsx'),
    read('../../app/student/continue/page.tsx'),
    read('../../app/student/kg/review/[level]/page.tsx'),
    read('../../features/lessons/grades/kg/review/CompletedLevelReview.tsx'),
    read('../../features/lessons/grades/kg/level-01/LevelExperience.tsx'),
    read('../../app/student/kg/level-2/page.tsx'),
    read('../../features/lessons/grades/kg/continuation/ContinuationPage.tsx'),
    read('../../../backend/src/routes/kg-level2-student.routes.ts'),
    read('../../../backend/src/routes/kg-continuation.routes.ts'),
    read('../../../backend/src/controllers/kg-level2-student.controller.ts'),
    read('../../../backend/src/controllers/kg-continuation.controller.ts'),
  ])

test('student PIN login still automatically resumes the first unfinished lesson; garden map is separate', () => {
  assert.match(resume, /nextKGStudentRoute\(\)/)
  assert.match(continuationController, /nextStudentRoute/)
  assert.match(mapPage, /<KGAdventureMap/)
  assert.match(kg1, /My garden/)
  assert.match(level2Route, /href="\/student\/kg\/map"/)
  assert.match(continuationPage, /href="\/student\/kg\/map"/)
})

test('all completed KG1-5 stones open their respective revision, while locked stones have no URL', () => {
  assert.match(map, /if \(status === 'locked'\) return undefined/)
  assert.match(map, /level === 1\) return status === 'completed' \? '\/student\/kg\?replay=all'/)
  assert.match(map, /level >= 2 && level <= 5/)
  assert.match(map, /status === 'completed' \? `\/student\/kg\/review\/\$\{level\}` : `\/student\/kg\/level-\$\{level\}`/)
  assert.match(map, /level\.status === 'completed' \? Check : LockKeyhole/)
  assert.match(reviewPage, /\^\[2-5\]\$/)
  assert.match(reviewPage, /KGCompletedLevelReview/)
})

test('completed revision verifies own student progress and uses server-controlled audio only', () => {
  assert.match(review, /kgLevel2StudentService\.state\(\)/)
  assert.match(review, /kgContinuationStudentService\.state\(level\)/)
  assert.match(review, /if \(!saved\.completed\)/)
  assert.match(review, /student\?\.grade === 0/)
  assert.match(review, /apiClientBlob\(completedNarrationUrl\(level, id\)/)
  assert.match(review, /href="\/student\/continue"/)
  assert.doesNotMatch(review, /\.submit\(|\.acknowledge\(|feedback-played|audioBase64|new MediaRecorder|localStorage|sessionStorage/)
  assert.match(level2Router, /router\.get\('\/review\/narration\/:id', KGLevel2StudentController\.reviewNarration\)/)
  assert.match(continuationRouter, /router\.get\('\/:level\/review\/narration\/:id', KGContinuationController\.reviewNarration\)/)
  assert.match(level2Controller, /currentIndex: LEVEL2_LETTERS\.length, completedAt: \{ \$exists: true \}/)
  assert.match(continuationController, /completedAt: \{ \$exists: true \}/)
  assert.match(continuationController, /getKGContinuationNarration\(level, req\.params\.id\)/)
  assert.doesNotMatch(level2Controller.slice(level2Controller.indexOf('  reviewNarration:'), level2Controller.indexOf('  attempt:')), /KGLevel2Attempt\.create|updateOne|setOnInsert/)
  assert.doesNotMatch(continuationController.slice(continuationController.indexOf('  reviewNarration:'), continuationController.indexOf('  attempt:')), /KGContinuationAttempt\.create|updateOne|setOnInsert/)
})
