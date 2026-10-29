import request from 'supertest'
import { createApp } from '../../src/app'
import { connectTestDatabase, disconnectTestDatabase, clearTestDatabase } from './dbTestUtils'
import { School } from '../../src/models/School'
import { Student } from '../../src/models/Student'
import { CurriculumClass } from '../../src/models/CurriculumClass'
import { Level } from '../../src/models/Level'
import { Lesson } from '../../src/models/Lesson'
import { Activity } from '../../src/models/Activity'
import { VoiceSession } from '../../src/models/VoiceSession'
import { hashPassword } from '../../src/utils/password'
import { signToken } from '../../src/utils/jwt'
import { CLASS1_DEMO_VERSION } from '../../src/services/class1-demo-access'

const app = createApp()
const originalNodeEnv = process.env.NODE_ENV

beforeAll(async () => connectTestDatabase())
afterAll(async () => disconnectTestDatabase())
beforeEach(() => { process.env.TALKORA_CLASS1_DEMO_ALL_STUDENTS = 'false' })
afterEach(async () => {
  if (originalNodeEnv === undefined) delete process.env.NODE_ENV
  else process.env.NODE_ENV = originalNodeEnv
  delete process.env.TALKORA_CLASS1_STUDENT_DEMO
  delete process.env.TALKORA_CLASS1_DEMO_STUDENT_ID
  delete process.env.TALKORA_CLASS1_DEMO_ALL_STUDENTS
  await clearTestDatabase()
})

async function createStudent(grade: number, name: string) {
  let school = await School.findOne({ code: 'DEMO1' })
  if (!school) {
    school = await School.create({ name: 'Demo Access School', code: 'DEMO1', passwordHash: await hashPassword('pw'), status: 'active' })
  }
  const student = await Student.create({
    schoolId: school._id,
    fullName: name,
    rollNumber: `${grade}-${name}`,
    grade,
    passwordHash: await hashPassword('ABCD'),
    avatarType: 'GIRL',
    status: 'active',
  })
  const token = signToken({ sub: student._id.toString(), role: 'STUDENT', schoolId: school._id.toString() })
  return { student, token }
}

async function createClass1Draft(classStatus: 'active' | 'draft' = 'draft') {
  const classroom = await CurriculumClass.create({ grade: 1, name: 'Class 1', order: 1, status: classStatus })
  const level = await Level.create({
    classId: classroom._id,
    number: 1,
    term: 1,
    unitNumber: 1,
    unitType: 'CONVERSATION',
    visualTheme: 'Two-Letter Word Meadow',
    learningObjectives: ['Recognize at and in'],
    speakingGoals: ['Say at'],
    sourcePages: [],
    curriculumVersion: CLASS1_DEMO_VERSION,
    availability: 'UPCOMING',
    title: 'Two-Letter Word Adventure',
    place: 'Two-Letter Word Meadow',
    order: 1,
    status: 'draft',
  })
  const lesson = await Lesson.create({
    levelId: level._id,
    title: 'Two-Letter Word Adventure',
    order: 1,
    settings: { talkoraDemoDraft: true, experienceId: 'g01-l01' },
    status: 'draft',
  })
  const keys = [
    'listen-am', 'build-an', 'listen-at', 'listen-in', 'use-on', 'it-is-up', 'review-little-words',
    'say-walk', 'find-school', 'school-talk',
  ]
  const activities = await Activity.create(keys.map((key, index) => ({
    lessonId: lesson._id,
    curriculumVersion: CLASS1_DEMO_VERSION,
    activityKey: `class1-l01-v2-${key}`,
    grade: 1,
    term: 1,
    unitNumber: 1,
    order: index + 1,
    type: ['review-little-words', 'school-talk'].includes(key) ? 'CONVERSATION'
      : key === 'say-walk' ? 'LISTEN_AND_REPEAT' : 'WORD_RECOGNITION',
    stage: ['review-little-words', 'school-talk'].includes(key) ? 'INTERACT'
      : key === 'say-walk' ? 'SPEAK' : 'LISTEN_REPEAT',
    title: key,
    prompt: ['review-little-words', 'school-talk'].includes(key) ? 'Talk with Miss Julie.' : key === 'say-walk' ? 'Say walk.' : 'Choose a word.',
    target: key === 'say-walk' ? 'walk' : key === 'school-talk' || key === 'find-school' ? 'school' : 'at',
    choices: ['review-little-words', 'school-talk', 'say-walk'].includes(key) ? []
      : key === 'find-school' ? ['bell', 'school', 'playground'] : ['an', 'at', 'in'],
    answer: ['review-little-words', 'school-talk', 'say-walk'].includes(key) ? undefined : key === 'find-school' ? 'school' : 'am',
    difficulty: 'easy',
    xp: 0,
    estimatedSeconds: 20,
    voiceEnabled: true,
    aiEnabled: ['review-little-words', 'school-talk'].includes(key),
    allowMic: ['review-little-words', 'school-talk', 'say-walk'].includes(key),
    allowOptions: !['review-little-words', 'school-talk', 'say-walk'].includes(key),
    maxConversationTurns: 2,
    ...(['review-little-words', 'school-talk'].includes(key) ? {
      conversationGoal: { requiredConcepts: [], minTurns: 2, maxTurns: 2 },
      metadata: { conversationMode: 'OPEN' },
    } : {}),
    core: true,
    required: true,
    status: 'draft',
  })))
  return { classroom, level, lesson, activities }
}

