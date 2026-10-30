import { createHash } from 'node:crypto'
import request from 'supertest'
import { createApp } from '../../src/app'
import { KGAlphabetProgress } from '../../src/models/KGAlphabetProgress'
import { KGAlphabetAttempt } from '../../src/models/KGAlphabetAttempt'
import { KGAlphabetSubmission } from '../../src/models/KGAlphabetSubmission'
import { KGIntroPlayback } from '../../src/models/KGIntroPlayback'
import { School } from '../../src/models/School'
import { Student } from '../../src/models/Student'
import { S3Service } from '../../src/services/S3Service'
import { KGSpeechService } from '../../src/services/kg-speech.service'
import { clearKGStaticAudioCache } from '../../src/services/kg-static-audio-cache'
import { PythonVoiceProvider } from '../../src/providers/voice/PythonVoiceProvider'
import { AzureVoiceProvider } from '../../src/providers/voice/AzureVoiceProvider'
import { KGQwenFeedbackService } from '../../src/services/kg-qwen-feedback.service'
import { ApiError } from '../../src/utils/ApiError'
import { signToken } from '../../src/utils/jwt'
import { clearTestDatabase, connectTestDatabase, disconnectTestDatabase } from './dbTestUtils'

const app = createApp()
let activePlaybackId = ''
async function approveIntro(authorization: string) {
  const started = await request(app).post('/api/kg-alphabet/intro/start').set('Authorization', authorization).expect(200)
  activePlaybackId = started.body.data.playbackId
  // Advance only the DB's test clock, never bypass this in production.
  await KGIntroPlayback.updateOne({ tokenHash: createHash('sha256').update(activePlaybackId).digest('hex') },
    { $set: { startedAt: new Date(Date.now() - 65_000) } })
  await request(app).post('/api/kg-alphabet/intro-seen').set('Authorization', authorization)
    .send({ videoEnded: true, playbackId: activePlaybackId }).expect(200)
}


beforeAll(() => connectTestDatabase())
afterAll(() => disconnectTestDatabase())
afterEach(async () => {
  activePlaybackId = ''
  jest.restoreAllMocks()
  clearKGStaticAudioCache()
  await clearTestDatabase()
})

it('saves all ABCD speech attempts, handles low-confidence speech, resumes, and completes the real puzzle sequence', async () => {
  const { student, authorization } = await makePilot()
  await approveIntro(authorization)
  const transcribe = jest.spyOn(KGSpeechService, 'transcribe')
    .mockResolvedValueOnce({ transcript: 'um', confidence: 0.1, available: true, provider: 'test' } as never)
    .mockResolvedValueOnce({ transcript: 'um', uncertain: true, available: true, provider: 'test' } as never)
  const speak = (id: string, submissionId: string) => request(app).post('/api/kg-alphabet/attempt').set('Authorization', authorization).set('X-KG-Intro-Playback', activePlaybackId)
    .send({ activityId: id, submissionId, audioBase64: 'Y'.repeat(160), mimeType: 'audio/webm', durationMs: 1000 })
  expect((await speak('say-a', 'quality-low-123456').expect(200)).body.data.outcome).toBe('unclear')
  expect((await speak('say-a', 'quality-flag-12345').expect(200)).body.data.outcome).toBe('unclear')
  for (const [letter, word] of [['a', 'apple'], ['b', 'ball'], ['c', 'cat'], ['d', 'dog']]) {
    transcribe.mockResolvedValueOnce({ transcript: word, available: true, provider: 'test' } as never)
    await speak(`say-${letter}`, `complete-speech-${letter}-1234`).expect(200)
  }
  const resumed = await request(app).get('/api/kg-alphabet/state').set('Authorization', authorization).expect(200)
  expect(resumed.body.data.currentIndex).toBe(4)
  for (const [letter, word] of [['a', 'apple'], ['b', 'ball'], ['c', 'cat'], ['d', 'dog']]) {
    await request(app).post('/api/kg-alphabet/attempt').set('Authorization', authorization).set('X-KG-Intro-Playback', activePlaybackId)
      .send({ activityId: `find-${letter}`, selected: word, submissionId: `complete-touch-${letter}-1234`, studentId: 'forged', schoolId: 'forged', outcome: 'correct' }).expect(200)
  }
  const progress = await KGAlphabetProgress.findOne({ studentId: student._id })
  expect(progress?.currentIndex).toBe(8)
  expect(progress?.completedAt).toBeTruthy()
  const attempts = await KGAlphabetAttempt.find({ studentId: student._id }).lean()
  expect(attempts).toHaveLength(10)
  expect(attempts.every((attempt) => attempt.schoolId.toString() === student.schoolId.toString())).toBe(true)
  expect(attempts.every((attempt) => !('audioBase64' in attempt) && !('audio' in attempt))).toBe(true)
  expect(await KGAlphabetSubmission.countDocuments()).toBe(0)
})

