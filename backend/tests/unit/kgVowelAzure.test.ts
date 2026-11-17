import { AzureVoiceProvider } from '../../src/providers/voice/AzureVoiceProvider'

describe('KG Vowel Garden Azure phonemes', () => {
  const previousKey = process.env.AZURE_SPEECH_KEY

  afterEach(() => {
    jest.restoreAllMocks()
    if (previousKey === undefined) delete process.env.AZURE_SPEECH_KEY
    else process.env.AZURE_SPEECH_KEY = previousKey
  })

  it('sends supported vowel hints as IPA phonemes and escapes surrounding text', async () => {
    process.env.AZURE_SPEECH_KEY = 'fake-test-key-not-a-live-Azure-credential'
    const mock = jest.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(new Uint8Array(512), { status: 200 }),
    )

    await new AzureVoiceProvider().synthesizeKGVowelUncached(
      'Say [[A]] & [[E]] slowly.',
    )

    const ssml = String(mock.mock.calls[0][1]?.body)
    expect(ssml).toContain('<phoneme alphabet="ipa" ph="æ">A</phoneme>')
    expect(ssml).toContain('<phoneme alphabet="ipa" ph="ɛ">E</phoneme>')
    expect(ssml).toContain('Say ')
    expect(ssml).toContain('&amp;')
    expect(ssml).toContain('slowly.')
  })

  it('rejects unsupported vowel hints before calling Azure', async () => {
    process.env.AZURE_SPEECH_KEY = 'fake-test-key-not-a-live-Azure-credential'
    const mock = jest.spyOn(globalThis, 'fetch')

    await expect(
      new AzureVoiceProvider().synthesizeKGVowelUncached('Say [[Z]].'),
    ).rejects.toThrow('A supported vowel sound is required')
    expect(mock).not.toHaveBeenCalled()
  })
})
