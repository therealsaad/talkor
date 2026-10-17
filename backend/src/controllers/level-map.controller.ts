import type { Request, Response } from 'express'
import { catchAsync } from '../utils/catchAsync'
import { ok } from '../utils/ApiResponse'
import { ApiError } from '../utils/ApiError'
import { parseGrade, parseLevel } from '../curriculum/level-map-contract'
import { LevelMapService } from '../services/level-map.service'

function gradeFrom(value: unknown) {
  try { return parseGrade(value) }
  catch { throw ApiError.badRequest('grade must be an integer from 0 (KG) to 10') }
}
function levelFrom(value: unknown) {
  try { return parseLevel(value) }
  catch { throw ApiError.badRequest('level must be an integer from 1 to 10') }
}
function checkKGTeacher(req: Request, grade: number) {
  if (grade === 0 && req.auth?.role === 'TEACHER') throw ApiError.forbidden('KG planning is restricted to school administrators')
}

export const LevelMapController = {
  /** Only staff can see unpublished curriculum addresses. No answer keys are returned. */
  classes: catchAsync(async (_req: Request, res: Response) => {
    const grades = Array.from({ length: 11 }, (_, grade) => ({
      grade, title: grade === 0 ? 'Kindergarten (KG)' : `Class ${grade}`, levels: 10,
    }))
    ok(res, grades)
  }),
  grade: catchAsync(async (req: Request, res: Response) => {
    const grade = gradeFrom(req.params.grade)
    checkKGTeacher(req, grade)
    res.setHeader('Cache-Control', 'no-store')
    ok(res, await LevelMapService.grade(grade))
  }),
  level: catchAsync(async (req: Request, res: Response) => {
    const grade = gradeFrom(req.params.grade)
    const level = levelFrom(req.params.level)
    checkKGTeacher(req, grade)
    res.setHeader('Cache-Control', 'no-store')
    ok(res, await LevelMapService.level(grade, level))
  }),
}