it('serializes simultaneous retries before STT and rejects reusing an ID for a different answer', async () => {
  const { authorization } = await makePilot()
  await approveIntro(authorization)
  let entered!: () => void
  let release!: () => void
  const started = new Promise<void>((resolve) => { entered = resolve })
  const gate = new Promise<void>((resolve) => { release = resolve })
  const transcribe = jest.spyOn(KGSpeechService, 'transcribe').mockImplementation(async () => {
    entered(); await gate
    return { transcript: 'apple', available: true, provider: 'test' } as never
  })
  const body = { activityId: 'say-a', submissionId: 'concurrent-speech-1234', audioBase64: 'Y'.repeat(160), mimeType: 'audio/webm', durationMs: 1000 }
  const first = request(app).post('/api/kg-alphabet/attempt').set('Authorization', authorization).set('X-KG-Intro-Playback', activePlaybackId).send(body).then((response) => response)
  await started
  const duplicate = await request(app).post('/api/kg-alphabet/attempt').set('Authorization', authorization).set('X-KG-Intro-Playback', activePlaybackId).send(body).expect(409)
  expect(duplicate.body.error.details.retryable).toBe(true)
  release()
  expect((await first).status).toBe(200)
  const recovered = await request(app).post('/api/kg-alphabet/attempt').set('Authorization', authorization).set('X-KG-Intro-Playback', activePlaybackId).send(body).expect(200)
  expect(recovered.body.data.duplicate).toBe(true)
  expect(recovered.body.data.state.currentIndex).toBe(1)
  expect(transcribe).toHaveBeenCalledTimes(1)
  await request(app).post('/api/kg-alphabet/attempt').set('Authorization', authorization).set('X-KG-Intro-Playback', activePlaybackId).send({ ...body, audioBase64: 'Z'.repeat(160) }).expect(409)
})

it('repairs progress from a saved correct attempt after an interrupted request', async () => {
  const { student, authorization } = await makePilot()
  await approveIntro(authorization)
  await KGAlphabetAttempt.create({ studentId: student._id, schoolId: student.schoolId, activityId: 'say-a', letter: 'A', mode: 'speak', outcome: 'correct', replay: false, submissionId: 'interrupted-correct-123' })
  const transcribe = jest.spyOn(KGSpeechService, 'transcribe')
  const response = await request(app).post('/api/kg-alphabet/attempt').set('Authorization', authorization).set('X-KG-Intro-Playback', activePlaybackId)
    .send({ activityId: 'say-a', submissionId: 'interrupted-correct-123' }).expect(200)
  expect(response.body.data.state.currentIndex).toBe(1)
  expect(response.body.data.duplicate).toBe(true)
  expect(transcribe).not.toHaveBeenCalled()
})

async function makePilot() {
  const school = await School.create({ name: 'Audio Pilot School', code: 'KGVOICE1', passwordHash: 'test-hash', status: 'active' })
  const student = await Student.create({
    schoolId: school._id,
    fullName: 'Asha Learner',
    rollNumber: 'audio-1',
    grade: 0,
    passwordHash: 'test-hash',
    avatarType: 'GIRL',
    status: 'active',
    kgAlphabetPilotEnabled: true,
  })
  const token = signToken({ sub: student._id.toString(), schoolId: school._id.toString(), role: 'STUDENT', sv: 0 })
  return { school, student, authorization: `Bearer ${token}` }
}

