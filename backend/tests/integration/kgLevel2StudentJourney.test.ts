import request from 'supertest'
import { createApp } from '../../src/app'
import { KGAlphabetProgress } from '../../src/models/KGAlphabetProgress'
import { KGLevel2Progress } from '../../src/models/KGLevel2Progress'
import { KGLevel2Attempt } from '../../src/models/KGLevel2Attempt'
import { School } from '../../src/models/School'
import { Student } from '../../src/models/Student'
import { KGSpeechService } from '../../src/services/kg-speech.service'
import { AzureVoiceProvider } from '../../src/providers/voice/AzureVoiceProvider'
import { signToken } from '../../src/utils/jwt'
import { clearTestDatabase, connectTestDatabase, disconnectTestDatabase } from './dbTestUtils'

const app = createApp()
beforeAll(connectTestDatabase)
afterAll(disconnectTestDatabase)
afterEach(async () => { jest.restoreAllMocks(); await clearTestDatabase() })

async function fixture(kg1Complete = true) {
  const school = await School.create({
    name: 'Sequential KG Test School', code: 'KGL2AUTO', passwordHash: 'hash', status: 'active',
  })
  const student = await Student.create({
    schoolId: school._id, fullName: 'KG Learner', rollNumber: 'resume-1', grade: 0,
    passwordHash: 'hash', avatarType: 'GIRL', status: 'active', kgAlphabetPilotEnabled: true,
  })
  await KGAlphabetProgress.create({
    studentId: student._id, schoolId: school._id,
    currentIndex: kg1Complete ? 8 : 7, introSeen: true,
    xp: kg1Complete ? 100 : 0, stars: kg1Complete ? 3 : 0,
    homeworkStatus: kg1Complete ? 'pending' : 'not-assigned',
  })
  const bearer = () => 'Bearer ' + signToken({
    sub: student._id.toString(), schoolId: school._id.toString(),
    role: 'STUDENT', sv: 0,
  })
  return { student, school, auth: bearer() }
}
const get = (auth: string) => request(app).get('/api/kg-level2/state').set('Authorization', auth)

async function watchIntro(auth: string, studentId: unknown) {
  const started = await request(app).post('/api/kg-level2/intro/start')
    .set('Authorization', auth).expect(200)
  const id: string = started.body.data.playbackId
  expect(id).toMatch(/^[a-f0-9]{64}$/)
  const options = { Authorization: auth, 'X-KG-Level2-Intro': id }
  await request(app).post('/api/kg-level2/intro/complete')
    .set('Authorization', auth).send({ playbackId: id, videoEnded: true }).expect(409)
  await KGLevel2Progress.updateOne({ studentId }, { $set: { introStartedAt: new Date(Date.now() - 20_000) } })
  await request(app).post('/api/kg-level2/intro/complete')
    .set('Authorization', auth).send({ playbackId: id, videoEnded: true }).expect(200)
  return options
}

it('unlocks student E–J only after authoritative KG1 completion; keeps preview off limits', async () => {
  const { student, school, auth } = await fixture(false)
  await get(auth).expect(403)
  await request(app).post('/api/kg-level2/intro/start').set('Authorization', auth).expect(403)
  await request(app).post('/api/kg-level2/attempt').set('Authorization', auth).send({}).expect(403)
  expect(await KGLevel2Progress.countDocuments({ studentId: student._id })).toBe(0)
  await KGAlphabetProgress.updateOne({ studentId: student._id }, { $set: { currentIndex: 8 } })
  const level1 = await request(app).get('/api/kg-alphabet/state').set('Authorization', auth).expect(200)
  expect(level1.body.data).toMatchObject({ completed: true, level2Available: true })
  expect(level1.body.data.homework.status).toBe('not-assigned') // Homework is not a gate.
  const level2 = await get(auth).expect(200)
  expect(level2.body.data).toMatchObject({
    currentIndex: 0, totalActivities: 6, completed: false, activity: { letter: 'E' },
  })
  await get(auth).expect(200)
  expect(await KGLevel2Progress.countDocuments({ studentId: student._id })).toBe(1)
  await request(app).get('/api/kg-level2/narration/letter-e').set('Authorization', auth).expect(409)
  await request(app).post('/api/kg-level2/attempt')
    .set('Authorization', auth).send({ letter: 'E', submissionId: 'too-early-12345' }).expect(409)
  const staffAuth = 'Bearer ' + signToken({
    sub: student._id.toString(), schoolId: school._id.toString(), role: 'TEACHER', sv: 0,
  })
  await get(staffAuth).expect(403)
  // Staff preview remains independent; no students can call its endpoints.
  await request(app).post('/api/kg-level2-preview/attempt')
    .set('Authorization', auth).send({ letter: 'E', noSpeech: true, durationMs: 1000 }).expect(403)
  expect(school._id).toBeTruthy()
})

