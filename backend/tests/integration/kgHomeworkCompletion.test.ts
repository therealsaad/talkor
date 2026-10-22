import { afterAll, afterEach, beforeAll, expect, it } from '@jest/globals'
import request from 'supertest'
import { createApp } from '../../src/app'
import { KGAlphabetProgress } from '../../src/models/KGAlphabetProgress'
import { KGAlphabetAttempt } from '../../src/models/KGAlphabetAttempt'
import { School } from '../../src/models/School'
import { Student } from '../../src/models/Student'
import { signToken } from '../../src/utils/jwt'
import { clearTestDatabase, connectTestDatabase, disconnectTestDatabase } from './dbTestUtils'

const app = createApp()
beforeAll(connectTestDatabase)
afterAll(disconnectTestDatabase)
afterEach(clearTestDatabase)

async function studentFixture() {
  const school = await School.create({ name: 'Homework School', code: 'KGHWORK1', passwordHash: 'hash', status: 'active' })
  const student = await Student.create({ schoolId: school._id, fullName: 'KG Learner',
    rollNumber: 'hw-1', grade: 0, passwordHash: 'hash', avatarType: 'BOY', status: 'active', kgAlphabetPilotEnabled: true })
  const token = signToken({ sub: student._id.toString(), schoolId: school._id.toString(), role: 'STUDENT', sv: 0 })
  return { school, student, auth: `Bearer ${token}` }
}

it('repairs old completed KG1 records once and persists homework check-in across reloads', async () => {
  const { school, student, auth } = await studentFixture()
  await KGAlphabetProgress.create({ studentId: student._id, schoolId: school._id,
    currentIndex: 8, introSeen: true, xp: 0, stars: 0 })
  await KGAlphabetAttempt.create({ studentId: student._id, schoolId: school._id,
    activityId: 'find-d', letter: 'D', mode: 'touch', outcome: 'correct', replay: false,
    submissionId: 'old-final-success-abc123' })
  const first = await request(app).get('/api/kg-alphabet/state').set('Authorization', auth).expect(200)
  expect(first.body.data).toMatchObject({ completed: true, xp: 100, stars: 3,
    homework: { status: 'pending' }, level2Available: false })
  const checked = await request(app).post('/api/kg-alphabet/homework/complete')
    .set('Authorization', auth).send({ homeworkId: 'kg-abcd-picture-homework-v1' }).expect(200)
  expect(checked.body.data.homework.status).toBe('completed')
  expect(checked.body.data.homework.completedAt).toBeTruthy()
  const second = await request(app).post('/api/kg-alphabet/homework/complete')
    .set('Authorization', auth).send({ homeworkId: 'kg-abcd-picture-homework-v1' }).expect(200)
  expect(second.body.data.homework.completedAt).toBe(checked.body.data.homework.completedAt)
  const reloaded = await request(app).get('/api/kg-alphabet/state').set('Authorization', auth).expect(200)
  expect(reloaded.body.data).toMatchObject({ xp: 100, stars: 3, homework: { status: 'completed' } })
  expect(await KGAlphabetProgress.countDocuments({ studentId: student._id, schoolId: school._id })).toBe(1)
})

it('refuses to check in homework early, on the wrong assignment, or without student auth', async () => {
  const { school, student, auth } = await studentFixture()
  await KGAlphabetProgress.create({ studentId: student._id, schoolId: school._id,
    currentIndex: 3, introSeen: true })
  await request(app).post('/api/kg-alphabet/homework/complete').set('Authorization', auth)
    .send({ homeworkId: 'kg-abcd-picture-homework-v1' }).expect(409)
  await request(app).post('/api/kg-alphabet/homework/complete').set('Authorization', auth)
    .send({ homeworkId: 'different-assignment' }).expect(400)
  await request(app).post('/api/kg-alphabet/homework/complete')
    .send({ homeworkId: 'kg-abcd-picture-homework-v1' }).expect(401)
  const saved = await KGAlphabetProgress.findOne({ studentId: student._id })
  expect(saved?.homeworkStatus).toBe('not-assigned')
})

it('loads one existing progress row after a student school change without a duplicate-key conflict', async () => {
  const { school: previousSchool, student } = await studentFixture()
  await KGAlphabetProgress.create({
    studentId: student._id, schoolId: previousSchool._id, currentIndex: 2, introSeen: true,
  })
  const currentSchool = await School.create({
    name: 'Current Homework School', code: 'KGHWORK2', passwordHash: 'hash', status: 'active',
  })
  await Student.updateOne({ _id: student._id }, { $set: { schoolId: currentSchool._id } })
  const token = signToken({ sub: student._id.toString(), schoolId: currentSchool._id.toString(), role: 'STUDENT', sv: 0 })

  const response = await request(app).get('/api/kg-alphabet/state')
    .set('Authorization', `Bearer ${token}`).expect(200)

  expect(response.body.data).toMatchObject({ currentIndex: 2, introSeen: true })
  expect(await KGAlphabetProgress.countDocuments({ studentId: student._id })).toBe(1)
  expect(await KGAlphabetProgress.findOne({ studentId: student._id }).then((row) => row?.schoolId.toString()))
    .toBe(currentSchool._id.toString())
})