it('authenticates the student, resolves a static teaching ID to its versioned S3 key, and streams playable MP3 bytes', async () => {
  const { authorization } = await makePilot()
  const bytes = Buffer.from('ID3\u0004\u0000\u0000KG test MP3 payload')
  const getAudio = jest.spyOn(S3Service, 'getAudio').mockResolvedValue(bytes)

  const response = await request(app)
    .get('/api/kg-alphabet/audio/v1/say-a')
    .set('Authorization', authorization)
    .buffer(true)
    .parse((res, callback) => {
      const chunks: Buffer[] = []
      res.on('data', (chunk: Buffer) => chunks.push(chunk))
      res.on('end', () => callback(null, Buffer.concat(chunks)))
    })
    .expect(200)

  expect(Buffer.isBuffer(response.body)).toBe(true)
  expect(response.body).toEqual(bytes)
  expect(response.headers['content-type']).toMatch(/audio\/mpeg/)
  expect(response.headers['content-length']).toBe(String(bytes.length))
  expect(response.headers['cache-control']).toMatch(/private/)
  expect(response.headers.etag).toMatch(/^"[a-f0-9]{64}"$/)
  expect(response.headers['x-content-type-options']).toBe('nosniff')
  expect(getAudio).toHaveBeenCalledWith('kg/level-1/miss-julie/v1/say-a.mp3')
})

it('routes bridge-c to Priya TTS from the reviewed lesson line without touching S3 or accepting client text', async () => {
  const { authorization } = await makePilot()
  const getAudio = jest.spyOn(S3Service, 'getAudio')
  const bytes = Buffer.from('RIFF\u0000\u0000\u0000\u0000WAVE test audio')
  const tts = jest.spyOn(PythonVoiceProvider.prototype, 'synthesize').mockResolvedValue({
    audioUrl: null, audioBase64: bytes.toString('base64'), contentType: 'audio/wav', available: true, provider: 'python-priya',
  })

  const response = await request(app).get('/api/kg-alphabet/audio/v1/bridge-c?text=ignore-the-manifest')
    .set('Authorization', authorization).buffer(true)
    .parse((res, callback) => {
      const chunks: Buffer[] = []
      res.on('data', (chunk: Buffer) => chunks.push(chunk))
      res.on('end', () => callback(null, Buffer.concat(chunks)))
    }).expect(200)

  expect(response.body).toEqual(bytes)
  expect(response.headers['content-type']).toMatch(/audio\/wav/)
  expect(response.headers['content-length']).toBe(String(bytes.length))
  expect(response.headers['cache-control']).toMatch(/no-store/)
  expect(tts).toHaveBeenCalledWith(expect.stringMatching(/billi.*cat/i))
  expect(getAudio).not.toHaveBeenCalled()
})

it('denies audio outside the authorized KG pilot and reports a missing static S3 object without TTS fallback', async () => {
  const { student, authorization } = await makePilot()
  const getAudio = jest.spyOn(S3Service, 'getAudio').mockResolvedValue(null)
  const tts = jest.spyOn(PythonVoiceProvider.prototype, 'synthesize')

  await request(app).get('/api/kg-alphabet/audio/v2/say-a').set('Authorization', authorization).expect(404)
  expect(getAudio).not.toHaveBeenCalled()

  const missing = await request(app).get('/api/kg-alphabet/audio/v1/say-a').set('Authorization', authorization).expect(404)
  expect(missing.body.error).toMatchObject({
    code: 'KG_AUDIO_MISSING',
    details: { s3Key: 'kg/level-1/miss-julie/v1/say-a.mp3', storageCode: 'NoSuchKey', retryable: false },
  })
  expect(tts).not.toHaveBeenCalled()
  expect(await KGAlphabetProgress.countDocuments({ studentId: student._id })).toBe(0)

  const nonPilot = await Student.create({
    schoolId: student.schoolId,
    fullName: 'Not Enrolled',
    rollNumber: 'audio-2',
    grade: 0,
    passwordHash: 'test-hash',
    avatarType: 'BOY',
    status: 'active',
    kgAlphabetPilotEnabled: false,
  })
  const nonPilotToken = signToken({ sub: nonPilot._id.toString(), schoolId: student.schoolId.toString(), role: 'STUDENT', sv: 0 })
  await request(app)
    .get('/api/kg-alphabet/audio/v1/say-a')
    .set('Authorization', `Bearer ${nonPilotToken}`)
    .expect(403)
})

