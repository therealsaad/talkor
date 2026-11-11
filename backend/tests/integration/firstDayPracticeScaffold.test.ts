import request from 'supertest'
import { Types } from 'mongoose'
import { createApp } from '../../src/app'
import { connectTestDatabase, disconnectTestDatabase, clearTestDatabase } from './dbTestUtils'
import { watchFirstDayIntro } from './class1IntroTestUtils'
import { School } from '../../src/models/School'
import { Student } from '../../src/models/Student'
import { CurriculumClass } from '../../src/models/CurriculumClass'
import { Level } from '../../src/models/Level'
import { Lesson } from '../../src/models/Lesson'
import { Activity } from '../../src/models/Activity'
import { ActivityAttempt } from '../../src/models/ActivityAttempt'
import { Conversation } from '../../src/models/Conversation'
import { Progress } from '../../src/models/Progress'
import { AzureVoiceProvider } from '../../src/providers/voice/AzureVoiceProvider'
import * as AIProviders from '../../src/providers/ai'
import type { MissJulieContext } from '../../src/providers/ai/AIProvider'
import { signToken } from '../../src/utils/jwt'
import { CLASS1_DEMO_VERSION, CLASS1_FIRST_DAY_POEM_REVISION } from '../../src/services/class1-demo-access'
import { FIRST_DAY_POEM_LINES, FIRST_DAY_POEM_STEPS } from '../../src/curriculum/class1-first-day-poem'
import { FIRST_DAY_TEACHING_SOURCE } from '../../src/curriculum/first-day-teaching-source'

// Real HTTP/auth/intro/Mongo/conversation/voice receipt paths. Only the external
// AI and Azure boundaries are synthetic; no real school or paid call is used.
const app = createApp()
beforeAll(connectTestDatabase)
afterAll(disconnectTestDatabase)
afterEach(async () => { jest.restoreAllMocks(); await clearTestDatabase() })

async function fixture(watch = true) {
  const school = await School.create({ name: 'Synthetic practice school', code: 'SMALLQA',
    passwordHash: 'not-a-real-password', status: 'active' })
  const klass = await CurriculumClass.create({ grade: 1, name: 'Class 1', order: 1, status: 'active' })
  const level = await Level.create({ classId: klass._id, number: 1, order: 1, title: 'My First Day',
    place: 'First Day Meadow', visualTheme: 'First Day Meadow', status: 'active', availability: 'PUBLISHED',
    curriculumVersion: CLASS1_DEMO_VERSION })
  const lesson = await Lesson.create({ levelId: level._id, order: 1, title: 'Synthetic poem lesson', status: 'active',
    settings: { experienceId: 'g01-l01', lessonPlanRevision: CLASS1_FIRST_DAY_POEM_REVISION,
      introVideoUrl: 'https://media.example.invalid/reviewed-intro.mp4' } })
  const students = await Student.create([1, 2].map(i => ({ schoolId: school._id, grade: 1,
    fullName: 'Synthetic Learner ' + i, rollNumber: String(i), status: 'active', passwordHash: 'not-a-real-pin' })))
  const tokens = students.map(student => signToken({ sub: String(student._id), schoolId: String(school._id), role: 'STUDENT' }))
  const activities = await Activity.create([FIRST_DAY_POEM_STEPS[2], FIRST_DAY_POEM_STEPS[0]].map((step, i) => ({
    lessonId: lesson._id, activityKey: 'class1-l01-v4-' + step.key, order: i + 1,
    curriculumVersion: CLASS1_DEMO_VERSION, title: step.title, type: 'CONVERSATION', status: 'active',
    prompt: 'Listen and say the current poem lines.', teacherPrompt: 'Listen and say the current poem lines.',
    aiEnabled: true, allowMic: true, voiceEnabled: true, required: true,
    conversationGoal: { requiredConcepts: ['first_day_english_attempt'], minTurns: 1, maxTurns: 8 },
    content: { poemLines: FIRST_DAY_POEM_LINES.slice(step.start, step.end) },
    metadata: { sceneKey: step.key, digitalType: 'FIRST_DAY_VOICE_SCENE', conversationMode: 'OPEN',
      allowedVocabulary: ['see', 'grin', 'bell', 'skip', 'run'],
      teaching: { ...FIRST_DAY_TEACHING_SOURCE, hints: { en: null, hi: step.hintHi, mr: step.hintMr } } },
  })))
  if (watch) for (let i = 0; i < students.length; i++)
    await watchFirstDayIntro(app, { Authorization: 'Bearer ' + tokens[i] }, String(students[i]._id), String(lesson._id))
  const generate = jest.fn(async (_context: MissJulieContext) => ({
    message: 'Can you say at?', emotion: 'encouraging' as const, responseQuality: 'ADEQUATE' as const,
    followUpQuestion: 'Can you say at?', corrections: [], modelSentence: 'at',
    activityComplete: true, shouldRetry: false, xpAwarded: 999, memoryUpdates: [],
  }))
  jest.spyOn(AIProviders, 'getAIProvider').mockReturnValue({ name: 'synthetic-old-brain', generate })
  const headers = (index = 0) => ({ Authorization: 'Bearer ' + tokens[index] })
  async function turn(message: string, options: { student?: number; activity?: number } = {}) {
    const index = options.student || 0
    const activity = activities[options.activity || 0]
    const started = await request(app).post('/api/voice/sessions').set(headers(index))
      .send({ lessonId: String(lesson._id), activityId: String(activity._id) }).expect(201)
    const result = await request(app).post('/api/voice/sessions/' + started.body.data._id + '/transcript')
      .set(headers(index)).send({ transcript: message, detectedLanguage: 'en-IN' }).expect(200)
    return result.body.data
  }
  return { school, lesson, activities, students, headers, turn, generate }
}

