import { AzureVoiceProvider } from '../../src/providers/voice/AzureVoiceProvider'

describe('Class 1 poem: Azure is the actual teacher voice, not a generic word clip', () => {
  const previous = {
    key: process.env.AZURE_SPEECH_KEY,
    region: process.env.AZURE_SPEECH_REGION,
    rate: process.env.AZURE_SPEECH_RATE,
  }
  afterEach(() => {
    jest.restoreAllMocks()
    for (const [key, value] of [
      ['AZURE_SPEECH_KEY', previous.key],
      ['AZURE_SPEECH_REGION', previous.region],
      ['AZURE_SPEECH_RATE', previous.rate],
    ] as const) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
  })

  it('synthesizes the complete highlighted two lines with English Neural voice, slow rhythm and breaks', async () => {
    process.env.AZURE_SPEECH_KEY = 'fake-test-key-not-a-live-Azure-credential'
    process.env.AZURE_SPEECH_REGION = 'centralindia'
    const mock = jest.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(new Uint8Array(512), { status: 200, headers: { 'Content-Type': 'audio/mpeg' } }),
    )
    const voice = new AzureVoiceProvider()
    const result = await voice.synthesizeStream(
      'See me grin.\nWhen the bell rings, I go in.',
      { class1Lesson: true, conversation: true, poemRecitation: true, language: 'en-IN' },
    )
    expect(result.contentType).toBe('audio/mpeg')
    expect(result.provider).toBe('azure-neerja')
    expect(mock).toHaveBeenCalledTimes(1)
    expect(mock.mock.calls[0][0]).toContain('centralindia.tts.speech.microsoft.com')
    const request = mock.mock.calls[0][1]
    const ssml = String(request?.body)
    expect(ssml).toContain('voice name="en-IN-NeerjaNeural"')
    expect(ssml).toContain('rate="-14%"')
    expect(ssml).toContain('pitch="+3%"')
    expect(ssml).toContain('See me grin.')
    expect(ssml).toContain('<break time="360ms"/>')
    expect(ssml).toMatch(/<voice name="en-IN-NeerjaNeural"><prosody[^>]+><break time="360ms"\/>When the bell rings, I go in\.<\/prosody><\/voice>/)
    expect(ssml).not.toMatch(/<\/voice>\s*<break\b/)
    expect(ssml).toContain('When the bell rings, I go in.')
    expect(ssml).not.toContain('Can you say at?')
    const reader = result.body.getReader()
    const packet = await reader.read()
    expect(packet.value?.byteLength).toBe(512)
  })

  it('normal dynamic feedback is NOT a musical recital and does not get line breaks inserted', async () => {
    process.env.AZURE_SPEECH_KEY = 'fake-test-key-not-a-live-Azure-credential'
    const mock = jest.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(new Uint8Array(512), { status: 200 }),
    )
    await new AzureVoiceProvider().synthesizeStream('Hello, learner!\nTry again.', {
      class1Lesson: true, conversation: true, language: 'en-IN',
    })
    const ssml = String(mock.mock.calls[0][1]?.body)
    expect(ssml).not.toContain('<break time="360ms"/>')
    expect(ssml).not.toContain('rate="-14%"')
  })
  it('reads Hindi help in Swara but switches to English Neerja for the actual poem lines', async () => {
    process.env.AZURE_SPEECH_KEY = 'fake-test-key-not-a-live-Azure-credential'
    const mock = jest.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(new Uint8Array(512), { status: 200 }),
    )
    await new AzureVoiceProvider().synthesizeStream(
      'इन दोनों पंक्तियों को ध्यान से सुनो।\nSee me grin.\nWhen the bell rings, I go in.',
      { class1Lesson: true, conversation: true, poemRecitation: true, language: 'hi-IN' },
    )
    const ssml = String(mock.mock.calls[0][1]?.body)
    expect(ssml).toContain('voice name="hi-IN-SwaraNeural"')
    expect(ssml).toContain('voice name="en-IN-NeerjaNeural"')
    expect(ssml.match(/<break time="360ms"\/>/g)).toHaveLength(2)
    expect(ssml).toContain('See me grin.')
    expect(ssml).toContain('When the bell rings, I go in.')
    expect(ssml).not.toMatch(/<\/voice>\s*<break\b/)
    expect(ssml).toMatch(/<voice name="en-IN-NeerjaNeural"><prosody[^>]+><break time="360ms"\/>See me grin\./)
  })

  it('reads Marathi help in Aarohi, but uses the English poem voice on Latin-script lines', async () => {
    process.env.AZURE_SPEECH_KEY = 'fake-test-key-not-a-live-Azure-credential'
    const mock = jest.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(new Uint8Array(512), { status: 200 }),
    )
    await new AzureVoiceProvider().synthesizeStream(
      'या दोन्ही ओळी ऐक.\nSee me grin.',
      { class1Lesson: true, poemRecitation: true, language: 'mr-IN' },
    )
    const ssml = String(mock.mock.calls[0][1]?.body)
    expect(ssml).toContain('voice name="mr-IN-AarohiNeural"')
    expect(ssml).toContain('voice name="en-IN-NeerjaNeural"')
  })

  it('submits a valid poem tree to Azure rather than a root-level break that returns 400', async () => {
    process.env.AZURE_SPEECH_KEY = 'fake-test-key-not-a-live-Azure-credential'
    const azureRequest = jest.spyOn(globalThis, 'fetch').mockImplementation(async (_url, init) => {
      const body = String(init?.body)
      // Mimic Azure's documented SSML hierarchy. Only voice nodes are legal
      // direct children of speak; breaks belong inside prosody/voice nodes.
      if (/<\\/voice>\\s*<break\\b/.test(body)) return new Response('Malformed SSML', { status: 400 })
      if (!body.includes('<prosody') || !body.includes('<break time="360ms"/>')) {
        return new Response('Missing poem pauses', { status: 400 })
      }
      return new Response(new Uint8Array(512), { status: 200 })
    })
    await expect(new AzureVoiceProvider().synthesizeStream(
      'See me skip.\\nSee me run.\\nI’m going to school like everyone.',
      { class1Lesson: true, poemRecitation: true, language: 'en-IN' },
    )).resolves.toMatchObject({ contentType: 'audio/mpeg', provider: 'azure-neerja' })
    expect(azureRequest).toHaveBeenCalledTimes(1)
  })

})
