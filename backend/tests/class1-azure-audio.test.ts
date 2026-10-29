import { afterEach, expect, test } from '@jest/globals'
import { AzureVoiceProvider } from '../src/providers/voice/AzureVoiceProvider'

const originalFetch = globalThis.fetch
const initialKey = process.env.AZURE_SPEECH_KEY
const initialRegion = process.env.AZURE_SPEECH_REGION

afterEach(() => {
  globalThis.fetch = originalFetch
  if (initialKey === undefined) delete process.env.AZURE_SPEECH_KEY
  else process.env.AZURE_SPEECH_KEY = initialKey
  if (initialRegion === undefined) delete process.env.AZURE_SPEECH_REGION
  else process.env.AZURE_SPEECH_REGION = initialRegion
})

test('Azure 200 with empty speech bytes is a provider failure, not a spoken turn', async () => {
  process.env.AZURE_SPEECH_KEY = 'test-only-key'
  globalThis.fetch = async () => new Response(new Uint8Array(0), { status: 200 })
  await expect(new AzureVoiceProvider().synthesizeStream('Hello, Grade One!')).rejects.toThrow()
})

test('Class 1 Hindi speech selects a matching Azure voice in the same TTS request', async () => {
  process.env.AZURE_SPEECH_KEY = 'test-only-key'
  process.env.AZURE_SPEECH_REGION = 'centralindia'
  let ssml = ''
  let calls = 0
  globalThis.fetch = async (_url, init) => {
    calls++
    ssml = String(init?.body)
    return new Response(new Uint8Array(1024), { status: 200 })
  }
  const result = await new AzureVoiceProvider().synthesizeStream('चलो स्कूल चलें', { class1Lesson: true })
  expect(calls).toBe(1)
  expect(ssml).toContain('hi-IN-SwaraNeural')
  expect(result.metadata?.['x-talkora-voice-id']).toBe('hi-IN-SwaraNeural')
})

test('Class 1 Sarvam mr-IN routes to Marathi neural voice without additional requests', async () => {
  process.env.AZURE_SPEECH_KEY = 'test-only-key'
  let calls = 0
  let ssml = ''
  globalThis.fetch = async (_url, init) => {
    calls += 1
    ssml = String(init?.body)
    return new Response(new Uint8Array(1024), { status: 200 })
  }
  const audio = await new AzureVoiceProvider().synthesizeStream(
    'चला म्हणू: I can jump.', { class1Lesson: true, language: 'mr-IN', conversation: true },
  )
  expect(calls).toBe(1)
  expect(ssml).toContain('mr-IN-AarohiNeural')
  expect(audio.metadata?.['x-talkora-voice-id']).toBe('mr-IN-AarohiNeural')
})
test('Class 1 explicit Hindi is not incorrectly guessed to be Marathi', async () => {
  process.env.AZURE_SPEECH_KEY = 'test-only-key'
  let ssml = ''
  globalThis.fetch = async (_url, init) => {
    ssml = String(init?.body)
    return new Response(new Uint8Array(1024), { status: 200 })
  }
  await new AzureVoiceProvider().synthesizeStream('शाळेत चलो', { class1Lesson: true, language: 'hi-IN' })
  expect(ssml).toContain('hi-IN-SwaraNeural')
})
