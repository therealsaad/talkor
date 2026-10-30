import { Request, Response } from 'express'
import { catchAsync } from '../utils/catchAsync'
import { ok } from '../utils/ApiResponse'
import { ApiError } from '../utils/ApiError'
import {
  LearningProgressService,
  parseLearningProgressQuery,
} from '../services/learning-progress.service'

function educatorScope(req: Request) {
  if (!req.auth || !['SCHOOL_ADMIN', 'TEACHER'].includes(req.auth.role)) {
    throw ApiError.forbidden()
  }
  return {
    schoolId: req.auth.schoolId,
    teacherId: req.auth.role === 'TEACHER' ? req.auth.id : undefined,
  }
}

export const LearningProgressController = {
  overview: catchAsync(async (req: Request, res: Response) => {
    const scope = educatorScope(req)
    const filters = parseLearningProgressQuery(req.query as Record<string, unknown>)
    ok(res, await LearningProgressService.overview(scope, filters))
  }),

  levelsForGrade: catchAsync(async (req: Request, res: Response) => {
    const scope = educatorScope(req)
    const grade = Number(req.params.grade)
    if (!Number.isInteger(grade) || grade < 0 || grade > 10) throw ApiError.badRequest('grade must be 0–10')
    ok(res, await LearningProgressService.levelsForGrade(scope, grade))
  }),

  levelReport: catchAsync(async (req: Request, res: Response) => {
    const scope = educatorScope(req)
    const filters = parseLearningProgressQuery(req.query as Record<string, unknown>)
    ok(res, await LearningProgressService.levelReport(scope, req.params.levelId, filters))
  }),

  studentDetail: catchAsync(async (req: Request, res: Response) => {
    const scope = educatorScope(req)
    ok(res, await LearningProgressService.studentDetail(scope, req.params.studentId))
  }),

  exportLevelCsv: catchAsync(async (req: Request, res: Response) => {
    const scope = educatorScope(req)
    const filters = parseLearningProgressQuery(req.query as Record<string, unknown>)
    const output = await LearningProgressService.exportLevelCsv(scope, req.params.levelId, filters)
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Cache-Control', 'private, no-store')
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="talkora-level-progress-${req.params.levelId}.csv"`,
    )
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('X-Talkora-Records', String(output.records))
    res.setHeader('Access-Control-Expose-Headers', 'X-Talkora-Records')
    res.status(200).send(output.csv)
  }),
}
