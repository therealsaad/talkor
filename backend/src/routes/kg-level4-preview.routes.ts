import { Router } from 'express'
import { KGLevel4PreviewController } from '../controllers/kg-level4-preview.controller'
import { KGVowelPreviewController } from '../controllers/kg-vowel-preview.controller'
import { authenticate, requireRole } from '../middleware/auth'
import { kgLessonLimiter } from '../middleware/rateLimit'
import { catchAsync } from '../utils/catchAsync'
import { ok } from '../utils/ApiResponse'

const router = Router()
router.use(authenticate, kgLessonLimiter)
router.get('/narration/:id', requireRole('TEACHER', 'SCHOOL_ADMIN'), KGLevel4PreviewController.narration)
router.post('/attempt', requireRole('TEACHER', 'SCHOOL_ADMIN'), KGLevel4PreviewController.attempt)

// Level 6 Vowel Garden uses a separate URL namespace and stays staff-preview only.
router.get('/vowel/speech/:line/:activityId', requireRole('TEACHER', 'SCHOOL_ADMIN'), catchAsync(async (req, res) => {
  const result = await KGVowelPreviewController.speech(req.params.line, req.params.activityId)
  res.setHeader('Content-Type', result.contentType)
  res.setHeader('Cache-Control', 'private, no-store')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.send(result.audio)
}))
router.post('/vowel/attempt', requireRole('TEACHER', 'SCHOOL_ADMIN'), catchAsync(async (req, res) => {
  const result = await KGVowelPreviewController.attempt(req.body)
  res.setHeader('Cache-Control', 'no-store')
  ok(res, result)
}))

export default router