test('three recorded at-at replies become small practice; refresh, partial replies and audio ACKs retain real progress gates', async () => {
  const f = await fixture()
  const before = await Progress.find({ studentId: f.students[0]._id }).lean()
  const first = await f.turn('At at.')
  const second = await f.turn('At at.')
  expect(first.aiResponse.followUpQuestion).toContain('BOTH lines')
  expect(second.aiResponse.followUpQuestion).toContain('BOTH lines')
  const third = await f.turn('At at.')
  expect(third.aiResponse.followUpQuestion).toBe('Say with me: See me grin')
  expect(third.aiResponse.message).not.toContain('When the bell rings')
  expect(third.aiResponse.activityComplete).toBe(false)
  expect(third.aiResponse.xpAwarded).toBe(0)
  const conversationId = third.aiResponse.conversation.id
  const saved = await Conversation.findById(conversationId).lean()
  expect(saved?.retryState?.attempt).toBe(3)
  expect(saved?.retryState?.practiceScaffold).toMatchObject({ stage: 'LINE', lineIndex: 0 })
  expect(saved?.status).toBe('ACTIVE')
  expect(saved?.masteryStatus).toBe('IN_PROGRESS')
  // A new Express instance has no practice state; resume comes from Mongo.
  const resumed = await request(createApp()).post('/api/ai/conversation/start').set(f.headers()).send({
    lessonId: String(f.lesson._id), activityId: String(f.activities[0]._id), mode: 'LESSON',
  }).expect(201)
  expect(resumed.body.data.conversationId).toBe(conversationId)
  expect(resumed.body.data.message).toContain('Say with me: See me grin')
  const line1 = await f.turn('See me grin.')
  expect(line1.aiResponse.followUpQuestion).toBe('Say with me: When the bell rings, I go in.')
  const line2 = await f.turn('When the bell rings, I go in.')
  expect(line2.aiResponse.followUpQuestion).toBe('Say with me: See me grin\nWhen the bell rings, I go in.')
  expect(line2.aiResponse.activityComplete).toBe(false)
  expect(await ActivityAttempt.countDocuments()).toBe(0)
  expect(await Progress.find({ studentId: f.students[0]._id }).lean()).toEqual(before)
  await request(app).post('/api/voice/sessions/' + line2._id + '/teacher-audio-played')
    .set(f.headers()).send({ feedbackReceipt: 'forged' }).expect(409)

  const full = await f.turn('See me grin. When the bell rings, I go in.')
  expect(full.aiResponse.activityComplete).toBe(true)
  expect(full.aiResponse.conversation.retryState.practiceScaffold).toBeUndefined()
  expect(await ActivityAttempt.countDocuments()).toBe(0)
  const ack = () => request(app).post('/api/voice/sessions/' + full._id + '/teacher-audio-played').set(f.headers())
  await ack().send({}).expect(409)
  const azure = jest.spyOn(AzureVoiceProvider.prototype, 'synthesizeStream').mockImplementation(async () => ({
    provider: 'synthetic-azure', contentType: 'audio/mpeg',
    body: new ReadableStream<Uint8Array>({ start(c) { c.enqueue(new Uint8Array(512)); c.close() } }),
  }))
  const audio = await request(app).post('/api/voice/synthesize').set(f.headers()).send({
    text: 'Client cannot choose this teacher text.', purpose: 'CONVERSATION',
    activityId: String(f.activities[0]._id), teacherSessionId: full._id,
  }).expect(200)
  expect(azure).toHaveBeenCalledTimes(1)
  const receipt = audio.headers['x-class1-feedback-receipt']
  expect(receipt).toMatch(/^v1\./)
  await ack().send({ feedbackReceipt: receipt }).expect(200)
  await ack().send({ feedbackReceipt: receipt }).expect(200)
  expect(await ActivityAttempt.countDocuments({ studentId: f.students[0]._id, activityId: f.activities[0]._id })).toBe(1)
})

