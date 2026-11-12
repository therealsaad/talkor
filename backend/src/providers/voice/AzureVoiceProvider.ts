import { ApiError } from '../../utils/ApiError'
import { chooseTalkoraBilingualVoice } from './class1-voice-language'
import { logger } from '../../utils/logger'
import { errorCategory } from '../../utils/error-category'
import type { VoiceProvider, VoiceStreamResult, VoiceSynthesisResult } from './VoiceProvider'

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function streamFromBuffer(audio: Buffer): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new Uint8Array(audio))
      controller.close()
    },
  })
}

export class AzureVoiceProvider implements VoiceProvider {
  name = 'azure-neerja'

  private settings() {
    return {
      key: process.env.AZURE_SPEECH_KEY?.trim() || '',
      region: process.env.AZURE_SPEECH_REGION?.trim() || 'centralindia',
      voice: process.env.AZURE_SPEECH_VOICE?.trim() || 'en-IN-NeerjaNeural',
      rate: process.env.AZURE_SPEECH_RATE?.trim() || '-8%',
      pitch: process.env.AZURE_SPEECH_PITCH?.trim() || '+2%',
      format: process.env.AZURE_SPEECH_OUTPUT_FORMAT?.trim() || 'audio-24khz-48kbitrate-mono-mp3',
      version: process.env.AZURE_VOICE_PROFILE_VERSION?.trim() || 'v2-mp3',
      timeoutMs: Number(process.env.TTS_TIMEOUT_MS || 30000),
    }
  }

  private async generate(text: string, kindergarten = false, class1Lesson = false, language?: string, poemRecitation = false): Promise<Buffer> {
    const s = this.settings()
    if (!s.key) throw ApiError.provider('Azure Speech is not configured')
    const selected = chooseTalkoraBilingualVoice(text, s.voice, class1Lesson, language)

    const url = `https://${s.region}.tts.speech.microsoft.com/cognitiveservices/v1`
    // The poem is a *rhythmic spoken recitation*, not synthesized singing.
    // The same Azure Neural voice recites every line; approved lesson context
    // alone enables a measured tempo and line-to-line breathing pauses.
    const rate = poemRecitation ? '-14%'
      : kindergarten ? (process.env.KG_AZURE_SPEECH_RATE?.trim() || "+5%") : s.rate
    const pitch = poemRecitation ? '+3%'
      : kindergarten ? (process.env.KG_AZURE_SPEECH_PITCH?.trim() || "+6%") : s.pitch
    // A Hindi/Marathi explanation and its English target need two distinct
    // voice segments, not one Hindi/Marathi voice reading the whole sentence.
    // Azure accepts multiple voice nodes inside ONE synthesis request.
    const practice = kindergarten && (selected.locale === 'hi-IN' || selected.locale === 'mr-IN')
      ? /^(.*?)(\s+Say (?:[a-z][a-z'-]{0,26}|the letter [a-z])[.!?]?)$/is.exec(text)
      : null
    // Azure SSML requires pauses inside a <voice> (or its <prosody>),
    // never as a direct child of <speak>. An orphan <break> causes HTTP 400
    // for the multi-line First Day poem, even with valid credentials.
    const voiceNode = (voice: string, words: string, pauseBefore = false) =>
      `<voice name="${voice}"><prosody rate="${rate}" pitch="${pitch}">${pauseBefore ? '<break time="360ms"/>' : ''}${escapeXml(words)}</prosody></voice>`
    // Voice-code hints come from verified Sarvam/Node; actual English poem
    // lines ALWAYS use the English Neural voice. Devanagari support lines
    // switch to the chosen Hindi/Marathi Neural voice in the same SSML call.
    const content = poemRecitation
      ? text.split(/\r?\n/).map(line => line.trim()).filter(Boolean)
          .map((line, index) =>
            voiceNode(/[\u0900-\u097F]/u.test(line) ? selected.voice : s.voice, line, index > 0))
          .join('')
      : practice && practice[1].trim()
        ? voiceNode(selected.voice, practice[1].trim()) + voiceNode('en-IN-NeerjaNeural', practice[2].trim())
        : voiceNode(selected.voice, text)
    const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${selected.locale}">${content}</speak>`

    let response: Response
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': s.key,
          'Content-Type': 'application/ssml+xml',
          'X-Microsoft-OutputFormat': s.format,
          'User-Agent': 'Talkora',
        },
        body: ssml,
        signal: AbortSignal.timeout(kindergarten ? Math.max(5000, Math.min(45000, Number(process.env.KG_AZURE_TTS_TIMEOUT_MS || 25000))) : s.timeoutMs),
      })
    } catch (error) {
      logger.warn('Azure TTS request failed', { errorCategory: errorCategory(error) })
      throw ApiError.provider('TTS_SERVICE_UNAVAILABLE')
    }

    if (!response.ok) {
      await response.body?.cancel().catch(() => undefined)
      logger.warn('Azure TTS returned an error', { status: response.status })
      throw ApiError.provider('TTS_GENERATION_FAILED')
    }

    const audio = Buffer.from(await response.arrayBuffer())
    // A 200 response is not enough: an empty payload produces a silent student
    // screen even though the provider appears healthy in API/network logs.
    if (audio.byteLength < 256) {
      logger.warn('Azure TTS returned empty or truncated audio', { bytes: audio.byteLength })
      throw ApiError.provider('TTS_EMPTY_AUDIO')
    }
    return audio
  }

  private contentType(): string {
    return this.settings().format.startsWith('audio-') ? 'audio/mpeg' : 'audio/wav'
  }

  /** KG speech is transient: no MongoDB, no S3, no persistent audio cache.
   * Honor a server-verified Sarvam language hint for Hindi/Marathi teaching
   * replies, including Romanized child words. English stays the default.
   */
  async synthesizeUncached(text: string, options?: { language?: 'en-IN' | 'hi-IN' | 'mr-IN' }): Promise<{ audio: Buffer; contentType: string }> {
    const normalized = text.replace(/\s+/g, ' ').trim()
    if (!normalized || normalized.length > 320) throw ApiError.badRequest('KG voice text must be 1–320 characters')
    return { audio: await this.generate(normalized, true, true, options?.language), contentType: this.contentType() }
  }

  async synthesize(text: string): Promise<VoiceSynthesisResult> {
    const normalized = text.trim()
    if (!normalized) throw ApiError.badRequest('text is required')
    if (!this.settings().key) throw ApiError.provider('Azure Speech is not configured')

    // Live Class 1+ replies are ephemeral. Only human-reviewed curriculum
    // narration is uploaded to S3; do not persist per-student corrections.
    const audio = await this.generate(normalized)
    return {
      audioUrl: null,
      audioBase64: audio.toString('base64'),
      contentType: this.contentType(),
      available: true,
      provider: this.name,
    }
  }

  async synthesizeStream(text: string, options?: { conversation?: boolean; class1Lesson?: boolean; language?: string; poemRecitation?: boolean }): Promise<VoiceStreamResult> {
    const normalized = text.trim()
    if (!normalized) throw ApiError.badRequest('text is required')
    if (!this.settings().key) throw ApiError.provider('Azure Speech is not configured')

    const audio = await this.generate(normalized, false, options?.class1Lesson === true, options?.language, options?.poemRecitation === true)

    return {
      body: streamFromBuffer(audio),
      contentType: this.contentType(),
      provider: this.name,
      metadata: {
        'x-talkora-cache': 'BYPASS',
        'x-talkora-voice-id': chooseTalkoraBilingualVoice(text, this.settings().voice, options?.class1Lesson === true, options?.language).voice,
      },
    }
  }
}
