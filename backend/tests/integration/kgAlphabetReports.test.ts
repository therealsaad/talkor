import { afterAll, afterEach, beforeAll, expect, it } from '@jest/globals'
import request from 'supertest'
import { createApp } from '../../src/app'
import { KGAlphabetAttempt } from '../../src/models/KGAlphabetAttempt'
import { KGAlphabetProgress } from '../../src/models/KGAlphabetProgress'
import { School } from '../../src/models/School'
import { Student } from '../../src/models/Student'
import { Teacher } from '../../src/models/Teacher'
import { signToken } from '../../src/utils/jwt'
import { clearTestDatabase, connectTestDatabase, disconnectTestDatabase } from './dbTestUtils'

const app = createApp()

beforeAll(connectTestDatabase)
afterAll(disconnectTestDatabase)
afterEach(clearTestDatabase)

function bearer(sub: string, schoolId: string, role: 'SCHOOL_ADMIN' | 'TEACHER') {
  return `Bearer ${signToken({ sub, schoolId, role })}`
}

it('reports active and replay time, and scopes KG data to the teacher assignment and school', async () => {
  const school = await School.create({ name: 'Report School', code: 'KGREP01', passwordHash: 'hash', status: 'active' })
  const otherSchool = await School.create({ name: 'Other Report School', code: 'KGREP02', passwordHash: 'hash', status: 'active' })
  const teacher = await Teacher.create({ schoolId: school._id, name: 'Assigned Teacher', email: 'assigned@example.test', passwordHash: 'hash' })
  const otherTeacher = await Teacher.create({ schoolId: school._id, name: 'Other Teacher', email: 'other@example.test', passwordHash: 'hash' })
  const otherSchoolTeacher = await Teacher.create({ schoolId: otherSchool._id, name: 'Other School Teacher', email: 'school@example.test', passwordHash: 'hash' })
  const student = await Student.create({ schoolId: school._id, teacherId: teacher._id, fullName: 'Asha Learner', rollNumber: 'report-1', grade: 0, passwordHash: 'hash', avatarType: 'GIRL', status: 'active' })
  const teammate = await Student.create({ schoolId: school._id, teacherId: otherTeacher._id, fullName: 'Schoolmate', rollNumber: 'report-2', grade: 0, passwordHash: 'hash', avatarType: 'BOY', status: 'active' })
  const outsider = await Student.create({ schoolId: otherSchool._id, teacherId: otherSchoolTeacher._id, fullName: 'Private Student', rollNumber: 'report-3', grade: 0, passwordHash: 'hash', avatarType: 'GIRL', status: 'active' })
  await KGAlphabetProgress.create({ studentId: student._id, schoolId: school._id, currentIndex: 2, introSeen: true })
  await KGAlphabetAttempt.create([
    { studentId: student._id, schoolId: school._id, activityId: 'say-a', letter: 'A', mode: 'speak', outcome: 'correct', replay: false, timeSpentMs: 3000, submissionId: 'report-correct-123' },
    { studentId: student._id, schoolId: school._id, activityId: 'say-a', letter: 'A', mode: 'speak', outcome: 'incorrect', replay: false, timeSpentMs: 6000, submissionId: 'report-wrong-1234' },
    { studentId: student._id, schoolId: school._id, activityId: 'say-a', letter: 'A', mode: 'speak', outcome: 'unclear', replay: true, timeSpentMs: 5000, submissionId: 'report-unclear-123' },
    { studentId: teammate._id, schoolId: school._id, activityId: 'say-b', letter: 'B', mode: 'speak', outcome: 'correct', replay: false, timeSpentMs: 2000, submissionId: 'schoolmate-correct-12' },
    { studentId: outsider._id, schoolId: otherSchool._id, activityId: 'say-c', letter: 'C', mode: 'speak', outcome: 'correct', replay: false, timeSpentMs: 9000, submissionId: 'outsider-correct-123' },
  ])

  const teacherAuthorization = bearer(teacher._id.toString(), school._id.toString(), 'TEACHER')
  const teacherList = await request(app).get('/api/kg-alphabet/reports').set('Authorization', teacherAuthorization).expect(200)
  expect(teacherList.body.data.totalStudents).toBe(1)
  expect(teacherList.body.data.students).toEqual([expect.objectContaining({ studentId: student._id.toString(), timeSpentMs: 14000, replayTimeSpentMs: 5000, attempts: 3, accuracy: 50 })])

  const detail = await request(app).get(`/api/kg-alphabet/reports/${student._id}`).set('Authorization', teacherAuthorization).expect(200)
  expect(detail.body.data).toMatchObject({ totalAttempts: 3, timeSpentMs: 14000, replayTimeSpentMs: 5000, currentIndex: 2 })
  expect(detail.body.data.letters.find((item: { letter: string }) => item.letter === 'A')).toMatchObject({ attempts: 3, correct: 1, retries: 1, unclear: 1, accuracy: 50, timeSpentMs: 14000, replayTimeSpentMs: 5000 })
  await request(app).get(`/api/kg-alphabet/reports/${teammate._id}`).set('Authorization', teacherAuthorization).expect(403)

  const adminAuthorization = bearer(school._id.toString(), school._id.toString(), 'SCHOOL_ADMIN')
  const adminList = await request(app).get('/api/kg-alphabet/reports').set('Authorization', adminAuthorization).expect(200)
  expect(adminList.body.data.totalStudents).toBe(2)
  expect(adminList.body.data.students.map((item: { studentId: string }) => item.studentId)).toContain(teammate._id.toString())
  await request(app).get(`/api/kg-alphabet/reports/${outsider._id}`).set('Authorization', adminAuthorization).expect(404)
})
