import { afterEach, describe, expect, it, jest } from '@jest/globals'
import express from 'express'
import request from 'supertest'
import { Types } from 'mongoose'
import { Student } from '../../src/models/Student'
import { VoiceService } from '../../src/services/voice.service'
import { createApp } from '../../src/app'
import { signToken } from '../../src/utils/jwt'
import { parseVoiceUpload, VoiceUploadRequest } from '../../src/middleware/voice-upload'
import { errorHandler } from '../../src/middleware/error'
import { transcribeVoiceSchema } from '../../src/schemas/voice.schema'

const app = createApp()
const studentId = new Types.ObjectId().toString()
const schoolId = new Types.ObjectId().toString()
const authorization = `Bearer ${signToken({ sub: studentId, schoolId, role: 'STUDENT' })}`

function mockActiveStudent() {
  jest.spyOn(Student, 'findOne').mockReturnValue({
    select: jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue({ authVersion: 0 } as never),
    }),
  } as never)
}

afterEach(() => {
  jest.restoreAllMocks()
})

describe('voice request schema', () => {
  it('allows 12-second browser captures and rejects unsupported JSON audio MIME types', () => {
    expect(transcribeVoiceSchema.safeParse({
      body: { audioBase64: 'dGVzdA==', mimeType: 'audio/webm;codecs=opus', durationMs: 12000 },
    }).success).toBe(true)
    expect(transcribeVoiceSchema.safeParse({
      body: { audioBase64: 'dGVzdA==', mimeType: 'image/png' },
    }).success).toBe(false)
    expect(transcribeVoiceSchema.safeParse({
      body: { audioBase64: 'dGVzdA==', durationMs: 12001 },
    }).success).toBe(false)
  })
})

describe('voice transcription upload route', () => {
  it('accepts browser WebM/Opus through the recorder 12-second limit', async () => {
    mockActiveStudent()
    const transcribe = jest.spyOn(VoiceService, 'transcribeAudio').mockResolvedValue({
      transcript: 'I like cricket.',
      available: true,
      provider: 'groq-whisper',
      model: 'test-model',
      latencyMs: 1,
    })
    const audio = Buffer.from('synthetic webm fixture')

    await request(app)
      .post('/api/voice/transcribe')
      .set('Authorization', authorization)
      .field('durationMs', '12000')
      .field('mode', 'fast')
      .attach('audio', audio, { filename: 'student-speech.webm', contentType: 'audio/webm;codecs=opus' })
      .expect(200)

    expect(transcribe).toHaveBeenCalledWith({
      audioBase64: audio.toString('base64'),
      mimeType: 'audio/webm;codecs=opus',
      durationMs: 12000,
      mode: 'fast',
    }, studentId)
  })

  it('rejects empty and unsupported audio before calling the speech provider', async () => {
    mockActiveStudent()
    const transcribe = jest.spyOn(VoiceService, 'transcribeAudio').mockResolvedValue({
      transcript: 'unused',
      available: true,
      provider: 'groq-whisper',
      model: 'test-model',
      latencyMs: 1,
    })

    await request(app)
      .post('/api/voice/transcribe')
      .set('Authorization', authorization)
      .attach('audio', Buffer.alloc(0), { filename: 'empty.webm', contentType: 'audio/webm' })
      .expect(400)

    await request(app)
      .post('/api/voice/transcribe')
      .set('Authorization', authorization)
      .attach('audio', Buffer.from('synthetic image fixture'), { filename: 'wrong.png', contentType: 'image/png' })
      .expect(400)

    expect(transcribe).not.toHaveBeenCalled()
  })
})

describe('multipart voice upload limits', () => {
  it('returns payload-too-large when a multipart request exceeds the byte limit', async () => {
    const app = express()
    app.post('/upload', parseVoiceUpload, (req, res) => {
      res.status(200).json({ size: (req as VoiceUploadRequest).voiceFile?.size || 0 })
    })
    app.use(errorHandler)
    const response = await request(app)
      .post('/upload')
      .attach('audio', Buffer.alloc(15 * 1024 * 1024 + 1), {
        filename: 'oversize.webm',
        contentType: 'audio/webm',
      })
      .expect(413)

    expect(response.body.error.code).toBe('PAYLOAD_TOO_LARGE')
  })

})
