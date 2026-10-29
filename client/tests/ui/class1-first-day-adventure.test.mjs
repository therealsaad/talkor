import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
const load = file => readFile(new URL(file, import.meta.url), 'utf8')

test('Class 1 First Day uses the illustrated board with live teacher text', async () => {
  const scene = await load('../../features/lessons/grades/class-01/level-01/FirstDayClassroom.tsx')
  const stage = await load('../../components/student/lesson/immersive-lesson-stage.tsx')
  assert.match(scene, /teacherText\s*\|\|/)
  assert.match(scene, /firstday-book__art/)
  assert.match(scene, /firstday-teacher__animation/)
  assert.match(stage, /if \(isClass1Classroom && firstDayV3Id\)/)
  assert.match(stage, /teacherText=\{julieMessage\}/)
})

test('no typed choices or student action buttons are rendered in the First Day storyboard', async () => {
  const scene = await load('../../features/lessons/grades/class-01/level-01/FirstDayClassroom.tsx')
  assert.doesNotMatch(scene, /<button|<input|<textarea|contentEditable|onClick=/i)
  const css = await load('../../features/lessons/grades/class-01/level-01/first-day-classroom.css')
  assert.match(css, /overflow:hidden/)
  assert.match(css, /orientation:portrait/)
})

test('the Class 1 mic tolerates quiet voices with no extra STT requests', async () => {
  const engine = await load('../../components/lessons/lesson-experience.tsx')
  assert.match(engine, /speechThreshold: 0\.012/)
  assert.match(engine, /noSpeechTimeoutMs: 8000/)
})
