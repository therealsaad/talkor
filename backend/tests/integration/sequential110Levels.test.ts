import request from 'supertest'
import { createApp } from '../../src/app'
import { School } from '../../src/models/School'
import { Student } from '../../src/models/Student'
import { CurriculumClass } from '../../src/models/CurriculumClass'
import { Level } from '../../src/models/Level'
import { Lesson } from '../../src/models/Lesson'
import { Activity } from '../../src/models/Activity'
import { Progress } from '../../src/models/Progress'
import { ProgressService } from '../../src/services/progress.service'
import { StudentLessonFastService } from '../../src/services/student-lesson-fast.service'
import { signToken } from '../../src/utils/jwt'
import { connectTestDatabase, disconnectTestDatabase, clearTestDatabase } from './dbTestUtils'
const app = createApp()
beforeAll(connectTestDatabase)
afterAll(disconnectTestDatabase)
afterEach(clearTestDatabase)

async function fixture(grade: number) {
  const school = await School.create({
    name: 'Sequential Grades School', code: 'SEQ' + grade, passwordHash: 'hash', status: 'active',
  })
  const student = await Student.create({
    schoolId: school._id, fullName: 'Sequential Learner', rollNumber: 'seq' + grade,
    grade, passwordHash: 'hash', avatarType: 'BOY', status: 'active',
  })
  const klass = await CurriculumClass.create({
    grade, name: 'Class ' + grade, order: grade, status: 'active',
  })
  const add = async (number: number, published = true) => {
    const level = await Level.create({
      classId: klass._id, number, order: number, title: 'Level ' + number,
      place: 'School', status: published ? 'active' : 'draft',
      availability: published ? 'PUBLISHED' : 'UPCOMING',
    })
    const lesson = await Lesson.create({
      levelId: level._id, title: 'Lesson ' + number, order: 1,
      status: published ? 'active' : 'draft',
    })
    const activity = await Activity.create({
      lessonId: lesson._id, type: 'MCQ', stage: 'FINAL_CHALLENGE',
      title: 'Question ' + number, prompt: 'Say yes', order: 1,
      answer: 'YES', xp: 10, required: true, core: true,
      status: published ? 'active' : 'draft',
    })
    return { level, lesson, activity }
  }
  const first = await add(1)
  const second = await add(2)
  const third = await add(3, false)
  const fourth = await add(4)
  const authorization = 'Bearer ' + signToken({
    sub: student._id.toString(), schoolId: school._id.toString(), role: 'STUDENT', sv: 0,
  })
  return { student, school, klass, first, second, third, fourth, authorization }
}

it.each([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])(
  'Class %i enforces published 1→2 and blocks unpublished-gap 3→4 even by direct request',
  async (grade) => {
    const { student, klass, first, second, fourth, authorization } = await fixture(grade)
    const id = student._id.toString(), classId = klass._id.toString()
    const before = await ProgressService.getForStudent(id, classId)
    const state = (levelId: string) => before.levels.find((p) => p.levelId.toString() === levelId)?.status
    expect(state(first.level._id.toString())).toBe('unlocked')
    expect(state(second.level._id.toString())).toBe('locked')
    expect(state(fourth.level._id.toString())).toBe('locked')

    const next = await request(app).get('/api/students/me/next-lesson')
      .set('Authorization', authorization).expect(200)
    expect(next.body.data).toMatchObject({ lessonId: first.lesson._id.toString(), complete: false })

    await request(app).get('/api/students/me/lessons/' + second.lesson._id)
      .set('Authorization', authorization).expect(400)
    await request(app).get('/api/students/me/lessons/' + fourth.lesson._id)
      .set('Authorization', authorization).expect(400)

    // Neither a forged deep-link nor direct answer submission unlocks future levels.
    await expect(ProgressService.submitAttempt({
      studentId: id, activityId: second.activity._id.toString(),
      answer: 'YES', startedAt: new Date(Date.now() - 1000), hintsUsed: 0,
    })).rejects.toThrow(/previous published level/i)

    await ProgressService.submitAttempt({
      studentId: id, activityId: first.activity._id.toString(),
      answer: 'YES', startedAt: new Date(Date.now() - 1000), hintsUsed: 0,
      idempotencyKey: 'first-' + grade,
    })
    const afterFirst = await ProgressService.getForStudent(id, classId)
    expect(afterFirst.levels.find((p) => p.levelId.equals(first.level._id))?.status).toBe('completed')
    expect(afterFirst.levels.find((p) => p.levelId.equals(second.level._id))?.status).toBe('unlocked')
    expect(afterFirst.levels.find((p) => p.levelId.equals(fourth.level._id))?.status).toBe('locked')
    const resumed = await StudentLessonFastService.next(id)
    expect(resumed).toMatchObject({ lessonId: second.lesson._id.toString(), complete: false })

    await ProgressService.submitAttempt({
      studentId: id, activityId: second.activity._id.toString(),
      answer: 'YES', startedAt: new Date(Date.now() - 1000), hintsUsed: 0,
      idempotencyKey: 'second-' + grade,
    })
    const afterSecond = await ProgressService.getForStudent(id, classId)
    expect(afterSecond.levels.find((p) => p.levelId.equals(second.level._id))?.status).toBe('completed')
    expect(afterSecond.levels.find((p) => p.levelId.equals(fourth.level._id))?.status).toBe('locked')
    const waiting = await StudentLessonFastService.next(id)
    expect(waiting).toMatchObject({ lessonId: null, complete: false, blocked: true })
    await request(app).get('/api/students/me/lessons/' + fourth.lesson._id)
      .set('Authorization', authorization).expect(400)
    expect((await Progress.findOne({ studentId: student._id, classId: klass._id }))?.levels
      .find((p) => p.levelId.equals(fourth.level._id))?.status).toBe('locked')
  },
)

it('a published lesson with no required activities never self-completes to unlock the next class level', async () => {
  const { student, klass, second } = await fixture(2)
  await Activity.deleteMany({ lessonId: (await Lesson.findOne({ levelId: (await Level.findOne({ classId: klass._id, number: 1 }))?._id }))?._id })
  const saved = await ProgressService.getForStudent(student._id.toString(), klass._id.toString())
  expect(saved.levels.find((p) => p.levelId.equals(second.level._id))?.status).toBe('locked')
})
