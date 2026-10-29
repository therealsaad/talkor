jest.mock('../src/models/VoiceSession', () => ({
  VoiceSession: { findOne: jest.fn(), updateOne: jest.fn() },
}))
jest.mock('../src/models/Conversation', () => ({
  Conversation: { updateOne: jest.fn() },
}))
jest.mock('../src/services/progress.service', () => ({
  ProgressService: { submitAttempt: jest.fn() },
}))
jest.mock('../src/services/curriculum-access.service', () => ({
  CurriculumAccessService: { assertActivity: jest.fn() },
}))

import { VoiceSession } from '../src/models/VoiceSession'
import { Conversation } from '../src/models/Conversation'
import { ProgressService } from '../src/services/progress.service'
import { CurriculumAccessService } from '../src/services/curriculum-access.service'
import { VoiceService } from '../src/services/voice.service'

const id = '64b000000000000000000001'
const session = () => ({
  _id: '64b000000000000000000010',
  studentId: id,
  activityId: '64b000000000000000000020',
  lessonId: '64b000000000000000000030',
  status: 'completed',
  transcript: 'I can jump',
  startedAt: new Date('2026-10-29T12:00:00.000Z'),
  aiResponse: { activityComplete: true,
    conversation: { id: '64b000000000000000000040', complete: false, masteryStatus: 'MASTERED' } },
})
beforeEach(() => {
  ;(VoiceSession.findOne as jest.Mock).mockResolvedValue(session())
  ;(VoiceSession.updateOne as jest.Mock).mockResolvedValue({ matchedCount: 1 })
  ;(Conversation.updateOne as jest.Mock).mockResolvedValue({ matchedCount: 1 })
  ;(ProgressService.submitAttempt as jest.Mock).mockResolvedValue({ xpAwarded: 0 })
  ;(CurriculumAccessService.assertActivity as jest.Mock).mockResolvedValue({
    activity: { activityKey: 'class1-l01-v3-jump-frog' },
  })
})
test('authorized audio acknowledgment persists v3 mastery exactly once with conversation idempotency', async () => {
  const result = await VoiceService.acknowledgeTeacherAudio(id, '64b000000000000000000010')
  expect(result.acknowledged).toBe(true)
  expect(ProgressService.submitAttempt).toHaveBeenCalledWith(
    expect.objectContaining({ idempotencyKey: 'conversation:64b000000000000000000040', evaluation: expect.objectContaining({ score: 90 }) }),
  )
  expect(Conversation.updateOne).toHaveBeenCalledWith(
    expect.objectContaining({ status: 'ACTIVE' }),
    expect.objectContaining({ $set: expect.objectContaining({ status: 'COMPLETED' }) }),
  )
})
test('incomplete Qwen answer cannot commit progress', async () => {
  ;(VoiceSession.findOne as jest.Mock).mockResolvedValue({
    ...session(), aiResponse: { activityComplete: false, conversation: { id: '64b000000000000000000040' } },
  })
  await expect(VoiceService.acknowledgeTeacherAudio(id, '64b000000000000000000010')).rejects.toBeDefined()
  expect(ProgressService.submitAttempt).not.toHaveBeenCalled()
})
test('non-v3 curriculum cannot use the audio acknowledgment endpoint', async () => {
  ;(CurriculumAccessService.assertActivity as jest.Mock).mockResolvedValue({
    activity: { activityKey: 'class1-l01-v2-listen-am' },
  })
  await expect(VoiceService.acknowledgeTeacherAudio(id, '64b000000000000000000010')).rejects.toBeDefined()
  expect(ProgressService.submitAttempt).not.toHaveBeenCalled()
})