it('distinguishes S3 access denial from a retryable S3 provider outage', async () => {
  const { authorization } = await makePilot()
  const accessDenied = Object.assign(new Error('denied'), { name: 'AccessDenied', $metadata: { httpStatusCode: 403 } })
  jest.spyOn(S3Service, 'getAudio').mockRejectedValueOnce(accessDenied).mockRejectedValueOnce(new Error('socket reset'))

  const denied = await request(app).get('/api/kg-alphabet/audio/v1/say-a').set('Authorization', authorization).expect(502)
  expect(denied.body.error).toMatchObject({
    code: 'KG_AUDIO_STORAGE_ACCESS_DENIED',
    details: { s3Key: 'kg/level-1/miss-julie/v1/say-a.mp3', storageCode: 'AccessDenied', retryable: false },
  })
  const unavailable = await request(app).get('/api/kg-alphabet/audio/v1/say-a').set('Authorization', authorization).expect(503)
  expect(unavailable.body.error).toMatchObject({
    code: 'KG_AUDIO_STORAGE_UNAVAILABLE',
    details: { s3Key: 'kg/level-1/miss-julie/v1/say-a.mp3', storageCode: 'Error', retryable: true },
  })
})

it('returns retryable TTS outage for dynamic feedback without requiring S3', async () => {
  const { authorization } = await makePilot()
  const getAudio = jest.spyOn(S3Service, 'getAudio')
  jest.spyOn(PythonVoiceProvider.prototype, 'synthesize').mockRejectedValue(new Error('Priya service offline'))

  const response = await request(app).get('/api/kg-alphabet/audio/v1/bridge-c').set('Authorization', authorization).expect(503)
  expect(response.body.error).toMatchObject({ code: 'TTS_SERVICE_UNAVAILABLE', details: { retryable: true } })
  expect(getAudio).not.toHaveBeenCalled()
})

it('requires a completed intro before recording any official Level 1 attempt', async () => {
  const { student, authorization } = await makePilot()
  const initial = await request(app).get('/api/kg-alphabet/state').set('Authorization', authorization).expect(200)
  expect(initial.body.data.introSeen).toBe(false)

  await request(app)
    .post('/api/kg-alphabet/intro-seen')
    .set('Authorization', authorization)
    .send({ videoStarted: true })
    .expect(400)

  await request(app)
    .post('/api/kg-alphabet/attempt')
    .set('Authorization', authorization).set('X-KG-Intro-Playback', activePlaybackId)
    .send({ activityId: 'say-a', submissionId: 'intro-required-12345' })
    .expect(409)

  let progress = await KGAlphabetProgress.findOne({ studentId: student._id })
  expect(progress?.introSeen).toBe(false)
  expect(progress?.currentIndex).toBe(0)

  const start = await request(app).post('/api/kg-alphabet/intro/start').set('Authorization', authorization).expect(200)
  const startedPlayback = start.body.data.playbackId
  await request(app).post('/api/kg-alphabet/intro-seen').set('Authorization', authorization)
    .send({ videoEnded: true, playbackId: startedPlayback }).expect(409)
  await KGIntroPlayback.updateOne({ tokenHash: createHash('sha256').update(startedPlayback).digest('hex') },
    { $set: { startedAt: new Date(Date.now() - 65_000) } })
  const ended = await request(app)
    .post('/api/kg-alphabet/intro-seen')
    .set('Authorization', authorization)
    .send({ videoEnded: true, playbackId: startedPlayback })
    .expect(200)
  expect(ended.body.data.introSeen).toBe(true)
  progress = await KGAlphabetProgress.findOne({ studentId: student._id })
  expect(progress?.introSeen).toBe(true)
  expect(progress?.currentIndex).toBe(0)
})

it('invalidates a completed introduction ticket when a new KG visit begins', async () => {
  const { authorization } = await makePilot()
  await approveIntro(authorization)
  const previousTicket = activePlaybackId
  const newVisit = await request(app).post('/api/kg-alphabet/intro/start')
    .set('Authorization', authorization).expect(200)
  expect(newVisit.body.data.playbackId).not.toBe(previousTicket)
  await request(app).post('/api/kg-alphabet/attempt')
    .set('Authorization', authorization).set('X-KG-Intro-Playback', previousTicket)
    .send({ activityId: 'say-a', submissionId: 'stale-visit-123456', noSpeech: true, durationMs: 600 })
    .expect(409)
  await request(app).post('/api/kg-alphabet/intro-seen')
    .set('Authorization', authorization)
    .send({ videoEnded: true, playbackId: previousTicket }).expect(409)
  await request(app).post('/api/kg-alphabet/intro-seen')
    .set('Authorization', authorization)
    .send({ videoEnded: true, playbackId: newVisit.body.data.playbackId }).expect(409)
})