describe('development-only Class 1 student demo access', () => {
  it('opens the exact ten-activity foundations and My First Day draft for only the configured Class 1 student', async () => {
    process.env.NODE_ENV = 'development'
    const { student, token } = await createStudent(1, 'Allowed Learner')
    const { level, lesson, activities } = await createClass1Draft('active')
    process.env.TALKORA_CLASS1_STUDENT_DEMO = 'true'
    process.env.TALKORA_CLASS1_DEMO_STUDENT_ID = student._id.toString()

    // Nearby draft content must never leak into the one-student g01-l01 demo.
    const decoyLesson = await Lesson.create({
      levelId: level._id,
      title: 'Unapproved Draft Lesson',
      order: 0,
      settings: { talkoraDemoDraft: true, experienceId: 'g01-l02' },
      status: 'draft',
    })
    await Activity.create({
      lessonId: decoyLesson._id, curriculumVersion: CLASS1_DEMO_VERSION, activityKey: 'class1-l01-decoy',
      grade: 1, term: 1, unitNumber: 1, order: 1, type: 'WORD_RECOGNITION', stage: 'LISTEN_REPEAT',
      title: 'decoy', prompt: 'Do not show this.', target: 'no', choices: ['no'], answer: 'no', difficulty: 'easy',
      xp: 0, estimatedSeconds: 10, voiceEnabled: false, aiEnabled: false, allowMic: false, allowOptions: true,
      core: true, required: true, status: 'draft',
    })
    await Activity.create({
      lessonId: lesson._id, curriculumVersion: 'unapproved-draft-v1', activityKey: 'unapproved-activity',
      grade: 1, term: 1, unitNumber: 1, order: 11, type: 'WORD_RECOGNITION', stage: 'LISTEN_REPEAT',
      title: 'unapproved', prompt: 'Do not show this.', target: 'no', choices: ['no'], answer: 'no', difficulty: 'easy',
      xp: 0, estimatedSeconds: 10, voiceEnabled: false, aiEnabled: false, allowMic: false, allowOptions: true,
      core: true, required: true, status: 'draft',
    })

    const progress = await request(app).get('/api/students/me/progress').set('Authorization', `Bearer ${token}`)
    expect(progress.status).toBe(200)
    expect(progress.body.data.curriculumVersion).toBe(CLASS1_DEMO_VERSION)
    expect(progress.body.data.levels).toHaveLength(1)
    expect(progress.body.data.levels[0]).toMatchObject({ levelId: level._id.toString(), status: 'unlocked' })

    const curriculum = await request(app).get('/api/students/me/curriculum').set('Authorization', `Bearer ${token}`)
    expect(curriculum.status).toBe(200)
    expect(curriculum.body.data).toMatchObject({
      studentGrade: 1,
      curriculumVersion: CLASS1_DEMO_VERSION,
      currentUnitId: level._id.toString(),
      totalUnits: 1,
    })
    expect(curriculum.body.data.units[0]).toMatchObject({
      id: level._id.toString(),
      title: 'Two-Letter Word Adventure',
      status: 'CURRENT',
      lessonCount: 1,
    })

    const next = await request(app).get('/api/students/me/next-lesson').set('Authorization', `Bearer ${token}`)
    expect(next.status).toBe(200)
    expect(next.body.data).toMatchObject({ grade: 1, lessonId: lesson._id.toString(), complete: false })

    const loaded = await request(app).get(`/api/students/me/lessons/${lesson._id}`).set('Authorization', `Bearer ${token}`)
    expect(loaded.status).toBe(200)
    expect(loaded.body.data.experienceId).toBe('g01-l01')
    expect(loaded.body.data.activities).toHaveLength(10)
    expect(loaded.body.data.activities.map((item: { activityKey: string }) => item.activityKey)).toEqual(
      activities.map((item) => item.activityKey),
    )

    const voice = await request(app).post('/api/voice/sessions').set('Authorization', `Bearer ${token}`).send({
      lessonId: lesson._id.toString(),
      activityId: activities[6]._id.toString(),
    })
    expect(voice.status).toBe(201)
    expect(voice.body.data.provider).toEqual(expect.any(String))

    const controlled = await request(app).post('/api/voice/sessions').set('Authorization', `Bearer ${token}`).send({
      lessonId: lesson._id.toString(),
      activityId: activities[7]._id.toString(),
      expectedPhrase: 'banana', // A student cannot change what "say walk" evaluates.
    })
    expect(controlled.status).toBe(201)
    const storedSession = await VoiceSession.findById(controlled.body.data._id)
    expect(storedSession?.metadata?.expectedPhrase).toBe('walk')
  })

  it('opens the exact draft to all active Class 1 students only in development when explicitly enabled', async () => {
    process.env.NODE_ENV = 'development'
    process.env.TALKORA_CLASS1_STUDENT_DEMO = 'true'
    process.env.TALKORA_CLASS1_DEMO_ALL_STUDENTS = 'true'
    const first = await createStudent(1, 'First Class 1 Learner')
    const second = await createStudent(1, 'Second Class 1 Learner')
    const { lesson } = await createClass1Draft('active')

    for (const learner of [first, second]) {
      const progress = await request(app).get('/api/students/me/progress').set('Authorization', `Bearer ${learner.token}`)
      expect(progress.status).toBe(200)
      expect(progress.body.data.curriculumVersion).toBe(CLASS1_DEMO_VERSION)
      const curriculum = await request(app).get('/api/students/me/curriculum').set('Authorization', `Bearer ${learner.token}`)
      expect(curriculum.status).toBe(200)
      const loaded = await request(app).get(`/api/students/me/lessons/${lesson._id}`).set('Authorization', `Bearer ${learner.token}`)
      expect(loaded.status).toBe(200)
      expect(loaded.body.data.experienceId).toBe('g01-l01')
      expect(loaded.body.data.activities).toHaveLength(10)
    }

    process.env.NODE_ENV = 'production'
    const production = await request(app).get('/api/students/me/progress').set('Authorization', `Bearer ${first.token}`)
    expect(production.status).not.toBe(200)
  })

  it('fails closed for another Class 1 student and for a mismatched KG student', async () => {
    process.env.NODE_ENV = 'development'
    const allowed = await createStudent(1, 'Configured Learner')
    const other = await createStudent(1, 'Other Learner')
    const { lesson } = await createClass1Draft('active')
    process.env.TALKORA_CLASS1_STUDENT_DEMO = 'true'
    process.env.TALKORA_CLASS1_DEMO_STUDENT_ID = allowed.student._id.toString()

    const otherProgress = await request(app).get('/api/students/me/progress').set('Authorization', `Bearer ${other.token}`)
    const otherCurriculum = await request(app).get('/api/students/me/curriculum').set('Authorization', `Bearer ${other.token}`)
    const otherNext = await request(app).get('/api/students/me/next-lesson').set('Authorization', `Bearer ${other.token}`)
    expect(otherProgress.status).not.toBe(200)
    expect(otherCurriculum.status).not.toBe(200)
    expect(otherNext.status).not.toBe(200)

    const denied = await request(app).get(`/api/students/me/lessons/${lesson._id}`).set('Authorization', `Bearer ${other.token}`)
    expect(denied.status).not.toBe(200)

    const kgClass = await CurriculumClass.create({ grade: 0, name: 'KG', order: 0, status: 'active' })
    await Level.create({
      classId: kgClass._id, number: 1, term: 1, unitNumber: 1, unitType: 'CONVERSATION',
      visualTheme: 'KG World', learningObjectives: [], speakingGoals: [], sourcePages: [],
      curriculumVersion: 'kg-published-v1', availability: 'PUBLISHED', title: 'KG Unit', place: 'KG World', order: 1, status: 'active',
    })
    const kg = await createStudent(0, 'KG Learner')
    const kgProgress = await request(app).get('/api/students/me/progress').set('Authorization', `Bearer ${kg.token}`)
    const kgCurriculum = await request(app).get('/api/students/me/curriculum').set('Authorization', `Bearer ${kg.token}`)
    expect(kgProgress.status).toBe(200)
    expect(kgCurriculum.status).toBe(200)
    await request(app).get('/api/students/me/curriculum').set('Authorization', `Bearer ${kg.token}`).expect(200)
    const kgDenied = await request(app).get(`/api/students/me/lessons/${lesson._id}`).set('Authorization', `Bearer ${kg.token}`)
    expect(kgDenied.status).toBe(403)
    expect(kgDenied.body.error.code).toBe('ACTIVITY_NOT_AVAILABLE')
  })

  it('does not alter ordinary published student lesson access', async () => {
    const { token } = await createStudent(2, 'Published Learner')
    const classroom = await CurriculumClass.create({ grade: 2, name: 'Class 2', order: 2, status: 'active' })
    const level = await Level.create({
      classId: classroom._id, number: 1, term: 1, unitNumber: 1, unitType: 'CONVERSATION',
      visualTheme: 'Published World', learningObjectives: [], speakingGoals: [], sourcePages: [],
      curriculumVersion: 'class2-v1', availability: 'PUBLISHED', title: 'Published Unit', place: 'Published World', order: 1, status: 'active',
    })
    const lesson = await Lesson.create({ levelId: level._id, title: 'Published Lesson', order: 1, status: 'active' })
    await Activity.create({
      lessonId: lesson._id, order: 1, type: 'WORD_RECOGNITION', stage: 'LISTEN_REPEAT', title: 'Published activity',
      prompt: 'Choose in.', target: 'in', choices: ['at', 'in'], answer: 'in', difficulty: 'easy', xp: 1,
      estimatedSeconds: 20, voiceEnabled: true, aiEnabled: false, status: 'active',
    })

    const loaded = await request(app).get(`/api/students/me/lessons/${lesson._id}`).set('Authorization', `Bearer ${token}`)
    expect(loaded.status).toBe(200)
    expect(loaded.body.data.experienceId).toBeUndefined()
    expect(loaded.body.data.activities).toHaveLength(1)
  })
})
