import request from 'supertest'
import { createApp } from '../../src/app'
import { KGAlphabetProgress } from '../../src/models/KGAlphabetProgress'
import { KGLevel2Progress } from '../../src/models/KGLevel2Progress'
import { KGContinuationProgress } from '../../src/models/KGContinuationProgress'
import { KGLevel2Attempt } from '../../src/models/KGLevel2Attempt'
import { KGContinuationAttempt } from '../../src/models/KGContinuationAttempt'
import { School } from '../../src/models/School'
import { Student } from '../../src/models/Student'
import { AzureVoiceProvider } from '../../src/providers/voice/AzureVoiceProvider'
import { signToken } from '../../src/utils/jwt'
import { clearTestDatabase, connectTestDatabase, disconnectTestDatabase } from './dbTestUtils'

const app = createApp()
beforeAll(connectTestDatabase)
afterAll(disconnectTestDatabase)
afterEach(async () => { jest.restoreAllMocks(); await clearTestDatabase() })

it('only completed own KG lessons permit spoken read-only revision, without intro tickets or XP writes', async () => {
  const school = await School.create({
    name: 'KG Completed Review Fixture', code: 'KGRVW01',
    passwordHash: 'test-only', status: 'active',
  })
  const first = await Student.create({
    schoolId: school._id, fullName: 'Synthetic Student One',
    rollNumber: '1', grade: 0, avatarType: 'GIRL', status: 'active',
    kgAlphabetPilotEnabled: true, passwordHash: 'not-a-real-pin',
  })
  const second = await Student.create({
    schoolId: school._id, fullName: 'Synthetic Student Two',
    rollNumber: '2', grade: 0, avatarType: 'BOY', status: 'active',
    kgAlphabetPilotEnabled: true, passwordHash: 'not-a-real-pin',
  })
  const token = (id: string, role: 'STUDENT' | 'TEACHER' = 'STUDENT') => 'Bearer ' + signToken({
    sub: id, schoolId: school._id.toString(), role, sv: 0,
  })
  const authorization = token(first._id.toString())
  const level2Url = '/api/kg-level2/review/narration/letter-e'
  const level3Url = '/api/kg-continuation/3/review/narration/word-k'
  const level4Url = '/api/kg-continuation/4/review/narration/word-q'
  await KGAlphabetProgress.create({
    studentId: first._id, schoolId: school._id, currentIndex: 8,
    introSeen: true, xp: 100, stars: 3, homeworkStatus: 'pending',
  })
  await KGAlphabetProgress.create({
    studentId: second._id, schoolId: school._id, currentIndex: 8,
    introSeen: true, xp: 100, stars: 3, homeworkStatus: 'pending',
  })
  await KGLevel2Progress.create({
    studentId: first._id, schoolId: school._id, currentIndex: 5,
  })
  // Neither valid PIN nor direct URL nor a review query can shortcut
  // recorded completion. No intro ticket is intentionally supplied.
  await request(app).get(level2Url).expect(401)
  await request(app).get(level2Url).set('Authorization', token(first._id.toString(), 'TEACHER')).expect(403)
  await request(app).get(level2Url).set('Authorization', authorization).expect(403)
  await request(app).get(level2Url).set('Authorization', token(second._id.toString())).expect(403)
  await request(app).get(level3Url).set('Authorization', authorization).expect(403)
  const audio = jest.spyOn(AzureVoiceProvider.prototype, 'synthesizeUncached')
    .mockResolvedValue({ audio: Buffer.alloc(500, 65), contentType: 'audio/mpeg' })
  await KGLevel2Progress.updateOne({ studentId: first._id }, {
    $set: { currentIndex: 6, completedAt: new Date() },
  })
  const level2 = await request(app).get(level2Url).set('Authorization', authorization).expect(200)
  expect(level2.headers['content-type']).toMatch(/audio\/mpeg/)
  expect(level2.headers['cache-control']).toMatch(/no-store/)
  expect(level2.headers['x-voice-provider']).toBe('azure')
  expect(level2.headers['x-kg-feedback-receipt']).toBeUndefined()
  expect(audio).toHaveBeenCalledWith('This is the letter E.')
  await request(app).get('/api/kg-level2/review/narration/unknown')
    .set('Authorization', authorization).expect(404)
  await KGContinuationProgress.create({
    studentId: first._id, schoolId: school._id, level: 3,
    currentIndex: 6, completedAt: new Date(),
  })
  const level3 = await request(app).get(level3Url).set('Authorization', authorization).expect(200)
  expect(level3.headers['cache-control']).toMatch(/no-store/)
  expect(level3.headers['x-kg-feedback-receipt']).toBeUndefined()
  expect(audio).toHaveBeenCalledWith('Kite.')
  await request(app).get(level4Url).set('Authorization', authorization).expect(403)
  await KGContinuationProgress.create({
    studentId: first._id, schoolId: school._id, level: 4, currentIndex: 2,
  })
  await request(app).get(level4Url).set('Authorization', authorization).expect(403)
  const reviewedKg1 = await KGAlphabetProgress.findOne({ studentId: first._id }).lean()
  const reviewedKg2 = await KGLevel2Progress.findOne({ studentId: first._id }).lean()
  const reviewedKg3 = await KGContinuationProgress.findOne({ studentId: first._id, level: 3 }).lean()
  expect(reviewedKg1?.xp).toBe(100)
  expect(reviewedKg1?.currentIndex).toBe(8)
  expect(reviewedKg2?.currentIndex).toBe(6)
  expect(reviewedKg3?.currentIndex).toBe(6)
  expect(await KGLevel2Attempt.countDocuments({ studentId: first._id })).toBe(0)
  expect(await KGContinuationAttempt.countDocuments({ studentId: first._id })).toBe(0)
})