it('scores KG speech on the server, retries unclear speech, advances once, and deduplicates submissions', async () => {
  const { student, authorization } = await makePilot()
  await approveIntro(authorization)
  const transcribe = jest.spyOn(KGSpeechService, 'transcribe')
    .mockResolvedValueOnce({ transcript: 'ball', available: true, provider: 'test-whisper' } as never)
    .mockResolvedValueOnce({ transcript: 'maybe', uncertain: true, available: true, provider: 'test-whisper' } as never)
    .mockResolvedValueOnce({ transcript: 'appl', available: true, provider: 'test-whisper' } as never)

  const submitSpeech = (submissionId: string) => request(app)
    .post('/api/kg-alphabet/attempt')
    .set('Authorization', authorization).set('X-KG-Intro-Playback', activePlaybackId)
    .send({
      activityId: 'say-a', submissionId, mimeType: 'audio/webm;codecs=opus',
      audioBase64: 'Y'.repeat(160), durationMs: 1100, timeSpentMs: 1900,
    })

  const wrong = await submitSpeech('speech-wrong-12345').expect(200)
  expect(wrong.body.data.outcome).toBe('incorrect')
  expect(wrong.body.data.state.currentIndex).toBe(0)

  const unclear = await submitSpeech('speech-unclear-12345').expect(200)
  expect(unclear.body.data.outcome).toBe('unclear')
  expect(unclear.body.data.state.currentIndex).toBe(0)

  const correct = await submitSpeech('speech-correct-12345').expect(200)
  expect(correct.body.data.outcome).toBe('correct')
  expect(correct.body.data.state.currentIndex).toBe(1)
  expect(correct.body.data.feedbackAudioId).toBe('great')

  const duplicate = await submitSpeech('speech-correct-12345').expect(200)
  expect(duplicate.body.data.duplicate).toBe(true)
  expect(duplicate.body.data.state.currentIndex).toBe(1)
  expect(transcribe).toHaveBeenCalledTimes(3)
  expect(await KGAlphabetAttempt.countDocuments({ studentId: student._id })).toBe(3)
  expect(await KGAlphabetAttempt.find({ studentId: student._id }).then((attempts) => attempts.reduce((sum, attempt) => sum + (attempt.timeSpentMs || 0), 0))).toBe(5700)
  expect(await KGAlphabetProgress.findOne({ studentId: student._id }).then((progress) => progress?.currentIndex)).toBe(1)
})

it('praises Hindi/Marathi meaning with reusable Priya feedback but advances only after English', async () => {
  const { student, authorization } = await makePilot()
  await approveIntro(authorization)
  const transcribe = jest.spyOn(KGSpeechService, 'transcribe')
    .mockResolvedValueOnce({ transcript: 'सेब', available: true, provider: 'sarvam' } as never)
    .mockResolvedValueOnce({ transcript: 'सफरचंद', available: true, provider: 'sarvam' } as never)
    .mockResolvedValueOnce({ transcript: 'apple', available: true, provider: 'sarvam' } as never)

  const say = (submissionId: string) => request(app).post('/api/kg-alphabet/attempt')
    .set('Authorization', authorization).set('X-KG-Intro-Playback', activePlaybackId)
    .send({ activityId: 'say-a', submissionId, mimeType: 'audio/webm;codecs=opus',
      audioBase64: 'Y'.repeat(160), durationMs: 1000 })

  const hindi = await say('child-hindi-1234567').expect(200)
  expect(hindi.body.data).toMatchObject({ outcome: 'supported', advance: false,
    feedbackAudioId: 'bridge-a', feedbackVoice: 'dynamic_tts', feedbackAudioBase64: null,
    state: { currentIndex: 0 } })
  const marathi = await say('child-marathi-12345').expect(200)
  expect(marathi.body.data).toMatchObject({ outcome: 'supported', advance: false,
    feedbackAudioId: 'bridge-a', state: { currentIndex: 0 } })
  expect(marathi.body.data.state.fallbackAvailable).toBe(true)

  const english = await say('child-english-12345').expect(200)
  expect(english.body.data).toMatchObject({ outcome: 'correct', advance: true,
    feedbackAudioId: 'great', state: { currentIndex: 1 } })
  expect(transcribe).toHaveBeenCalledTimes(3)
  expect(await KGAlphabetAttempt.countDocuments({ studentId: student._id })).toBe(3)
})

