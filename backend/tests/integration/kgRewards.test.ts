import request from 'supertest'
import { Types } from 'mongoose'
import { createApp } from '../../src/app'
import { KGAlphabetProgress } from '../../src/models/KGAlphabetProgress'
import { KGLevel2Progress } from '../../src/models/KGLevel2Progress'
import { KGContinuationProgress } from '../../src/models/KGContinuationProgress'
import { School } from '../../src/models/School'
import { Student } from '../../src/models/Student'
import { KGRewardsService } from '../../src/services/kg-rewards.service'
import { continuationLesson } from '../../src/kg/student-continuation-catalog'
import { signToken } from '../../src/utils/jwt'
import { clearTestDatabase, connectTestDatabase, disconnectTestDatabase } from './dbTestUtils'

const app = createApp()
beforeAll(connectTestDatabase)
afterAll(disconnectTestDatabase)
afterEach(clearTestDatabase)

async function makeStudent(name: string, grade = 0) {
  const school = await School.create({ name: 'KG Reward School', code: `KGR${name.slice(0, 3).toUpperCase()}`, passwordHash: 'hash', status: 'active' })
  const student = await Student.create({
    schoolId: school._id, fullName: name, rollNumber: name, grade,
    passwordHash: 'hash', avatarType: 'GIRL', status: 'active', kgAlphabetPilotEnabled: grade === 0,
  })
  const auth = 'Bearer ' + signToken({ sub: student._id.toString(), schoolId: school._id.toString(), role: 'STUDENT', sv: 0 })
  return { student, school, auth }
}

async function completeAllLevels(studentId: Types.ObjectId, schoolId: Types.ObjectId) {
  const completedAt = new Date()
  await KGAlphabetProgress.create({ studentId, schoolId, currentIndex: 8, completedAt })
  await KGLevel2Progress.create({ studentId, schoolId, currentIndex: 6, completedAt })
  await KGContinuationProgress.create([3, 4, 5].map((level) => ({
    studentId, schoolId, level,
    currentIndex: continuationLesson(level as 3 | 4 | 5).letters.length,
    completedAt,
  })))
}

it('grants and keeps exactly five stars and the Champion trophy for the authenticated owner', async () => {
  const first = await makeStudent('Aanya')
  await completeAllLevels(first.student._id, first.school._id)

  const response = await request(app).get('/api/kg-rewards/mine').set('Authorization', first.auth).expect(200)
  expect(response.body.data.totalStars).toBe(5)
  expect(response.body.data.newlyAwardedLevels).toEqual([1, 2, 3, 4, 5])
  expect(response.body.data.levels).toHaveLength(5)
  expect(response.body.data.levels.every((level: { completed: boolean; starEarned: boolean }) => level.completed && level.starEarned)).toBe(true)
  expect(response.body.data.championUnlocked).toBe(true)

  const repeated = await request(app).get('/api/kg-rewards/mine').set('Authorization', first.auth).expect(200)
  expect(repeated.body.data.newlyAwardedLevels).toEqual([])
  const saved = await KGAlphabetProgress.findOne({ studentId: first.student._id }).lean()
  expect(saved?.kgRewards).toHaveLength(5)
  expect(new Set(saved?.kgRewards.map((reward) => reward.level)).size).toBe(5)

  const second = await makeStudent('Vihaan')
  const other = await request(app).get('/api/kg-rewards/mine?studentId=' + first.student._id)
    .set('Authorization', second.auth).expect(200)
  expect(other.body.data.totalStars).toBe(0)
  expect(other.body.data.championUnlocked).toBe(false)
})

it('does not reward partial levels or a completed later record without its earlier levels', async () => {
  const { student, school, auth } = await makeStudent('Zoya')
  await KGAlphabetProgress.create({ studentId: student._id, schoolId: school._id, currentIndex: 7 })
  await KGLevel2Progress.create({ studentId: student._id, schoolId: school._id, currentIndex: 6, completedAt: new Date() })
  await KGContinuationProgress.create({ studentId: student._id, schoolId: school._id, level: 3, currentIndex: 5 })

  const response = await request(app).get('/api/kg-rewards/mine').set('Authorization', auth).expect(200)
  expect(response.body.data.totalStars).toBe(0)
  expect(response.body.data.championUnlocked).toBe(false)
  expect((await KGAlphabetProgress.findOne({ studentId: student._id }).lean())?.kgRewards).toHaveLength(0)
})

it('uses an atomic one-time write when completion and collection reads race', async () => {
  const { student, school } = await makeStudent('Ishaan')
  await KGAlphabetProgress.create({ studentId: student._id, schoolId: school._id, currentIndex: 8 })
  const results = await Promise.all(Array.from({ length: 8 }, () =>
    KGRewardsService.awardCompletedLevel(student._id, school._id, 1)))
  const saved = await KGAlphabetProgress.findOne({ studentId: student._id }).lean()
  expect(saved?.kgRewards).toHaveLength(1)
  expect(results.filter((result) => result.newlyAwardedLevels.includes(1))).toHaveLength(1)
})

it('does not expose KG rewards to another grade or allow frontend reward writes', async () => {
  const student = await makeStudent('Rohan', 4)
  await request(app).get('/api/kg-rewards/mine').set('Authorization', student.auth).expect(403)
  await request(app).post('/api/kg-rewards/mine').set('Authorization', student.auth).expect(404)
})

it('reports the same authenticated KG pilot eligibility rule without exposing rewards', async () => {
  const pilot = await makeStudent('PilotAccess')
  expect((await request(app).get('/api/kg-rewards/access').set('Authorization', pilot.auth).expect(200)).body.data)
    .toEqual({ eligible: true })

  await Student.updateOne({ _id: pilot.student._id }, { $set: { kgAlphabetPilotEnabled: false } })
  expect((await request(app).get('/api/kg-rewards/access').set('Authorization', pilot.auth).expect(200)).body.data)
    .toEqual({ eligible: false })
  await request(app).get('/api/kg-rewards/mine').set('Authorization', pilot.auth).expect(403)

  const otherGrade = await makeStudent('OtherGrade', 4)
  expect((await request(app).get('/api/kg-rewards/access').set('Authorization', otherGrade.auth).expect(200)).body.data)
    .toEqual({ eligible: false })
  await request(app).get('/api/kg-rewards/access').expect(401)
})
