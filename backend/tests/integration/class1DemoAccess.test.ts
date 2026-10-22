import request from 'supertest'
import { createApp } from '../../src/app'
import { connectTestDatabase, disconnectTestDatabase, clearTestDatabase } from './dbTestUtils'
import { School } from '../../src/models/School'
import { Student } from '../../src/models/Student'
import { CurriculumClass } from '../../src/models/CurriculumClass'
import { Level } from '../../src/models/Level'
import { Lesson } from '../../src/models/Lesson'
import { Activity } from '../../src/models/Activity'
import { hashPassword } from '../../src/utils/password'
import { signToken } from '../../src/utils/jwt'
import { CLASS1_DEMO_VERSION } from '../../src/services/class1-demo-access'

const app = createApp()

beforeAll(async () => connectTestDatabase())
afterAll(async () => disconnectTestDatabase())
afterEach(async () => {
  delete process.env.TALKORA_CLASS1_STUDENT_DEMO
  delete process.env.TALKORA_CLASS1_DEMO_STUDENT_ID
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

async function createClass1Draft() {
  const classroom = await CurriculumClass.create({ grade: 1, name: 'Class 1', order: 1, status: 'draft' })
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
  const keys = ['listen-at', 'build-at', 'listen-in', 'build-in', 'look-at-me', 'i-am-sam', 'repeat-at']
  const activities = await Activity.create(keys.map((key, index) => ({
    lessonId: lesson._id,
    curriculumVersion: CLASS1_DEMO_VERSION,
    activityKey: `class1-l01-${key}`,
    grade: 1,
    term: 1,
    unitNumber: 1,
    order: index + 1,
    type: key === 'repeat-at' ? 'CONVERSATION' : 'WORD_RECOGNITION',
    stage: key === 'repeat-at' ? 'INTERACT' : 'LISTEN_REPEAT',
    title: key,
    prompt: key === 'repeat-at' ? 'Say at with Miss Julie.' : 'Choose at.',
    target: 'at',
    choices: key === 'repeat-at' ? [] : ['an', 'at', 'in'],
    answer: key === 'repeat-at' ? undefined : 'at',
    difficulty: 'easy',
    xp: 0,
    estimatedSeconds: 20,
    voiceEnabled: true,
    aiEnabled: key === 'repeat-at',
    allowMic: key === 'repeat-at',
    allowOptions: key !== 'repeat-at',
    maxConversationTurns: 2,
    ...(key === 'repeat-at' ? {
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
  it('opens the exact seven-activity draft for only the configured Class 1 student', async () => {
    const { student, token } = await createStudent(1, 'Allowed Learner')
    const { lesson, activities } = await createClass1Draft()
    process.env.TALKORA_CLASS1_STUDENT_DEMO = 'true'
    process.env.TALKORA_CLASS1_DEMO_STUDENT_ID = student._id.toString()

    const next = await request(app).get('/api/students/me/next-lesson').set('Authorization', `Bearer ${token}`)
    expect(next.status).toBe(200)
    expect(next.body.data).toMatchObject({ grade: 1, lessonId: lesson._id.toString(), complete: false })

    const loaded = await request(app).get(`/api/students/me/lessons/${lesson._id}`).set('Authorization', `Bearer ${token}`)
    expect(loaded.status).toBe(200)
    expect(loaded.body.data.experienceId).toBe('g01-l01')
    expect(loaded.body.data.activities).toHaveLength(7)
    expect(loaded.body.data.activities.map((item: { activityKey: string }) => item.activityKey)).toEqual(
      activities.map((item) => item.activityKey),
    )

    const voice = await request(app).post('/api/voice/sessions').set('Authorization', `Bearer ${token}`).send({
      lessonId: lesson._id.toString(),
      activityId: activities[6]._id.toString(),
    })
    expect(voice.status).toBe(201)
    expect(voice.body.data.provider).toBe('groq-whisper')
  })

  it('fails closed for another Class 1 student and for a mismatched KG student', async () => {
    const allowed = await createStudent(1, 'Configured Learner')
    const other = await createStudent(1, 'Other Learner')
    const { lesson } = await createClass1Draft()
    process.env.TALKORA_CLASS1_STUDENT_DEMO = 'true'
    process.env.TALKORA_CLASS1_DEMO_STUDENT_ID = allowed.student._id.toString()

    const denied = await request(app).get(`/api/students/me/lessons/${lesson._id}`).set('Authorization', `Bearer ${other.token}`)
    expect(denied.status).toBe(404)

    const kgClass = await CurriculumClass.create({ grade: 0, name: 'KG', order: 0, status: 'active' })
    await Level.create({
      classId: kgClass._id, number: 1, term: 1, unitNumber: 1, unitType: 'CONVERSATION',
      visualTheme: 'KG World', learningObjectives: [], speakingGoals: [], sourcePages: [],
      curriculumVersion: 'kg-published-v1', availability: 'PUBLISHED', title: 'KG Unit', place: 'KG World', order: 1, status: 'active',
    })
    const kg = await createStudent(0, 'KG Learner')
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
