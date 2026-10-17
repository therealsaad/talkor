import { Types } from 'mongoose'
import { Student } from '../../src/models/Student'
import { CurriculumClass } from '../../src/models/CurriculumClass'
import { createStudentSchema, listStudentsQuerySchema, updateStudentSchema } from '../../src/schemas/student.schema'

describe('Grade 0 model and validation support', () => {
  it('accepts Grade 0 on the student and curriculum class models without a database connection', () => {
    const student = new Student({
      schoolId: new Types.ObjectId(),
      fullName: 'KG Learner',
      rollNumber: 'kg-01',
      passwordHash: 'not-a-real-password-hash',
      grade: 0,
      avatarType: 'GIRL',
    })
    const curriculumClass = new CurriculumClass({ grade: 0, name: 'Kindergarten (KG)', order: 0, status: 'active' })

    expect(student.validateSync()).toBeUndefined()
    expect(curriculumClass.validateSync()).toBeUndefined()
    expect(Student.schema.path('grade').options.min).toBe(0)
    expect(CurriculumClass.schema.path('grade').options.min).toBe(0)
    const pinIndex = Student.schema.indexes().find(([keys]) => keys.pinLookup === 1)
    expect(pinIndex?.[1].unique).toBe(true)
  })

  it('accepts Grade 0 in create, update and list filters while still rejecting an out-of-range grade', () => {
    const student = { fullName: 'KG Learner', rollNumber: 'kg-01', grade: 0, avatarType: 'GIRL' }

    expect(createStudentSchema.safeParse({ body: student }).success).toBe(true)
    expect(updateStudentSchema.safeParse({ body: { grade: 0 }, params: { id: 'student-1' } }).success).toBe(true)
    expect(listStudentsQuerySchema.safeParse({ query: { grade: '0' } }).success).toBe(true)
    expect(createStudentSchema.safeParse({ body: { ...student, grade: 11 } }).success).toBe(false)
  })
})
