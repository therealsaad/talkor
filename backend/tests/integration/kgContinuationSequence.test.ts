import request from 'supertest'
import { createApp } from '../../src/app'
import { KGAlphabetProgress } from '../../src/models/KGAlphabetProgress'
import { KGLevel2Progress } from '../../src/models/KGLevel2Progress'
import { KGContinuationProgress } from '../../src/models/KGContinuationProgress'
import { KGContinuationAttempt } from '../../src/models/KGContinuationAttempt'
import { School } from '../../src/models/School'
import { Student } from '../../src/models/Student'
import { KGSpeechService } from '../../src/services/kg-speech.service'
import { AzureVoiceProvider } from '../../src/providers/voice/AzureVoiceProvider'
import { signToken } from '../../src/utils/jwt'
import { connectTestDatabase, disconnectTestDatabase, clearTestDatabase } from './dbTestUtils'

const app = createApp()
beforeAll(connectTestDatabase)
afterAll(disconnectTestDatabase)
afterEach(async () => { jest.restoreAllMocks(); await clearTestDatabase() })

async function fixture() {
  const school = await School.create({
    name: 'KG Level Continuation', code: 'KGCNT1', passwordHash: 'hash', status: 'active',
  })
  const student = await Student.create({
    schoolId: school._id, fullName: 'KG Explorer', rollNumber: 'continuation-1', grade: 0,
    passwordHash: 'hash', avatarType: 'GIRL', status: 'active', kgAlphabetPilotEnabled: true,
  })
  await KGAlphabetProgress.create({
    studentId: student._id, schoolId: school._id, currentIndex: 8,
    introSeen: true, xp: 100, stars: 3, homeworkStatus: 'pending',
  })
  await KGLevel2Progress.create({
    studentId: student._id, schoolId: school._id, currentIndex: 5,
  })
  const auth = 'Bearer ' + signToken({
    sub: student._id.toString(), schoolId: school._id.toString(), role: 'STUDENT', sv: 0,
  })
  return { student, school, auth }
}
const get = (level: number, auth: string) => request(app).get('/api/kg-continuation/' + level + '/state')
  .set('Authorization', auth)
const overview = (auth: string) => request(app).get('/api/kg-continuation/overview')
  .set('Authorization', auth)
async function intro(level: number, auth: string, studentId: unknown) {
  const base = '/api/kg-continuation/' + level
  const started = await request(app).post(base + '/intro/start').set('Authorization', auth).expect(200)
  const playbackId: string = started.body.data.playbackId
  expect(playbackId).toMatch(/^[a-f0-9]{64}$/)
  await request(app).post(base + '/intro/complete').set('Authorization', auth)
    .send({ playbackId, videoEnded: true }).expect(409)
  await KGContinuationProgress.updateOne({ studentId, level }, { $set: { introStartedAt: new Date(Date.now() - 20_000) } })
  await request(app).post(base + '/intro/complete').set('Authorization', auth)
    .send({ playbackId, videoEnded: true }).expect(200)
  return { Authorization: auth, 'X-KG-Continuation-Intro': playbackId }
}

it('unlocks K–P only after KG Level 2 completion; no bypass of level 4, 5, 6 or staff preview', async () => {
  const { student, auth } = await fixture()
  expect((await overview(auth).expect(200)).body.data).toMatchObject({
    nextLevel: null, levels: [{ level: 3, status: 'LOCKED' }, { level: 4, status: 'LOCKED' }, { level: 5, status: 'LOCKED' }],
  })
  await get(3, auth).expect(403)
  await get(4, auth).expect(403)
  await get(5, auth).expect(403)
  await get(6, auth).expect(404)
  expect(await KGContinuationProgress.countDocuments({ studentId: student._id })).toBe(0)
  await KGLevel2Progress.updateOne({ studentId: student._id }, { $set: { currentIndex: 6, completedAt: new Date() } })
  expect((await overview(auth).expect(200)).body.data).toMatchObject({
    nextLevel: 3, levels: [{ level: 3, status: 'CURRENT' }, { level: 4, status: 'LOCKED' }, { level: 5, status: 'LOCKED' }],
  })
  expect((await get(3, auth).expect(200)).body.data).toMatchObject({
    currentIndex: 0, activity: { letter: 'K' }, completed: false,
  })
  await get(4, auth).expect(403)
  await request(app).post('/api/kg-continuation/3/attempt').set('Authorization', auth)
    .send({ letter: 'K', submissionId: 'skip-intro-123456' }).expect(409)
  await request(app).post('/api/kg-level3-preview/attempt').set('Authorization', auth)
    .send({ letter: 'K', noSpeech: true, durationMs: 1000 }).expect(403)
})

