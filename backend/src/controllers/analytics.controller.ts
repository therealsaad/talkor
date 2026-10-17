import { Request, Response } from 'express'
import { catchAsync } from '../utils/catchAsync'
import { ok } from '../utils/ApiResponse'
import { AnalyticsService } from '../services/analytics.service'
import { ApiError } from '../utils/ApiError'
import { StudentReportService, type ReportPeriod } from '../services/student-report.service'
import { reportPage } from '../services/report-csv.service'

export const AnalyticsController = {
  /** Export a bounded page of teacher/school-scoped records. Never expose this to students. */
  exportReports: catchAsync(async (req: Request, res: Response) => {
    if (!req.auth || !['SCHOOL_ADMIN', 'TEACHER'].includes(req.auth.role)) throw ApiError.forbidden()
    const period = String(req.query.period || 'weekly')
    if (!['daily', 'weekly', 'monthly'].includes(period)) throw ApiError.badRequest('Invalid report period')
    const limit = req.query.limit === undefined ? 30 : Number(req.query.limit)
    const after = req.query.after === undefined ? undefined : String(req.query.after)
    const output = await reportPage({ schoolId: req.auth.schoolId, requesterId: req.auth.id,
      role: req.auth.role as 'SCHOOL_ADMIN' | 'TEACHER', period: period as ReportPeriod,
      after, limit })
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Cache-Control', 'private, no-store')
    res.setHeader('Content-Disposition', `attachment; filename="talkora-reports-${period}.csv"`)
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('X-Talkora-Records', String(output.records))
    if (output.nextCursor) res.setHeader('X-Talkora-Next-Cursor', output.nextCursor)
    res.setHeader('Access-Control-Expose-Headers', 'X-Talkora-Records, X-Talkora-Next-Cursor')
    res.status(200).send(output.csv)
  }),
  studentReport: catchAsync(async (req: Request, res: Response) => {
    if (!req.auth || !['SCHOOL_ADMIN', 'TEACHER'].includes(req.auth.role)) throw ApiError.forbidden()
    const period = String(req.query.period || 'weekly')
    if (!['daily', 'weekly', 'monthly'].includes(period)) throw ApiError.badRequest('Period must be daily, weekly, or monthly')
    res.setHeader('Cache-Control', 'private, no-store')
    ok(res, await StudentReportService.generate(req.auth.schoolId, req.params.studentId,
      req.auth.role as 'SCHOOL_ADMIN' | 'TEACHER', req.auth.id, period as ReportPeriod))
  }),
  overview: catchAsync(async (req: Request, res: Response) => {
    if (!req.auth) throw ApiError.unauthorized()
    ok(res, await AnalyticsService.analyticsOverview(req.auth.schoolId, req.auth.role === 'TEACHER' ? req.auth.id : undefined))
  }),

  weakestSkills: catchAsync(async (req: Request, res: Response) => {
    if (!req.auth) throw ApiError.unauthorized()
    ok(res, await AnalyticsService.weakestSkillsForSchool(req.auth.schoolId, 5, req.auth.role === 'TEACHER' ? req.auth.id : undefined))
  }),
}
