import request from 'supertest'
import { createApp } from '../../src/app'
import { env } from '../../src/config/env'
import { KG_CURRICULUM_VERSION } from '../../src/curriculum/kg/constants'
import { Activity } from '../../src/models/Activity'
import { CurriculumClass } from '../../src/models/CurriculumClass'
import { Level } from '../../src/models/Level'
import { Lesson } from '../../src/models/Lesson'
import { Progress } from '../../src/models/Progress'
import { School } from '../../src/models/School'
import { Student } from '../../src/models/Student'
import { signToken } from '../../src/utils/jwt'
import { clearTestDatabase, connectTestDatabase, disconnectTestDatabase } from './dbTestUtils'

const app = createApp()
const configuredPilotIds = [...env.kgPilotStudentIds]

beforeAll(connectTestDatabase)
afterAll(async () => {
  env.kgPilotStudentIds.splice(0, env.kgPilotStudentIds.length, ...configuredPilotIds)
  await disconnectTestDatabase()
})
afterEach(async () => {
  env.kgPilotStudentIds.splice(0, env.kgPilotStudentIds.length, ...configuredPilotIds)
  await clearTestDatabase()
})

async function makeStudent(schoolId: string, grade: number, rollNumber: string) {
  return Student.create({
    schoolId,
    fullName: `${grade === 0 ? 'KG' : 'Class 4'} Learner`,
    rollNumber,
    grade,
    passwordHash: 'test-hash',
    avatarType: 'GIRL',
    status: 'active',
  })
}

function studentToken(student: { _id: { toString(): string }; schoolId: { toString(): string } }) {
  return signToken({
    sub: student._id.toString(),
    schoolId: student.schoolId.toString(),
    role: 'STUDENT',
    sv: 0,
  })
}

