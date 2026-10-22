import { isAuthorizedClass1DemoStudent } from '../../src/services/class1-demo-access'

const student = { id: '64b000000000000000000001', grade: 1, status: 'active' }

describe('Class 1 demo allowlist', () => {
  it('allows only the matching active Grade 1 student outside production', () => {
    expect(isAuthorizedClass1DemoStudent(student, {
      nodeEnv: 'development', enabled: 'true', studentId: student.id,
    })).toBe(true)
  })

  it('fails closed when disabled, mismatched, invalid, wrong-grade, or production', () => {
    expect(isAuthorizedClass1DemoStudent(student, {
      nodeEnv: 'development', enabled: 'false', studentId: student.id,
    })).toBe(false)
    expect(isAuthorizedClass1DemoStudent(student, {
      nodeEnv: 'development', enabled: 'true', studentId: '64b000000000000000000002',
    })).toBe(false)
    expect(isAuthorizedClass1DemoStudent(student, {
      nodeEnv: 'development', enabled: 'true', studentId: 'not-an-object-id',
    })).toBe(false)
    expect(isAuthorizedClass1DemoStudent({ ...student, grade: 0 }, {
      nodeEnv: 'development', enabled: 'true', studentId: student.id,
    })).toBe(false)
    expect(isAuthorizedClass1DemoStudent(student, {
      nodeEnv: 'production', enabled: 'true', studentId: student.id,
    })).toBe(false)
  })
})
