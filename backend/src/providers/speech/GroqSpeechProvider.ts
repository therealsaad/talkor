import { env } from '../../config/env'
import { SpeechRecognitionProvider } from './SpeechRecognitionProvider'
import { ApiError } from '../../utils/ApiError'
import { logger } from '../../utils/logger'
import { isSupportedVoiceAudioMimeType } from '../../schemas/voice.schema'

const GROQ_TRANSCRIBE_URL =
  'https://api.groq.com/openai/v1/audio/transcriptions'

function decodeAudioBase64(value: string): Buffer {
  const encoded = value.trim()
  if (!encoded) throw ApiError.badRequest('Audio payload is empty')

  const unpadded = encoded.replace(/=+$/, '')
  if (!/^[A-Za-z0-9+/]+$/.test(unpadded) || unpadded.length % 4 === 1) {
    throw ApiError.badRequest('Audio payload is not valid base64')
  }
  const normalized = unpadded + '='.repeat((4 - (unpadded.length % 4)) % 4)
  if (encoded !== unpadded && encoded !== normalized) {
    throw ApiError.badRequest('Audio payload is not valid base64')
  }

  const bytes = Buffer.from(normalized, 'base64')
  if (!bytes.length) throw ApiError.badRequest('Audio payload is empty')
  return bytes
}

function extensionFor(
  mimeType?: string,
): string {
  const mime =
    (mimeType || '')
      .split(';', 1)[0]
      .trim()
      .toLowerCase()

  if (mime.includes('wav')) {
    return '.wav'
  }

  if (
    mime.includes('mpeg') ||
    mime.includes('mp3')
  ) {
    return '.mp3'
  }

  if (
    mime.includes('mp4') ||
    mime.includes('m4a') ||
    mime.includes('x-m4a')
  ) {
    return '.m4a'
  }

  if (mime.includes('ogg')) {
    return '.ogg'
  }

  if (mime.includes('flac')) {
    return '.flac'
  }

  if (mime.includes('opus')) {
    return '.ogg'
  }

  return '.webm'
}

function normalizeLanguage(
  value?: string,
): string {
  const raw =
    (value || '')
      .trim()
      .toLowerCase()

  // Empty means provider auto-detects Hindi/English for beginner lessons.
  if (!raw) {
    return ''
  }

  const aliases: Record<string, string> = {
    english: 'en',
    en: 'en',
    'en-in': 'en',
    'en_in': 'en',
    'en-us': 'en',
    'en_us': 'en',
    hindi: 'hi',
    hi: 'hi',
    'hi-in': 'hi',
    'hi_in': 'hi',
  }

  if (aliases[raw]) {
    return aliases[raw]
  }

  const base =
    raw.split(/[-_]/, 1)[0] ||
    'en'

  return aliases[base] || base
}

function looksLikeLeakedPrompt(
  text: string,
): boolean {
  const normalized =
    text
      .toLowerCase()
      .replace(
        /[^a-z\s]/g,
        ' ',
      )
      .replace(
        /\s+/g,
        ' ',
      )
      .trim()

  return (
    normalized.includes(
      'preserve student names and common indian words',
    ) ||
    normalized.includes(
      'preserve names and common indian words',
    ) ||
    normalized.includes(
      'a school student is speaking english with an indian accent',
    )
  )
}