it('saves Level 2 only after audio receipt, resumes F on next login, and never writes raw microphone recordings', async () => {
  const { student, school, auth } = await fixture()
  const headers = await watchIntro(auth, student._id)
  const url = '/api/kg-level2/attempt'
  const post = (submissionId: string, noSpeech = false) =>
    request(app).post(url).set(headers).send({
      letter: 'E', submissionId, durationMs: 1000,
      ...(noSpeech ? { noSpeech: true } : { audioBase64: 'Y'.repeat(160), mimeType: 'audio/webm' }),
    })
  // Silence is not independent English-speaking evidence.
  const silence = await post('level2-silence-123456', true).expect(200)
  expect(silence.body.data.outcome).toBe('unclear')
  await request(app).post('/api/kg-level2/attempt/level2-silence-123456/feedback-played')
    .set(headers).send({ feedbackReceipt: 'forged' }).expect(409)
  expect((await get(auth).expect(200)).body.data.currentIndex).toBe(0)
  jest.spyOn(AzureVoiceProvider.prototype, 'synthesizeUncached').mockResolvedValue({
    audio: Buffer.alloc(500, 65), contentType: 'audio/mpeg',
  })
  const play = (id: string) => request(app).get('/api/kg-level2/attempt/' + id + '/feedback-audio').set(headers)
  const silenceAudio = await play('level2-silence-123456').expect(200)
  expect(silenceAudio.headers['x-voice-provider']).toBe('azure')
  const silenceReceipt = silenceAudio.headers['x-kg-feedback-receipt']
  expect(silenceReceipt).toMatch(/^v1\./)
  await request(app).post('/api/kg-level2/attempt/level2-silence-123456/feedback-played')
    .set(headers).send({ feedbackReceipt: silenceReceipt }).expect(200)
  expect((await get(auth).expect(200)).body.data.currentIndex).toBe(0)

  jest.spyOn(KGSpeechService, 'transcribe').mockResolvedValue({
    transcript: 'E', provider: 'sarvam', available: true, languageCode: 'en-IN',
  } as never)
  const answered = await post('level2-correct-e-12345').expect(200)
  expect(answered.body.data.outcome).toBe('correct')
  expect((await get(auth).expect(200)).body.data).toMatchObject({
    currentIndex: 0, pendingFeedback: { submissionId: 'level2-correct-e-12345' },
  })
  await post('level2-extra-answer-12345').expect(409)
  const duplicate = await post('level2-correct-e-12345').expect(200)
  expect(duplicate.body.data.duplicate).toBe(true)
  const audio = await play('level2-correct-e-12345').expect(200)
  const receipt = audio.headers['x-kg-feedback-receipt']
  await request(app).post('/api/kg-level2/attempt/level2-correct-e-12345/feedback-played')
    .set(headers).send({ feedbackReceipt: receipt }).expect(200)
  const refreshedAuth = 'Bearer ' + signToken({
    sub: student._id.toString(), schoolId: school._id.toString(), role: 'STUDENT', sv: 0,
  })
  // Another session's signed-in student returns to F, never E or completed KG1.
  const resumed = await get(refreshedAuth).expect(200)
  expect(resumed.body.data).toMatchObject({ currentIndex: 1, activity: { letter: 'F' }, completed: false })
  const saved = await KGLevel2Attempt.findOne({ studentId: student._id, submissionId: 'level2-correct-e-12345' }).lean()
  expect(saved?.feedbackAcknowledgedAt).toBeTruthy()
  expect(saved).not.toHaveProperty('audioBase64')
  expect(saved).not.toHaveProperty('transcript')
  expect((await KGAlphabetProgress.findOne({ studentId: student._id }))?.xp).toBe(100)
  await request(app).get('/api/kg-level2/narration/letter-f').set(headers).expect(200)
  const refreshed = await watchIntro(refreshedAuth, student._id)
  await request(app).get('/api/kg-level2/narration/letter-f').set(refreshed).expect(200)
})

it('finishes J with an atomic final ACK, preserving completed Level 2 on later login', async () => {
  const { student, auth } = await fixture()
  await get(auth).expect(200)
  await KGLevel2Progress.updateOne({ studentId: student._id }, { $set: { currentIndex: 5 } })
  const headers = await watchIntro(auth, student._id)
  jest.spyOn(KGSpeechService, 'transcribe').mockResolvedValue({
    transcript: 'jay', provider: 'sarvam', available: true,
  } as never)
  jest.spyOn(AzureVoiceProvider.prototype, 'synthesizeUncached').mockResolvedValue({
    audio: Buffer.alloc(500, 65), contentType: 'audio/mpeg',
  })
  const submitted = await request(app).post('/api/kg-level2/attempt').set(headers).send({
    letter: 'J', submissionId: 'level2-final-j-123456',
    mimeType: 'audio/webm', durationMs: 900, audioBase64: 'Y'.repeat(160),
  }).expect(200)
  expect(submitted.body.data.outcome).toBe('correct')
  expect((await get(auth).expect(200)).body.data.completed).toBe(false)
  const audio = await request(app).get('/api/kg-level2/attempt/level2-final-j-123456/feedback-audio')
    .set(headers).expect(200)
  const receipt = audio.headers['x-kg-feedback-receipt']
  const final = await request(app).post('/api/kg-level2/attempt/level2-final-j-123456/feedback-played')
    .set(headers).send({ feedbackReceipt: receipt }).expect(200)
  expect(final.body.data).toMatchObject({ currentIndex: 6, completed: true, activity: null })
  expect(final.body.data.completedAt).toBeTruthy()
  const reloaded = await get(auth).expect(200)
  expect(reloaded.body.data).toMatchObject({ currentIndex: 6, completed: true })
  expect((await KGLevel2Progress.findOne({ studentId: student._id }))?.currentIndex).toBe(6)
})
