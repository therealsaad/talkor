import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
const read = path => readFile(new URL(path, import.meta.url), 'utf8')

test('First Day routes Qwen through 8002 and not an implicit Groq fallback', async () => {
  const ai = await read('../../../backend/src/providers/ai/index.ts')
  const py = await read('../../../backend/src/providers/ai/PythonAIProvider.ts')
  assert.match(ai, /FIRST_DAY_VOICE_SCENE/)
  assert.match(ai, /return new PythonAIProvider\(\)/)
  assert.match(py, /strictFirstDay = isClass1Pilot/)
  assert.match(py, /if \(isClass1Pilot && pilotEnabled\)/)
})

test('only S3 narration is allowed for a First Day lesson line; dynamic text uses Azure only', async () => {
  const voice = await read('../../../backend/src/services/voice.service.ts')
  const scoped = voice.split('if (isFirstDayV3) {')[1]?.split('    // Azure Neerja')[0] || ''
  assert.match(scoped, /purpose === 'LESSON'/)
  assert.match(scoped, /new AzureVoiceProvider\(\)/)
  assert.match(scoped, /CLASS1_DYNAMIC_AZURE_TTS_UNAVAILABLE/)
  assert.doesNotMatch(scoped, /new GroqVoiceProvider\(|new PythonVoiceProvider\(/)
})

test('client carries detected student locale through teacher hooks and HTTP request', async () => {
  const lesson = await read('../../components/lessons/lesson-experience.tsx')
  const voice = await read('../../services/voice-service.ts')
  assert.match(lesson, /voiceLanguage: activity\?\.activityKey/)
  assert.match(lesson, /turn\.staticAudioActivityId, turn\.voiceLanguage/)
  assert.match(voice, /language: language \|\| detectVoiceLanguage\(text\)/)
  assert.match(voice, /this\.lastLanguage/)
})

test('First Day scene does not advance before audio playback is completed', async () => {
  const lesson = await read('../../components/lessons/lesson-experience.tsx')
  assert.match(lesson, /Promise<boolean>/)
  assert.match(lesson, /const spoken = await commitTeacherTurn\(normalizedTurn/)
  assert.match(lesson, /if \(firstDayV3 && complete && spoken\)/)
  assert.match(lesson, /if \(!firstDayV3\) setActivityComplete\(complete\)/)
  assert.match(lesson, /playback !== 'spoken'/)
})

test('duplicate teacher turns do not count as spoken before audio media-ended', async () => {
  const lesson = await read('../../components/lessons/lesson-experience.tsx')
  const playback = lesson.indexOf('const playback = await julie.speak(turn.text, turn.id')
  const recorded = lesson.indexOf('spokenTurnIds.current.add(turn.id)', playback)
  assert.ok(playback >= 0 && recorded > playback, 'a turn is recorded as spoken only after awaiting playback')
  assert.match(lesson, /if \(playback !== 'spoken'\)/)
})
