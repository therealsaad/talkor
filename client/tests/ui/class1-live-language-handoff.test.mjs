import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const read = (file) => readFileSync(path.join(root, file), 'utf8')
const player = read('components/lessons/lesson-experience.tsx')
const service = read('services/voice-service.ts')

test('Class 1 live microphone keeps Sarvam language without a second STT request', () => {
  assert.match(player, /experienceId === 'g01-l01'/)
  assert.match(player, /voiceService\.transcribeAudioDetailed\(blob, durationMs, 'en-IN'\)/)
  assert.match(player, /voiceResult\.languageCode/)
  assert.match(service, /async transcribeAudioDetailed\(/)
  assert.match(service, /detectedLanguage\?: VoiceTranscription\['languageCode'\]/)
  assert.match(service, /language === 'mr-IN'/)
  assert.match(service, /language === 'hi-IN'/)
})

test('legacy grades still receive a plain transcript and nothing changes grades/progress', () => {
  assert.match(player, /transcript: await voiceService\.transcribeAudio\(blob, durationMs, 'en-IN'\)/)
  assert.match(service, /return result\.transcript/)
  assert.doesNotMatch(service, /score\s*=|iq\s*=|pronunciationScore\s*=/i)
})
