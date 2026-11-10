import { afterEach, expect, test } from '@jest/globals'
import { AzureVoiceProvider } from '../src/providers/voice/AzureVoiceProvider'
import { logger } from '../src/utils/logger'

const originalFetch = globalThis.fetch
const initialKey = process.env.AZURE_SPEECH_KEY
const initialRegion = process.env.AZURE_SPEECH_REGION

afterEach(() => {
  jest.restoreAllMocks()
  globalThis.fetch = originalFetch
  if (initialKey === undefined) delete process.env.AZURE_SPEECH_KEY
  else process.env.AZURE_SPEECH_KEY = initialKey
  if (initialRegion === undefined) delete process.env.AZURE_SPEECH_REGION
  else process.env.AZURE_SPEECH_REGION = initialRegion
})

test('Azure provider errors cannot echo private SSML or upstream response text into logs', async () => {
  process.env.AZURE_SPEECH_KEY = 'test-only-key'
  const privateText = 'CANARY_PRIVATE_CHILD_TEXT'
  const warnings: unknown[][] = []
  jest.spyOn(logger, 'warn').mockImplementation((...args) => { warnings.push(args) })
  globalThis.fetch = async () => new Response(privateText, { status: 400 })
  await expect(new AzureVoiceProvider().synthesizeStream(privateText)).rejects.toThrow()
  expect(warnings).toEqual([['Azure TTS returned an error', { status: 400 }]])
  expect(JSON.stringify(warnings)).not.toContain(privateText)
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
