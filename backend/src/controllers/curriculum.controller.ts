import { Request, Response } from 'express'
import { catchAsync } from '../utils/catchAsync'
import { ok } from '../utils/ApiResponse'
import { CurriculumService } from '../services/curriculum.service'
import { ProgressService } from '../services/progress.service'
import { CurriculumClass } from '../models/CurriculumClass'
import { ApiError } from '../utils/ApiError'
import { CurriculumAccessService } from '../services/curriculum-access.service'
import { roadmapForGrade } from '../curriculum/roadmap'

async function assertTeacherCanPreviewClass(role: string | undefined, classId: string) {
  if (role !== 'TEACHER') return
  const curriculumClass = await CurriculumClass.findById(classId).select('grade').lean()
  if (curriculumClass?.grade === 0) {
    throw ApiError.forbidden('Kindergarten curriculum preview is available to school administrators only')
  }
}

export const CurriculumController = {
  /** Educator planning only; never treats an editorial roadmap as unlocked activities. */
  roadmap: catchAsync(async (req: Request, res: Response) => {
    if (!req.auth || !['TEACHER', 'SCHOOL_ADMIN'].includes(req.auth.role)) throw ApiError.forbidden()
    const grade = Number(req.query.grade)
    const levels = roadmapForGrade(grade)
    if (!levels) throw ApiError.badRequest('grade must be an integer between 0 (KG) and 10')
    if (grade === 0 && req.auth.role === 'TEACHER') throw ApiError.forbidden('KG preview is restricted to school administrators')
    ok(res, { grade, levels, note: 'Editorial plan only; only approved, published curriculum is available to students.' })
  }),
  listClasses: catchAsync(async (req: Request, res: Response) => {
    if (req.auth?.role === 'STUDENT') return ok(res, [(await CurriculumAccessService.context(req.auth.id)).curriculumClass])
    const classes = await CurriculumService.listClasses()
    ok(res, req.auth?.role === 'TEACHER' ? classes.filter((item) => item.grade !== 0) : classes)
  }),

  getClass: catchAsync(async (req: Request, res: Response) => {
    if (req.auth?.role === 'STUDENT') await CurriculumAccessService.assertClass(req.auth.id, req.params.id)
    const curriculumClass = await CurriculumService.getClass(req.params.id)
    if (curriculumClass.grade === 0) await assertTeacherCanPreviewClass(req.auth?.role, req.params.id)
    ok(res, curriculumClass)
  }),

  /** Levels annotated with this student's unlock status, not just raw curriculum data. */
  listLevels: catchAsync(async (req: Request, res: Response) => {
    if (req.auth?.role === 'STUDENT') await CurriculumAccessService.assertClass(req.auth.id, req.params.classId)
    await assertTeacherCanPreviewClass(req.auth?.role, req.params.classId)
    const levels = await CurriculumService.listLevels(req.params.classId)
    if (req.auth?.role === 'STUDENT') {
      const progress = await ProgressService.getForStudent(req.auth.id, req.params.classId)
      const statusByLevel = new Map(progress.levels.map((l) => [l.levelId.toString(), l.status]))
      const annotated = levels.map((l) => ({ ...l, status: statusByLevel.get(l._id.toString()) ?? 'locked' }))
      return ok(res, annotated)
    }
    ok(res, levels)
  }),

  getLevel: catchAsync(async (req: Request, res: Response) => {
    if (req.auth?.role === 'STUDENT') await CurriculumAccessService.assertLevel(req.auth.id, req.params.id)
    const level = await CurriculumService.getLevel(req.params.id)
    await assertTeacherCanPreviewClass(req.auth?.role, level.classId.toString())
    if (req.auth?.role === 'STUDENT') {
      await ProgressService.assertLevelAccessible(req.auth.id, level.classId.toString(), level._id.toString())
    }
    ok(res, level)
  }),

  listLessons: catchAsync(async (req: Request, res: Response) => {
    if (req.auth?.role === 'STUDENT') await CurriculumAccessService.assertLevel(req.auth.id, req.params.levelId)
    const level = await CurriculumService.getLevel(req.params.levelId)
    await assertTeacherCanPreviewClass(req.auth?.role, level.classId.toString())
    ok(res, await CurriculumService.listLessons(req.params.levelId))
  }),

  getLesson: catchAsync(async (req: Request, res: Response) => {
    if (req.auth?.role === 'STUDENT') await CurriculumAccessService.assertLesson(req.auth.id, req.params.id)
    const lesson = await CurriculumService.getLesson(req.params.id)
    if (req.auth?.role === 'TEACHER') {
      const level = await CurriculumService.getLevel(lesson.levelId.toString())
      await assertTeacherCanPreviewClass(req.auth.role, level.classId.toString())
    }
    ok(res, lesson)
  }),

  listActivities: catchAsync(async (req: Request, res: Response) => {
    if (req.auth?.role === 'TEACHER' || req.auth?.role === 'SCHOOL_ADMIN') {
      if (req.auth.role === 'TEACHER') {
        const lesson = await CurriculumService.getLesson(req.params.lessonId)
        const level = await CurriculumService.getLevel(lesson.levelId.toString())
        await assertTeacherCanPreviewClass(req.auth.role, level.classId.toString())
      }
      return ok(res, await CurriculumService.listActivitiesForTeacher(req.params.lessonId))
    }
    if (!req.auth) throw ApiError.unauthorized()
    await CurriculumAccessService.assertLesson(req.auth.id, req.params.lessonId)
    ok(res, await CurriculumService.listActivitiesForStudent(req.params.lessonId))
  }),

  getActivity: catchAsync(async (req: Request, res: Response) => {
    if (req.auth?.role === 'TEACHER' || req.auth?.role === 'SCHOOL_ADMIN') {
      const activity = await CurriculumService.getActivity(req.params.id)
      if (req.auth.role === 'TEACHER') {
        const lesson = await CurriculumService.getLesson(activity.lessonId.toString())
        const level = await CurriculumService.getLevel(lesson.levelId.toString())
        await assertTeacherCanPreviewClass(req.auth.role, level.classId.toString())
      }
      return ok(res, activity)
    }
    if (!req.auth) throw ApiError.unauthorized()
    await CurriculumAccessService.assertActivity(req.auth.id, req.params.id)
    ok(res, await CurriculumService.getActivityForStudent(req.params.id))
  }),
}
