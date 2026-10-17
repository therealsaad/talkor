jest.mock('../../src/models/Student', () => ({
  Student: { create: jest.fn(), exists: jest.fn(), findById: jest.fn(), findOne: jest.fn() },
}))
jest.mock('../../src/models/Teacher', () => ({ Teacher: { exists: jest.fn() } }))
jest.mock('../../src/models/School', () => ({ School: { findOne: jest.fn() } }))
jest.mock('../../src/models/CurriculumClass', () => ({ CurriculumClass: { findOne: jest.fn() } }))
jest.mock('../../src/models/Level', () => ({ Level: { exists: jest.fn() } }))
jest.mock('../../src/utils/student-pin', () => ({ newUniquePin: jest.fn(), pinLookup: jest.fn() }))
jest.mock('../../src/utils/password', () => ({ hashPassword: jest.fn(), comparePassword: jest.fn() }))
jest.mock('../../src/utils/jwt', () => ({ signToken: jest.fn() }))

import { Student } from '../../src/models/Student'
import { School } from '../../src/models/School'
import { CurriculumClass } from '../../src/models/CurriculumClass'
import { Level } from '../../src/models/Level'
import { createStudentSchema } from '../../src/schemas/student.schema'
import { StudentService } from '../../src/services/student.service'
import { AuthService } from '../../src/services/auth.service'
import { CurriculumAccessService } from '../../src/services/curriculum-access.service'
import { newUniquePin, pinLookup } from '../../src/utils/student-pin'
import { comparePassword, hashPassword } from '../../src/utils/password'
import { signToken } from '../../src/utils/jwt'

const schoolId = 'school-1'
const studentId = 'student-kg-1'
const kgClass = { _id: { toString: () => 'curriculum-kg' }, grade: 0, name: 'Kindergarten (KG)', order: 0, status: 'active' as const }

describe('safe KG Grade 0 student access', () => {
  beforeEach(() => jest.clearAllMocks())

  it('accepts Grade 0 in student creation validation', () => {
    const result = createStudentSchema.safeParse({
      body: { fullName: 'KG Tester', rollNumber: 'kg-test-1', grade: 0, className: 'KG-A', avatarType: 'GIRL' },
    })
    expect(result.success).toBe(true)
  })

  it('retries a PIN collision and creates a KG student with a unique five-digit PIN', async () => {
    const firstDuplicate = Object.assign(new Error('duplicate key'), { code: 11000, keyPattern: { pinLookup: 1 } })
    ;(newUniquePin as jest.Mock)
      .mockResolvedValueOnce({ pin: '12345', digest: 'digest-a' })
      .mockResolvedValueOnce({ pin: '24680', digest: 'digest-b' })
    ;(hashPassword as jest.Mock).mockResolvedValue('hashed-pin')
    ;(Student.create as jest.Mock)
      .mockRejectedValueOnce(firstDuplicate)
      .mockResolvedValueOnce({ _id: studentId, grade: 0, fullName: 'KG Tester' })

    const result = await StudentService.create(schoolId, {
      fullName: 'KG Tester', rollNumber: 'kg-test-1', grade: 0, className: 'KG-A', avatarType: 'GIRL',
    })

    expect(result.student.grade).toBe(0)
    expect(result.studentCode).toMatch(/^\d{5}$/)
    expect(result.studentCode).toBe('24680')
    expect(Student.create).toHaveBeenCalledTimes(2)
    expect(Student.create).toHaveBeenLastCalledWith(expect.objectContaining({
      schoolId, grade: 0, passwordHash: 'hashed-pin', pinLookup: 'digest-b',
    }))
  })

  it('maps a Grade 0 student to the active KG curriculum by persisted grade', async () => {
    const learner = { _id: studentId, grade: 0, schoolId, status: 'active', className: 'KG-A', fullName: 'KG Tester' }
    ;(Student.findById as jest.Mock).mockReturnValue({
      select: () => ({ lean: async () => learner }),
    })
    ;(CurriculumClass.findOne as jest.Mock).mockReturnValue({ lean: async () => kgClass })
    ;(Level.exists as jest.Mock).mockResolvedValue({ _id: 'published-kg-level' })

    const result = await CurriculumAccessService.context(studentId)

    expect(CurriculumClass.findOne).toHaveBeenCalledWith({ grade: 0, status: 'active' })
    expect(Level.exists).toHaveBeenCalledWith({ classId: kgClass._id, status: 'active', availability: 'PUBLISHED' })
    expect(result.curriculumClass.grade).toBe(0)
  })

  it('logs in a KG student by the issued PIN and keeps Grade 0 in the authenticated student session', async () => {
    const loggedInStudent = {
      _id: studentId,
      schoolId: { toString: () => schoolId },
      grade: 0,
      className: 'KG-A',
      fullName: 'KG Tester',
      rollNumber: 'kg-test-1',
      avatarType: 'GIRL',
      authVersion: 0,
      status: 'active',
      save: jest.fn().mockResolvedValue(undefined),
    }
    ;(pinLookup as jest.Mock).mockReturnValue('pin-digest')
    ;(comparePassword as jest.Mock).mockResolvedValue(true)
    ;(signToken as jest.Mock).mockReturnValue('student-session-token')
    ;(Student.findOne as jest.Mock).mockReturnValue({ select: async () => loggedInStudent })
    ;(School.findOne as jest.Mock).mockReturnValue({ select: async () => ({ _id: { toString: () => schoolId }, name: 'Test School', code: 'SCHOOL1' }) })

    const result = await AuthService.loginStudentByPin('24680')

    expect(Student.findOne).toHaveBeenCalledWith({ pinLookup: 'pin-digest', status: 'active' })
    expect(result.student.grade).toBe(0)
    expect(result.token).toBe('student-session-token')
  })

  it('explains when KG curriculum has not been published', async () => {
    const learner = { _id: studentId, grade: 0, schoolId, status: 'active', className: 'KG-A', fullName: 'KG Tester' }
    ;(Student.findById as jest.Mock).mockReturnValue({
      select: () => ({ lean: async () => learner }),
    })
    ;(CurriculumClass.findOne as jest.Mock).mockReturnValue({ lean: async () => kgClass })
    ;(Level.exists as jest.Mock).mockResolvedValue(null)

    await expect(CurriculumAccessService.context(studentId)).rejects.toMatchObject({
      statusCode: 422,
      message: expect.stringMatching(/curriculum has not been published/i),
    })
  })
})
