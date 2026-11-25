import type { Request, Response } from 'express'
import { Types } from 'mongoose'
import { Student } from '../models/Student'
import { isAuthorizedKGAlphabetStudent } from '../services/kg-pilot-access'
import { KGRewardsService } from '../services/kg-rewards.service'
import { ApiError } from '../utils/ApiError'
import { ok } from '../utils/ApiResponse'
import { catchAsync } from '../utils/catchAsync'

export const KGRewardsController = {
  access: catchAsync(async (req: Request, res: Response) => {
    if (req.auth?.role !== 'STUDENT') throw ApiError.forbidden('Student login required')
    const student = await Student.findOne({ _id: req.auth.id, schoolId: req.auth.schoolId })
      .select('_id schoolId grade status kgAlphabetPilotEnabled')
    if (!student) throw ApiError.forbidden('KG student access is not enabled')
    const eligible = isAuthorizedKGAlphabetStudent({
      id: student._id.toString(), grade: student.grade, status: student.status,
      kgAlphabetPilotEnabled: student.kgAlphabetPilotEnabled,
    })
    res.setHeader('Cache-Control', 'private, no-store')
    ok(res, { eligible })
  }),

  mine: catchAsync(async (req: Request, res: Response) => {
    if (req.auth?.role !== 'STUDENT') throw ApiError.forbidden('Student login required')
    const student = await Student.findOne({ _id: req.auth.id, schoolId: req.auth.schoolId })
      .select('_id schoolId grade status kgAlphabetPilotEnabled')
    if (!student || !isAuthorizedKGAlphabetStudent({
      id: student._id.toString(), grade: student.grade, status: student.status,
      kgAlphabetPilotEnabled: student.kgAlphabetPilotEnabled,
    })) throw ApiError.forbidden('KG student access is not enabled')
    res.setHeader('Cache-Control', 'private, no-store')
    ok(res, await KGRewardsService.getCollection(student._id as Types.ObjectId, student.schoolId as Types.ObjectId))
  }),
}