export class GroqSpeechProvider
  implements SpeechRecognitionProvider
{
  name =
    'groq-whisper'

  async transcribe(input: {
    audioBase64: string

    mimeType?: string

    durationMs?: number

    /** fast = turbo (live chat); accurate = whisper-large-v3 (syllabus / pronunciation) */
    mode?: 'fast' | 'accurate'
    /** KG opts in; existing Class 4 JSON behavior stays unchanged. */
    qualityMetadata?: boolean
    languageOverride?: string
  }) {
    const apiKey =
      env.groqApiKey?.trim()

    if (!apiKey) {
      throw ApiError.provider(
        'STT_FAILED: GROQ_API_KEY is missing',
      )
    }

    const startedAt =
      Date.now()

    const bytes = decodeAudioBase64(input.audioBase64)
    const rawMimeType = input.mimeType?.trim() || 'audio/webm'
    const mimeType = rawMimeType.split(';', 1)[0]?.trim().toLowerCase() || ''
    if (!isSupportedVoiceAudioMimeType(mimeType)) {
      throw ApiError.badRequest('Unsupported audio type')
    }

    const accurateModel =
      env.groqSttAccurateModel?.trim() ||
      'whisper-large-v3'
    const fastModel =
      env.groqSttModel?.trim() ||
      'whisper-large-v3-turbo'
    const model =
      input.mode === 'accurate'
        ? accurateModel
        : fastModel

    const language =
      normalizeLanguage(
        input.languageOverride ?? env.groqSttLanguage,
      )

    const form =
      new FormData()

    form.append(
      'file',
      new Blob(
        [bytes],
        {
          type:
            mimeType,
        },
      ),
      `student-speech${extensionFor(
        mimeType,
      )}`,
    )

    form.append(
      'model',
      model,
    )

    form.append(
      'response_format',
      input.qualityMetadata ? 'verbose_json' : 'json',
    )

    form.append(
      'temperature',
      '0',
    )

    if (language) {
      form.append('language', language)
    }

    /*
     * IMPORTANT:
     *
     * DO NOT send a Whisper prompt like:
     *
     * "Preserve student names..."
     *
     * Whisper can hallucinate that prompt
     * into the student's transcript.
     */

    let response:
      Response

    try {
      response =
        await fetch(
          GROQ_TRANSCRIBE_URL,
          {
            method:
              'POST',

            headers: {
              Authorization:
                `Bearer ${apiKey}`,
            },

            body:
              form,

            signal:
              AbortSignal.timeout(
                env.sttTimeoutMs,
              ),
          },
        )
    } catch (error) {
      const metadata = {
        errorName: error instanceof Error ? error.name : 'UnknownError',
        model,
        language,
        mimeType,
        bytes: bytes.length,
        durationMs: input.durationMs,
        latencyMs: Date.now() - startedAt,
      }
      if (error instanceof Error && error.name === 'TimeoutError') {
        logger.warn('Groq STT request timed out', metadata)
        throw ApiError.gatewayTimeout('Speech recognition timed out. Please try again shortly.')
      }
      logger.error('Groq STT request failed before response', metadata)
      throw ApiError.provider('Could not reach speech recognition. Check your connection and try again.')
    }

    if (!response.ok) {
      await response.body?.cancel().catch(() => undefined)
      const metadata = {
        status: response.status,
        model,
        language,
        mimeType,
        bytes: bytes.length,
        durationMs: input.durationMs,
        latencyMs: Date.now() - startedAt,
      }
      if (response.status === 429) {
        logger.warn('Groq STT rate limited the request', metadata)
        throw ApiError.rateLimited('Speech recognition is busy. Please try again shortly.')
      }
      logger.error('Groq STT returned an error', metadata)
      if (response.status === 401 || response.status === 403) {
        throw ApiError.provider('Speech recognition rejected its configured key. Please contact your Talkora administrator.')
      }
      if (response.status === 413) {
        throw ApiError.payloadTooLarge('This recording is too large. Please record a shorter answer.')
      }
      throw ApiError.provider(`Speech recognition failed at the provider (HTTP ${response.status}). Please try again shortly.`)
    }

    const raw = await response.text()

    let result: {
      text?: string
      segments?: Array<{ avg_logprob?: number; no_speech_prob?: number; compression_ratio?: number }>
    }

    try {
      result =
        JSON.parse(
          raw,
        ) as {
          text?: string
          segments?: Array<{ avg_logprob?: number; no_speech_prob?: number; compression_ratio?: number }>
        }
    } catch {
      logger.error(
        'Groq STT returned invalid JSON',
        {
          model,
          latencyMs: Date.now() - startedAt,
        },
      )

      throw ApiError.provider(
        'STT_FAILED: invalid Groq response',
      )
    }

    const transcript = typeof result.text === 'string' ? result.text.trim() : ''

    if (!transcript && !input.qualityMetadata) {
      throw ApiError.businessRule('No speech was detected. Please speak clearly and try again.')
    }

    if (
      !input.qualityMetadata && looksLikeLeakedPrompt(
        transcript,
      )
    ) {
      logger.warn(
        'Groq STT rejected leaked prompt text',
        {
          model,

          durationMs:
            input.durationMs,
        },
      )

      throw ApiError.businessRule('I could not hear that clearly. Please speak again.')
    }

    const latencyMs =
      Date.now() -
      startedAt

    logger.info(
      'Groq STT completed',
      {
        provider:
          this.name,

        model,

        language,

        latencyMs,

        transcriptLength:
          transcript.length,
      },
    )

    return {
      transcript,
      ...(input.qualityMetadata ? {
        // These are conservative quality flags, not calibrated child-speech scores.
        uncertain: !transcript || looksLikeLeakedPrompt(transcript) || !Array.isArray(result.segments) || !result.segments.length || result.segments.some((segment) =>
          !segment || typeof segment.avg_logprob !== 'number' || !Number.isFinite(segment.avg_logprob) || segment.avg_logprob < -0.7 || segment.avg_logprob > 0 ||
          typeof segment.no_speech_prob !== 'number' || !Number.isFinite(segment.no_speech_prob) || segment.no_speech_prob < 0 || segment.no_speech_prob > 0.5 ||
          (segment.compression_ratio !== undefined && (typeof segment.compression_ratio !== 'number' || !Number.isFinite(segment.compression_ratio) || segment.compression_ratio <= 0 || segment.compression_ratio > 2.4))),
      } : {}),

      available:
        true,

      latencyMs,

      provider:
        this.name,

      model,
    }
  }
}
