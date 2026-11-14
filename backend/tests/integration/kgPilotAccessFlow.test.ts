import request from 'supertest'
import { createApp } from '../../src/app'
import { KGAlphabetProgress } from '../../src/models/KGAlphabetProgress'
import { School } from '../../src/models/School'
import { Student } from '../../src/models/Student'
import { hashPassword } from '../../src/utils/password'
import { pinLookup } from '../../src/utils/student-pin'
import { signToken, verifyToken } from '../../src/utils/jwt'
import { logger } from '../../src/utils/logger'
import { clearTestDatabase, connectTestDatabase, disconnectTestDatabase } from './dbTestUtils'

const app = createApp()

beforeAll(() => connectTestDatabase())
afterAll(() => disconnectTestDatabase())
beforeEach(() => {
  jest.spyOn(process.stdout, 'write').mockImplementation(() => true)
})
afterEach(async () => {
  jest.restoreAllMocks()
  await clearTestDatabase()
})

it('persists admin approval and uses the PIN-authenticated student for KG state', async () => {
  const school = await School.create({
    name: 'KG Access Test School',
    code: 'KGAUTH1',
    passwordHash: 'test-hash',
    status: 'active',
  })
  const pin = '04268'
  const student = await Student.create({
    schoolId: school._id,
    fullName: 'KG Access Test Student',
    rollNumber: 'kg-access-1',
    grade: 0,
    status: 'active',
    passwordHash: await hashPassword(pin),
    pinLookup: pinLookup(pin),
    avatarType: 'BOY',
    kgAlphabetPilotEnabled: false,
  })
  const adminToken = signToken({
    sub: school._id.toString(),
    role: 'SCHOOL_ADMIN',
    schoolId: school._id.toString(),
  })

  const toggle = await request(app)
    .patch(`/api/students/${student._id.toString()}/kg-alphabet-pilot`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ enabled: true })
    .expect(200)
  expect(toggle.body).toEqual({
    success: true,
    data: { studentId: student._id.toString(), enabled: true },
  })

  const savedStudent = await Student.findById(student._id).select('kgAlphabetPilotEnabled')
  expect(savedStudent?.kgAlphabetPilotEnabled).toBe(true)

  const login = await request(app)
    .post('/api/auth/student/pin-login')
    .send({ pin })
    .expect(200)
  expect(login.body.data.student.id).toBe(student._id.toString())
  const studentToken = login.body.data.token as string
  const payload = verifyToken(studentToken)
  expect(payload.sub).toBe(student._id.toString())
  expect(payload.schoolId).toBe(school._id.toString())

  await request(app)
    .get('/api/kg-alphabet/state')
    .set('Authorization', `Bearer ${studentToken}`)
    .expect(200)
  const progress = await KGAlphabetProgress.findOne({ studentId: student._id }).lean()
  expect(progress?.studentId.toString()).toBe(student._id.toString())
  expect(progress?.schoolId.toString()).toBe(school._id.toString())
})

it('continues rejecting an unapproved student and logs only redacted eligibility booleans', async () => {
  const school = await School.create({
    name: 'KG Access Test School',
    code: 'KGAUTH2',
    passwordHash: 'test-hash',
    status: 'active',
  })
  const student = await Student.create({
    schoolId: school._id,
    fullName: 'Unapproved KG Test Student',
    rollNumber: 'kg-access-2',
    grade: 0,
    status: 'active',
    passwordHash: 'test-hash',
    avatarType: 'BOY',
    kgAlphabetPilotEnabled: false,
  })
  const token = signToken({
    sub: student._id.toString(),
    role: 'STUDENT',
    schoolId: school._id.toString(),
    sv: 0,
  })
  const warn = jest.spyOn(logger, 'warn').mockImplementation(() => undefined)

  const response = await request(app)
    .get('/api/kg-alphabet/state')
    .set('Authorization', `Bearer ${token}`)
    .expect(403)

  expect(response.body.error).toEqual({
    code: 'FORBIDDEN',
    message: 'KG Level 1 is not enabled for this student. Ask your school administrator to enable the ABCD pilot in Students.',
    details: undefined,
  })
  expect(warn).toHaveBeenCalledWith('KG alphabet student access denied', {
    studentRecordFound: true,
    studentRecordMatchesSession: true,
    schoolMatchesToken: true,
    gradeIsZero: true,
    statusIsActive: true,
    pilotFlagIsTrue: false,
    legacyPilotEligible: false,
  })
})
