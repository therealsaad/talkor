import { Router } from 'express'
import { KGLevel5PreviewController } from '../controllers/kg-level5-preview.controller'
import { authenticate, requireRole } from '../middleware/auth'
import { kgLessonLimiter } from '../middleware/rateLimit'

const router = Router()
router.use(authenticate, kgLessonLimiter)
router.get('/narration/:id', requireRole('TEACHER', 'SCHOOL_ADMIN'), KGLevel5PreviewController.narration)
router.post('/attempt', requireRole('TEACHER', 'SCHOOL_ADMIN'), KGLevel5PreviewController.attempt)

export default router

