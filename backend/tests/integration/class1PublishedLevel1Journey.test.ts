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
import { hashPassword } from '../../src/utils/password'
import { signToken } from '../../src/utils/jwt'
import { FIRST_DAY_SCENES } from '../../src/scripts/class1-first-day-scenes'
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
  if (oldNodeEnv === undefined) delete process.env.NODE_ENV
  else process.env.NODE_ENV = oldNodeEnv
  delete process.env.TALKORA_CLASS1_STUDENT_DEMO
  delete process.env.TALKORA_CLASS1_DEMO_ALL_STUDENTS
  delete process.env.TALKORA_CLASS1_DEMO_STUDENT_ID
  await clearTestDatabase()
})

async function fixture() {
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
  return { school, classroom, level, level2, lesson, oldLesson, activities, student, token, schoolToken }
}

describe('genuinely published Class 1 Level 1 (disposable database)', () => {
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
