import type { Request, Response } from 'express'
import { createHash, randomBytes } from 'node:crypto'
import { Student } from '../models/Student'
import { Activity } from '../models/Activity'
import { Class1IntroVisit } from '../models/Class1IntroVisit'
import { CurriculumAccessService } from '../services/curriculum-access.service'
import { CLASS1_INTRO_VALID_MS, firstDayIntroSource } from '../services/class1-intro-eligibility'
import { ApiError } from '../utils/ApiError'
import { ok } from '../utils/ApiResponse'
import { catchAsync } from '../utils/catchAsync'
import { verifyToken } from '../utils/jwt'

const hash = (s: string) => createHash('sha256').update(s).digest('hex')
async function scope(req: Request) {
  if (!req.auth || req.auth.role !== 'STUDENT') throw ApiError.forbidden()
  const student = await Student.findOne({ _id: req.auth.id, schoolId: req.auth.schoolId, status: 'active', grade: 1 })
    .select('authVersion').lean()
  if (!student) throw ApiError.forbidden()
  // A concurrent PIN login may happen after authenticate() runs. Keep this
  // operation on the signed visit; never adopt the newer database version.
  let signedVersion: number
  try { signedVersion = verifyToken(req.headers.authorization!.slice('Bearer '.length)).sv || 0 }
  catch { throw ApiError.unauthorized() }
  if (signedVersion !== (student.authVersion || 0)) throw ApiError.unauthorized('Your student session has ended. Please sign in again.')
  const { lesson, level } = await CurriculumAccessService.assertLesson(req.auth.id, req.body.lessonId)
  if (level.number !== 1 || !await Activity.exists({ lessonId: lesson._id,
    activityKey: /^class1-l01-v(?:3|4)-/, status: lesson.status })) throw ApiError.forbidden()
  const source = firstDayIntroSource(lesson.settings)
  return { studentId: req.auth.id, schoolId: req.auth.schoolId, lessonId: String(lesson._id),
    authVersion: signedVersion, ...source }
}
export const Class1IntroController = {
  start: catchAsync(async (req: Request, res: Response) => {
    const visit = await scope(req)
    const playbackId = randomBytes(32).toString('hex')
    const startedAt = new Date()
    await Class1IntroVisit.findOneAndUpdate({ studentId: visit.studentId, lessonId: visit.lessonId,
      authVersion: visit.authVersion }, { $set: { ...visit, ticketHash: hash(playbackId), startedAt,
      expiresAt: new Date(startedAt.getTime() + CLASS1_INTRO_VALID_MS) }, $unset: { completedAt: 1 } }, { upsert: true })
    res.setHeader('Cache-Control', 'private, no-store')
    ok(res, { playbackId, minimumSeconds: visit.minimumMs / 1000 })
  }),
  complete: catchAsync(async (req: Request, res: Response) => {
    const visit = await scope(req)
    const now = new Date()
    const saved = await Class1IntroVisit.updateOne({ studentId: visit.studentId, schoolId: visit.schoolId,
      lessonId: visit.lessonId, authVersion: visit.authVersion, sourceHash: visit.sourceHash,
      ticketHash: hash(req.body.playbackId), expiresAt: { $gt: now },
      startedAt: { $lte: new Date(now.getTime() - visit.minimumMs) } }, { $set: { completedAt: now } })
    if (!saved.matchedCount) throw ApiError.conflict('Finish Miss Julie’s complete story before starting this lesson')
    res.setHeader('Cache-Control', 'private, no-store')
    ok(res, { introSeen: true })
  }),
}
