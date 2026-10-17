jest.mock('../../src/models/Student', () => ({ Student: { findById: jest.fn() } }))
jest.mock('../../src/models/CurriculumClass', () => ({ CurriculumClass: { findOne: jest.fn() } }))
jest.mock('../../src/models/Level', () => ({ Level: { exists: jest.fn(), find: jest.fn() } }))
jest.mock('../../src/models/Lesson', () => ({ Lesson: { find: jest.fn() } }))
jest.mock('../../src/models/Activity', () => ({ Activity: { find: jest.fn() } }))
jest.mock('../../src/services/progress.service', () => ({ ProgressService: { getForStudent: jest.fn() } }))

import { Student } from '../../src/models/Student'
import { CurriculumClass } from '../../src/models/CurriculumClass'
import { Level } from '../../src/models/Level'
import { Lesson } from '../../src/models/Lesson'
import { Activity } from '../../src/models/Activity'
import { ProgressService } from '../../src/services/progress.service'
import { CurriculumAccessService } from '../../src/services/curriculum-access.service'
import { StudentLessonFastService } from '../../src/services/student-lesson-fast.service'

const studentId = 'kg-student-1'
const classId = 'kg-curriculum-1'
const levelId = 'kg-level-1'
const lessonId = '64b000000000000000000001'
const student = { _id: studentId, grade: 0, schoolId: 'school-1', status: 'active', className: 'KG-A', fullName: 'KG Learner' }
const curriculumClass = { _id: { toString: () => classId }, grade: 0, name: 'Kindergarten (KG)', order: 0, status: 'active' }
const level = { _id: { toString: () => levelId }, classId: curriculumClass._id, title: 'Picture Garden', order: 1, availability: 'PUBLISHED', status: 'active' }
const lesson = { _id: { toString: () => lessonId }, levelId: level._id, order: 1, title: 'Look, Touch & Say', status: 'active' }
const progress = {
  levels: [{
    levelId: level._id,
    status: 'in-progress',
    lessons: [{ lessonId: lesson._id, completedActivityIds: ['finished-activity'] }],
  }],
}

function queryResult<T>(value: T) {
  const query = {
    select: jest.fn(),
    sort: jest.fn(),
    lean: jest.fn().mockResolvedValue(value),
  }
  query.select.mockReturnValue(query)
  query.sort.mockReturnValue(query)
  return query
}

describe('KG lesson resume path', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(Student.findById as jest.Mock).mockReturnValue({
      select: () => ({ lean: async () => student }),
    })
    ;(CurriculumClass.findOne as jest.Mock).mockReturnValue({ lean: async () => curriculumClass })
    ;(Level.exists as jest.Mock).mockResolvedValue({ _id: level._id })
    ;(ProgressService.getForStudent as jest.Mock).mockResolvedValue(progress)
  })

  it('resumes at the first unfinished Grade 0 activity without changing saved progress', async () => {
    ;(Level.find as jest.Mock).mockReturnValue(queryResult([level]))
    ;(Lesson.find as jest.Mock).mockReturnValue(queryResult([lesson]))
    ;(Activity.find as jest.Mock).mockReturnValue(queryResult([
      { _id: 'finished-activity', order: 1 },
      { _id: 'next-activity', order: 2 },
    ]))
    const beforeCompletedIds = [...progress.levels[0].lessons[0].completedActivityIds]

    const result = await StudentLessonFastService.next(studentId)

    expect(result).toMatchObject({ grade: 0, lessonId, activityId: 'next-activity', complete: false })
    expect(progress.levels[0].lessons[0].completedActivityIds).toEqual(beforeCompletedIds)
    expect(ProgressService.getForStudent).toHaveBeenCalledWith(studentId, classId)
  })

  it('loads the Grade 0 lesson package with its existing completed activity ids', async () => {
    jest.spyOn(CurriculumAccessService, 'assertLesson').mockResolvedValue({ lesson, level } as never)
    ;(Activity.find as jest.Mock).mockReturnValue(queryResult([
      { _id: { toString: () => 'finished-activity' }, lessonId: lesson._id, order: 1 },
      { _id: { toString: () => 'next-activity' }, lessonId: lesson._id, order: 2 },
    ]))

    const result = await StudentLessonFastService.lesson(studentId, lessonId)

    expect(result.grade).toBe(0)
    expect(result.curriculumClass.grade).toBe(0)
    expect(result.lesson.id).toBe(lessonId)
    expect(result.completedActivityIds).toEqual(['finished-activity'])
  })

  it('does not send a KG student to a false completed state when the published unit has no active lessons', async () => {
    ;(Level.find as jest.Mock).mockReturnValue(queryResult([level]))
    ;(Lesson.find as jest.Mock).mockReturnValue(queryResult([]))

    await expect(StudentLessonFastService.next(studentId)).rejects.toMatchObject({
      statusCode: 422,
      message: expect.stringMatching(/curriculum has not been published/i),
    })
  })
})
