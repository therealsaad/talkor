import { ApiError } from '../../utils/ApiError'
import { chooseTalkoraBilingualVoice } from './class1-voice-language'
import { logger } from '../../utils/logger'
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

  private async generate(text: string, kindergarten = false): Promise<Buffer> {
    const s = this.settings()
    if (!s.key) throw ApiError.provider('Azure Speech is not configured')
    const selected = chooseTalkoraBilingualVoice(text, s.voice)

    const url = `https://${s.region}.tts.speech.microsoft.com/cognitiveservices/v1`
    const rate = kindergarten ? (process.env.KG_AZURE_SPEECH_RATE?.trim() || "+5%") : s.rate
    const pitch = kindergarten ? (process.env.KG_AZURE_SPEECH_PITCH?.trim() || "+6%") : s.pitch
    const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${selected.locale}"><voice name="${selected.voice}"><prosody rate="${rate}" pitch="${pitch}">${escapeXml(text)}</prosody></voice></speak>`

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
      logger.warn('Azure TTS request failed', { error })
      throw ApiError.provider('TTS_SERVICE_UNAVAILABLE')
    }

    if (!response.ok) {
      const detail = await response.text().catch(() => '')
      logger.warn('Azure TTS returned an error', { status: response.status, detail: detail.slice(0, 300) })
      throw ApiError.provider('TTS_GENERATION_FAILED')
    }

    return Buffer.from(await response.arrayBuffer())
  }

  private contentType(): string {
    return this.settings().format.startsWith('audio-') ? 'audio/mpeg' : 'audio/wav'
  }

  /** KG speech is transient: no MongoDB, no S3, no persistent audio cache. */
  async synthesizeUncached(text: string): Promise<{ audio: Buffer; contentType: string }> {
    const normalized = text.replace(/\s+/g, ' ').trim()
    if (!normalized || normalized.length > 320) throw ApiError.badRequest('KG voice text must be 1–320 characters')
    return { audio: await this.generate(normalized, true), contentType: this.contentType() }
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

  async synthesizeStream(text: string): Promise<VoiceStreamResult> {
    const normalized = text.trim()
    if (!normalized) throw ApiError.badRequest('text is required')
    if (!this.settings().key) throw ApiError.provider('Azure Speech is not configured')

    const audio = await this.generate(normalized)

    return {
      body: streamFromBuffer(audio),
      contentType: this.contentType(),
      provider: this.name,
      metadata: {
        'x-talkora-cache': 'BYPASS',
        'x-talkora-voice-id': chooseTalkoraBilingualVoice(text, this.settings().voice).voice,
      },
    }
  }
}
