/** First Day v3 delivery checkpoint: live browser audio is outside CI, but
 * backend progress must remain blocked until the authenticated spoken ACK.
 * Uses no real student account, MongoDB connection or speech credits. */
jest.mock('../../src/models/VoiceSession', () => ({
  VoiceSession: { findOne: jest.fn(), updateOne: jest.fn() },
}))
jest.mock('../../src/models/Conversation', () => ({
  Conversation: { updateOne: jest.fn() },
}))
jest.mock('../../src/services/curriculum-access.service', () => ({
  CurriculumAccessService: { assertActivity: jest.fn() },
}))
jest.mock('../../src/services/progress.service', () => ({
  ProgressService: { submitAttempt: jest.fn() },
}))

import { VoiceService } from '../../src/services/voice.service'
import { VoiceSession } from '../../src/models/VoiceSession'
import { Conversation } from '../../src/models/Conversation'
import { CurriculumAccessService } from '../../src/services/curriculum-access.service'
import { ProgressService } from '../../src/services/progress.service'
import { Types } from 'mongoose'

const studentId = '64b000000000000000000001'
const activityId = '64b000000000000000000002'
const sessionId = '64b000000000000000000003'
const lessonId = '64b000000000000000000004'
const conversationId = '64b000000000000000000005'

const validSession = () => ({
  _id: new Types.ObjectId(sessionId), studentId: new Types.ObjectId(studentId),
  activityId: new Types.ObjectId(activityId), lessonId: new Types.ObjectId(lessonId),
  status: 'completed' as const, transcript: 'I can skip.',
  startedAt: new Date('2026-10-29T11:00:00Z'),
  metadata: {} as Record<string, unknown>,
  aiResponse: { message: 'You spoke skip! Good listening. Let us skip together.', activityComplete: true,
    conversation: { id: conversationId, masteryStatus: 'MASTERED' } },
})

beforeEach(() => {
  jest.resetAllMocks()
  ;(CurriculumAccessService.assertActivity as jest.Mock).mockResolvedValue({
    activity: { activityKey: 'class1-l01-v3-skip-bunny' },
  })
  ;(ProgressService.submitAttempt as jest.Mock).mockResolvedValue({ xpAwarded: 0 })
  ;(Conversation.updateOne as jest.Mock).mockResolvedValue({ matchedCount: 1 })
  ;(VoiceSession.updateOne as jest.Mock).mockResolvedValue({ matchedCount: 1 })
})

test('pending final Qwen turn is recoverable without awarding progress', async () => {
  const session = validSession()
  ;(VoiceSession.findOne as jest.Mock).mockReturnValue({
    sort: jest.fn().mockResolvedValue(session),
  })
  const pending = await VoiceService.pendingTeacherAudio(studentId, activityId)
  expect(pending).toEqual({
    pending: true, sessionId,
    text: 'You spoke skip! Good listening. Let us skip together.',
    language: 'en-IN',
  })
  expect(ProgressService.submitAttempt).not.toHaveBeenCalled()
})

test('authenticated acknowledgment awards progress only for completed v3 speech', async () => {
  const session = validSession()
  ;(VoiceSession.findOne as jest.Mock).mockResolvedValue(session)
  await expect(VoiceService.acknowledgeTeacherAudio(studentId, sessionId))
    .resolves.toEqual({ complete: true, acknowledged: true })
  expect(ProgressService.submitAttempt).toHaveBeenCalledWith(
    expect.objectContaining({
      studentId, activityId, answer: 'I can skip.',
      idempotencyKey: `conversation:${conversationId}`,
      evaluation: expect.objectContaining({ score: 90 }),
    }),
  )
  expect(Conversation.updateOne).toHaveBeenCalledTimes(1)
  expect(VoiceSession.updateOne).toHaveBeenCalledWith(
    expect.objectContaining({ _id: session._id, studentId }),
    expect.objectContaining({ $set: expect.objectContaining({
      'metadata.teacherAudioAcknowledgedAt': expect.any(Date),
    }) }),
  )
})

test('incomplete or unrelated lessons cannot self-award first-day progress', async () => {
  const session = validSession()
  session.aiResponse.activityComplete = false
  ;(VoiceSession.findOne as jest.Mock).mockResolvedValue(session)
  await expect(VoiceService.acknowledgeTeacherAudio(studentId, sessionId)).rejects.toMatchObject({
    code: 'CONFLICT',
  })
  expect(ProgressService.submitAttempt).not.toHaveBeenCalled()
  session.aiResponse.activityComplete = true
  ;(CurriculumAccessService.assertActivity as jest.Mock).mockResolvedValue({
    activity: { activityKey: 'class1-l01-v2-listen-am' },
  })
  await expect(VoiceService.acknowledgeTeacherAudio(studentId, sessionId)).rejects.toBeTruthy()
  expect(ProgressService.submitAttempt).not.toHaveBeenCalled()
})

test('replaying an already acknowledged response is idempotent', async () => {
  const session = validSession()
  session.metadata.teacherAudioAcknowledgedAt = new Date()
  ;(VoiceSession.findOne as jest.Mock).mockResolvedValue(session)
  await VoiceService.acknowledgeTeacherAudio(studentId, sessionId)
  expect(ProgressService.submitAttempt).not.toHaveBeenCalled()
})
