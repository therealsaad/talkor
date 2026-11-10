import request from 'supertest'
import { createApp } from '../../src/app'
import { connectTestDatabase, disconnectTestDatabase, clearTestDatabase } from './dbTestUtils'
import { School } from '../../src/models/School'
import { Student } from '../../src/models/Student'
import { CurriculumClass } from '../../src/models/CurriculumClass'
import { Level } from '../../src/models/Level'
import { Lesson } from '../../src/models/Lesson'
import { Activity } from '../../src/models/Activity'
import { Progress } from '../../src/models/Progress'
import { VoiceSession } from '../../src/models/VoiceSession'
import { Conversation } from '../../src/models/Conversation'
import { ActivityAttempt } from '../../src/models/ActivityAttempt'
import { AzureVoiceProvider } from '../../src/providers/voice/AzureVoiceProvider'
import { hashPassword } from '../../src/utils/password'
import { signToken } from '../../src/utils/jwt'
import { FIRST_DAY_SCENES } from '../../src/scripts/class1-first-day-scenes'
import { watchFirstDayIntro } from './class1IntroTestUtils'
import { Class1IntroVisit } from '../../src/models/Class1IntroVisit'
import { VoiceWarmupService } from '../../src/services/voice-warmup.service'
import { pinLookup } from '../../src/utils/student-pin'
import { Class1IntroController } from '../../src/controllers/class1-intro.controller'
import type { Request, Response, NextFunction } from 'express'
import {
  CLASS1_DEMO_VERSION, CLASS1_FIRST_DAY_PARALLEL_REVISION,
} from '../../src/services/class1-demo-access'

/** Real Express + disposable MongoDB. The lesson is PRE-published in a
 * synthetic fixture, not activated in an actual school or cloud provider.
 * This proves PIN-session *server paths*, never audible mic/speaker behavior.
 */
const app = createApp()
const oldNodeEnv = process.env.NODE_ENV
beforeAll(async () => connectTestDatabase())
afterAll(async () => disconnectTestDatabase())
afterEach(async () => {
  jest.restoreAllMocks()
  if (oldNodeEnv === undefined) delete process.env.NODE_ENV
  else process.env.NODE_ENV = oldNodeEnv
  delete process.env.TALKORA_CLASS1_STUDENT_DEMO
  delete process.env.TALKORA_CLASS1_DEMO_ALL_STUDENTS
  delete process.env.TALKORA_CLASS1_DEMO_STUDENT_ID
  await clearTestDatabase()
})

