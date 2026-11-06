import request from 'supertest'
import { createApp } from '../../src/app'
import { KGAlphabetProgress } from '../../src/models/KGAlphabetProgress'
import { KGLevel2Progress } from '../../src/models/KGLevel2Progress'
import { KGContinuationProgress } from '../../src/models/KGContinuationProgress'
import { School } from '../../src/models/School'
import { Student } from '../../src/models/Student'
import { KGSpeechService } from '../../src/services/kg-speech.service'
import { AzureVoiceProvider } from '../../src/providers/voice/AzureVoiceProvider'
import { VoiceWarmupService } from '../../src/services/voice-warmup.service'
import { hashPassword } from '../../src/utils/password'
import { pinLookup } from '../../src/utils/student-pin'
import { clearTestDatabase, connectTestDatabase, disconnectTestDatabase } from './dbTestUtils'

// Real HTTP auth/authorization and Mongo state. Only STT and Azure bytes are
// synthetic. Do not run against a school DB or use a real learner's PIN.
const app = createApp()
beforeAll(connectTestDatabase)
afterAll(disconnectTestDatabase)
afterEach(async () => { jest.restoreAllMocks(); await clearTestDatabase() })

async function fixture() {
  const school = await School.create({
    name: 'KG Visit Isolation Fixture', code: 'KGVISIT1',
    passwordHash: 'hash', status: 'active',
  })
  const student = await Student.create({
    schoolId: school._id, fullName: 'Synthetic KG Visitor',
    rollNumber: 'visit-1', grade: 0, passwordHash: 'hash',
    avatarType: 'GIRL', status: 'active', kgAlphabetPilotEnabled: true,
  })
  await KGAlphabetProgress.create({
    studentId: student._id, schoolId: school._id, currentIndex: 8,
    introSeen: true, xp: 100, stars: 3, homeworkStatus: 'pending',
  })
  await KGLevel2Progress.create({
    studentId: student._id, schoolId: school._id, currentIndex: 5,
  })
  return { student }
}
const get = (level: number, auth: string) =>
  request(app).get('/api/kg-continuation/' + level + '/state').set('Authorization', auth)
const overview = (auth: string) =>
  request(app).get('/api/kg-continuation/overview').set('Authorization', auth)
async function intro(level: number, auth: string, studentId: unknown) {
  const base = '/api/kg-continuation/' + level
  const started = await request(app).post(base + '/intro/start')
    .set('Authorization', auth).expect(200)
  const playbackId: string = started.body.data.playbackId
  expect(playbackId).toMatch(/^[a-f0-9]{64}$/)
  await KGContinuationProgress.updateOne({ studentId, level }, {
    $set: { introStartedAt: new Date(Date.now() - 20_000) },
  })
  await request(app).post(base + '/intro/complete').set('Authorization', auth)
    .send({ playbackId, videoEnded: true }).expect(200)
  return { Authorization: auth, 'X-KG-Continuation-Intro': playbackId }
}

