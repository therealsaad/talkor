import { readFileSync } from 'node:fs'
import path from 'node:path'
import assert from 'node:assert/strict'
import test from 'node:test'
const root=path.resolve(import.meta.dirname,'../..')
const source=(p)=>readFileSync(path.join(root,p),'utf8')

test('Class 1 page mounts the six-step poem and keeps mandatory intro',()=>{
  const lesson=source('app/student/lesson/[id]/page.tsx')
  assert.match(lesson,/firstDayPoem/)
  assert.match(lesson,/lesson\.activities\.length === 6/)
  assert.match(lesson,/class1-g01-l01/)
  assert.match(lesson,/class1IntroVideoUrl/)
})
test('Poem classroom shows ten authentic lines and preserves live engine ownership',()=>{
  const stage=source('components/student/lesson/immersive-lesson-stage.tsx')
  const poem=source('features/lessons/grades/class-01/level-01/FirstDayPoemClassroom.tsx')
  assert.match(stage,/FirstDayPoemClassroom/)
  assert.match(poem,/See me skip/)
  assert.match(poem,/Hip hip hurray!/)
  assert.match(poem,/onStartMic/)
  assert.match(poem,/onStopMic/)
  assert.match(poem,/useOriginalInstrumental/)
  assert.doesNotMatch(poem,/submitAttempt|createConversation|markComplete/)
})

test('full ten-line challenge aggregates five microphone clips and never submits partial poem as mastery',()=>{
  const engine=source('components/lessons/lesson-experience.tsx')
  const stage=source('components/student/lesson/immersive-lesson-stage.tsx')
  const board=source('features/lessons/grades/class-01/level-01/FirstDayPoemClassroom.tsx')
  assert.match(engine, /poemRecitalChunk < 4/)
  assert.match(engine, /await cancelActiveVoiceSession\(\)/)
  assert.match(engine, /normalizedText = \[\.\.\.poemRecitalParts\.current, normalizedText\]\.join\(' '\)/)
  assert.match(stage, /recitalChunk=\{poemRecitalChunk\}/)
  assert.match(board, /activeStart=final\?Math\.min\(4,recitalChunk\)\*2/)
  assert.match(engine, /poemRecitalParts\.current = \[\]/)
})
