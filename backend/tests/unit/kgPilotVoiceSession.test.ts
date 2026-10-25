jest.mock('../../src/models/VoiceSession', () => ({ VoiceSession: { create: jest.fn() } }))
jest.mock('../../src/models/Activity', () => ({ Activity: { findById: jest.fn() } }))
jest.mock('../../src/services/curriculum-access.service', () => ({
  CurriculumAccessService: { assertActivity: jest.fn(), context: jest.fn() },
}))
jest.mock('../../src/providers/speech', () => ({ getSpeechProvider: jest.fn(() => ({ name: 'groq-whisper' })) }))
jest.mock('../../src/services/progress.service', () => ({ ProgressService: { submitAttempt: jest.fn() } }))
jest.mock('../../src/models/ActivityAttempt', () => ({ ActivityAttempt: { exists: jest.fn() } }))
jest.mock('../../src/services/missJulie.service', () => ({ MissJulieService: { converse: jest.fn() } }))

import { VoiceSession } from '../../src/models/VoiceSession'
import { Activity } from '../../src/models/Activity'
import { CurriculumAccessService } from '../../src/services/curriculum-access.service'
import { VoiceService } from '../../src/services/voice.service'
import { getSpeechProvider } from '../../src/providers/speech'

const studentId = '64b000000000000000000001'
const lessonId = '64b000000000000000000002'
const activityId = '64b000000000000000000003'

describe('KG pilot voice sessions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(VoiceSession.create as jest.Mock).mockResolvedValue({ _id: 'voice-session', status: 'active' })
  })

  it('starts a draft voice session after the server-side KG pilot guard authorizes it', async () => {
    ;(CurriculumAccessService.assertActivity as jest.Mock).mockResolvedValue({
      isKGPilot: true,
      activity: { _id: activityId, status: 'draft', lessonId, target: 'Apple.' },
    })

    await VoiceService.startSession(studentId, { lessonId, activityId, expectedPhrase: 'Apple.' })

    expect(CurriculumAccessService.assertActivity).toHaveBeenCalledWith(studentId, activityId)
    expect(Activity.findById).not.toHaveBeenCalled()
    expect(VoiceSession.create).toHaveBeenCalledWith(expect.objectContaining({
      studentId,
      lessonId,
      activityId,
      provider: 'groq-whisper',
      status: 'active',
      metadata: { expectedPhrase: 'Apple.' },
    }))
  })

  it('does not create a session if the pilot access guard rejects the student or activity', async () => {
    ;(CurriculumAccessService.assertActivity as jest.Mock).mockRejectedValue(new Error('This activity is unavailable'))

    await expect(VoiceService.startSession(studentId, { lessonId, activityId })).rejects.toThrow('This activity is unavailable')

    expect(VoiceSession.create).not.toHaveBeenCalled()
    expect(Activity.findById).not.toHaveBeenCalled()
  })

  it('uses configured Sarvam STT for KG, Class 1 and other grades alike', async () => {
    const configuredTranscribe = jest.fn().mockResolvedValue({ transcript: 'apple', available: true, provider: 'sarvam' })
    ;(getSpeechProvider as jest.Mock).mockReturnValue({ name: 'sarvam', transcribe: configuredTranscribe })
    ;(CurriculumAccessService.context as jest.Mock).mockResolvedValue({ isKGPilot: true })

    const pilotResult = await VoiceService.transcribeAudio({ audioBase64: 'YXVkaW8=' }, studentId)
    expect(configuredTranscribe).toHaveBeenCalledWith({ audioBase64: 'YXVkaW8=' })
    expect(pilotResult).toMatchObject({ provider: 'sarvam' })

    ;(CurriculumAccessService.context as jest.Mock).mockResolvedValue({ isKGPilot: false, isClass1Demo: true })
    await VoiceService.transcribeAudio({ audioBase64: 'Y2xhc3Mx' }, studentId)
    expect(configuredTranscribe).toHaveBeenCalledWith({ audioBase64: 'Y2xhc3Mx' })

    ;(CurriculumAccessService.context as jest.Mock).mockResolvedValue({ isKGPilot: false, isClass1Demo: false })
    const regularResult = await VoiceService.transcribeAudio({ audioBase64: 'YXVkaW8=' }, '64b000000000000000000004')
    expect(configuredTranscribe).toHaveBeenCalledWith({ audioBase64: 'YXVkaW8=' })
    expect(regularResult).toMatchObject({ provider: 'sarvam' })
  })
})
