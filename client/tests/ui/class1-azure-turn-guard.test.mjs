import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
const read = path => readFile(new URL(path, import.meta.url), 'utf8')

test('First Day cannot silently finish muted, skipped or concurrent teacher audio', async () => {
  const engine = await read('../../components/lessons/lesson-experience.tsx')
  assert.match(engine, /if \(firstDayV3 && !audioEnabled\)/)
  assert.match(engine, /if \(speakingTurnIds\.current\.has\(turn\.id\)\) return false/)
  assert.match(engine, /if \(firstDayV3\) return false/)
  assert.match(engine, /if \(playback !== 'spoken'\)/)
  assert.match(engine, /setExperience\('recoverable_error'\)/)
  assert.match(engine, /spokenTurnIds\.current\.add\(turn\.id\)/)
  assert.match(engine, /pendingTeacherAck\.current = id/)
  assert.match(engine, /await voiceService\.acknowledgeTeacherAudio\(id\)/)
})

test('Unheard final teacher response can only complete after a successful replay and server acknowledgment', async () => {
  const engine = await read('../../components/lessons/lesson-experience.tsx')
  const retry = engine.split('async function enableAudioAndContinue() {')[1].split('\n  function resetRecorder()')[0]
  assert.match(retry, /const playback = await julie\.replay\(\)/)
  assert.match(retry, /if \(playback !== 'spoken'\)/)
  assert.match(retry, /await voiceService\.acknowledgeTeacherAudio\(pendingId\)/)
  assert.match(retry, /setActivityComplete\(true\)/)
  const voice = await read('../../../backend/src/services/voice.service.ts')
  assert.match(voice, /const isFirstDayV3 = Boolean\(currentActivity\?\.activityKey\?\.startsWith\('class1-l01-v3-'\)\)/)
  assert.match(voice, /CLASS1_DYNAMIC_AZURE_TTS_UNAVAILABLE/)
  assert.match(voice, /CLASS1_FIRST_DAY_APPROVED_AUDIO_MISSING/)
})

test('KG Level 05 remains a staff-only alphabet preview without rewriting the Food and Fruits roadmap', async () => {
  const config = await read('../../features/lessons/grades/kg/level-05/config.ts')
  assert.match(config, /"title": "Letters W to Z"/)
  assert.match(config, /"roadmapTitle": "Food and Fruits"/)
  assert.match(config, /"studentPlayable": false/)
})
