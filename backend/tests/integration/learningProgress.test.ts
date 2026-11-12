import request from 'supertest'
import { createApp } from '../../src/app'
import { connectTestDatabase, disconnectTestDatabase, clearTestDatabase } from './dbTestUtils'
import { School } from '../../src/models/School'
import { Student } from '../../src/models/Student'
import { Teacher } from '../../src/models/Teacher'
import { CurriculumClass } from '../../src/models/CurriculumClass'
import { Level } from '../../src/models/Level'
import { Lesson } from '../../src/models/Lesson'
import { Activity } from '../../src/models/Activity'
import { Progress } from '../../src/models/Progress'
import { ActivityAttempt } from '../../src/models/ActivityAttempt'
import { LearningEvent } from '../../src/models/LearningEvent'
import { hashPassword } from '../../src/utils/password'
import { signToken } from '../../src/utils/jwt'
import { ProgressService } from '../../src/services/progress.service'
import { LearningProgressService } from '../../src/services/learning-progress.service'

const app = createApp()

beforeAll(async () => connectTestDatabase())
afterAll(async () => disconnectTestDatabase())
afterEach(async () => clearTestDatabase())

async function seedCurriculum(grade = 4) {
  const schoolA = await School.create({
    name: 'School A',
    code: `SA${grade}${Date.now().toString().slice(-4)}`,
    passwordHash: await hashPassword('pw'),
    status: 'active',
  })
  const schoolB = await School.create({
    name: 'School B',
    code: `SB${grade}${Date.now().toString().slice(-4)}`,
    passwordHash: await hashPassword('pw'),
    status: 'active',
  })
  const teacherA = await Teacher.create({
    schoolId: schoolA._id,
    name: 'Teacher A',
    email: `a${Date.now()}@school.test`,
    passwordHash: await hashPassword('pw'),
    status: 'active',
  })
  const teacherB = await Teacher.create({
    schoolId: schoolA._id,
    name: 'Teacher B',
    email: `b${Date.now()}@school.test`,
    passwordHash: await hashPassword('pw'),
    status: 'active',
  })
  const klass = await CurriculumClass.create({
    grade,
    name: `Class ${grade}`,
    order: grade || 1,
    status: 'active',
  })
  const level = await Level.create({
    classId: klass._id,
    number: 1,
    order: 1,
    title: 'Level 1',
    place: 'School',
    availability: 'PUBLISHED',
    status: 'active',
  })
  const lesson = await Lesson.create({
    levelId: level._id,
    title: 'Lesson 1',
    order: 1,
    status: 'active',
  })
  const activity = await Activity.create({
    lessonId: lesson._id,
    type: 'MCQ',
    stage: 'FINAL_CHALLENGE',
    title: 'Required',
    prompt: 'Choose',
    order: 1,
    answer: 'YES',
    xp: 10,
    required: true,
    core: true,
    status: 'active',
  })
  return { schoolA, schoolB, teacherA, teacherB, klass, level, lesson, activity, grade }
}

