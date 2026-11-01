import { createHash } from 'node:crypto'
import request from 'supertest'
import { createApp } from '../../src/app'
import { KGAlphabetAttempt } from '../../src/models/KGAlphabetAttempt'
import { KGAlphabetProgress } from '../../src/models/KGAlphabetProgress'
import { KGAlphabetSubmission } from '../../src/models/KGAlphabetSubmission'
import { KGIntroPlayback } from '../../src/models/KGIntroPlayback'
import { School } from '../../src/models/School'
import { Student } from '../../src/models/Student'
import { AzureVoiceProvider } from '../../src/providers/voice/AzureVoiceProvider'
import { PythonVoiceProvider } from '../../src/providers/voice/PythonVoiceProvider'
import { S3Service } from '../../src/services/S3Service'
import { KGSpeechService } from '../../src/services/kg-speech.service'
import { VoiceWarmupService } from '../../src/services/voice-warmup.service'
import { hashPassword } from '../../src/utils/password'
import { pinLookup } from '../../src/utils/student-pin'
import { clearTestDatabase, connectTestDatabase, disconnectTestDatabase } from './dbTestUtils'

/**
 * HTTP-to-real-Mongo KG production-contract harness, NOT a microphone test.
 *
 * The only fake boundaries are Sarvam (a fixed synthetic transcript) and
 * Azure (synthetic MP3-sized bytes). The actual PIN login, session
 * invalidation, intro ticket, grade, Mongo state, voice receipt and
 * homework endpoints run unmocked via the Express app.
 *
 * Never run with a school/production database or real child credentials.
 */
const app = createApp()
const TEST_PINS = ['03142', '97531'] as const

beforeAll(() => connectTestDatabase())
afterAll(() => disconnectTestDatabase())
beforeEach(() => {
  jest.spyOn(VoiceWarmupService, 'schedule').mockImplementation(() => undefined)
})
afterEach(async () => {
  jest.restoreAllMocks()
  await clearTestDatabase()
})

async function makeTwoPilotStudents() {
  const school = await School.create({
    name: 'Disposable KG Full Session Fixture', code: 'KG35TEST',
    passwordHash: 'test-only-school-hash', status: 'active',
  })
  const first = await Student.create({
    schoolId: school._id, fullName: 'Synthetic Learner A', rollNumber: '1',
    grade: 0, className: 'TEST-KG-A', avatarType: 'GIRL', status: 'active',
    kgAlphabetPilotEnabled: true, pinLookup: pinLookup(TEST_PINS[0]),
    passwordHash: await hashPassword(TEST_PINS[0]),
  })
  const second = await Student.create({
    schoolId: school._id, fullName: 'Synthetic Learner B', rollNumber: '2',
    grade: 0, className: 'TEST-KG-A', avatarType: 'BOY', status: 'active',
    kgAlphabetPilotEnabled: true, pinLookup: pinLookup(TEST_PINS[1]),
    passwordHash: await hashPassword(TEST_PINS[1]),
  })
  return { school, first, second }
}

async function loginByPin(pin: string) {
  const response = await request(app).post('/api/auth/student/pin-login')
    .send({ pin }).expect(200)
  expect(response.body.data.token).toEqual(expect.any(String))
  expect(response.body.data.student.grade).toBe(0)
  expect(response.body.data.student).not.toHaveProperty('passwordHash')
  expect(response.body.data.student).not.toHaveProperty('pinLookup')
  return 'Bearer ' + response.body.data.token as string
}

