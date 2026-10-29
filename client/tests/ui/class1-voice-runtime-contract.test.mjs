import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
const read = (p) => readFile(new URL(p, import.meta.url), 'utf8')

test('Class 1 v3 is a motion-first classroom with mic and sound recovery but no fake answer buttons', async () => {
  const view = await read('../../components/student/lesson/immersive-lesson-stage.tsx')
  const scene = await read('../../features/lessons/grades/class-01/level-01/FirstDayClassroom.tsx')
  assert.match(view, /if \(isClass1Classroom && firstDayV3Id\)/)
  assert.match(view, /onReplayJulie=\{onReplayJulie\}/)
  assert.match(view, /onStartMic=\{onStartMic\}/)
  assert.match(scene, /firstday-teacher__animation/)
  assert.match(scene, /onEnableAudio/)
  assert.doesNotMatch(scene, /onSelectChoice|onLocalComplete|completeLocalActivity/)
})

test('request close no longer cancels Azure audio during response streaming', async () => {
  const controller = await read('../../../backend/src/controllers/voice.controller.ts')
  assert.match(controller, /writeVoiceResponseStream\(res, stream\)/)
  assert.doesNotMatch(controller, /req\.on\('close', \(\) => \{ void reader\.cancel/)
  const server = await read('../../../backend/src/services/voice-response-stream.ts')
  assert.match(server, /res\.once\('close', onDisconnected\)/)
})

test('Class 1 app starts playable audio during the same user gesture as fullscreen', async () => {
  const intro = await read('../../features/lessons/grades/class-01/level-01/Class1LessonIntro.tsx')
  assert.match(intro, /const unlockAudio = voiceService\.unlockPlayback\(\)/)
  assert.match(intro, /const startedVideo = video\.current\.play\(\)/)
  assert.match(intro, /firstDayOnly/)
  assert.match(intro, /sourceReady/)
})

test('silent Azure responses never advance lessons as successfully spoken', async () => {
  const speech = await read('../../../backend/src/providers/voice/AzureVoiceProvider.ts')
  const engine = await read('../../components/lessons/lesson-experience.tsx')
  assert.match(speech, /TTS_EMPTY_AUDIO/)
  assert.match(engine, /playback !== 'spoken'/)
  assert.match(engine, /setExperience\('recoverable_error'\)/)
})

test('Class 1 Qwen does not substitute generic model failure with fake mastery', async () => {
  const ai = await read('../../../backend/src/providers/ai/QwenProvider.ts')
  assert.match(ai, /CLASS1_AI_SERVICE_UNAVAILABLE/)
})
