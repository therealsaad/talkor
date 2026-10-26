import { afterAll, afterEach, beforeAll, expect, it, jest } from '@jest/globals'
import request from 'supertest'
import { createApp } from '../../src/app'
import { KGAlphabetAttempt } from '../../src/models/KGAlphabetAttempt'
import { KGAlphabetProgress } from '../../src/models/KGAlphabetProgress'
import { KGAlphabetSubmission } from '../../src/models/KGAlphabetSubmission'
import { School } from '../../src/models/School'
import { Student } from '../../src/models/Student'
import { Teacher } from '../../src/models/Teacher'
import { AzureVoiceProvider } from '../../src/providers/voice/AzureVoiceProvider'
import { LEVEL3_NARRATION } from '../../src/kg/level3-content'
import { KGSpeechService } from '../../src/services/kg-speech.service'
import { signToken } from '../../src/utils/jwt'
import { clearTestDatabase, connectTestDatabase, disconnectTestDatabase } from './dbTestUtils'

const app = createApp()

beforeAll(connectTestDatabase)
afterAll(disconnectTestDatabase)
afterEach(async () => {
  jest.restoreAllMocks()
  await clearTestDatabase()
})

async function makeIdentities() {
  const school = await School.create({ name: 'Level 3 Preview School', code: 'L3PREV01', passwordHash: 'hash' })
  const teacher = await Teacher.create({ schoolId: school._id, name: 'Level 3 Teacher', email: 'l3@example.test', passwordHash: 'hash' })
  const student = await Student.create({
    schoolId: school._id, teacherId: teacher._id, fullName: 'Level 3 Student',
    rollNumber: 'l3-1', grade: 0, passwordHash: 'hash', avatarType: 'GIRL', status: 'active',
  })
  const token = (sub: string, role: 'TEACHER' | 'SCHOOL_ADMIN' | 'STUDENT') =>
    `Bearer ${signToken({ sub, role, schoolId: school._id.toString() })}`
  return {
    school,
    teacherAuthorization: token(teacher._id.toString(), 'TEACHER'),
    adminAuthorization: token(school._id.toString(), 'SCHOOL_ADMIN'),
    studentAuthorization: token(student._id.toString(), 'STUDENT'),
  }
}

it('restricts both Level 3 preview endpoints to authenticated school staff', async () => {
  const { teacherAuthorization, adminAuthorization, studentAuthorization } = await makeIdentities()
  await request(app).get('/api/kg-level3-preview/narration/letter-k').expect(401)
  await request(app).post('/api/kg-level3-preview/attempt').send({ letter: 'K' }).expect(401)

  await request(app).get('/api/kg-level3-preview/narration/letter-k')
    .set('Authorization', studentAuthorization).expect(403)
  await request(app).post('/api/kg-level3-preview/attempt')
    .set('Authorization', studentAuthorization).send({ letter: 'K', durationMs: 1000, noSpeech: true }).expect(403)

  jest.spyOn(AzureVoiceProvider.prototype, 'synthesizeUncached')
    .mockResolvedValue({ audio: Buffer.from('audio'), contentType: 'audio/mpeg' })
  await request(app).get('/api/kg-level3-preview/narration/letter-k')
    .set('Authorization', teacherAuthorization).expect(200)
  await request(app).get('/api/kg-level3-preview/narration/letter-k')
    .set('Authorization', adminAuthorization).expect(200)
})

it('serves only fixed approved narration IDs using uncached Azure synthesis', async () => {
  const { teacherAuthorization } = await makeIdentities()
  const synthesize = jest.spyOn(AzureVoiceProvider.prototype, 'synthesizeUncached')
    .mockResolvedValue({ audio: Buffer.from('audio'), contentType: 'audio/mpeg' })

  for (const id of Object.keys(LEVEL3_NARRATION)) {
    await request(app).get(`/api/kg-level3-preview/narration/${id}`)
      .set('Authorization', teacherAuthorization)
      .expect('Cache-Control', 'private, no-store')
      .expect(200)
  }
  await request(app).get('/api/kg-level3-preview/narration/custom-text')
    .set('Authorization', teacherAuthorization).expect(404)
  expect(synthesize.mock.calls.map(([text]) => text)).toEqual(Object.values(LEVEL3_NARRATION))
})