async function watchCompletedIntro(authorization: string) {
  const started = await request(app).post('/api/kg-alphabet/intro/start')
    .set('Authorization', authorization).expect(200)
  const playbackId: string = started.body.data.playbackId
  expect(playbackId).toMatch(/^[a-f0-9]{64}$/)
  const withoutFilm = await request(app).post('/api/kg-alphabet/intro-seen')
    .set('Authorization', authorization).send({ videoEnded: true, playbackId }).expect(409)
  expect(withoutFilm.body.error.code).toBe('CONFLICT')
  // CI has no physical screen or film playback; backdate only the ephemeral
  // Mongo fixture to model the passage of the required 59+ seconds.
  await KGIntroPlayback.updateOne({
    tokenHash: createHash('sha256').update(playbackId).digest('hex'),
  }, { $set: { startedAt: new Date(Date.now() - 65_000) } })
  await request(app).post('/api/kg-alphabet/intro-seen')
    .set('Authorization', authorization).send({ videoEnded: true, playbackId }).expect(200)
  return playbackId
}

function asStudent(authorization: string, ticket: string) {
  return {
    auth: authorization,
    ticket,
    protected: (path: string) => request(app).get(path)
      .set('Authorization', authorization).set('X-KG-Intro-Playback', ticket),
    post: (path: string, body: Record<string, unknown>) => request(app).post(path)
      .set('Authorization', authorization).set('X-KG-Intro-Playback', ticket).send(body),
  }
}

async function playAndAck(
  student: ReturnType<typeof asStudent>,
  submissionId: string, expectedIndex: number,
) {
  const path = '/api/kg-alphabet/attempt/' + submissionId
  const before = await student.protected('/api/kg-alphabet/state').expect(200)
  expect(before.body.data.currentIndex).toBe(expectedIndex)
  const audio = await student.protected(path + '/feedback-audio').expect(200)
  expect(audio.headers['content-type']).toMatch(/audio\/mpeg/)
  expect(audio.headers['cache-control']).toMatch(/no-store/)
  expect(audio.headers['x-voice-provider']).toBe('azure')
  expect(audio.headers['x-kg-feedback-receipt']).toMatch(/^v1\./)
  const receipt = audio.headers['x-kg-feedback-receipt'] as string
  // A receipt from a different submission (or a fabricated value) is useless.
  await student.post(path + '/feedback-played',
    { feedbackReceipt: receipt.slice(0, -1) + (receipt.endsWith('a') ? 'b' : 'a') }).expect(409)
  const success = await student.post(path + '/feedback-played',
    { feedbackReceipt: receipt }).expect(200)
  expect(success.body.data.state.currentIndex).toBe(expectedIndex + 1)
  const again = await student.post(path + '/feedback-played',
    { feedbackReceipt: receipt }).expect(200)
  expect(again.body.data.state.currentIndex).toBe(expectedIndex + 1)
  return success.body.data.state
}