it('keeps the current activity and saves no attempt when speech recognition is temporarily unavailable', async () => {
  const { student, authorization } = await makePilot()
  await approveIntro(authorization)
  const transcribe = jest.spyOn(KGSpeechService, 'transcribe')
    .mockRejectedValue(ApiError.provider('Speech recognition is temporarily unavailable. Please try again.'))

  const response = await request(app)
    .post('/api/kg-alphabet/attempt')
    .set('Authorization', authorization).set('X-KG-Intro-Playback', activePlaybackId)
    .send({ activityId: 'say-a', submissionId: 'speech-provider-fail-12345', mimeType: 'audio/webm;codecs=opus',
      audioBase64: 'Y'.repeat(160), durationMs: 1100 })
    .expect(502)

  expect(response.body.error.message).toMatch(/temporarily unavailable/i)
  expect(transcribe).toHaveBeenCalledTimes(1)
  expect(await KGAlphabetAttempt.countDocuments({ studentId: student._id })).toBe(0)
  const progress = await KGAlphabetProgress.findOne({ studentId: student._id })
  expect(progress?.introSeen).toBe(true)
  expect(progress?.currentIndex).toBe(0)
})

it('records silent turns as unclear without sending child audio to STT or advancing', async () => {
  const { student, authorization } = await makePilot()
  await approveIntro(authorization)
  const transcribe = jest.spyOn(KGSpeechService, 'transcribe')
  const response = await request(app).post('/api/kg-alphabet/attempt').set('Authorization', authorization).set('X-KG-Intro-Playback', activePlaybackId)
    .send({ activityId: 'say-a', submissionId: 'silence-turn-123456', noSpeech: true, outcome: 'correct', durationMs: 6500 }).expect(200)
  expect(response.body.data).toMatchObject({ outcome: 'unclear', feedbackAudioId: 'silence', state: { currentIndex: 0 } })
  expect(transcribe).not.toHaveBeenCalled()
  const attempt = await KGAlphabetAttempt.findOne({ studentId: student._id }).lean()
  expect(attempt?.recognitionReason).toBe('silence')
  expect(attempt?.createdAt).toBeInstanceOf(Date)
  expect(attempt?.outcome).toBe('unclear')
})

it('rejects locked picture puzzles, validates the final answer, and records replay without changing completion', async () => {
  const { student, authorization } = await makePilot()
  await approveIntro(authorization)

  await request(app).post('/api/kg-alphabet/attempt').set('Authorization', authorization).set('X-KG-Intro-Playback', activePlaybackId)
    .send({ activityId: 'find-a', submissionId: 'locked-find-a-1234', selected: 'apple' }).expect(409)
  await KGAlphabetAttempt.deleteMany({ studentId: student._id })
  await KGAlphabetProgress.updateOne({ studentId: student._id }, { $set: { currentIndex: 7 } })

  await request(app).post('/api/kg-alphabet/attempt').set('Authorization', authorization).set('X-KG-Intro-Playback', activePlaybackId)
    .send({ activityId: 'find-d', submissionId: 'time-too-long-1234', selected: 'dog', timeSpentMs: 300001 }).expect(400)
  const wrong = await request(app).post('/api/kg-alphabet/attempt').set('Authorization', authorization).set('X-KG-Intro-Playback', activePlaybackId)
    .send({ activityId: 'find-d', submissionId: 'final-puzzle-wrong-123', selected: 'cat', timeSpentMs: 1000 }).expect(200)
  expect(wrong.body.data.outcome).toBe('incorrect')
  expect(wrong.body.data.state.currentIndex).toBe(7)

  const final = await request(app).post('/api/kg-alphabet/attempt').set('Authorization', authorization).set('X-KG-Intro-Playback', activePlaybackId)
    .send({ activityId: 'find-d', submissionId: 'final-puzzle-right-123', selected: 'dog', timeSpentMs: 1200 }).expect(200)
  expect(final.body.data.outcome).toBe('correct')
  expect(final.body.data.state).toMatchObject({ currentIndex: 8, completed: true, level2Unlocked: true, level2Available: false })
  expect(final.body.data.state.completedAt).toBeTruthy()

  const replay = await request(app).post('/api/kg-alphabet/attempt').set('Authorization', authorization).set('X-KG-Intro-Playback', activePlaybackId)
    .send({ activityId: 'find-d', submissionId: 'final-puzzle-replay-123', selected: 'dog', replay: true, timeSpentMs: 700 }).expect(200)
  expect(replay.body.data.outcome).toBe('correct')
  expect(replay.body.data.state.currentIndex).toBe(8)
  expect(replay.body.data.state.completedAt).toBe(final.body.data.state.completedAt)
  expect(await KGAlphabetAttempt.countDocuments({ studentId: student._id, replay: true })).toBe(1)
  expect(await KGAlphabetProgress.findOne({ studentId: student._id }).then((progress) => progress?.currentIndex)).toBe(8)
})