it('real PIN re-login keeps the KG cursor but revokes older Level 2 and Level 3 introductions', async () => {
  const { student } = await fixture()
  const pin = '48291' // Disposable fake student in disposable MongoDB only.
  await Student.updateOne({ _id: student._id }, {
    $set: { passwordHash: await hashPassword(pin), pinLookup: pinLookup(pin) },
  })
  jest.spyOn(VoiceWarmupService, 'schedule').mockImplementation(() => undefined)
  const login = async () => {
    const response = await request(app).post('/api/auth/student/pin-login').send({ pin }).expect(200)
    expect(response.body.data.student.grade).toBe(0)
    expect(response.body.data).not.toHaveProperty('pin')
    return 'Bearer ' + response.body.data.token as string
  }
  const first = await login()
  // Level 2 has saved progress at J, and fresh intro is required.
  const level2 = '/api/kg-level2'
  const l2started = await request(app).post(level2 + '/intro/start')
    .set('Authorization', first).expect(200)
  const l2ticket: string = l2started.body.data.playbackId
  await KGLevel2Progress.updateOne({ studentId: student._id },
    { $set: { introStartedAt: new Date(Date.now() - 20_000) } })
  await request(app).post(level2 + '/intro/complete').set('Authorization', first)
    .send({ playbackId: l2ticket, videoEnded: true }).expect(200)
  const second = await login() // Next PIN visit, even without a clean logout.
  const oldL2 = { Authorization: second, 'X-KG-Level2-Intro': l2ticket }
  expect((await request(app).get(level2 + '/state').set('Authorization', second)
    .expect(200)).body.data.currentIndex).toBe(5)
  await request(app).get(level2 + '/narration/letter-j').set(oldL2).expect(409)
  const level2Row = await KGLevel2Progress.findOne({ studentId: student._id }).select('+introTicketHash')
  expect(level2Row?.introTicketHash).toBeFalsy()
  expect(level2Row?.introCompletedAt).toBeFalsy()

  // Fixture represents earlier J completion by the real Level 2 pilot,
  // already verified by kgLevel2StudentJourney.test.ts.
  await KGLevel2Progress.updateOne({ studentId: student._id }, {
    $set: { currentIndex: 6, completedAt: new Date() },
  })
  const l3 = '/api/kg-continuation/3'
  expect((await overview(second).expect(200)).body.data.nextLevel).toBe(3)
  expect((await get(3, second).expect(200)).body.data).toMatchObject({
    currentIndex: 0, activity: { letter: 'K' },
  })
  await get(4, second).expect(403)
  const oldIntro = await intro(3, second, student._id)
  const third = await login() // Must revoke Level 3's completed intro.
  await request(app).get(l3 + '/narration/letter-k').set({
    Authorization: third, 'X-KG-Continuation-Intro': oldIntro['X-KG-Continuation-Intro'],
  }).expect(409)
  expect((await get(3, third).expect(200)).body.data.currentIndex).toBe(0)
  const fresh = await intro(3, third, student._id)
  jest.spyOn(KGSpeechService, 'transcribe').mockResolvedValue({
    transcript: 'kay', available: true, provider: 'sarvam', languageCode: 'en-IN',
  } as never)
  jest.spyOn(AzureVoiceProvider.prototype, 'synthesizeUncached').mockResolvedValue({
    audio: Buffer.alloc(500, 65), contentType: 'audio/mpeg',
  })
  const id = 'new-pin-visit-kg3-k-12345'
  const answered = await request(app).post(l3 + '/attempt').set(fresh).send({
    letter: 'K', submissionId: id, durationMs: 900, mimeType: 'audio/webm',
    audioBase64: 'Y'.repeat(160),
  }).expect(200)
  expect(answered.body.data.outcome).toBe('correct')
  expect((await get(3, third).expect(200)).body.data.currentIndex).toBe(0)
  const audio = await request(app).get(l3 + '/attempt/' + id + '/feedback-audio').set(fresh).expect(200)
  const receipt = audio.headers['x-kg-feedback-receipt']
  expect(receipt).toMatch(/^v1\./)
  await request(app).post(l3 + '/attempt/' + id + '/feedback-played').set(fresh)
    .send({ feedbackReceipt: receipt }).expect(200)
  expect((await get(3, third).expect(200)).body.data).toMatchObject({
    currentIndex: 1, activity: { letter: 'L' }, completed: false,
  })
  await request(app).post('/api/auth/logout').set('Authorization', third).expect(200)
  await get(3, third).expect(401)
  const fourth = await login()
  expect((await get(3, fourth).expect(200)).body.data).toMatchObject({
    currentIndex: 1, activity: { letter: 'L' }, completed: false,
  })
  await request(app).get(l3 + '/narration/letter-l').set({
    Authorization: fourth, 'X-KG-Continuation-Intro': fresh['X-KG-Continuation-Intro'],
  }).expect(409)
  expect((await overview(fourth).expect(200)).body.data.nextLevel).toBe(3)
  await get(4, fourth).expect(403)
  const persisted = await KGContinuationProgress.findOne({ studentId: student._id, level: 3 })
    .select('+introTicketHash').lean()
  expect(persisted?.introTicketHash).toBeFalsy()
  expect(persisted?.currentIndex).toBe(1)
})