test('interleaved students and another activity cannot borrow retry or practice state', async () => {
  const f = await fixture()
  for (let i = 0; i < 3; i++) await Promise.all([
    f.turn('At at.', { student: 0 }), f.turn('not sure', { student: 1, activity: 1 }),
  ])
  const saved = await Conversation.find({ status: 'ACTIVE' }).lean()
  expect(saved).toHaveLength(2)
  for (const row of saved) expect(row.retryState?.practiceScaffold).toMatchObject({ stage: 'LINE', lineIndex: 0 })
  const otherActivity = await f.turn('At at.', { activity: 1 })
  expect(otherActivity.aiResponse.conversation.retryState.attempt).toBe(1)
  expect(otherActivity.aiResponse.conversation.retryState.practiceScaffold).toBeUndefined()
  const context = f.generate.mock.calls.at(-1)![0]
  expect(context.teachingContext?.sceneKey).toBe('poem-pair-1')
  expect(context.teachingContext?.modelLines).toEqual(FIRST_DAY_POEM_LINES.slice(0, 2))
})

test('an explicit conversation ID must belong to the current student, lesson and activity', async () => {
  const f = await fixture()
  const turn = await f.turn('At at.')
  const conversationId = turn.aiResponse.conversation.id
  const original = await Conversation.findById(conversationId).lean()
  const calls = f.generate.mock.calls.length
  const post = (student: number, activity: number) => request(app).post('/api/ai/conversation/turn').set(f.headers(student)).send({
    message: 'At at.', conversationId, lessonId: String(f.lesson._id), activityId: String(f.activities[activity]._id),
  })
  await post(0, 1).expect(403)
  await post(1, 0).expect(404)
  await request(app).post('/api/ai/conversation/turn').set(f.headers()).send({
    conversationId: 'not-an-id', message: 'At at.',
  }).expect(400)
  expect(f.generate).toHaveBeenCalledTimes(calls)
  expect(await Conversation.findById(conversationId).lean()).toEqual(original)
  await Conversation.updateOne({ _id: conversationId }, { $set: { lessonId: new Types.ObjectId() } })
  await post(0, 0).expect(403)
  expect(f.generate).toHaveBeenCalledTimes(calls)
})

