jest.mock('../../src/models/Student', () => ({ Student: { findOne: jest.fn() } }))
jest.mock('../../src/models/CurriculumClass', () => ({ CurriculumClass: { findById: jest.fn() } }))
jest.mock('../../src/services/student-curriculum.service', () => ({
  StudentCurriculumService: { get: jest.fn() },
}))
jest.mock('../../src/services/student.service', () => ({ StudentService: { create: jest.fn() } }))
jest.mock('../../src/services/curriculum.service', () => ({
  CurriculumService: {
    listClasses: jest.fn(),
    getClass: jest.fn(),
    listLevels: jest.fn(),
    getLevel: jest.fn(),
    getLesson: jest.fn(),
    listActivitiesForTeacher: jest.fn(),
  },
}))

import request from 'supertest'
import { createApp } from '../../src/app'
import { Student } from '../../src/models/Student'
import { StudentCurriculumService } from '../../src/services/student-curriculum.service'
import { StudentService } from '../../src/services/student.service'
import { CurriculumService } from '../../src/services/curriculum.service'
import { CurriculumClass } from '../../src/models/CurriculumClass'
import { ApiError } from '../../src/utils/ApiError'
import { signToken } from '../../src/utils/jwt'

const app = createApp()
const schoolId = 'school-http-test'

function token(role: 'SCHOOL_ADMIN' | 'TEACHER' | 'STUDENT') {
  return signToken({ sub: `${role.toLowerCase()}-http-test`, schoolId, role, sv: 0 })
}

describe('curriculum HTTP authorization and error contract', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(Student.findOne as jest.Mock).mockReturnValue({
      select: () => ({ lean: async () => ({ authVersion: 0 }) }),
    })
  })

  it('preserves the original authenticated curriculum HTTP status and message', async () => {
    ;(StudentCurriculumService.get as jest.Mock).mockRejectedValue(
      ApiError.businessRule('The Kindergarten (KG) curriculum has not been published yet.'),
    )

    const response = await request(app)
      .get('/api/students/me/curriculum')
      .set('Authorization', `Bearer ${token('STUDENT')}`)

    expect(response.status).toBe(422)
    expect(response.body.error).toMatchObject({
      code: 'BUSINESS_RULE_ERROR',
      message: expect.stringMatching(/Kindergarten.*not been published/i),
    })
  })

  it('requires student authentication before reading personal curriculum', async () => {
    const response = await request(app).get('/api/students/me/curriculum')

    expect(response.status).toBe(401)
    expect(StudentCurriculumService.get).not.toHaveBeenCalled()
  })

  it('allows a school admin to create a Grade 0 student through the normal PIN flow', async () => {
    ;(StudentService.create as jest.Mock).mockResolvedValue({
      student: { id: 'new-kg-student', grade: 0 },
      studentCode: '48261',
    })

    const response = await request(app)
      .post('/api/students')
      .set('Authorization', `Bearer ${token('SCHOOL_ADMIN')}`)
      .send({ fullName: 'KG Preview Learner', rollNumber: 'kg-preview-1', grade: 0, className: 'KG-Test', avatarType: 'GIRL' })

    expect(response.status).toBe(201)
    expect(response.body.data.studentCode).toMatch(/^\d{5}$/)
  })

  it('does not let a teacher create a Grade 0 preview student', async () => {
    const response = await request(app)
      .post('/api/students')
      .set('Authorization', `Bearer ${token('TEACHER')}`)
      .send({ fullName: 'KG Preview Learner', rollNumber: 'kg-preview-2', grade: 0, className: 'KG-Test', avatarType: 'GIRL' })

    expect(response.status).toBe(403)
    expect(StudentService.create).not.toHaveBeenCalled()
  })

  it('keeps KG curriculum preview out of teacher class listings', async () => {
    ;(CurriculumService.listClasses as jest.Mock).mockResolvedValue([
      { _id: 'kg-class', grade: 0, name: 'Kindergarten (KG)' },
      { _id: 'class-4', grade: 4, name: 'Class 4' },
    ])

    const response = await request(app)
      .get('/api/classes')
      .set('Authorization', `Bearer ${token('TEACHER')}`)

    expect(response.status).toBe(200)
    expect(response.body.data.map((item: { grade: number }) => item.grade)).toEqual([4])
  })

  it('blocks direct teacher access to KG levels even when the class id is known', async () => {
    ;(CurriculumClass.findById as jest.Mock).mockReturnValue({
      select: () => ({ lean: async () => ({ grade: 0 }) }),
    })

    const response = await request(app)
      .get('/api/classes/kg-class/levels')
      .set('Authorization', `Bearer ${token('TEACHER')}`)

    expect(response.status).toBe(403)
    expect(CurriculumService.listLevels).not.toHaveBeenCalled()
  })

  it('blocks direct teacher access to KG lesson activities before returning answer data', async () => {
    ;(CurriculumService.getLesson as jest.Mock).mockResolvedValue({ levelId: 'kg-level' })
    ;(CurriculumService.getLevel as jest.Mock).mockResolvedValue({ classId: 'kg-class' })
    ;(CurriculumClass.findById as jest.Mock).mockReturnValue({
      select: () => ({ lean: async () => ({ grade: 0 }) }),
    })

    const response = await request(app)
      .get('/api/lessons/kg-lesson/activities')
      .set('Authorization', `Bearer ${token('TEACHER')}`)

    expect(response.status).toBe(403)
    expect(CurriculumService.listActivitiesForTeacher).not.toHaveBeenCalled()
  })
})
