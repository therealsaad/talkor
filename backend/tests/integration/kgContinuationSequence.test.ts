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
import * as KGAzureNarration from '../../src/services/kg-azure-narration.service'
import { getKGContinuationNarration } from '../../src/kg/student-continuation-catalog'
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
  await KGContinuationProgress.updateOne({ studentId, level }, { $set: { introStartedAt: new Date(Date.now() - (level === 5 ? 61_000 : 91_000)) } })
  await request(app).post(base + '/intro/complete').set('Authorization', auth)
    .send({ playbackId, videoEnded: true }).expect(200)
  return { Authorization: auth, 'X-KG-Continuation-Intro': playbackId }
}

it.each([[3, 90_000], [4, 90_000], [5, 60_000]])(
  'requires the complete packaged Level %s film duration before accepting its ticket', async (level, duration) => {
    const { student, school, auth } = await fixture()
    await KGLevel2Progress.updateOne({ studentId: student._id }, { $set: { currentIndex: 6, completedAt: new Date() } })
    for (let previous = 3; previous < level; previous++) {
      await KGContinuationProgress.create({ studentId: student._id, schoolId: school._id,
        level: previous, currentIndex: 6, completedAt: new Date() })
    }
    const base = '/api/kg-continuation/' + level
    const started = await request(app).post(base + '/intro/start').set('Authorization', auth).expect(200)
    const body = { playbackId: started.body.data.playbackId, videoEnded: true }
    for (const elapsed of [20_000, duration - 5_000]) {
      await KGContinuationProgress.updateOne({ studentId: student._id, level },
        { $set: { introStartedAt: new Date(Date.now() - elapsed) } })
      await request(app).post(base + '/intro/complete').set('Authorization', auth).send(body).expect(409)
      expect((await KGContinuationProgress.findOne({ studentId: student._id, level }))?.introCompletedAt).toBeUndefined()
    }
    await KGContinuationProgress.updateOne({ studentId: student._id, level },
      { $set: { introStartedAt: new Date(Date.now() - duration - 1_000) } })
    await request(app).post(base + '/intro/complete').set('Authorization', auth).send({ ...body, videoEnded: false }).expect(409)
    await request(app).post(base + '/intro/complete').set('Authorization', auth).send(body).expect(200)
  },
)

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

it('uses reviewed fixed narration cache only after the KG3 intro and does not call live Azure', async () => {
  const { student, auth } = await fixture()
  await KGLevel2Progress.updateOne({ studentId: student._id },
    { $set: { currentIndex: 6, completedAt: new Date() } })
  const headers = await intro(3, auth, student._id)
  const bytes = Buffer.concat([Buffer.from('ID3'), Buffer.alloc(380, 0x30)])
  const cached = jest.spyOn(KGAzureNarration, 'getKGAzureNarrationAudio')
    .mockResolvedValue({ audio: bytes, contentType: 'audio/mpeg', source: 's3', storedInS3: true })
  const liveAzure = jest.spyOn(AzureVoiceProvider.prototype, 'synthesizeUncached')
    .mockRejectedValue(new Error('Live Azure must not run for a cache hit'))
  const old = process.env.TALKORA_KG_FIXED_NARRATION_CACHE
  process.env.TALKORA_KG_FIXED_NARRATION_CACHE = 'true'
  try {
    const endpoint = '/api/kg-continuation/3/narration/word-k'
    await request(app).get(endpoint).set('Authorization', auth).expect(409)
    await request(app).get(endpoint).set(headers).expect(200)
      .expect('Cache-Control', 'private, no-store')
      .expect('Content-Type', /audio\/mpeg/)
      .expect('X-Voice-Provider', 'azure-s3')
    expect(cached).toHaveBeenCalledTimes(1)
    expect(cached).toHaveBeenCalledWith({
      level: 3, id: 'word-k', text: getKGContinuationNarration(3, 'word-k'),
    })
    expect(liveAzure).not.toHaveBeenCalled()
    await request(app).get('/api/kg-continuation/4/narration/letter-q').set(headers).expect(403)
    expect(cached).toHaveBeenCalledTimes(1)
  } finally {
    if (old === undefined) delete process.env.TALKORA_KG_FIXED_NARRATION_CACHE
    else process.env.TALKORA_KG_FIXED_NARRATION_CACHE = old
  }
})

it('rejects invalid cached narration bytes, with no unusable audio response', async () => {
  const { student, auth } = await fixture()
  await KGLevel2Progress.updateOne({ studentId: student._id },
    { $set: { currentIndex: 6, completedAt: new Date() } })
  const headers = await intro(3, auth, student._id)
  const cached = jest.spyOn(KGAzureNarration, 'getKGAzureNarrationAudio')
    .mockResolvedValue({ audio: Buffer.alloc(0), contentType: 'audio/mpeg', source: 's3', storedInS3: true })
  const old = process.env.TALKORA_KG_FIXED_NARRATION_CACHE
  process.env.TALKORA_KG_FIXED_NARRATION_CACHE = 'true'
  try {
    await request(app).get('/api/kg-continuation/3/narration/letter-k').set(headers).expect(502)
    expect(cached).toHaveBeenCalledTimes(1)
  } finally {
    if (old === undefined) delete process.env.TALKORA_KG_FIXED_NARRATION_CACHE
    else process.env.TALKORA_KG_FIXED_NARRATION_CACHE = old
  }
})