it('grades recordings server-side, returns no transcript, and stores no attempt or progress', async () => {
  const { teacherAuthorization, school } = await makeIdentities()
  const transcribe = jest.spyOn(KGSpeechService, 'transcribe')
    .mockResolvedValueOnce({ transcript: 'Kay!', available: true, provider: 'test' } as never)
    .mockResolvedValueOnce({ transcript: 'monkey', available: true, provider: 'test' } as never)
    .mockResolvedValueOnce({ transcript: '', uncertain: true, available: true, provider: 'test' } as never)

  const submit = (letter: string, extras: Record<string, unknown> = {}) => request(app)
    .post('/api/kg-level3-preview/attempt')
    .set('Authorization', teacherAuthorization)
    .send({
      letter, durationMs: 1000, mimeType: 'audio/webm',
      audioBase64: 'Y'.repeat(160), outcome: 'correct', ...extras,
    })

  const correct = await submit('K').expect(200)
  expect(correct.body.data).toEqual({ outcome: 'correct' })
  const wrong = await submit('L').expect(200)
  expect(wrong.body.data).toEqual({ outcome: 'incorrect' })
  const unclear = await submit('M').expect(200)
  expect(unclear.body.data).toEqual({ outcome: 'unclear' })

  const silence = await request(app).post('/api/kg-level3-preview/attempt')
    .set('Authorization', teacherAuthorization)
    .send({ letter: 'P', durationMs: 1000, noSpeech: true }).expect(200)
  expect(silence.body.data).toEqual({ outcome: 'unclear' })
  expect(transcribe).toHaveBeenCalledTimes(3)
  expect(await KGAlphabetAttempt.countDocuments()).toBe(0)
  expect(await KGAlphabetProgress.countDocuments({ schoolId: school._id })).toBe(0)
  expect(await KGAlphabetSubmission.countDocuments()).toBe(0)
})

it('rejects invalid targets and audio without trusting a supplied outcome', async () => {
  const { teacherAuthorization } = await makeIdentities()
  const transcribe = jest.spyOn(KGSpeechService, 'transcribe')
    .mockResolvedValue({ transcript: 'wrong word', available: true, provider: 'test' } as never)
  await request(app).post('/api/kg-level3-preview/attempt')
    .set('Authorization', teacherAuthorization)
    .send({ letter: 'A', durationMs: 1000, noSpeech: true }).expect(400)
  await request(app).post('/api/kg-level3-preview/attempt')
    .set('Authorization', teacherAuthorization)
    .send({ letter: 'K', durationMs: 12001, audioBase64: 'Y'.repeat(160), mimeType: 'audio/webm', outcome: 'correct' }).expect(400)

  const response = await request(app).post('/api/kg-level3-preview/attempt')
    .set('Authorization', teacherAuthorization)
    .send({ letter: 'K', durationMs: 1000, audioBase64: 'Y'.repeat(160), mimeType: 'audio/webm', outcome: 'correct' }).expect(200)
  expect(response.body.data.outcome).toBe('incorrect')
  expect(transcribe).toHaveBeenCalledTimes(1)
})

it('returns a provider error when STT is unavailable without saving data', async () => {
  const { teacherAuthorization } = await makeIdentities()
  jest.spyOn(KGSpeechService, 'transcribe').mockResolvedValue({ available: false, transcript: '' } as never)
  await request(app).post('/api/kg-level3-preview/attempt')
    .set('Authorization', teacherAuthorization)
    .send({ letter: 'K', durationMs: 1000, audioBase64: 'Y'.repeat(160), mimeType: 'audio/webm' }).expect(502)
  expect(await KGAlphabetAttempt.countDocuments()).toBe(0)
  expect(await KGAlphabetProgress.countDocuments()).toBe(0)
  expect(await KGAlphabetSubmission.countDocuments()).toBe(0)
})
