import {
  CLASS1_DEMO_EXPERIENCE_ID,
  isAuthorizedClass1DemoStudent,
  isClass1DemoLesson,
} from '../../src/services/class1-demo-access'

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
      nodeEnv: 'test', enabled: 'true', studentId: student.id,
    })).toBe(false)
    expect(isAuthorizedClass1DemoStudent(student, {
      nodeEnv: 'production', enabled: 'true', studentId: student.id,
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
  })

  it('recognizes only the marked canonical g01-l01 draft lesson', () => {
    expect(isClass1DemoLesson({
      status: 'draft',
      settings: { talkoraDemoDraft: true, experienceId: CLASS1_DEMO_EXPERIENCE_ID },
    })).toBe(true)
    expect(isClass1DemoLesson({
      status: 'draft',
      settings: { talkoraDemoDraft: true, experienceId: 'g01-l02' },
    })).toBe(false)
    expect(isClass1DemoLesson({
      status: 'active',
      settings: { talkoraDemoDraft: true, experienceId: CLASS1_DEMO_EXPERIENCE_ID },
    })).toBe(false)
  })
})
