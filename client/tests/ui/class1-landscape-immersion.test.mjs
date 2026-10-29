import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'

const read = (relative) => readFile(new URL(relative, import.meta.url), 'utf8')
const route = await read('../../app/student/lesson/[id]/page.tsx')
const shell = await read('../../features/lessons/grades/class-01/level-01/Class1Immersion.tsx')
const intro = await read('../../features/lessons/grades/class-01/level-01/Class1LessonIntro.tsx')
const utility = await read('../../features/lessons/grades/class-01/level-01/class1-fullscreen.ts')
const css = await read('../../features/lessons/grades/class-01/level-01/class1-immersion.css')
const stage = await read('../../components/student/lesson/immersive-lesson-stage.tsx')

test('the existing shared activity engine remains canonical; immersion is Class 1-only', () => {
  assert.match(route, /const experience = <ActivityEngine/)
  assert.match(route, /lesson\.experienceId === 'g01-l01'/)
  assert.match(route, /<Class1Immersion voiceOnly=\{firstDayV3\}>\{experience\}<\/Class1Immersion>/)
  assert.match(route, /: experience/)
})

test('fullscreen is user-initiated and persists from the introductory story into practice', () => {
  assert.match(shell, /data-class1-immersion/)
  assert.match(shell, /onClick=\{\(\) => void enterLandscape\(\)\}/)
  assert.match(utility, /requestFullscreen\(\{ navigationUI: 'hide' \}\)/)
  assert.match(utility, /orientation\?\.lock\?\.\('landscape'\)/)
  assert.match(intro, /closest<HTMLElement>\('\[data-class1-immersion\]'\)/)
  assert.match(intro, /fullscreenActive\.current = await requestClass1Fullscreen\(fullscreenTarget\)/)
  assert.match(intro, /if \(document\.fullscreenElement === frame\.current\)/)
  assert.doesNotMatch(shell, /requestFullscreen\(\)/) // no autoplay/effect fullscreen
})

test('phone portrait prompts rotation instead of faking a CSS landscape device', () => {
  assert.match(shell, /setIsPortrait\(window\.innerHeight > window\.innerWidth\)/)
  assert.match(shell, /Rotate your phone or tablet/)
  assert.match(shell, /Auto-rotate/)
  assert.match(css, /@media \(orientation: landscape\) and \(max-height: 720px\)/)
  assert.match(css, /\.tk-class1-immersion \.tk-stage-grid/)
  assert.doesNotMatch(css, /rotate\(90deg\)/)
})

test('Miss Julie shows which Class 1 steps are actual AI-guided turns', () => {
  assert.match(stage, /experienceId === 'g01-l01' && isConversation && activity\.aiEnabled/)
  assert.match(stage, /AI-guided conversation/)
  assert.match(stage, /Miss Julie’s guided lesson/)
  assert.match(stage, /Listening to your answer/)
  assert.match(stage, /Thinking about your answer/)
  assert.match(stage, /Miss Julie is speaking/)
})
