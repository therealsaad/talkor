import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8')
const classroom = read('../../features/lessons/grades/class-01/level-01/FirstDayPoemClassroom.tsx')
const stage = read('../../components/student/lesson/immersive-lesson-stage.tsx')
const engine = read('../../components/lessons/lesson-experience.tsx')

test('poem shows and reads exactly the highlighted pair, not the last generic AI reply', () => {
  assert.match(classroom, /LISTEN & CHANT/)
  assert.match(classroom, /Hear these lines/)
  assert.match(classroom, /onReciteLines\?: \(text: string\) => void/)
  assert.match(classroom, /onReciteLines\(LINES\.slice\(activeStart, activeEnd\)\.join\('\\n'\)\)/)
  assert.match(stage, /onReciteLines=\{\(text\) => \{ void onSpeakText\(text, /)
  assert.match(stage, /poem:\$\{activity\.id\}:lines/)
})

test('poem audio replay supplies authorized activity ID, Azure-conversation priority and never submits XP', () => {
  assert.match(engine, /poemLineReplay = key\?\.startsWith\('poem:' \+ activity\.id \+ ':'\)/)
  assert.match(engine, /poemLineReplay \? 'CONVERSATION' : 'LESSON'/)
  assert.match(engine, /poemLineReplay \? activity\.id : undefined/)
  const part = engine.slice(engine.indexOf('const poemLineReplay = '), engine.indexOf("if (poemLineReplay && playback"))
  assert.doesNotMatch(part, /submitAttempt|completeLocalActivity|acknowledgeTeacherAudio/)
  assert.match(engine, /if \(poemLineReplay && playback === 'spoken'\) setExperience\('waiting_for_student'\)/)
})
