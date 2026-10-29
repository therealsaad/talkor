import type { Request, Response } from 'express'
import { AzureVoiceProvider } from '../providers/voice/AzureVoiceProvider'
import { KGSpeechService } from '../services/kg-speech.service'
import { isSupportedVoiceAudioMimeType } from '../schemas/voice.schema'
import { ApiError } from '../utils/ApiError'
import { ok } from '../utils/ApiResponse'
import { catchAsync } from '../utils/catchAsync'
import {
  gradeLevel3Transcription,
  LEVEL3_LETTERS,
  LEVEL3_NARRATION,
  type Level3Letter,
  type Level3NarrationId,
} from '../kg/level3-content'

const MAX_AUDIO_BASE64_LENGTH = 11_000_000

function validLetter(value: unknown): value is Level3Letter {
  return typeof value === 'string' && LEVEL3_LETTERS.includes(value as Level3Letter)
}

export const KGLevel3PreviewController = {
  narration: catchAsync(async (req: Request, res: Response) => {
    const narrationId = req.params.id as Level3NarrationId
    if (!Object.prototype.hasOwnProperty.call(LEVEL3_NARRATION, narrationId)) {
      throw ApiError.notFound('Level 3 narration not found')
    }

    const { audio, contentType } = await new AzureVoiceProvider().synthesizeUncached(LEVEL3_NARRATION[narrationId])
    res.setHeader('Content-Type', contentType)
    res.setHeader('Content-Length', String(audio.length))
    res.setHeader('Cache-Control', 'private, no-store')
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.send(audio)
  }),

  attempt: catchAsync(async (req: Request, res: Response) => {
    const body = req.body as Record<string, unknown> | undefined
    if (!body || !validLetter(body.letter)) throw ApiError.badRequest('A valid Level 3 letter is required')

    const durationMs = Number(body.durationMs)
    if (!Number.isInteger(durationMs) || durationMs < 250 || durationMs > 12_000) {
      throw ApiError.badRequest('Recording duration must be 0.25–12 seconds')
    }

    if (body.noSpeech === true) return ok(res, { outcome: 'unclear' as const })

    const mimeType = typeof body.mimeType === 'string' ? body.mimeType : ''
    const audioBase64 = body.audioBase64
    if (!isSupportedVoiceAudioMimeType(mimeType) || typeof audioBase64 !== 'string' ||
        audioBase64.length < 128 || audioBase64.length > MAX_AUDIO_BASE64_LENGTH ||
        !/^[A-Za-z0-9+/]+={0,2}$/.test(audioBase64)) {
      throw ApiError.badRequest('A valid short microphone recording is required')
    }

    const stt = await KGSpeechService.transcribe({ audioBase64, mimeType, durationMs })
    if (!stt.available) throw ApiError.provider('Speech recognition is temporarily unavailable')

    const confidence = 'confidence' in stt ? stt.confidence : undefined
    const uncertain = ('uncertain' in stt && stt.uncertain === true) ||
      (typeof confidence === 'number' && (!Number.isFinite(confidence) || confidence < 0.5))
    const outcome = gradeLevel3Transcription(
      String(stt.transcript || ''),
      body.letter,
      uncertain,
    )

    return ok(res, { outcome })
  }),
}