it('enforces two server-recorded speech failures before picture support and never falsely awards pronunciation mastery', async () => {
  const { student, authorization } = await makePilot()
  await approveIntro(authorization)
  const endpoint = () => request(app).post('/api/kg-alphabet/attempt').set('Authorization', authorization)
    .set('X-KG-Intro-Playback', activePlaybackId)
  const speech = (submissionId: string) => endpoint().send({ activityId: 'say-a', submissionId,
    audioBase64: 'Y'.repeat(160), mimeType: 'audio/webm', durationMs: 1000 })
  const assisted = (submissionId: string, selected: string) => endpoint().send({ activityId: 'say-a',
    submissionId, selected, assistedPicture: true })
  const stt = jest.spyOn(KGSpeechService, 'transcribe').mockResolvedValue({
    transcript: 'elephant', available: true, provider: 'test',
  } as never)
  await assisted('early-picture-1234', 'apple').expect(403)
  const first = await speech('first-failure-1234').expect(200)
  expect(first.body.data.state.fallbackAvailable).toBe(false)
  const second = await speech('second-failure-1234').expect(200)
  expect(second.body.data.state.fallbackAvailable).toBe(true)
  expect((await request(app).get('/api/kg-alphabet/state').set('Authorization', authorization).expect(200)).body.data.fallbackAvailable).toBe(true)
  expect((await assisted('wrong-picture-1234', 'ball').expect(200)).body.data.state.currentIndex).toBe(0)
  const result = await assisted('correct-picture-1234', 'apple').expect(200)
  expect(result.body.data.outcome).toBe('supported')
  expect(result.body.data.state.currentIndex).toBe(1)
  expect(result.body.data.state.pronunciationNeedsPractice).toContain('A')
  expect(stt).toHaveBeenCalledTimes(2)
  const progress = await KGAlphabetProgress.findOne({ studentId: student._id })
  expect(progress?.pronunciationNeedsPractice).toContain('A')
  const saved = await KGAlphabetAttempt.findOne({ studentId: student._id, submissionId: 'correct-picture-1234' })
  expect(saved).toMatchObject({ outcome: 'supported', mode: 'touch', selected: 'apple' })
  const duplicate = await assisted('correct-picture-1234', 'apple').expect(200)
  expect(duplicate.body.data.duplicate).toBe(true)
  expect(duplicate.body.data.state.currentIndex).toBe(1)
})

it('records Hindi vocabulary understanding without advancing spoken-English mastery', async () => {
  const { student, authorization } = await makePilot()
  await approveIntro(authorization)
  jest.spyOn(KGSpeechService, 'transcribe').mockResolvedValue({
    transcript: 'saib', available: true, provider: 'test',
  } as never)
  const response = await request(app).post('/api/kg-alphabet/attempt').set('Authorization', authorization)
    .set('X-KG-Intro-Playback', activePlaybackId).send({ activityId: 'say-a', submissionId: 'hindi-bridge-123456',
      audioBase64: 'Y'.repeat(160), mimeType: 'audio/webm', durationMs: 1000 }).expect(200)
  expect(response.body.data.outcome).toBe('supported')
  expect(response.body.data.state.currentIndex).toBe(0)
  expect(response.body.data.state.pronunciationNeedsPractice).not.toContain('A')
  const saved = await KGAlphabetAttempt.findOne({ studentId: student._id, submissionId: 'hindi-bridge-123456' })
  expect(saved?.outcome).toBe('supported')
})