it('serves draft KG only to the allowlisted Grade 0 session, resumes saved progress, and labels missing pictures honestly', async () => {
  const school = await School.create({ name: 'Pilot School', code: 'KGPILOT1', passwordHash: 'test-hash', status: 'active' })
  const student = await makeStudent(school._id.toString(), 0, 'kg-1')
  env.kgPilotStudentIds.push(student._id.toString())

  const klass = await CurriculumClass.create({ grade: 0, name: 'Kindergarten (KG)', order: 0, status: 'draft' })
  const unit = await Level.create({
    classId: klass._id, number: 1, unitNumber: 1, order: 1, title: 'Look, Touch & Say', place: 'My World',
    curriculumVersion: KG_CURRICULUM_VERSION, availability: 'UPCOMING', status: 'draft',
  })
  const unit2 = await Level.create({
    classId: klass._id, number: 2, unitNumber: 2, order: 2, title: 'More Things Around Me', place: 'My World',
    curriculumVersion: KG_CURRICULUM_VERSION, availability: 'UPCOMING', status: 'draft',
  })
  const lesson1 = await Lesson.create({ levelId: unit._id, title: 'Hello words', order: 1, status: 'draft' })
  const lesson2 = await Lesson.create({ levelId: unit._id, title: 'My things', order: 2, status: 'draft' })
  const lesson3 = await Lesson.create({ levelId: unit2._id, title: 'Around me', order: 1, status: 'draft' })
  const firstActivity = await Activity.create({
    lessonId: lesson1._id, type: 'SPEAK_PROMPT', stage: 'SPEAK', title: 'Say cat', prompt: 'Say cat.',
    order: 1, target: 'cat', answer: 'cat', required: true, core: true, status: 'draft',
  })
  const nextActivity = await Activity.create({
    lessonId: lesson1._id, type: 'PICTURE_CHOICE', stage: 'PRACTICE_ZONE', title: 'Look again', prompt: 'Find the dog picture.',
    order: 2, target: 'dog', choices: ['dog', 'cat'], answer: 'dog', required: true, core: true, status: 'draft',
    content: { pictureMode: true, pictureAsset: { assetKey: 'kg-g0-u1-dog', status: 'MISSING' } },
  })
  await Activity.create({
    lessonId: lesson2._id, type: 'SPEAK_PROMPT', stage: 'SPEAK', title: 'Say a word', prompt: 'Say hello.',
    order: 1, target: 'hello', answer: 'hello', required: true, core: true, status: 'draft',
  })
  const lesson2Activity = await Activity.findOne({ lessonId: lesson2._id })
  const unit2Activity = await Activity.create({
    lessonId: lesson3._id, type: 'SPEAK_PROMPT', stage: 'SPEAK', title: 'Say ball', prompt: 'Say ball.',
    order: 1, target: 'ball', answer: 'ball', required: true, core: true, status: 'draft',
  })
  await Progress.create({
    studentId: student._id,
    classId: klass._id,
    curriculumVersion: KG_CURRICULUM_VERSION,
    levels: [{
      levelId: unit._id,
      status: 'in-progress',
      lessons: [{ lessonId: lesson1._id, completedActivityIds: [firstActivity._id], completed: false, accuracy: 100, totalTimeMs: 1000 }],
      accuracy: 100,
      totalTimeMs: 1000,
    }],
  })

  const authorization = `Bearer ${studentToken(student)}`
  const curriculum = await request(app).get('/api/students/me/curriculum').set('Authorization', authorization)
  expect(curriculum.status).toBe(200)
  expect(curriculum.body.data.studentGrade).toBe(0)
  expect(curriculum.body.data.units).toHaveLength(2)
  expect(curriculum.body.data.units[0].status).toBe('CURRENT')
  expect(curriculum.body.data.units[0].progress).toBe(50)
  expect(curriculum.body.data.units[1].status).toBe('LOCKED')

  const next = await request(app).get('/api/students/me/next-lesson').set('Authorization', authorization)
  expect(next.status).toBe(200)
  expect(next.body.data).toMatchObject({ lessonId: lesson2._id.toString(), activityId: lesson2Activity!._id.toString(), complete: false })

  const packageResponse = await request(app)
    .get(`/api/students/me/lessons/${lesson1._id}`)
    .set('Authorization', authorization)
  expect(packageResponse.status).toBe(200)
  expect(packageResponse.body.data.activities[0].id).toBe(firstActivity._id.toString())
  expect(packageResponse.body.data.activities[1].id).toBe(nextActivity._id.toString())
  expect(packageResponse.body.data.activities[1]).toMatchObject({
    title: 'Picture activity unavailable',
    prompt: 'The picture is not available yet. Tap Continue to skip this activity.',
    choices: [],
    content: {
      pictureMode: false,
      pilotUnavailableMessage: expect.stringMatching(/does not count as completed/i),
      pictureAsset: { status: 'MISSING' },
    },
  })
  expect(packageResponse.body.data.activities[1].content.pictureAsset.url).toBeUndefined()

  const blockedPictureAttempt = await request(app)
    .post(`/api/progress/activities/${nextActivity._id}/attempts`)
    .set('Authorization', authorization)
    .send({ answer: 'dog', startedAt: new Date(Date.now() - 1000).toISOString(), hintsUsed: 0, idempotencyKey: 'kg-missing-picture' })
  expect(blockedPictureAttempt.status).toBe(403)
  expect(blockedPictureAttempt.body.error.message).toMatch(/skipped until its picture asset is ready/i)

  const skipped = await request(app).get('/api/students/me/next-lesson').set('Authorization', authorization)
  expect(skipped.body.data).toMatchObject({ lessonId: lesson2._id.toString(), activityId: lesson2Activity!._id.toString(), complete: false })

  const wrongAnswer = await request(app)
    .post(`/api/progress/activities/${lesson2Activity!._id}/attempts`)
    .set('Authorization', authorization)
    .send({ answer: 'cat', startedAt: new Date(Date.now() - 1000).toISOString(), hintsUsed: 0, idempotencyKey: 'kg-pilot-wrong-answer' })
  expect(wrongAnswer.status).toBe(200)
  expect(wrongAnswer.body.data.attempt.correct).toBe(false)

  const stillCurrent = await request(app).get('/api/students/me/next-lesson').set('Authorization', authorization)
  expect(stillCurrent.body.data.activityId).toBe(lesson2Activity!._id.toString())

  const correctAnswer = await request(app)
    .post(`/api/progress/activities/${lesson2Activity!._id}/attempts`)
    .set('Authorization', authorization)
    .send({ answer: 'hello', startedAt: new Date(Date.now() - 1000).toISOString(), hintsUsed: 0, idempotencyKey: 'kg-pilot-correct-answer' })
  expect(correctAnswer.status).toBe(200)
  expect(correctAnswer.body.data.attempt.correct).toBe(true)

  const resumedAfterCompletion = await request(app).get('/api/students/me/next-lesson').set('Authorization', authorization)
  expect(resumedAfterCompletion.body.data).toMatchObject({ lessonId: lesson3._id.toString(), activityId: unit2Activity._id.toString(), complete: false })
})

