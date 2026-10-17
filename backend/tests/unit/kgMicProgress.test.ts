jest.mock('../../src/models/VoiceSession', () => ({ VoiceSession: { create: jest.fn(), findOne: jest.fn() } }))
jest.mock('../../src/models/Activity', () => ({ Activity: { findById: jest.fn() } }))
jest.mock('../../src/models/ActivityAttempt', () => ({ ActivityAttempt: { exists: jest.fn() } }))
jest.mock('../../src/services/curriculum-access.service', () => ({ CurriculumAccessService: { assertActivity: jest.fn() } }))
jest.mock('../../src/services/progress.service', () => ({ ProgressService: { submitAttempt: jest.fn() } }))
jest.mock('../../src/providers/speech', () => ({ getSpeechProvider: jest.fn() }))
jest.mock('../../src/providers/pronunciation', () => ({ getPronunciationProvider: jest.fn() }))
jest.mock('../../src/services/missJulie.service', () => ({ MissJulieService: { converse: jest.fn() } }))

import { VoiceSession } from '../../src/models/VoiceSession'
import { Activity } from '../../src/models/Activity'
import { ActivityAttempt } from '../../src/models/ActivityAttempt'
import { CurriculumAccessService } from '../../src/services/curriculum-access.service'
import { ProgressService } from '../../src/services/progress.service'
import { getSpeechProvider } from '../../src/providers/speech'
import { getPronunciationProvider } from '../../src/providers/pronunciation'
import { VoiceService } from '../../src/services/voice.service'

describe('KG microphone to progress flow', () => {
  it('transcribes an authorized KG lesson response and records it against that student activity', async () => {
    const studentId = 'kg-student-1'
    const lessonId = '64b000000000000000000001'
    const activityId = '64b000000000000000000002'
    const activity = {
      _id: activityId,
      status: 'active',
      target: 'Say I see a cat',
      prompt: 'Look and say what you see.',
      type: 'SPEAK_PROMPT',
      aiEnabled: false,
      metadata: {},
      lessonId,
    }
    const startedAt = new Date('2026-10-13T10:00:00.000Z')
    const session = {
      _id: 'voice-session-kg-1',
      studentId,
      lessonId,
      activityId,
      startedAt,
      metadata: { expectedPhrase: activity.target },
      status: 'active',
      save: jest.fn().mockResolvedValue(undefined),
    }
    const transcribe = jest.fn().mockResolvedValue({ transcript: 'I see a cat', provider: 'mock-stt' })
    const evaluate = jest.fn().mockResolvedValue({
      score: 90,
      feedback: 'Nice speaking!',
      correctWords: ['I', 'see', 'a', 'cat'],
      wrongWords: [],
      missingWords: [],
      extraWords: [],
      wordOrderMatched: true,
      sentenceSimilarity: 90,
    })
    ;(getSpeechProvider as jest.Mock).mockReturnValue({ name: 'mock-stt', transcribe })
    ;(getPronunciationProvider as jest.Mock).mockReturnValue({ evaluate })
    ;(CurriculumAccessService.assertActivity as jest.Mock).mockResolvedValue({ activity })
    ;(Activity.findById as jest.Mock).mockReturnValue({ select: async () => activity })
    ;(VoiceSession.create as jest.Mock).mockResolvedValue(session)
    ;(VoiceSession.findOne as jest.Mock).mockResolvedValue(session)
    ;(ActivityAttempt.exists as jest.Mock).mockResolvedValue(false)
    ;(ProgressService.submitAttempt as jest.Mock).mockResolvedValue({ xpAwarded: 12 })

    const transcript = await VoiceService.transcribeAudio({
      audioBase64: 'c2FtcGxlLWF1ZGlv',
      mimeType: 'audio/webm;codecs=opus',
      durationMs: 1800,
    })
    if (!transcript.transcript) throw new Error('Mock speech provider returned no transcript')
    await VoiceService.startSession(studentId, { lessonId, activityId, expectedPhrase: activity.target })
    const completedSession = await VoiceService.submitTranscript(studentId, session._id, { transcript: transcript.transcript })

    expect(transcribe).toHaveBeenCalledWith(expect.objectContaining({ mimeType: 'audio/webm;codecs=opus', durationMs: 1800 }))
    expect(CurriculumAccessService.assertActivity).toHaveBeenCalledWith(studentId, activityId)
    expect(ProgressService.submitAttempt).toHaveBeenCalledWith(expect.objectContaining({
      studentId,
      activityId,
      answer: 'I see a cat',
      idempotencyKey: `voice:${session._id}`,
    }))
    expect(completedSession).toMatchObject({ status: 'completed', transcript: 'I see a cat', xpAwarded: 12 })
  })
})