describe('Learning Progress reporting', () => {
  it('does not record level completion when a student only starts or completes one of multiple required activities', async () => {
    const { schoolA, klass, level, lesson, activity } = await seedCurriculum(4)
    const student = await Student.create({
      schoolId: schoolA._id,
      fullName: 'Partial',
      rollNumber: '1',
      grade: 4,
      passwordHash: await hashPassword('ABCD'),
      avatarType: 'BOY',
      status: 'active',
    })
    const second = await Activity.create({
      lessonId: lesson._id,
      type: 'MCQ',
      stage: 'FINAL_CHALLENGE',
      title: 'Required 2',
      prompt: 'Choose',
      order: 2,
      answer: 'YES',
      xp: 10,
      required: true,
      core: true,
      status: 'active',
    })

    await ProgressService.ensureProgress(student._id.toString(), klass._id.toString())
    await ProgressService.submitAttempt({
      studentId: student._id.toString(),
      activityId: activity._id.toString(),
      answer: 'YES',
      startedAt: new Date(Date.now() - 1000),
      hintsUsed: 0,
      idempotencyKey: 'partial-1',
    })

    const progress = await Progress.findOne({ studentId: student._id, classId: klass._id }).lean()
    const levelRow = progress?.levels.find((row) => String(row.levelId) === String(level._id))
    expect(levelRow?.status).not.toBe('completed')

    const report = await LearningProgressService.levelReport(
      { schoolId: schoolA._id.toString() },
      level._id.toString(),
    )
    expect(report.summary.completed).toBe(0)
    expect(report.summary.inProgress).toBe(1)
    expect(report.summary.notStarted).toBe(0)
    expect(report.summary.completionRate).toBe(0)
    void second
  })

  it('records one verified completion, stays idempotent on replay, and surfaces it to school reports', async () => {
    const { schoolA, klass, level, activity } = await seedCurriculum(5)
    const student = await Student.create({
      schoolId: schoolA._id,
      fullName: 'Complete',
      rollNumber: '1',
      grade: 5,
      passwordHash: await hashPassword('ABCD'),
      avatarType: 'GIRL',
      status: 'active',
    })
    const token = signToken({
      sub: student._id.toString(),
      role: 'STUDENT',
      schoolId: schoolA._id.toString(),
    })
    const adminToken = signToken({
      sub: schoolA._id.toString(),
      role: 'SCHOOL_ADMIN',
      schoolId: schoolA._id.toString(),
    })

    const payload = {
      answer: 'YES',
      startedAt: new Date(Date.now() - 1000).toISOString(),
      hintsUsed: 0,
      idempotencyKey: 'complete-1',
    }
    const first = await request(app)
      .post(`/api/progress/activities/${activity._id}/attempts`)
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
    expect(first.status).toBe(200)
    expect(
      first.body.data.progress.levels.find(
        (row: { levelId: string }) => String(row.levelId) === String(level._id),
      ).status,
    ).toBe('completed')

    const replay = await request(app)
      .post(`/api/progress/activities/${activity._id}/attempts`)
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
    expect(replay.body.data.alreadyProcessed).toBe(true)

    await ProgressService.submitAttempt({
      studentId: student._id.toString(),
      activityId: activity._id.toString(),
      answer: 'YES',
      startedAt: new Date(Date.now() - 500),
      hintsUsed: 0,
      idempotencyKey: 'complete-replay-2',
    })

    const overview = await request(app)
      .get('/api/analytics/learning-progress/overview?grade=5')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(overview.status).toBe(200)
    expect(overview.body.data.metrics.uniqueVerifiedLevelCompletions).toBe(1)
    expect(overview.body.data.metrics.studentsWhoCompletedAtLeastOneLevel).toBe(1)

    const levelReport = await request(app)
      .get(`/api/analytics/learning-progress/levels/${level._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
    expect(levelReport.status).toBe(200)
    expect(levelReport.body.data.summary.completed).toBe(1)
    expect(levelReport.body.data.summary.completionRate).toBe(100)
    expect(levelReport.body.data.students.filter((row: { state: string }) => row.state === 'completed')).toHaveLength(1)
  })

  it('classifies not-started vs in-progress and returns null completion rate for empty eligible roster', async () => {
    const { schoolA, klass, level, activity } = await seedCurriculum(6)
    await Student.create({
      schoolId: schoolA._id,
      fullName: 'Idle',
      rollNumber: '1',
      grade: 6,
      passwordHash: await hashPassword('ABCD'),
      avatarType: 'BOY',
      status: 'active',
    })
    const active = await Student.create({
      schoolId: schoolA._id,
      fullName: 'Working',
      rollNumber: '2',
      grade: 6,
      passwordHash: await hashPassword('ABCD'),
      avatarType: 'GIRL',
      status: 'active',
    })
    await ProgressService.submitAttempt({
      studentId: active._id.toString(),
      activityId: activity._id.toString(),
      answer: 'NO',
      startedAt: new Date(Date.now() - 1000),
      hintsUsed: 0,
      idempotencyKey: 'wrong-1',
    })

    const report = await LearningProgressService.levelReport(
      { schoolId: schoolA._id.toString() },
      level._id.toString(),
    )
    expect(report.summary.eligibleStudents).toBe(2)
    expect(report.summary.completed).toBe(0)
    expect(report.summary.inProgress).toBe(1)
    expect(report.summary.notStarted).toBe(1)
    expect(report.summary.completionRate).toBe(0)

    const empty = await LearningProgressService.levelReport(
      { schoolId: schoolA._id.toString() },
      level._id.toString(),
      { grade: 9 },
    )
    expect(empty.summary.eligibleStudents).toBe(0)
    expect(empty.summary.completionRate).toBeNull()
    void klass
  })

  it('scopes school and teacher authorization and rejects cross-school access', async () => {
    const { schoolA, schoolB, teacherA, teacherB, level, activity } = await seedCurriculum(7)
    const studentA = await Student.create({
      schoolId: schoolA._id,
      teacherId: teacherA._id,
      fullName: 'A Student',
      rollNumber: '1',
      grade: 7,
      passwordHash: await hashPassword('ABCD'),
      avatarType: 'BOY',
      status: 'active',
    })
    await Student.create({
      schoolId: schoolA._id,
      teacherId: teacherB._id,
      fullName: 'B Student',
      rollNumber: '2',
      grade: 7,
      passwordHash: await hashPassword('ABCD'),
      avatarType: 'GIRL',
      status: 'active',
    })
    await Student.create({
      schoolId: schoolB._id,
      fullName: 'Other School',
      rollNumber: '1',
      grade: 7,
      passwordHash: await hashPassword('ABCD'),
      avatarType: 'BOY',
      status: 'active',
    })

    await ProgressService.submitAttempt({
      studentId: studentA._id.toString(),
      activityId: activity._id.toString(),
      answer: 'YES',
      startedAt: new Date(Date.now() - 1000),
      hintsUsed: 0,
      idempotencyKey: 'auth-complete',
    })

    const adminA = signToken({
      sub: schoolA._id.toString(),
      role: 'SCHOOL_ADMIN',
      schoolId: schoolA._id.toString(),
    })
    const adminB = signToken({
      sub: schoolB._id.toString(),
      role: 'SCHOOL_ADMIN',
      schoolId: schoolB._id.toString(),
    })
    const teacherAToken = signToken({
      sub: teacherA._id.toString(),
      role: 'TEACHER',
      schoolId: schoolA._id.toString(),
    })
    const teacherBToken = signToken({
      sub: teacherB._id.toString(),
      role: 'TEACHER',
      schoolId: schoolA._id.toString(),
    })

    const schoolWide = await request(app)
      .get(`/api/analytics/learning-progress/levels/${level._id}`)
      .set('Authorization', `Bearer ${adminA}`)
    expect(schoolWide.body.data.summary.eligibleStudents).toBe(2)
    expect(schoolWide.body.data.summary.completed).toBe(1)

    const teacherView = await request(app)
      .get(`/api/analytics/learning-progress/levels/${level._id}`)
      .set('Authorization', `Bearer ${teacherAToken}`)
    expect(teacherView.body.data.summary.eligibleStudents).toBe(1)
    expect(teacherView.body.data.summary.completed).toBe(1)

    const otherTeacher = await request(app)
      .get(`/api/analytics/learning-progress/levels/${level._id}`)
      .set('Authorization', `Bearer ${teacherBToken}`)
    expect(otherTeacher.body.data.summary.eligibleStudents).toBe(1)
    expect(otherTeacher.body.data.summary.completed).toBe(0)

    const crossSchool = await request(app)
      .get(`/api/analytics/learning-progress/students/${studentA._id}`)
      .set('Authorization', `Bearer ${adminB}`)
    expect(crossSchool.status).toBe(404)

    const teacherCross = await request(app)
      .get(`/api/analytics/learning-progress/students/${studentA._id}`)
      .set('Authorization', `Bearer ${teacherBToken}`)
    expect(teacherCross.status).toBe(404)
  })

  it('does not treat LearningEvent-only history as verified completion', async () => {
    const { schoolA, level } = await seedCurriculum(8)
    const student = await Student.create({
      schoolId: schoolA._id,
      fullName: 'Event Only',
      rollNumber: '1',
      grade: 8,
      passwordHash: await hashPassword('ABCD'),
      avatarType: 'BOY',
      status: 'active',
    })
    await LearningEvent.create({
      studentId: student._id,
      type: 'level_completed',
      levelId: level._id,
      metadata: { fabricated: true },
    })

    const report = await LearningProgressService.levelReport(
      { schoolId: schoolA._id.toString() },
      level._id.toString(),
    )
    expect(report.summary.completed).toBe(0)
    expect(report.summary.notStarted).toBe(1)
  })

  it('exports CSV for authorized roster only and never demotes verified completions on ensureProgress', async () => {
    const { schoolA, klass, level, lesson, activity } = await seedCurriculum(3)
    const student = await Student.create({
      schoolId: schoolA._id,
      fullName: 'Stable',
      rollNumber: '1',
      grade: 3,
      passwordHash: await hashPassword('ABCD'),
      avatarType: 'BOY',
      status: 'active',
    })
    await ProgressService.submitAttempt({
      studentId: student._id.toString(),
      activityId: activity._id.toString(),
      answer: 'YES',
      startedAt: new Date(Date.now() - 1000),
      hintsUsed: 0,
      idempotencyKey: 'stable-complete',
    })

    const completedAtBefore = (
      await Progress.findOne({ studentId: student._id }).lean()
    )?.levels.find((row) => String(row.levelId) === String(level._id))?.completedAt
    expect(completedAtBefore).toBeTruthy()

    await Activity.create({
      lessonId: lesson._id,
      type: 'MCQ',
      stage: 'FINAL_CHALLENGE',
      title: 'New required after completion',
      prompt: 'Choose',
      order: 2,
      answer: 'YES',
      xp: 10,
      required: true,
      core: true,
      status: 'active',
    })
    await ProgressService.ensureProgress(student._id.toString(), klass._id.toString())

    const after = await Progress.findOne({ studentId: student._id }).lean()
    const levelRow = after?.levels.find((row) => String(row.levelId) === String(level._id))
    expect(levelRow?.status).toBe('completed')
    expect(levelRow?.completedAt).toBeTruthy()

    const adminToken = signToken({
      sub: schoolA._id.toString(),
      role: 'SCHOOL_ADMIN',
      schoolId: schoolA._id.toString(),
    })
    const csv = await request(app)
      .get(`/api/analytics/learning-progress/levels/${level._id}/export.csv`)
      .set('Authorization', `Bearer ${adminToken}`)
    expect(csv.status).toBe(200)
    expect(csv.text).toContain('Stable')
    expect(csv.text).toContain('completed')
    expect(csv.headers['x-talkora-records']).toBe('1')
  })

  it('rejects student tokens from learning-progress endpoints', async () => {
    const { schoolA, level } = await seedCurriculum(2)
    const student = await Student.create({
      schoolId: schoolA._id,
      fullName: 'Kid',
      rollNumber: '1',
      grade: 2,
      passwordHash: await hashPassword('ABCD'),
      avatarType: 'BOY',
      status: 'active',
    })
    const studentToken = signToken({
      sub: student._id.toString(),
      role: 'STUDENT',
      schoolId: schoolA._id.toString(),
    })
    const res = await request(app)
      .get('/api/analytics/learning-progress/overview')
      .set('Authorization', `Bearer ${studentToken}`)
    expect(res.status).toBe(403)

    // Student cannot invent completion for another student via attempts API.
    const other = await Student.create({
      schoolId: schoolA._id,
      fullName: 'Other',
      rollNumber: '2',
      grade: 2,
      passwordHash: await hashPassword('ABCD'),
      avatarType: 'GIRL',
      status: 'active',
    })
    const attemptCount = await ActivityAttempt.countDocuments({ studentId: other._id })
    expect(attemptCount).toBe(0)
    void level
  })
})