it('denies draft KG to non-allowlisted Grade 0 students and keeps Class 4 on the published path', async () => {
  const school = await School.create({ name: 'Isolation School', code: 'KGPILOT2', passwordHash: 'test-hash', status: 'active' })
  const regularKgStudent = await makeStudent(school._id.toString(), 0, 'kg-regular')
  const class4Student = await makeStudent(school._id.toString(), 4, 'class4-1')

  const kgClass = await CurriculumClass.create({ grade: 0, name: 'Kindergarten (KG)', order: 0, status: 'draft' })
  const kgLevel = await Level.create({ classId: kgClass._id, number: 1, unitNumber: 1, order: 1, title: 'Draft KG', place: 'Pilot', curriculumVersion: KG_CURRICULUM_VERSION, availability: 'UPCOMING', status: 'draft' })
  const kgLesson = await Lesson.create({ levelId: kgLevel._id, title: 'Draft lesson', order: 1, status: 'draft' })
  await Activity.create({ lessonId: kgLesson._id, type: 'SPEAK_PROMPT', stage: 'SPEAK', title: 'Draft prompt', prompt: 'Say hello.', order: 1, status: 'draft' })

  const blocked = await request(app)
    .get(`/api/students/me/lessons/${kgLesson._id}`)
    .set('Authorization', `Bearer ${studentToken(regularKgStudent)}`)
  expect(blocked.status).toBe(422)
  expect(JSON.stringify(blocked.body)).not.toContain(kgLesson._id.toString())

  const class4 = await CurriculumClass.create({ grade: 4, name: 'Class 4', order: 4, status: 'active' })
  const class4Level = await Level.create({ classId: class4._id, number: 1, unitNumber: 1, order: 1, title: 'Class 4 Unit', place: 'World', curriculumVersion: 'class4-term1-v1', availability: 'PUBLISHED', status: 'active' })
  const class4Lesson = await Lesson.create({ levelId: class4Level._id, title: 'Published lesson', order: 1, status: 'active' })
  const class4Activity = await Activity.create({ lessonId: class4Lesson._id, type: 'MCQ', stage: 'PRACTICE_ZONE', title: 'Published activity', prompt: 'Choose.', choices: ['A', 'B'], answer: 'A', order: 1, status: 'active' })

  const class4Curriculum = await request(app)
    .get('/api/students/me/curriculum')
    .set('Authorization', `Bearer ${studentToken(class4Student)}`)
  expect(class4Curriculum.status).toBe(200)
  expect(class4Curriculum.body.data.studentGrade).toBe(4)
  expect(class4Curriculum.body.data.units[0].status).toBe('CURRENT')

  const class4Next = await request(app)
    .get('/api/students/me/next-lesson')
    .set('Authorization', `Bearer ${studentToken(class4Student)}`)
  expect(class4Next.status).toBe(200)
  expect(class4Next.body.data).toMatchObject({ lessonId: class4Lesson._id.toString(), activityId: class4Activity._id.toString() })
})
