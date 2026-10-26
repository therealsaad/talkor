import { env } from '../../src/config/env'
import { KGSpeechService } from '../../src/services/kg-speech.service'
import { GroqSpeechProvider } from '../../src/providers/speech/GroqSpeechProvider'
import { SarvamSpeechProvider } from '../../src/providers/speech/SarvamSpeechProvider'
import { PythonSpeechProvider } from '../../src/providers/speech/PythonSpeechProvider'
import { evaluateKGSpeech } from '../../src/kg/alphabet-content'

const previousProvider = process.env.KG_ALPHABET_STT_PROVIDER
const previousGlobalProvider = env.speechProvider
const previousProd = env.isProd
const previousUrl = env.aiServiceUrl
afterEach(() => {
  if (previousProvider === undefined) delete process.env.KG_ALPHABET_STT_PROVIDER
  else process.env.KG_ALPHABET_STT_PROVIDER = previousProvider
  env.isProd = previousProd; env.aiServiceUrl = previousUrl
  env.speechProvider = previousGlobalProvider
  jest.restoreAllMocks()
})

it('uses the global Sarvam provider for KG without ten grade-specific settings', async () => {
  delete process.env.KG_ALPHABET_STT_PROVIDER
  env.speechProvider = 'sarvam'
  const transcribe = jest.spyOn(SarvamSpeechProvider.prototype, 'transcribe').mockResolvedValue({ transcript: 'apple', available: true, provider: 'sarvam', model: 'saaras:v4', latencyMs: 1 })
  await KGSpeechService.transcribe({ audioBase64: 'dGVzdA==', mimeType: 'audio/webm', durationMs: 1200 })
  expect(transcribe).toHaveBeenCalledWith({ audioBase64: 'dGVzdA==', mimeType: 'audio/webm', durationMs: 1200 })
})

it('keeps the legacy Groq override available during migration', async () => {
  process.env.KG_ALPHABET_STT_PROVIDER = 'groq'
  env.speechProvider = 'sarvam'
  const transcribe = jest.spyOn(GroqSpeechProvider.prototype, 'transcribe').mockResolvedValue({ transcript: 'apple', available: true, provider: 'groq-whisper', model: 'test', latencyMs: 1 })
  await KGSpeechService.transcribe({ audioBase64: 'dGVzdA==', mimeType: 'audio/webm', durationMs: 1200 })
  expect(transcribe).toHaveBeenCalledWith(expect.objectContaining({ mode: 'accurate', qualityMetadata: true }))
})

it('blocks production Python STT configured on localhost instead of silently switching provider', async () => {
  process.env.KG_ALPHABET_STT_PROVIDER = 'python'; env.isProd = true; env.aiServiceUrl = 'http://127.0.0.1:8001'
  const python = jest.spyOn(PythonSpeechProvider.prototype, 'transcribe')
  await expect(KGSpeechService.transcribe({ audioBase64: 'dGVzdA==', mimeType: 'audio/webm', durationMs: 1000 })).rejects.toMatchObject({ statusCode: 502 })
  expect(python).not.toHaveBeenCalled()
})

it('validates the requested English word, handles Hindi script, and repeats ambiguous recognition', () => {
  expect(evaluateKGSpeech('एप्पल', 'A', 'word')).toBe('correct')
  expect(evaluateKGSpeech('यह बॉल है', 'B', 'word')).toBe('correct')
  expect(evaluateKGSpeech('कैट', 'C', 'word')).toBe('correct')
  expect(evaluateKGSpeech('डॉग', 'D', 'word')).toBe('correct')
  expect(evaluateKGSpeech('bee', 'B', 'word')).toBe('correct')
  expect(evaluateKGSpeech('bee', 'B', 'letter')).toBe('correct')
  expect(evaluateKGSpeech('apple ball cat dog', 'A', 'word')).toBe('unclear')
  expect(evaluateKGSpeech('not apple', 'A', 'word')).toBe('unclear')
  expect(evaluateKGSpeech('appl', 'A', 'word')).toBe('correct')
  expect(evaluateKGSpeech('ball', 'A', 'word')).toBe('incorrect')
  expect(evaluateKGSpeech('सेब', 'A', 'word')).toBe('unclear')
})