it('uses real 5-digit PIN, intro, 8 saved turns, receipt ACK, homework and safe lab logout', async () => {
  const { first, second } = await makeTwoPilotStudents()
  await request(app).post('/api/auth/student/pin-login').send({ pin: '1234' }).expect(400)
  await request(app).post('/api/auth/student/pin-login').send({ pin: '00000' }).expect(401)
  const tokenA = await loginByPin(TEST_PINS[0])
  const tokenB = await loginByPin(TEST_PINS[1])
  expect((await request(app).get('/api/kg-alphabet/state')
    .set('Authorization', tokenA).expect(200)).body.data.currentIndex).toBe(0)
  await request(app).post('/api/kg-alphabet/attempt').set('Authorization', tokenA)
    .send({ activityId: 'say-a', submissionId: 'kg35-early-0000001',
      noSpeech: true, durationMs: 1000 }).expect(409)

  const ticketA = await watchCompletedIntro(tokenA)
  const ticketB = await watchCompletedIntro(tokenB)
  const a = asStudent(tokenA, ticketA)
  const b = asStudent(tokenB, ticketB)

  // Serve reviewed fixed pronunciation narration from synthetic S3 data,
  // then the lesson's live opening instruction from synthetic Priya bytes.
  // Neither provider is contacted from this disposable integration suite.
  const s3 = jest.spyOn(S3Service, 'getAudio')
    .mockResolvedValue(Buffer.concat([Buffer.from([73, 68, 51, 4, 0, 0]), Buffer.alloc(350)]))
  const local = jest.spyOn(PythonVoiceProvider.prototype, 'synthesize')
    .mockResolvedValue({ audioUrl: null, audioBase64: Buffer.alloc(400, 65).toString('base64'),
      contentType: 'audio/wav', available: true, provider: 'synthetic-priya' })
  const fixedPrompt = await a.protected('/api/kg-alphabet/audio/v1/letter-a').expect(200)
  expect(fixedPrompt.headers['content-type']).toMatch(/audio\/mpeg/)
  expect(s3).toHaveBeenCalledWith('kg/level-1/miss-julie/v1/letter-a.mp3')
  const livePrompt = await a.protected('/api/kg-alphabet/audio/v1/say-a').expect(200)
  expect(livePrompt.headers['x-voice-provider']).toBe('python-priya')
  expect(local).toHaveBeenCalledWith('A! A for apple! Can you say apple?')

  const fakeVoice = jest.spyOn(AzureVoiceProvider.prototype, 'synthesizeUncached')
    .mockResolvedValue({ audio: Buffer.alloc(512, 65), contentType: 'audio/mpeg' })
  const syntheticWords = ['apple', 'ball', 'cat', 'dog']
  let sttCalls = 0
  const fakeStt = jest.spyOn(KGSpeechService, 'transcribe').mockImplementation(async () => ({
    transcript: syntheticWords[sttCalls++], available: true,
    provider: 'synthetic-stt', languageCode: 'en-IN',
  } as never))

  const quietId = 'kg35-quiet-0000001'
  const quiet = await a.post('/api/kg-alphabet/attempt', {
    activityId: 'say-a', submissionId: quietId,
    noSpeech: true, durationMs: 1000,
  }).expect(200)
  expect(quiet.body.data.outcome).toBe('unclear')
  expect(quiet.body.data.state.currentIndex).toBe(0)
  expect(fakeStt).not.toHaveBeenCalled()
  await a.post('/api/kg-alphabet/attempt/' + quietId + '/feedback-played', {}).expect(409)
  // For the unclear attempt, audio+ACK must NOT promote pronunciation.
  const quietAudio = await a.protected('/api/kg-alphabet/attempt/' + quietId + '/feedback-audio').expect(200)
  const quietAck = await a.post('/api/kg-alphabet/attempt/' + quietId + '/feedback-played',
    { feedbackReceipt: quietAudio.headers['x-kg-feedback-receipt'] }).expect(200)
  expect(quietAck.body.data.state.currentIndex).toBe(0)

  const activityIds = ['say-a', 'say-b', 'say-c', 'say-d', 'find-a', 'find-b', 'find-c', 'find-d']
  for (let i = 0; i < activityIds.length; i++) {
    const activityId = activityIds[i]
    const word = syntheticWords[i % 4]
    const submissionId = 'kg35-turn-' + String(i).padStart(2, '0') + '-000000'
    const body = i < 4
      ? { activityId, submissionId, audioBase64: 'Y'.repeat(160),
          mimeType: 'audio/webm', durationMs: 950, timeSpentMs: 1200,
          studentId: second._id.toString(), outcome: 'incorrect' }
      : { activityId, submissionId, selected: word, timeSpentMs: 400,
          studentId: second._id.toString(), outcome: 'incorrect' }

    const response = await a.post('/api/kg-alphabet/attempt', body).expect(200)
    expect(response.body.data.outcome).toBe('correct')
    expect(response.body.data.state.currentIndex).toBe(i)
    expect(response.body.data.feedbackText).toEqual(expect.any(String))
    const beforeAck = await a.protected('/api/kg-alphabet/pending-feedback').expect(200)
    expect(beforeAck.body.data.pending.submissionId).toBe(submissionId)
    if (i === 0) {
      // Another logged-in student cannot fetch or acknowledge A's attempts.
      await b.protected('/api/kg-alphabet/attempt/' + submissionId + '/feedback-audio').expect(404)
      await b.post('/api/kg-alphabet/attempt/' + submissionId + '/feedback-played', {}).expect(404)
      await a.post('/api/kg-alphabet/attempt/' + submissionId + '/feedback-played', {}).expect(409)
    }
    const state = await playAndAck(a, submissionId, i)
    expect(state.currentIndex).toBe(i + 1)
    const repeated = await a.post('/api/kg-alphabet/attempt', body).expect(200)
    expect(repeated.body.data.duplicate).toBe(true)
    expect(repeated.body.data.feedbackText).toBe(response.body.data.feedbackText)
    expect(repeated.body.data.state.currentIndex).toBe(i + 1)
    const saved = await KGAlphabetAttempt.findOne({ studentId: first._id, submissionId }).lean()
    expect(saved?.awaitingFeedbackPlayback).toBe(false)
    expect(saved?.feedbackAcknowledgedAt).toBeInstanceOf(Date)
  }
  expect(fakeStt).toHaveBeenCalledTimes(4)
  expect(fakeVoice.mock.calls.length).toBeGreaterThanOrEqual(9)

  const final = await a.protected('/api/kg-alphabet/state').expect(200)
  expect(final.body.data).toMatchObject({
    currentIndex: 8, completed: true, xp: 100, stars: 3,
    homework: { status: 'pending' },
  })
  expect(final.body.data.completedAt).toBeTruthy()
  expect((await a.protected('/api/kg-alphabet/pending-feedback').expect(200)).body.data.pending).toBeNull()
  const homework = '/api/kg-alphabet/homework/complete'
  const savedHomework = await a.post(homework,
    { homeworkId: 'kg-abcd-picture-homework-v1' }).expect(200)
  expect(savedHomework.body.data.homework.status).toBe('completed')
  const homeworkDate = savedHomework.body.data.homework.completedAt
  expect(homeworkDate).toBeTruthy()
  const retriedHomework = await a.post(homework,
    { homeworkId: 'kg-abcd-picture-homework-v1' }).expect(200)
  expect(retriedHomework.body.data.homework.completedAt).toBe(homeworkDate)

  const attempts = await KGAlphabetAttempt.find({ studentId: first._id }).lean()
  expect(attempts).toHaveLength(9)
  expect(attempts.every((attempt) => !('audioBase64' in attempt) && !('audio' in attempt))).toBe(true)
  expect(attempts.filter((attempt) => attempt.outcome === 'correct')).toHaveLength(8)
  expect(await KGAlphabetSubmission.countDocuments()).toBe(0)
  expect((await KGAlphabetProgress.findOne({ studentId: second._id }).lean())?.currentIndex).toBe(0)

  await request(app).post('/api/auth/logout').set('Authorization', tokenA).expect(200)
  await request(app).get('/api/kg-alphabet/state').set('Authorization', tokenA).expect(401)
  // The other logged-in student and completed intro were NOT revoked.
  expect((await b.protected('/api/kg-alphabet/pending-feedback').expect(200)).body.data.pending).toBeNull()
  const refreshedA = await loginByPin(TEST_PINS[0])
  // The new valid PIN session cannot reuse a ticket from before logout.
  await request(app).get('/api/kg-alphabet/pending-feedback')
    .set('Authorization', refreshedA).set('X-KG-Intro-Playback', ticketA).expect(409)
  const freshTicket = await watchCompletedIntro(refreshedA)
  const resumed = await asStudent(refreshedA, freshTicket)
    .protected('/api/kg-alphabet/state').expect(200)
  expect(resumed.body.data).toMatchObject({
    currentIndex: 8, completed: true, xp: 100, stars: 3,
    homework: { status: 'completed' },
  })
  expect(await KGAlphabetAttempt.countDocuments({ studentId: second._id })).toBe(0)
})