async function fixture(watchIntro = true) {
  const school = await School.create({
    name: 'Isolated Published First Day School', code: 'L01REL',
    passwordHash: await hashPassword('irrelevant-password'), status: 'active',
  })
  const classroom = await CurriculumClass.create({
    grade: 1, name: 'Class 1', order: 1, status: 'active',
  })
  const level = await Level.create({
    classId: classroom._id, number: 1, order: 1, term: 1, unitNumber: 1,
    status: 'active', availability: 'PUBLISHED', curriculumVersion: CLASS1_DEMO_VERSION,
    title: 'My First Day', place: 'First Day Meadow',
    visualTheme: 'First Day Meadow', sourcePages: [1],
  })
  const level2 = await Level.create({
    classId: classroom._id, number: 2, order: 2, term: 1, unitNumber: 2,
    status: 'draft', availability: 'UPCOMING', curriculumVersion: 'class1-level2-unpublished',
    title: 'Action Beats & Rainbow Words', place: 'Rainbow Garden',
    visualTheme: 'Rainbow Garden', sourcePages: [2, 3, 4, 5, 6, 7, 8, 9],
  })
  // A legacy draft must remain in Mongo but NEVER control the published map.
  const oldLesson = await Lesson.create({
    levelId: level._id, order: 1, status: 'draft', title: 'Historical Two-Letter Words',
    settings: { talkoraDemoDraft: true, experienceId: 'g01-l01', lessonPlanRevision: 'first-day-little-words-v2' },
  })
  await Activity.create({
    lessonId: oldLesson._id, order: 1, title: 'Historic AM', prompt: 'AM', type: 'WORD_RECOGNITION',
    stage: 'LISTEN_REPEAT', status: 'draft', curriculumVersion: CLASS1_DEMO_VERSION,
    activityKey: 'class1-l01-v2-listen-am',
  })
  const lesson = await Lesson.create({
    levelId: level._id, title: 'My First Day — School Adventure', order: 0,
    status: 'active', settings: {
      talkoraDemoDraft: true, experienceId: 'g01-l01',
      lessonPlanRevision: CLASS1_FIRST_DAY_PARALLEL_REVISION,
      introVideoUrl: 'https://media.example.invalid/reviewed-first-day.mp4',
    },
  })
  const activities = await Activity.create(FIRST_DAY_SCENES.map((scene, i) => ({
    lessonId: lesson._id, grade: 1, term: 1, unitNumber: 1, order: i + 1,
    curriculumVersion: CLASS1_DEMO_VERSION, activityKey: 'class1-l01-v3-' + scene.key,
    title: scene.title, prompt: scene.prompt, type: 'CONVERSATION', stage: 'INTERACT',
    voiceEnabled: true, aiEnabled: true, allowMic: true, allowOptions: false,
    core: true, required: true, status: 'active',
    metadata: { conversationMode: 'OPEN', sceneKey: scene.key },
    content: { audioKey: 'class-01/level-01/v3/' + scene.key + '-en.wav' },
  })))
  const student = await Student.create({
    schoolId: school._id, grade: 1, fullName: 'Disposable Synthetic Learner',
    rollNumber: '1', avatarType: 'GIRL', status: 'active',
    passwordHash: await hashPassword('not-a-real-pin'),
  })
  const token = signToken({
    sub: student._id.toString(), role: 'STUDENT', schoolId: school._id.toString(),
  })
  const schoolToken = signToken({
    sub: school._id.toString(), role: 'SCHOOL_ADMIN', schoolId: school._id.toString(),
  })
  if (watchIntro) await watchFirstDayIntro(app, { Authorization: 'Bearer ' + token }, String(student._id), String(lesson._id))
  return { school, classroom, level, level2, lesson, oldLesson, activities, student, token, schoolToken }
}

