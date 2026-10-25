import { AzureVoiceProvider } from '../../src/providers/voice/AzureVoiceProvider'
import { AudioCacheService } from '../../src/services/AudioCacheService'

const previousKey = process.env.AZURE_SPEECH_KEY

afterEach(() => {
  if (previousKey === undefined) delete process.env.AZURE_SPEECH_KEY
  else process.env.AZURE_SPEECH_KEY = previousKey
  jest.restoreAllMocks()
})

it('speaks new Class 1+ feedback without persisting individual replies in S3/Atlas', async () => {
  process.env.AZURE_SPEECH_KEY = 'test-only-key'
  const cacheRead = jest.spyOn(AudioCacheService, 'get')
  const cacheWrite = jest.spyOn(AudioCacheService, 'put')
  const fetchMock = jest.spyOn(globalThis, 'fetch').mockImplementation(async () =>
    new Response(Uint8Array.from([73, 68, 51, 1, 2, 3]), { status: 200 }),
  )

  const provider = new AzureVoiceProvider()
  const streamed = await provider.synthesizeStream('Nice effort, beta ji! Say apple.')
  expect(streamed.provider).toBe('azure-neerja')
  expect(streamed.metadata?.['x-talkora-cache']).toBe('BYPASS')
  expect(Buffer.from(await new Response(streamed.body).arrayBuffer())).toEqual(Buffer.from([73, 68, 51, 1, 2, 3]))

  const generated = await provider.synthesize('Try this sound once more!')
  expect(generated.available).toBe(true)
  expect(generated.audioBase64).toBe(Buffer.from([73, 68, 51, 1, 2, 3]).toString('base64'))
  expect(fetchMock).toHaveBeenCalledTimes(2)
  expect(cacheRead).not.toHaveBeenCalled()
  expect(cacheWrite).not.toHaveBeenCalled()
})
