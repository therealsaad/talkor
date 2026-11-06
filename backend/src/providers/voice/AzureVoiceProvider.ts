
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

  private async generate(
    text: string,
    kindergarten = false,
    class1Lesson = false,
    language?: string,
    vowelPhonemes?: Record<string, string>
  ): Promise<Buffer> {
    const s = this.settings()

    if (!s.key) {
      throw ApiError.provider('Azure Speech is not configured')
    }

    const plainText = text.replace(/\[\[([AEIOU])\]\]/g, '$1')
    const selected = chooseTalkoraBilingualVoice(
      plainText,
      s.voice,
      class1Lesson,
      language
    )

    const url = `https://${s.region}.tts.speech.microsoft.com/cognitiveservices/v1`

    const rate = vowelPhonemes
      ? (process.env.KG_VOWEL_AZURE_SPEECH_RATE?.trim() || '-8%')
      : kindergarten
        ? (process.env.KG_AZURE_SPEECH_RATE?.trim() || '+5%')
        : s.rate

    const pitch = kindergarten
      ? (process.env.KG_AZURE_SPEECH_PITCH?.trim() || '+6%')
      : s.pitch

    const speechMarkup = vowelPhonemes
      ? text.split(/(\[\[[AEIOU]\]\])/g).map((part) => {
          const match = /^\[\[([AEIOU])\]\]$/.exec(part)
          if (!match) return escapeXml(part)

          const letter = match[1]
          const phoneme = vowelPhonemes[letter]

          if (!phoneme) {
            throw ApiError.badRequest('Unsupported vowel phoneme')
          }

          return '<phoneme alphabet="ipa" ph="' + phoneme + '">' +
            letter +
            '</phoneme>'
        }).join('')
      : escapeXml(text)

    // Hindi/Marathi explanation and English target use separate voices.
    // Vowel phoneme teaching keeps its dedicated IPA markup.
    const practice =
      !vowelPhonemes &&
      kindergarten &&
      (selected.locale === 'hi-IN' || selected.locale === 'mr-IN')
        ? /^(.*?)(\s+Say (?:[a-z][a-z'-]{0,26}|the letter [a-z])[.!?]?)$/is.exec(text)
        : null

    const voiceNode = (
      voice: string,
      words: string,
      isMarkup = false
    ) =>
      '<voice name="' + voice + '">' +
      '<prosody rate="' + rate + '" pitch="' + pitch + '">' +
      (isMarkup ? words : escapeXml(words)) +
      '</prosody></voice>'

    const content = vowelPhonemes
      ? voiceNode(selected.voice, speechMarkup, true)
      : practice && practice[1].trim()
        ? voiceNode(selected.voice, practice[1].trim()) +
          voiceNode('en-IN-NeerjaNeural', practice[2].trim())
        : voiceNode(selected.voice, text)

    const ssml =
      '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="' +
      selected.locale +
      '">' +
      content +
      '</speak>'

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
        signal: AbortSignal.timeout(
          kindergarten
            ? Math.max(
                5000,
                Math.min(
                  45000,
                  Number(process.env.KG_AZURE_TTS_TIMEOUT_MS || 25000)
                )
              )
            : s.timeoutMs
        ),
      })
    } catch (error) {
      logger.warn('Azure TTS request failed', { error })
      throw ApiError.provider('TTS_SERVICE_UNAVAILABLE')
    }

    if (!response.ok) {
      const detail = await response.text().catch(() => '')

      logger.warn('Azure TTS returned an error', {
        status: response.status,
        detail: detail.slice(0, 300),
      })

      throw ApiError.provider('TTS_GENERATION_FAILED')
    }

    const audio = Buffer.from(await response.arrayBuffer())

    if (audio.byteLength < 256) {
      logger.warn('Azure TTS returned empty or truncated audio', {
        bytes: audio.byteLength,
      })

      throw ApiError.provider('TTS_EMPTY_AUDIO')
    }

    return audio
  }

  private contentType(): string {
    return this.settings().format.startsWith('audio-')
      ? 'audio/mpeg'
      : 'audio/wav'
  }

  /** KG speech is transient: no MongoDB, no S3, no persistent audio cache. */
  async synthesizeUncached(
    text: string,
    options?: { language?: 'en-IN' | 'hi-IN' | 'mr-IN' }
  ): Promise<{ audio: Buffer; contentType: string }> {
    const normalized = text.replace(/\s+/g, ' ').trim()

    if (!normalized || normalized.length > 320) {
      throw ApiError.badRequest(
        'KG voice text must be 1–320 characters'
      )
    }

    return {
      audio: await this.generate(
        normalized,
        true,
        true,
        options?.language
      ),
      contentType: this.contentType(),
    }
  }

  /** Vowel Garden phoneme teaching uses Azure IPA SSML. */
  async synthesizeKGVowelUncached(
    text: string
  ): Promise<{ audio: Buffer; contentType: string }> {
    const normalized = text.replace(/\s+/g, ' ').trim()

    if (
      !normalized ||
      normalized.length > 320 ||
      !/\[\[[AEIOU]\]\]/.test(normalized) ||
      /\[\[(?![AEIOU]\]\])/.test(normalized)
    ) {
      throw ApiError.badRequest('A supported vowel sound is required')
    }

    const ipa: Record<string, string> = {
      A: 'æ',
      E: 'ɛ',
      I: 'ɪ',
      O: 'ɒ',
      U: 'ʌ',
    }

    const audio = await this.generate(
      normalized,
      true,
      true,
      undefined,
      ipa
    )

    return {
      audio,
      contentType: this.contentType(),
    }
  }

  async synthesize(text: string): Promise<VoiceSynthesisResult> {
    const normalized = text.trim()

    if (!normalized) {
      throw ApiError.badRequest('text is required')
    }

    if (!this.settings().key) {
      throw ApiError.provider('Azure Speech is not configured')
    }

    const audio = await this.generate(normalized)

    return {
      audioUrl: null,
      audioBase64: audio.toString('base64'),
      contentType: this.contentType(),
      available: true,
      provider: this.name,
    }
  }

  async synthesizeStream(
    text: string,
    options?: {
      conversation?: boolean
      class1Lesson?: boolean
      language?: string
    }
  ): Promise<VoiceStreamResult> {
    const normalized = text.trim()

    if (!normalized) {
      throw ApiError.badRequest('text is required')
    }

    if (!this.settings().key) {
      throw ApiError.provider('Azure Speech is not configured')
    }

    const audio = await this.generate(
      normalized,
      false,
      options?.class1Lesson === true,
      options?.language
    )

    return {
      body: streamFromBuffer(audio),
      contentType: this.contentType(),
      provider: this.name,
      metadata: {
        'x-talkora-cache': 'BYPASS',
        'x-talkora-voice-id': chooseTalkoraBilingualVoice(
          text,
          this.settings().voice,
          options?.class1Lesson === true,
          options?.language
        ).voice,
      },
    }
  }
}
