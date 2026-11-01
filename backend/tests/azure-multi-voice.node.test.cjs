/* Run without credentials/network: node --test backend/tests/azure-multi-voice.node.test.cjs */
const { test, beforeEach } = require('node:test')
const assert = require('node:assert/strict')
const { loadTS } = require('./helpers/load-ts.cjs')

class StubApiError extends Error {
  constructor(code, message) { super(message); this.code = code }
  static provider(message) { return new StubApiError('PROVIDER', message) }
  static badRequest(message) { return new StubApiError('BAD_REQUEST', message) }
}
const ssmlModule = loadTS('providers/voice/multi-voice-ssml.ts')
const { AzureVoiceProvider } = loadTS('providers/voice/AzureVoiceProvider.ts', {
  '../../utils/ApiError': { ApiError: StubApiError },
  './class1-voice-language': { chooseTalkoraBilingualVoice: () => ({ voice: 'en-IN-NeerjaNeural', locale: 'en-IN' }) },
  './multi-voice-ssml': ssmlModule,
  '../../utils/logger': { logger: { warn() {}, info() {} } },
})

const realFetch = globalThis.fetch
let requests
beforeEach(() => {
  requests = []
  process.env.AZURE_SPEECH_KEY = 'test-key'
  process.env.AZURE_SPEECH_REGION = 'centralindia'
  delete process.env.AZURE_SPEECH_OUTPUT_FORMAT
})
const mockFetch = (handler) => { globalThis.fetch = async (url, init) => { requests.push({ url, init }); return handler() } }
const audioResponse = (bytes = 2048) => new Response(new Uint8Array(bytes).fill(7), { status: 200 })
test.afterEach(() => { globalThis.fetch = realFetch })

const billi = [
  { text: 'अच्छा बेटा! बिल्ली! पर अंग्रेज़ी में हम इसे', locale: 'hi-IN' },
  { text: 'cat', locale: 'en-IN' },
  { text: 'कहते हैं। बोलो,', locale: 'hi-IN' },
  { text: 'cat!', locale: 'en-IN' },
]

test('a mixed Hindi/English reply is ONE Azure request with a voice per language', async () => {
  mockFetch(() => audioResponse())
  const result = await new AzureVoiceProvider().synthesizeSegmentsUncached(billi)
  assert.equal(requests.length, 1)
  assert.equal(requests[0].url, 'https://centralindia.tts.speech.microsoft.com/cognitiveservices/v1')
  assert.equal(requests[0].init.headers['Content-Type'], 'application/ssml+xml')
  const names = [...requests[0].init.body.matchAll(/<voice name="([^"]+)"/g)].map((m) => m[1])
  assert.deepEqual(names, ['hi-IN-SwaraNeural', 'en-IN-NeerjaNeural', 'hi-IN-SwaraNeural', 'en-IN-NeerjaNeural'])
  assert.equal(result.audio.length, 2048)
  assert.equal(result.contentType, 'audio/mpeg')
})

test('KG pacing defaults apply to every segment', async () => {
  mockFetch(() => audioResponse())
  await new AzureVoiceProvider().synthesizeSegmentsUncached(billi)
  const prosody = [...requests[0].init.body.matchAll(/<prosody rate="([^"]+)" pitch="([^"]+)"/g)]
  assert.equal(prosody.length, 4)
  assert.ok(prosody.every((m) => m[1] === '+5%' && m[2] === '+6%'))
})

test('empty or truncated audio is an error, never a silent success', async () => {
  mockFetch(() => audioResponse(10))
  await assert.rejects(new AzureVoiceProvider().synthesizeSegmentsUncached(billi), /TTS_EMPTY_AUDIO/)
})

test('an Azure HTTP error and a network failure both surface as provider errors', async () => {
  mockFetch(() => new Response('nope', { status: 500 }))
  await assert.rejects(new AzureVoiceProvider().synthesizeSegmentsUncached(billi), /TTS_GENERATION_FAILED/)
  globalThis.fetch = async () => { throw new Error('socket hang up') }
  await assert.rejects(new AzureVoiceProvider().synthesizeSegmentsUncached(billi), /TTS_SERVICE_UNAVAILABLE/)
})

test('invalid segments are rejected before any network call', async () => {
  mockFetch(() => audioResponse())
  await assert.rejects(new AzureVoiceProvider().synthesizeSegmentsUncached([]), (error) => error.code === 'BAD_REQUEST')
  assert.equal(requests.length, 0)
})

test('without an Azure key it fails fast instead of calling out', async () => {
  process.env.AZURE_SPEECH_KEY = ''
  mockFetch(() => audioResponse())
  await assert.rejects(new AzureVoiceProvider().synthesizeSegmentsUncached(billi), /not configured/)
  assert.equal(requests.length, 0)
})
