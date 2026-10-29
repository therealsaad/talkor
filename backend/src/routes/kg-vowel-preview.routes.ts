import { Router } from 'express'
import { authenticate, requireRole } from '../middleware/auth'
import { kgLessonLimiter } from '../middleware/rateLimit'
import { catchAsync } from '../utils/catchAsync'
import { ok } from '../utils/ApiResponse'
import { KGVowelPreviewController } from '../controllers/kg-vowel-preview.controller'

const router = Router()
router.use(authenticate, kgLessonLimiter, requireRole('TEACHER', 'SCHOOL_ADMIN'))
router.get('/speech/:line/:activityId', catchAsync(async (req, res) => {
  const result = await KGVowelPreviewController.speech(req.params.line, req.params.activityId)
  res.setHeader('Content-Type', result.contentType)
  res.setHeader('Cache-Control', 'private, no-store')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.send(result.audio)
}))
router.post('/attempt', catchAsync(async (req, res) => {
  const result = await KGVowelPreviewController.attempt(req.body)
  res.setHeader('Cache-Control', 'no-store')
  ok(res, result)
}))
export default router
