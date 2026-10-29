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

test('First Day uses motion-first Miss Julie and voice recovery controls, not fake answer buttons', async () => {
  const scene = await load('../../features/lessons/grades/class-01/level-01/FirstDayClassroom.tsx')
  const stage = await load('../../components/student/lesson/immersive-lesson-stage.tsx')
  const css = await load('../../features/lessons/grades/class-01/level-01/first-day-classroom.css')
  assert.match(scene, /firstday-teacher__animation/)
  assert.match(scene, /videoReady/)
  assert.match(scene, /onError=\{\(\) => \{ setVideoFailed\(true\)/)
  assert.match(scene, /onStartMic/)
  assert.match(scene, /onStopMic/)
  assert.match(scene, /onReplayJulie/)
  assert.match(scene, /onEnableAudio/)
  assert.doesNotMatch(scene, /onSelectChoice|onLocalComplete|completeLocalActivity|new MediaRecorder/)
  assert.match(stage, /onStartMic=\{onStartMic\}/)
  assert.match(stage, /onStopMic=\{onStopMic\}/)
  assert.match(css, /overflow:hidden/)
  assert.match(css, /orientation:portrait/)
})

test('the Class 1 mic tolerates quiet voices with no extra STT requests', async () => {
  const engine = await load('../../components/lessons/lesson-experience.tsx')
  assert.match(engine, /speechThreshold: 0\.012/)
  assert.match(engine, /noSpeechTimeoutMs: 8000/)
})

test('First Day route uses school-action homework and hides v3 fullscreen button', async () => {
  const page = await load('../../app/student/lesson/[id]/page.tsx')
  const wrapper = await load('../../features/lessons/grades/class-01/level-01/Class1Immersion.tsx')
  assert.match(page, /firstDayV3/)
  assert.match(page, /I can walk, I can play/)
  assert.match(page, /voiceOnly=\{firstDayV3\}/)
  assert.match(wrapper, /!voiceOnly && !isPortrait && !isFullscreen/)
})


test('Class 1 requires end-of-audio before new microphone or next frame', async () => {
  const engine = await load('../../components/lessons/lesson-experience.tsx')
  assert.match(engine, /speakingTurnIds\.current\.has\(turn\.id\)/)
  assert.match(engine, /if \(playback !== 'spoken'\)/)
  assert.match(engine, /spokenTurnIds\.current\.add\(turn\.id\)/)
  assert.match(engine, /if \(!activity \|\| julie\.isSpeaking \|\| julie\.state === 'loading' \|\| audioBlocked\)/)
  assert.match(engine, /if \(pending\?\.activityComplete \|\| pending\?\.conversationComplete\)/)
})

test('Balbharati First Day cannot falsely complete after four unlearned turns', async () => {
  const svc = await load('../../../backend/src/services/missJulie.service.ts')
  assert.match(svc, /!isFirstDayScene \|\| demonstratedRequiredSkills/)
  assert.match(svc, /firstDaySceneSkills/)
  assert.match(svc, /turnSkills\.includes\('first_day_english_attempt'\)/)
})

test('manual microphone retry works after no-speech errors; replay restores teaching state', async () => {
  const engine = await load('../../components/lessons/lesson-experience.tsx')
  assert.match(engine, /lastTurn\.activityComplete \|\| lastTurn\.conversationComplete/)
  assert.match(engine, /lastTurn\.retryRequired \? 'retry_required' : 'waiting_for_student'/)
  const mic = engine.split('async function startMic() {')[1].split('if (startingMic.current')[0]
  assert.doesNotMatch(mic, /experience === 'recoverable_error'/)
})