it('KG3 sher teaches lion in Hindi, saves replay locale and never advances before an English letter + audio ACK', async () => {
  const { student, auth } = await fixture()
  await KGLevel2Progress.updateOne({ studentId: student._id }, { $set: { currentIndex: 6, completedAt: new Date() } })
  await get(3, auth).expect(200)
  // Earlier K was completed in this disposable fixture; L is the current checkpoint.
  await KGContinuationProgress.updateOne({ studentId: student._id, level: 3 }, { $set: { currentIndex: 1 } })
  const headers = await intro(3, auth, student._id)
  const speech = jest.spyOn(KGSpeechService, 'transcribe')
    .mockResolvedValueOnce({ transcript: 'sher', available: true, provider: 'sarvam', languageCode: 'en-IN' } as never)
    .mockResolvedValueOnce({ transcript: 'lion', available: true, provider: 'sarvam', languageCode: 'en-IN' } as never)
    .mockResolvedValueOnce({ transcript: 'el', available: true, provider: 'sarvam', languageCode: 'en-IN' } as never)
  const azure = jest.spyOn(AzureVoiceProvider.prototype, 'synthesizeUncached')
    .mockResolvedValue({ audio: Buffer.alloc(512, 65), contentType: 'audio/mpeg' })
  const submit = (id: string) => request(app).post('/api/kg-continuation/3/attempt').set(headers).send({
    letter: 'L', submissionId: id, durationMs: 1000, mimeType: 'audio/webm', audioBase64: 'Y'.repeat(160),
  })
  const translationId = 'kg3-sher-lion-12345'
  const translated = await submit(translationId).expect(200)
  expect(translated.body.data.outcome).toBe('incorrect')
  expect(translated.body.data.feedbackText).toContain('शेर')
  expect(translated.body.data.feedbackText).toContain('lion')
  expect(translated.body.data.feedbackText).toContain('Say lion.')
  let persisted = await KGContinuationAttempt.findOne({ studentId: student._id, level: 3, submissionId: translationId }).lean()
  expect(persisted?.feedbackLanguageCode).toBe('hi-IN')
  expect(persisted?.feedbackAcknowledgedAt).toBeUndefined()
  expect((await get(3, auth).expect(200)).body.data.currentIndex).toBe(1)
  const audio = await request(app).get('/api/kg-continuation/3/attempt/' + translationId + '/feedback-audio')
    .set(headers).expect(200)
  expect(azure).toHaveBeenCalledWith(expect.stringContaining('lion'), { language: 'hi-IN' })
  expect(audio.headers['x-kg-feedback-receipt']).toMatch(/^v1\./)
  await request(app).post('/api/kg-continuation/3/attempt/' + translationId + '/feedback-played')
    .set(headers).send({ feedbackReceipt: audio.headers['x-kg-feedback-receipt'] }).expect(200)
  // A Hindi translation is understanding evidence, NOT English letter mastery.
  expect((await get(3, auth).expect(200)).body.data.currentIndex).toBe(1)
  // The child now repeats the NEW English picture word; it is praised and
  // then the original, separately assessed letter task is shown.
  const repeatId = 'kg3-repeat-lion-12345'
  const repeated = await submit(repeatId).expect(200)
  expect(repeated.body.data.outcome).toBe('incorrect') // Word is not letter mastery.
  expect(repeated.body.data.feedbackText).toContain('lion')
  expect(repeated.body.data.feedbackText).toContain('letter L')
  const repeatedAudio = await request(app).get('/api/kg-continuation/3/attempt/' + repeatId + '/feedback-audio')
    .set(headers).expect(200)
  await request(app).post('/api/kg-continuation/3/attempt/' + repeatId + '/feedback-played')
    .set(headers).send({ feedbackReceipt: repeatedAudio.headers['x-kg-feedback-receipt'] }).expect(200)
  expect((await get(3, auth).expect(200)).body.data.currentIndex).toBe(1)
  const englishId = 'kg3-letter-l-123456'
  const correct = await submit(englishId).expect(200)
  expect(correct.body.data.outcome).toBe('correct')
  const englishAudio = await request(app).get('/api/kg-continuation/3/attempt/' + englishId + '/feedback-audio')
    .set(headers).expect(200)
  await request(app).post('/api/kg-continuation/3/attempt/' + englishId + '/feedback-played')
    .set(headers).send({ feedbackReceipt: englishAudio.headers['x-kg-feedback-receipt'] }).expect(200)
  expect((await get(3, auth).expect(200)).body.data.currentIndex).toBe(2)
  expect(speech).toHaveBeenCalledTimes(3)
  persisted = await KGContinuationAttempt.findOne({ studentId: student._id, level: 3, submissionId: translationId }).lean()
  expect(persisted?.feedbackAcknowledgedAt).toBeTruthy()
})