describe('genuinely published Class 1 Level 1 (disposable database)', () => {
  it('requires generated, session-bound audio before progress and keeps duplicate ACKs idempotent', async () => {
    const f = await fixture()
    const activity = f.activities[0]
    const conversation = await Conversation.create({ studentId: f.student._id, lessonId: f.lesson._id,
      activityId: activity._id, mode: 'LESSON', status: 'ACTIVE', turnCount: 1 })
    const session = await VoiceSession.create({ studentId: f.student._id, lessonId: f.lesson._id,
      activityId: activity._id, provider: 'synthetic-stt', status: 'completed', startedAt: new Date(),
      transcript: 'I go to school.', aiResponse: { message: 'You said school. Let us try the next school action.',
        activityComplete: true, conversation: { id: String(conversation._id), masteryStatus: 'MASTERED' } } })
    const headers = { Authorization: 'Bearer ' + f.token }
    const ack = () => request(app).post('/api/voice/sessions/' + session._id + '/teacher-audio-played').set(headers)
    await ack().send({}).expect(409)
    await ack().send({ feedbackReceipt: 'forged' }).expect(409)
    expect(await ActivityAttempt.countDocuments({ studentId: f.student._id })).toBe(0)
    const azure = jest.spyOn(AzureVoiceProvider.prototype, 'synthesizeStream')
    const stream = (bytes: number) => ({ provider: 'azure-neerja', contentType: 'audio/mpeg',
      body: new ReadableStream<Uint8Array>({ start(c) { if (bytes) c.enqueue(new Uint8Array(bytes)); c.close() } }) })
    azure.mockImplementation(async () => stream(0))
    const body = { text: 'Browser-supplied text must not be narrated', purpose: 'CONVERSATION',
      activityId: String(activity._id), teacherSessionId: String(session._id) }
    const failed = await request(app).post('/api/voice/synthesize').set(headers).send(body).expect(502)
    expect(failed.headers['x-class1-feedback-receipt']).toBeUndefined()
    azure.mockImplementation(async () => stream(512))
    const generated = await request(app).post('/api/voice/synthesize').set(headers).send(body).expect(200)
    const receipt: string = generated.headers['x-class1-feedback-receipt']
    expect(receipt).toMatch(/^v1\.[0-9]+\.[a-f0-9]{32}\.[a-f0-9]{64}$/)
    expect(azure).toHaveBeenLastCalledWith('You said school. Let us try the next school action.', expect.any(Object))
    expect(await ActivityAttempt.countDocuments({ studentId: f.student._id })).toBe(0)
    const otherSession = await VoiceSession.create({ studentId: f.student._id, lessonId: f.lesson._id,
      activityId: activity._id, provider: 'synthetic-stt', status: 'completed', startedAt: new Date(),
      transcript: 'school', aiResponse: session.aiResponse })
    await request(app).post('/api/voice/sessions/' + otherSession._id + '/teacher-audio-played')
      .set(headers).send({ feedbackReceipt: receipt }).expect(409)
    await ack().send({ feedbackReceipt: receipt }).expect(200)
    await ack().send({ feedbackReceipt: receipt }).expect(200)
    expect(await ActivityAttempt.countDocuments({ studentId: f.student._id, activityId: activity._id })).toBe(1)
  })
  it('does not adopt a newer PIN visit when authentication and intro handling race', async () => {
    const f = await fixture(false)
    // Simulate revocation after authenticate() accepted the old token but
    // before the controller reads the student; no real school is involved.
    await Student.updateOne({ _id: f.student._id }, { $inc: { authVersion: 1 } })
    const req = { auth: { id: String(f.student._id), role: 'STUDENT', schoolId: String(f.school._id) },
      headers: { authorization: 'Bearer ' + f.token }, body: { lessonId: String(f.lesson._id) } } as Request
    const error = await new Promise<any>(resolve => Class1IntroController.start(req, {} as Response, resolve as NextFunction))
    expect(error.statusCode).toBe(401)
    expect(await Class1IntroVisit.countDocuments({ studentId: f.student._id })).toBe(0)
  })

  it('allows curriculum bootstrap but refuses direct voice, AI and progress before the full story', async () => {
    const f = await fixture(false)
    const headers = { Authorization: 'Bearer ' + f.token }
    const body = { lessonId: String(f.lesson._id), activityId: String(f.activities[0]._id) }
    await request(app).get('/api/students/me/next-lesson').set(headers).expect(200)
    await request(app).post('/api/voice/sessions').set(headers).send(body).expect(409)
    await request(app).post('/api/ai/miss-julie').set(headers).send({ ...body, message: 'school' }).expect(409)
    await request(app).post('/api/ai/miss-julie').set(headers).send({ lessonId: body.lessonId, message: 'school' }).expect(409)
    await request(app).post('/api/progress/activities/' + f.activities[0]._id + '/attempts').set(headers)
      .send({ answer: 'school', startedAt: new Date().toISOString() }).expect(409)
    expect(await VoiceSession.countDocuments({ studentId: f.student._id })).toBe(0)
    expect(await ActivityAttempt.countDocuments({ studentId: f.student._id })).toBe(0)
    expect(await Conversation.countDocuments({ studentId: f.student._id })).toBe(0)
  })

  it('rejects early, forged, missing-ended and expired intro completion; only the current reviewed film authorizes voice', async () => {
    const f = await fixture(false)
    const headers = { Authorization: 'Bearer ' + f.token }
    const lessonId = String(f.lesson._id)
    const started = await request(app).post('/api/voice/first-day/intro/start').set(headers).send({ lessonId }).expect(200)
    const payload = { lessonId, playbackId: started.body.data.playbackId, videoEnded: true }
    for (const elapsed of [20_000, 85_000]) {
      await Class1IntroVisit.updateOne({ studentId: f.student._id }, { $set: { startedAt: new Date(Date.now() - elapsed) } })
      await request(app).post('/api/voice/first-day/intro/complete').set(headers).send(payload).expect(409)
    }
    await request(app).post('/api/voice/first-day/intro/complete').set(headers).send({ ...payload, videoEnded: false }).expect(400)
    await request(app).post('/api/voice/first-day/intro/complete').set(headers).send({ ...payload, playbackId: 'f'.repeat(64) }).expect(409)
    await Class1IntroVisit.updateOne({ studentId: f.student._id }, { $set: { startedAt: new Date(Date.now() - 91_000), expiresAt: new Date(Date.now() - 1000) } })
    await request(app).post('/api/voice/first-day/intro/complete').set(headers).send(payload).expect(409)
    await Class1IntroVisit.updateOne({ studentId: f.student._id }, { $set: { expiresAt: new Date(Date.now() + 60_000) } })
    await request(app).post('/api/voice/first-day/intro/complete').set(headers).send(payload).expect(200)
    await request(app).post('/api/voice/sessions').set(headers).send({ lessonId, activityId: String(f.activities[0]._id) }).expect(201)
    await Lesson.updateOne({ _id: f.lesson._id }, { $set: { 'settings.introVideoUrl': 'https://media.example.test/new-version.mp4' } })
    await request(app).post('/api/voice/sessions').set(headers).send({ lessonId, activityId: String(f.activities[0]._id) }).expect(409)
    await request(app).post('/api/voice/first-day/intro/start').send({ lessonId }).expect(401)
    await request(app).post('/api/voice/first-day/intro/start').set({ Authorization: 'Bearer ' + f.schoolToken }).send({ lessonId }).expect(403)
  })

  it('new Class 1 PIN visits revoke old JWT/intro eligibility, preserve progress and require the story again', async () => {
    const f = await fixture()
    const pin = '48291'
    await Student.updateOne({ _id: f.student._id }, { $set: { passwordHash: await hashPassword(pin), pinLookup: pinLookup(pin) } })
    jest.spyOn(VoiceWarmupService, 'schedule').mockImplementation(() => undefined)
    const before = JSON.stringify(await Progress.find({ studentId: f.student._id }).lean())
    const login = async () => (await request(app).post('/api/auth/student/pin-login').send({ pin }).expect(200)).body.data.token as string
    const token = await login()
    expect(token).not.toBe(f.token)
    await request(app).get('/api/auth/me').set('Authorization', 'Bearer ' + f.token).expect(401)
    const headers = { Authorization: 'Bearer ' + token }
    const body = { lessonId: String(f.lesson._id), activityId: String(f.activities[0]._id) }
    await request(app).post('/api/voice/sessions').set(headers).send(body).expect(409)
    expect(JSON.stringify(await Progress.find({ studentId: f.student._id }).lean())).toBe(before)
    await watchFirstDayIntro(app, headers, String(f.student._id), String(f.lesson._id))
    await request(app).post('/api/voice/sessions').set(headers).send(body).expect(201)
    const second = await login()
    expect(second).not.toBe(token)
    await request(app).get('/api/auth/me').set(headers).expect(401)
    await request(app).post('/api/voice/sessions').set('Authorization', 'Bearer ' + second).send(body).expect(409)
  })
  it('opens My First Day from the student map/next lesson and staff map with no draft leakage', async () => {
    const f = await fixture()
    // A stale development flag must not redirect a student back into draft.
    process.env.NODE_ENV = 'development'
    process.env.TALKORA_CLASS1_STUDENT_DEMO = 'true'
    process.env.TALKORA_CLASS1_DEMO_ALL_STUDENTS = 'true'
    const headers = { Authorization: 'Bearer ' + f.token }
    const curriculum = await request(app).get('/api/students/me/curriculum').set(headers)
    expect(curriculum.status).toBe(200)
    expect(curriculum.body.data.studentGrade).toBe(1)
    expect(curriculum.body.data.units).toHaveLength(1)
    expect(curriculum.body.data.units[0]).toMatchObject({
      id: f.level._id.toString(), status: 'CURRENT', title: 'My First Day — School Adventure',
      lessonCount: 1,
    })
    const next = await request(app).get('/api/students/me/next-lesson').set(headers)
    expect(next.status).toBe(200)
    expect(next.body.data).toMatchObject({
      grade: 1, lessonId: f.lesson._id.toString(), activityId: f.activities[0]._id.toString(),
    })
    const loaded = await request(app)
      .get('/api/students/me/lessons/' + f.lesson._id).set(headers)
    expect(loaded.status).toBe(200)
    expect(loaded.body.data.experienceId).toBe('g01-l01')
    expect(loaded.body.data.activities).toHaveLength(10)
    expect(loaded.body.data.activities.map((a: { activityKey: string }) => a.activityKey))
      .toEqual(FIRST_DAY_SCENES.map(scene => 'class1-l01-v3-' + scene.key))
    expect(loaded.body.data.lesson.settings.introVideoUrl)
      .toBe('https://media.example.invalid/reviewed-first-day.mp4')
    await request(app).get('/api/students/me/lessons/' + f.oldLesson._id).set(headers).expect(403)

    const staff = await request(app).get('/api/curriculum-map/grades/1')
      .set('Authorization', 'Bearer ' + f.schoolToken)
    expect(staff.status).toBe(200)
    expect(staff.body.data.levels[0]).toMatchObject({
      address: 'g01-l01', status: 'PUBLISHED', publication: 'PUBLISHED',
      activeActivities: 10, draftActivities: 1,
    })
    expect(staff.body.data.levels[1]).toMatchObject({
      address: 'g01-l02', status: 'DRAFT',
    })
    await request(app).get('/api/curriculum-map/grades/1').set(headers).expect(403)
  })

  it('resumes from saved Mongo progress and cannot skip unpublished Level 2', async () => {
    const f = await fixture()
    const headers = { Authorization: 'Bearer ' + f.token }
    await request(app).get('/api/students/me/progress').set(headers).expect(200)
    const saved = await Progress.findOne({ studentId: f.student._id })
    expect(saved).not.toBeNull()
    const lvl = saved!.levels.find(x => x.levelId.toString() === f.level._id.toString())
    expect(lvl).toBeDefined()
    lvl!.status = 'in-progress'
    lvl!.lessons.push({
      lessonId: f.lesson._id,
      completedActivityIds: [f.activities[0]._id],
      completed: false, accuracy: 100, totalTimeMs: 500,
    })
    await saved!.save()
    const next = await request(app).get('/api/students/me/next-lesson').set(headers)
    expect(next.status).toBe(200)
    expect(next.body.data.activityId).toBe(f.activities[1]._id.toString())
    const resumed = await request(app).get('/api/students/me/lessons/' + f.lesson._id).set(headers)
    expect(resumed.status).toBe(200)
    expect(resumed.body.data.completedActivityIds).toContain(f.activities[0]._id.toString())
    // The existing unpublished next chapter is not a student URL permission.
    const staffOnlyLesson = await Lesson.create({
      levelId: f.level2._id, title: '1.2 Draft', order: 1, status: 'draft',
    })
    await request(app).get('/api/students/me/lessons/' + staffOnlyLesson._id)
      .set(headers).expect(403)
    // No mutation of legacy progress or creation of new published Level 2.
    const after = await Progress.findOne({ studentId: f.student._id }).lean()
    expect(after?.levels.some(x => x.levelId.toString() === f.level2._id.toString())).toBe(false)
    expect(await Activity.countDocuments({ lessonId: f.oldLesson._id, status: 'draft' })).toBe(1)
  })
})
