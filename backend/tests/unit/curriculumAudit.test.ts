import { auditCurriculumDocuments } from '../../src/services/curriculum-audit'

describe('read-only curriculum audit summary', () => {
  it('counts only published active lessons and activities, and reports broken references', () => {
    const result = auditCurriculumDocuments({
      classes: [
        { _id: 'class-4', grade: 4, name: 'Class 4', status: 'active' },
        { _id: 'draft-kg', grade: 0, name: 'Kindergarten', status: 'draft' },
      ],
      levels: [
        { _id: 'published-unit', classId: 'class-4', status: 'active', availability: 'PUBLISHED' },
        { _id: 'draft-unit', classId: 'class-4', status: 'active', availability: 'UPCOMING' },
        { _id: 'orphan-unit', classId: 'missing-class', status: 'active', availability: 'PUBLISHED' },
      ],
      lessons: [
        { _id: 'published-lesson', levelId: 'published-unit', status: 'active' },
        { _id: 'draft-lesson', levelId: 'draft-unit', status: 'active' },
        { _id: 'orphan-lesson', levelId: 'missing-unit', status: 'active' },
      ],
      activities: [
        { _id: 'published-activity', lessonId: 'published-lesson', status: 'active' },
        { _id: 'orphan-activity', lessonId: 'missing-lesson', status: 'active' },
      ],
    })

    const classFour = result.grades.find((grade) => grade.grade === 4)
    expect(classFour).toMatchObject({
      unitCount: 2,
      publishedUnitCount: 1,
      publishedLessonCount: 1,
      activityCount: 1,
    })
    expect(result.orphanReferences).toEqual(expect.arrayContaining([
      expect.stringContaining('orphan-unit'),
      expect.stringContaining('orphan-lesson'),
      expect.stringContaining('orphan-activity'),
    ]))
  })

  it('reports a published unit with no lesson and a published lesson with no activities', () => {
    const result = auditCurriculumDocuments({
      classes: [{ _id: 'kg-class', grade: 0, name: 'Kindergarten (KG)', status: 'active' }],
      levels: [
        { _id: 'empty-unit', classId: 'kg-class', status: 'active', availability: 'PUBLISHED' },
        { _id: 'lesson-unit', classId: 'kg-class', status: 'active', availability: 'PUBLISHED' },
      ],
      lessons: [{ _id: 'empty-lesson', levelId: 'lesson-unit', status: 'active' }],
      activities: [],
    })

    const kindergarten = result.grades.find((grade) => grade.grade === 0)
    expect(kindergarten?.missingReferences).toEqual(expect.arrayContaining([
      expect.stringContaining('empty-unit'),
      expect.stringContaining('empty-lesson'),
    ]))
  })

  it('reports an active grade whose curriculum class has no published units', () => {
    const result = auditCurriculumDocuments({
      classes: [{ _id: 'class-5', grade: 5, name: 'Class 5', status: 'active' }],
      levels: [{ _id: 'upcoming-unit', classId: 'class-5', status: 'active', availability: 'UPCOMING' }],
      lessons: [],
      activities: [],
    })

    expect(result.grades.find((grade) => grade.grade === 5)?.missingReferences)
      .toContain('No active published units are configured for grade 5')
  })
})
