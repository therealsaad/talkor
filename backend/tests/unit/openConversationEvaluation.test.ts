jest.mock('../../src/models/VoiceSession', () => ({ VoiceSession: { findOne: jest.fn() } }))
jest.mock('../../src/models/Activity', () => ({ Activity: { findById: jest.fn() } }))
jest.mock('../../src/models/ActivityAttempt', () => ({ ActivityAttempt: { exists: jest.fn() } }))
jest.mock('../../src/services/progress.service', () => ({ ProgressService: { submitAttempt: jest.fn() } }))
jest.mock('../../src/services/missJulie.service', () => ({ MissJulieService: { converse: jest.fn() } }))
jest.mock('../../src/providers/pronunciation', () => ({ getPronunciationProvider: jest.fn() }))

import { VoiceSession } from '../../src/models/VoiceSession'
import { Activity } from '../../src/models/Activity'
import { ActivityAttempt } from '../../src/models/ActivityAttempt'
import { ProgressService } from '../../src/services/progress.service'
import { MissJulieService } from '../../src/services/missJulie.service'
import { getPronunciationProvider } from '../../src/providers/pronunciation'
import { VoiceService } from '../../src/services/voice.service'

describe('open conversation evaluation', () => {
  it('keeps a spoken open response conversational instead of scoring it as pronunciation', async () => {
    const session = {
      _id: 'voice-open-1',
      studentId: 'student-1',
      lessonId: 'lesson-1',
      activityId: 'activity-1',
      startedAt: new Date('2026-10-13T10:00:00.000Z'),
      metadata: {},
      status: 'active',
      save: jest.fn().mockResolvedValue(undefined),
    }
    const activity = {
      _id: 'activity-1',
      lessonId: 'lesson-1',
      type: 'OPEN_CONVERSATION',
      prompt: 'What do you like to play?',
      aiEnabled: true,
      metadata: { conversationMode: 'OPEN' },
    }
    ;(VoiceSession.findOne as jest.Mock).mockResolvedValue(session)
    ;(Activity.findById as jest.Mock).mockReturnValue({ select: async () => activity })
    ;(ActivityAttempt.exists as jest.Mock).mockResolvedValue(null)
    ;(MissJulieService.converse as jest.Mock).mockResolvedValue({ message: 'That sounds fun!', emotion: 'curious' })

    const result = await VoiceService.submitTranscript('student-1', session._id, {
      transcript: 'I like playing soccer with my friends.',
    })

    expect(result).toMatchObject({
      transcript: 'I like playing soccer with my friends.',
      conversationMode: 'OPEN',
      status: 'completed',
      evaluation: { score: 85, isAcousticPronunciationScore: false },
    })
    expect(MissJulieService.converse).toHaveBeenCalledWith('student-1', expect.objectContaining({
      message: 'I like playing soccer with my friends.',
      activityId: 'activity-1',
      inputMode: 'MIC',
    }))
    expect(getPronunciationProvider).not.toHaveBeenCalled()
    expect(ProgressService.submitAttempt).not.toHaveBeenCalled()
  })
})
