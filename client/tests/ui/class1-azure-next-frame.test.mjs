import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
const read = file => readFile(new URL(file, import.meta.url), 'utf8')
test('First Day teacher narration stays on exact reviewed S3 script', async () => {
  const voice = await read('../../../backend/src/services/voice.service.ts')
  assert.match(voice, /sameNarration\(text, class1Text\)/)
  assert.match(voice, /getStaticAudio\(key, class1Text\)/)
})
test('Class 1 adaptive answers go to Azure only, not Groq or Priya fallback', async () => {
  const voice = await read('../../../backend/src/services/voice.service.ts')
  const clause = voice.split('if (dynamicFirstDay) {')[1].split('\n    }')[0]
  assert.match(clause, /new AzureVoiceProvider\(\)/)
  assert.match(clause, /CLASS1_AZURE_DYNAMIC_VOICE_UNAVAILABLE/)
  assert.doesNotMatch(clause, /GroqVoiceProvider|PythonVoiceProvider/)
})
test('Student progresses only after an actual spoken teacher turn', async () => {
  const engine = await read('../../components/lessons/lesson-experience.tsx')
  assert.match(engine, /if \(playback !== 'spoken'\)/)
  assert.match(engine, /setExperience\('recoverable_error'\)/)
  assert.match(engine, /experience !== 'activity_complete' \|\| !activityComplete \|\| julie.isSpeaking/)
})

test('Class 1 cannot skip a voice turn by muting or reusing an in-flight ID', async () => {
  const engine = await read('../../components/lessons/lesson-experience.tsx')
  assert.match(engine, /if \(experienceId === 'g01-l01'\) return/)
  assert.match(engine, /if \(!audioEnabled && experienceId === 'g01-l01'\)/)
  assert.match(engine, /Teacher audio is required for this voice-first lesson/)
})