test('legacy activity-only conversations remain bound to their real authorized lesson', async () => {
  const f = await fixture()
  const old = await Conversation.create({ studentId: f.students[0]._id, activityId: f.activities[0]._id,
    mode: 'LESSON', status: 'ACTIVE', retryState: { waiting: true, attempt: 2, hintLevel: 1 } })
  const next = await f.turn('At at.')
  expect(next.aiResponse.conversation.id).toBe(String(old._id))
  expect(next.aiResponse.followUpQuestion).toBe('Say with me: See me grin')
})

test('unwatched introductions and draft lessons stay blocked before provider or practice state', async () => {
  const f = await fixture(false)
  await request(app).post('/api/ai/conversation/turn').set(f.headers()).send({
    message: 'At at.', lessonId: String(f.lesson._id), activityId: String(f.activities[0]._id),
    practiceScaffold: { stage: 'JOIN' }, retryState: { attempt: 999 },
  }).expect(409)
  expect(f.generate).not.toHaveBeenCalled()
  expect(await Conversation.countDocuments()).toBe(0)
  await Lesson.updateOne({ _id: f.lesson._id }, { $set: { status: 'draft' } })
  const unpublished = await request(app).post('/api/ai/conversation/turn').set(f.headers()).send({
    message: 'At at.', lessonId: String(f.lesson._id), activityId: String(f.activities[0]._id),
  }).expect(403)
  expect(unpublished.body.error.code).toBe('ACTIVITY_NOT_AVAILABLE')
  expect(f.generate).not.toHaveBeenCalled()
  expect(await Conversation.countDocuments()).toBe(0)
})

test('browser-provided retry counters and practice state cannot skip to combined practice', async () => {
  const f = await fixture()
  const result = await request(app).post('/api/ai/conversation/turn').set(f.headers()).send({
    message: 'At at.', lessonId: String(f.lesson._id), activityId: String(f.activities[0]._id),
    retryState: { waiting: true, attempt: 999 }, practiceScaffold: { stage: 'JOIN' },
    teachingContext: { modelLines: ['at'], activityComplete: true },
  }).expect(200)
  expect(result.body.data.conversation.retryState.attempt).toBe(1)
  expect(result.body.data.conversation.retryState.practiceScaffold).toBeUndefined()
  expect(result.body.data.activityComplete).toBe(false)
  expect(await ActivityAttempt.countDocuments()).toBe(0)
})

test('an ID-only resume enforces the full intro before inheriting the saved lesson practice', async () => {
  const f = await fixture(false)
  const saved = await Conversation.create({ studentId: f.students[0]._id, activityId: f.activities[0]._id,
    mode: 'LESSON', status: 'ACTIVE', retryState: { waiting: true, attempt: 2, hintLevel: 1 } })
  const post = () => request(app).post('/api/ai/conversation/turn').set(f.headers())
    .send({ conversationId: String(saved._id), message: 'At at.' })
  await post().expect(409)
  expect(f.generate).not.toHaveBeenCalled()
  expect((await Conversation.findById(saved._id))?.retryState?.attempt).toBe(2)
  await watchFirstDayIntro(app, f.headers(), String(f.students[0]._id), String(f.lesson._id))
  const response = await post().expect(200)
  expect(response.body.data.followUpQuestion).toBe('Say with me: See me grin')
  expect(response.body.data.activityComplete).toBe(false)
  expect(await Conversation.countDocuments()).toBe(1)
})

test('ID-only free talk remains free talk and does not acquire a curriculum practice cursor', async () => {
  const f = await fixture(false)
  const start = await request(app).post('/api/ai/conversation/start').set(f.headers()).send({ mode: 'FREE_TALK' }).expect(201)
  const result = await request(app).post('/api/ai/conversation/turn').set(f.headers()).send({
    conversationId: start.body.data.conversationId, message: 'Hello Miss Julie.',
  }).expect(200)
  expect(result.body.data.conversation.id).toBe(start.body.data.conversationId)
  expect(result.body.data.conversation.retryState.practiceScaffold).toBeUndefined()
  expect(result.body.data.activityComplete).toBe(false)
  const saved = await Conversation.findById(start.body.data.conversationId).lean()
  expect(saved?.lessonId).toBeUndefined()
  expect(saved?.activityId).toBeUndefined()
})