it('verified final letter opens the exact next continuation level; resumes after a new PIN login and ends safely after Z', async () => {
  const { student, school, auth } = await fixture()
  await KGLevel2Progress.updateOne({ studentId: student._id }, { $set: { currentIndex: 6, completedAt: new Date() } })
  jest.spyOn(AzureVoiceProvider.prototype, 'synthesizeUncached').mockResolvedValue({
    audio: Buffer.alloc(500, 65), contentType: 'audio/mpeg',
  })
  const stt = jest.spyOn(KGSpeechService, 'transcribe')
  for (const part of [
    { level: 3, index: 5, letter: 'P', transcript: 'pee', next: 4 },
    { level: 4, index: 5, letter: 'V', transcript: 'vee', next: 5 },
    { level: 5, index: 3, letter: 'Z', transcript: 'zee', next: null },
  ] as const) {
    const base = '/api/kg-continuation/' + part.level
    const ready = await get(part.level, auth).expect(200)
    expect(ready.body.data.currentIndex).toBe(0)
    await KGContinuationProgress.updateOne({ studentId: student._id, level: part.level },
      { $set: { currentIndex: part.index } }) // Synthetic fixture only: earlier letters were completed.
    const headers = await intro(part.level, auth, student._id)
    stt.mockResolvedValueOnce({
      available: true, provider: 'sarvam', transcript: part.transcript, languageCode: 'en-IN',
    } as never)
    const id = 'next-level-' + part.level + '-12345'
    const post = () => request(app).post(base + '/attempt').set(headers).send({
      letter: part.letter, submissionId: id, durationMs: 1000,
      audioBase64: 'Y'.repeat(160), mimeType: 'audio/webm',
    })
    const correct = await post().expect(200)
    expect(correct.body.data.outcome).toBe('correct')
    expect((await get(part.level, auth).expect(200)).body.data.currentIndex).toBe(part.index)
    expect((await post().expect(200)).body.data.duplicate).toBe(true)
    await request(app).post(base + '/attempt/' + id + '/feedback-played').set(headers)
      .send({ feedbackReceipt: 'forged' }).expect(409)
    expect((await get(part.level, auth).expect(200)).body.data.pendingFeedback).toMatchObject({ submissionId: id })
    const audio = await request(app).get(base + '/attempt/' + id + '/feedback-audio').set(headers).expect(200)
    expect(audio.headers['x-voice-provider']).toBe('azure')
    expect(audio.headers['x-kg-feedback-receipt']).toMatch(/^v1\./)
    const finished = await request(app).post(base + '/attempt/' + id + '/feedback-played').set(headers)
      .send({ feedbackReceipt: audio.headers['x-kg-feedback-receipt'] }).expect(200)
    expect(finished.body.data).toMatchObject({ completed: true, currentIndex: part.index + 1, activity: null })
    const reloaded = await get(part.level, auth).expect(200)
    expect(reloaded.body.data.completed).toBe(true)
    expect((await overview(auth).expect(200)).body.data.nextLevel).toBe(part.next)
    const attempt = await KGContinuationAttempt.findOne({ studentId: student._id, level: part.level, submissionId: id }).lean()
    expect(attempt?.feedbackAcknowledgedAt).toBeTruthy()
    expect(attempt).not.toHaveProperty('audioBase64')
    expect(attempt).not.toHaveProperty('transcript')
    await request(app).post(base + '/attempt/' + id + '/feedback-played').set(headers)
      .send({ feedbackReceipt: audio.headers['x-kg-feedback-receipt'] }).expect(404)
  }
  expect((await overview(auth).expect(200)).body.data).toMatchObject({
    nextLevel: null, unavailableLevels: [6, 7, 8, 9, 10],
  })
  // A fresh authenticated session must see the same saved progress.
  const nextAuth = 'Bearer ' + signToken({
    sub: student._id.toString(), schoolId: school._id.toString(), role: 'STUDENT', sv: 0,
  })
  expect((await overview(nextAuth).expect(200)).body.data.nextLevel).toBeNull()
  expect(await KGContinuationProgress.countDocuments({ studentId: student._id, schoolId: school._id })).toBe(3)
  expect(await KGContinuationAttempt.countDocuments({ studentId: student._id })).toBe(3)
})
