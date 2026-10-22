import { env } from '../config/env'
import { GroqSpeechProvider } from '../providers/speech/GroqSpeechProvider'
import { PythonSpeechProvider } from '../providers/speech/PythonSpeechProvider'
import { ApiError } from '../utils/ApiError'

/** KG only: provider selection stays on the server; no recording is persisted. */
export const KGSpeechService = {
  async transcribe(input: { audioBase64: string; mimeType: string; durationMs: number }) {
    const provider = process.env.KG_ALPHABET_STT_PROVIDER || 'groq'
    if (provider === 'groq') {
      return new GroqSpeechProvider().transcribe({ ...input, mode: 'accurate', qualityMetadata: true, languageOverride: '' })
    }
    if (provider !== 'python') throw ApiError.provider('Invalid KG speech provider configuration')
    const hostname = new URL(env.aiServiceUrl).hostname.toLowerCase()
    if (env.isProd && /^(localhost|.*\.localhost|127\..*|\[?::1\]?|0\.0\.0\.0)$/.test(hostname)) {
      throw ApiError.provider('KG speech needs a deployed STT service. A localhost Python service cannot serve production students.')
    }
    return new PythonSpeechProvider().transcribe(input)
  },
}
