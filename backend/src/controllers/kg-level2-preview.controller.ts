import type { Request, Response } from 'express'
import { getKGAzureNarrationAudio } from '../services/kg-azure-narration.service'
import { KGSpeechService } from '../services/kg-speech.service'
import { isSupportedVoiceAudioMimeType } from '../schemas/voice.schema'
import { ApiError } from '../utils/ApiError'
import { ok } from '../utils/ApiResponse'
import { catchAsync } from '../utils/catchAsync'
import {
  gradeLevel2Transcription,
  LEVEL2_LETTERS,
  LEVEL2_NARRATION,
  type Level2Letter,
  type Level2NarrationId,
} from '../kg/level2-content'

const MAX_AUDIO_BASE64_LENGTH = 11_000_000

function validLetter(value: unknown): value is Level2Letter {
  return typeof value === 'string' && LEVEL2_LETTERS.includes(value as Level2Letter)
}

export const KGLevel2PreviewController = {
  narration: catchAsync(async (req: Request, res: Response) => {
    const narrationId = req.params.id as Level2NarrationId
    if (!Object.prototype.hasOwnProperty.call(LEVEL2_NARRATION, narrationId)) {
      throw ApiError.notFound('Level 2 narration not found')
    }

    const { audio, contentType, source } = await getKGAzureNarrationAudio({
      level: 2, id: narrationId, text: LEVEL2_NARRATION[narrationId],
    })
    res.setHeader('Content-Type', contentType)
    res.setHeader('Content-Length', String(audio.length))
    res.setHeader('X-Talkora-Cache', source.toUpperCase())
    res.setHeader('Cache-Control', 'private, no-store')
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.send(audio)
  }),

  attempt: catchAsync(async (req: Request, res: Response) => {
    const body = req.body as Record<string, unknown> | undefined
    if (!body || !validLetter(body.letter)) throw ApiError.badRequest('A valid Level 2 letter from E to J is required')

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
    const outcome = gradeLevel2Transcription(String(stt.transcript || ''), body.letter, uncertain)

    return ok(res, { outcome })
  }),
}
