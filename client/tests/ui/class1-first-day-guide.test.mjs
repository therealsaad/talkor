import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

// Node 22+ can load this dependency-free TypeScript source directly.
const guidePath = fileURLToPath(new URL('../../features/lessons/grades/class-01/level-01/first-day-voice-guide.ts', import.meta.url))
const guide = await import(new URL('../../features/lessons/grades/class-01/level-01/first-day-voice-guide.ts', import.meta.url))

test('Level 1 explicitly moves from foundation to Balbharati 1.1', () => {
  assert.equal(guide.class1TeachingCue('class1-l01-v2-listen-am')?.phase, 'FOUNDATION')
  assert.equal(guide.class1TeachingCue('class1-l01-v2-say-walk')?.phase, 'BALBHARATI')
  assert.equal(guide.class1TeachingCue('class1-l01-v2-school-talk')?.scene, 'conversation')
  assert.equal(guide.class1TeachingCue('class1-l02-other'), null)
})

test('mic-spelled foundation letters can replace physical keyboard', () => {
  assert.equal(guide.class1SpokenSpelling('a and n', 'an'), 'an')
  assert.equal(guide.class1SpokenSpelling('A N', 'an'), 'an')
  assert.equal(guide.class1SpokenSpelling('the word an', 'an'), 'an')
  assert.equal(guide.class1SpokenSpelling('n and a', 'an'), null)
  assert.equal(guide.class1SpokenSpelling('a', 'an'), null)
})

test('the live lesson keeps server progress and Class 1-only voice route', () => {
  const source = readFileSync(new URL('../../components/lessons/lesson-experience.tsx', import.meta.url), 'utf8')
  const stage = readFileSync(new URL('../../components/student/lesson/immersive-lesson-stage.tsx', import.meta.url), 'utf8')
  assert.match(source, /experienceId === 'g01-l01'\s*\? class1SpokenSpelling/)
  assert.match(source, /progressService\.submitAttempt/)
  assert.match(source, /if \(!wantsMic/)
  assert.match(stage, /class1TeachingCue\(activity\.activityKey\)/)
  assert.match(stage, /grid-template-columns: clamp\(270px, 29vw, 440px\)/)
  assert.match(readFileSync(guidePath, 'utf8'), /NOT the copyrighted rhyme/)
})
