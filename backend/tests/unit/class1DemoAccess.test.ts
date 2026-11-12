import {
  CLASS1_DEMO_EXPERIENCE_ID,
  isAuthorizedClass1DemoStudent,
  isClass1DemoLesson,
  CLASS1_FIRST_DAY_PARALLEL_REVISION,
  preferClass1FirstDayLesson,
} from '../../src/services/class1-demo-access'

const student = { id: '64b000000000000000000001', grade: 1, status: 'active' }

describe('Class 1 demo access', () => {
  it('allows the matching active Grade 1 student outside production', () => {
    expect(isAuthorizedClass1DemoStudent(student, {
      nodeEnv: 'development', enabled: 'true', studentId: student.id, allStudents: 'false',
    })).toBe(true)
  })

  it('fails closed when disabled, mismatched, invalid, wrong-grade, or production', () => {
    expect(isAuthorizedClass1DemoStudent(student, {
      nodeEnv: 'development', enabled: 'false', studentId: student.id, allStudents: 'false',
    })).toBe(false)
    expect(isAuthorizedClass1DemoStudent(student, {
      nodeEnv: 'test', enabled: 'true', studentId: student.id, allStudents: 'false',
    })).toBe(false)
    expect(isAuthorizedClass1DemoStudent(student, {
      nodeEnv: 'production', enabled: 'true', studentId: student.id, allStudents: 'false',
    })).toBe(false)
    expect(isAuthorizedClass1DemoStudent(student, {
      nodeEnv: 'development', enabled: 'true', studentId: '64b000000000000000000002', allStudents: 'false',
    })).toBe(false)
    expect(isAuthorizedClass1DemoStudent(student, {
      nodeEnv: 'development', enabled: 'true', studentId: 'not-an-object-id', allStudents: 'false',
    })).toBe(false)
    expect(isAuthorizedClass1DemoStudent({ ...student, grade: 0 }, {
      nodeEnv: 'development', enabled: 'true', studentId: student.id, allStudents: 'false',
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

describe('additive First Day v3 selection without losing historic learning', () => {
  it('prefers the versioned First Day lesson and preserves old records in source array', () => {
    const old = { id: 'v2', settings: { talkoraDemoDraft: true, experienceId: 'g01-l01' } }
    const newFirstDay = { id: 'v3', settings: { talkoraDemoDraft: true, experienceId: 'g01-l01',
      lessonPlanRevision: CLASS1_FIRST_DAY_PARALLEL_REVISION } }
    const original = [old, newFirstDay]
    expect(preferClass1FirstDayLesson(original)).toEqual([newFirstDay])
    expect(original).toEqual([old, newFirstDay])
  })

  it('does not hide a legacy lesson until a fully marked v3 exists', () => {
    const old = { id: 'v2', settings: { talkoraDemoDraft: true } }
    const installing = { id: 'staging', settings: { lessonPlanRevision: 'class1-first-day-v3-installing' } }
    expect(preferClass1FirstDayLesson([old, installing])).toEqual([old, installing])
    expect(preferClass1FirstDayLesson([old])).toEqual([old])
  })
})