it('KG1 caches each Qwen teacher reply once and synthesizes the identical Azure sentence on audio retry', async () => {
  const { student, authorization } = await makePilot()
  await approveIntro(authorization)
  const qwen = jest.spyOn(KGQwenFeedbackService, 'compose').mockResolvedValue({
    text: 'I heard your apple. Great try! Let us say apple once more.',
    source: 'qwen-8002',
  })
  const synthesize = jest.spyOn(AzureVoiceProvider.prototype, 'synthesizeUncached').mockResolvedValue({
    audio: Buffer.from('ID3\\x04\\x00\\x00KG Azure test payload'),
    contentType: 'audio/mpeg',
  })
  jest.spyOn(KGSpeechService, 'transcribe').mockResolvedValue({
    transcript: 'apple', available: true, provider: 'test',
  } as never)

  const submissionId = 'kg-stable-azure-reply-1234'
  const body = { activityId: 'say-a', submissionId,
    audioBase64: 'Y'.repeat(160), mimeType: 'audio/webm', durationMs: 1200 }
  const result = await request(app).post('/api/kg-alphabet/attempt')
    .set('Authorization', authorization).set('X-KG-Intro-Playback', activePlaybackId)
    .send(body).expect(200)
  expect(result.body.data.feedbackText).toBe('I heard your apple. Great try! Let us say apple once more.')
  const saved = await KGAlphabetAttempt.findOne({ studentId: student._id, submissionId })
  expect(saved?.feedbackText).toBe(result.body.data.feedbackText)

  const audio = () => request(app)
    .get(`/api/kg-alphabet/attempt/${submissionId}/feedback-audio`)
    .set('Authorization', authorization).set('X-KG-Intro-Playback', activePlaybackId)
    .expect(200)

  await audio()
  await audio()
  expect(qwen).toHaveBeenCalledTimes(1)
  expect(synthesize).toHaveBeenCalledTimes(2)
  expect(synthesize).toHaveBeenNthCalledWith(1, result.body.data.feedbackText)
  expect(synthesize).toHaveBeenNthCalledWith(2, result.body.data.feedbackText)

  const recovered = await request(app).post('/api/kg-alphabet/attempt')
    .set('Authorization', authorization).set('X-KG-Intro-Playback', activePlaybackId)
    .send(body).expect(200)
  expect(recovered.body.data.duplicate).toBe(true)
  expect(recovered.body.data.feedbackText).toBe(result.body.data.feedbackText)
  expect(qwen).toHaveBeenCalledTimes(1)
  // A resumed client can still acknowledge the specific saved turn.
  await request(app).post(`/api/kg-alphabet/attempt/${submissionId}/feedback-played`)
    .set('Authorization', authorization).set('X-KG-Intro-Playback', activePlaybackId)
    .expect(200)
})


it('uses local Priya for the same saved KG teacher reply if live Azure is unavailable, without auto-advancing', async () => {
  const { student, authorization } = await makePilot()
  await approveIntro(authorization)
  const submissionId = 'kg-azure-priya-fallback-1234'
  const feedbackText = 'Apple is our English word. Good try! Say apple with me.'
  await KGAlphabetAttempt.create({
    studentId: student._id, schoolId: student.schoolId,
    activityId: 'say-a', letter: 'A', mode: 'speak', outcome: 'incorrect',
    submissionId, replay: false, feedbackText,
  })

  jest.spyOn(AzureVoiceProvider.prototype, 'synthesizeUncached')
    .mockRejectedValueOnce(new Error('Azure temporarily unavailable'))
  const priya = jest.spyOn(PythonVoiceProvider.prototype, 'synthesize')
    .mockResolvedValueOnce({
      audioUrl: null,
      audioBase64: Buffer.alloc(320, 65).toString('base64'),
      contentType: 'audio/wav',
      available: true,
      provider: 'python-priya',
    })

  const response = await request(app)
    .get(`/api/kg-alphabet/attempt/${submissionId}/feedback-audio`)
    .set('Authorization', authorization)
    .set('X-KG-Intro-Playback', activePlaybackId)
    .expect(200)

  expect(response.headers['x-voice-provider']).toBe('python-priya-fallback')
  expect(response.headers['content-type']).toMatch(/audio\/wav/)
  expect(priya).toHaveBeenCalledTimes(1)
  expect(priya).toHaveBeenCalledWith(feedbackText)
  const progress = await KGAlphabetProgress.findOne({ studentId: student._id })
  expect(progress?.currentIndex).toBe(0)
})
