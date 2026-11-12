import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const source = readFileSync(path.join(root, 'features/lessons/grades/class-01/balbharati-curriculum.ts'), 'utf8')

test('Class 1 authored map covers exactly 44 real Balbharati chapters in 10 levels', () => {
  const matches = [...source.matchAll(/chapter:'(\d\.\d+)'/g)].map((item) => item[1])
  assert.equal(matches.length, 44)
  assert.equal(new Set(matches).size, 44, 'no textbook chapter is duplicated')
  assert.deepEqual(
    matches.filter((chapter) => chapter.startsWith('1.')),
    Array.from({ length: 10 }, (_, index) => `1.${index + 1}`),
  )
  assert.deepEqual(
    matches.filter((chapter) => chapter.startsWith('2.')),
    Array.from({ length: 12 }, (_, index) => `2.${index + 1}`),
  )
  assert.deepEqual(
    matches.filter((chapter) => chapter.startsWith('3.')),
    Array.from({ length: 11 }, (_, index) => `3.${index + 1}`),
  )
  assert.deepEqual(
    matches.filter((chapter) => chapter.startsWith('4.')),
    Array.from({ length: 11 }, (_, index) => `4.${index + 1}`),
  )
  assert.match(source, /approved: false/)
  assert.match(source, /educator approval and student trials are pending/)
})

test('Class 1 levels 2-10 link their original chapter activities and stay staff-only', () => {
  for (let n = 2; n <= 10; n++) {
    const levelDir = `features/lessons/grades/class-01/level-${String(n).padStart(2, '0')}`
    const activities = readFileSync(path.join(root, levelDir, 'activities.ts'), 'utf8')
    const config = readFileSync(path.join(root, levelDir, 'config.ts'), 'utf8')
    assert.match(activities, new RegExp(`class1DraftActivities\\(${n}\\)`))
    assert.match(config, /"editorialStatus": "draft"/)
    assert.match(config, /"studentPlayable": false/)
    assert.match(config, /"boardReviewRequired": true/)
    assert.match(config, /"syllabusVerified": false/)
    assert.match(config, /"staffOnlyPreview": true/)
    assert.match(config, /"sourceBook": "English Balbharati Standard One/)
    const staticConfig = config.match(/export const config = (\{[\s\S]*\}) as const satisfies LevelDesignConfig\s*$/)
    assert.ok(staticConfig, `Level ${n} must remain JSON-parseable for the 110-level validator`)
    assert.equal(JSON.parse(staticConfig[1]).level, n)
  }
})

test('Class 1 board hides the cartoon learner but keeps the speech evidence visible', () => {
  const stage = readFileSync(path.join(root, 'components/student/lesson/immersive-lesson-stage.tsx'), 'utf8')
  assert.match(stage, /!isClass1Classroom \? <motion\.aside/)
  assert.match(stage, /tk-class1-student-voice/)
  assert.match(stage, /studentTurnText \|\| transcript/)
})
