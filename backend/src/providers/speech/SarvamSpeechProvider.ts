import { env } from '../../config/env'
import { ApiError } from '../../utils/ApiError'
import { logger } from '../../utils/logger'
import { isSupportedVoiceAudioMimeType } from '../../schemas/voice.schema'
import { SpeechRecognitionProvider } from './SpeechRecognitionProvider'

const SARVAM_STT_URL = 'https://api.sarvam.ai/speech-to-text'

export class SarvamSpeechProvider implements SpeechRecognitionProvider {
  name = 'sarvam'

  async transcribe(input: { audioBase64: string; mimeType?: string; durationMs?: number }) {
    if (!env.sarvamApiKey.trim()) throw ApiError.provider('Sarvam speech recognition is not configured')
    const audioBase64 = input.audioBase64?.trim()
    if (!audioBase64 || audioBase64.length > 8_000_000) throw ApiError.badRequest('Audio payload is missing or too large')
    if (!/^[A-Za-z0-9+/]+={0,2}$/.test(audioBase64) || audioBase64.length % 4 !== 0) throw ApiError.badRequest('Audio payload is invalid')
    if (input.durationMs !== undefined && (!Number.isFinite(input.durationMs) || input.durationMs < 250 || input.durationMs > 12_000)) throw ApiError.badRequest('Audio duration must be between 250ms and 12 seconds')
    const mimeType = (input.mimeType || 'audio/webm').split(';', 1)[0].trim().toLowerCase()
    if (!isSupportedVoiceAudioMimeType(mimeType)) throw ApiError.badRequest('Unsupported audio type')
    const bytes = Buffer.from(audioBase64, 'base64')
    if (!bytes.length) throw ApiError.badRequest('Audio payload is empty')
    const extensions: Record<string, string> = { 'audio/mpeg': 'mp3', 'audio/mp3': 'mp3', 'audio/opus': 'ogg', 'audio/x-wav': 'wav', 'audio/wave': 'wav', 'audio/x-m4a': 'm4a' }
    const extension = extensions[mimeType] || mimeType.split('/')[1]
    const language = ['auto', ''].includes(env.sarvamSttLanguage.trim().toLowerCase()) ? 'unknown' : env.sarvamSttLanguage.trim()
    if (!['unknown', 'en-IN', 'hi-IN', 'mr-IN'].includes(language)) throw ApiError.provider('Invalid Sarvam STT language configuration')
    const mode = env.sarvamSttMode.trim()
    if (!['codemix', 'transcribe', 'verbatim'].includes(mode)) throw ApiError.provider('Invalid Sarvam STT mode configuration')

    const controller = new AbortController()
    const startedAt = Date.now()
    const timeout = setTimeout(() => controller.abort(), Math.min(Math.max(1000, env.sarvamTimeoutMs), 30000))
    try {
      const form = new FormData()
      form.append('file', new Blob([bytes], { type: mimeType }), `student-speech.${extension}`)
      form.append('model', env.sarvamSttModel)
      form.append('language_code', language)
      form.append('mode', mode)
      const response = await fetch(SARVAM_STT_URL, {
        method: 'POST',
        headers: { 'api-subscription-key': env.sarvamApiKey },
        body: form,
        signal: controller.signal,
      })
      if (!response.ok) {
        logger.warn('Sarvam STT returned an error', { status: response.status, latencyMs: Date.now() - startedAt })
        if (response.status === 429) throw ApiError.rateLimited('Speech recognition is busy. Please try again shortly.')
        if (response.status === 413) throw ApiError.payloadTooLarge('Please record a shorter answer.')
        if ([401, 403].includes(response.status)) throw ApiError.provider('Sarvam speech key is not authorized')
        throw ApiError.provider('Speech recognition is temporarily unavailable')
      }
      const payload = await response.json() as { transcript?: unknown; language_code?: unknown }
      if (payload.transcript !== undefined && typeof payload.transcript !== 'string') throw ApiError.provider('Speech provider returned an invalid transcript')
      const transcript = typeof payload.transcript === 'string' ? payload.transcript.trim() || null : null
      const latencyMs = Date.now() - startedAt
      logger.info('Sarvam STT completed', { provider: this.name, model: env.sarvamSttModel, latencyMs, durationMs: input.durationMs, transcriptLength: transcript?.length || 0 })
      // available describes the provider, not whether the child spoke.
      return { transcript, available: true, latencyMs, provider: this.name, model: env.sarvamSttModel }
    } catch (error) {
      if (error instanceof ApiError) throw error
      if (error instanceof Error && error.name === 'AbortError') throw ApiError.gatewayTimeout('Speech recognition timed out. Please try again.')
      throw ApiError.provider('Speech service is temporarily unavailable')
    } finally {
      clearTimeout(timeout)
    }
  }
}
