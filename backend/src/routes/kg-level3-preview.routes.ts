import { Router } from 'express'
import { KGLevel3PreviewController } from '../controllers/kg-level3-preview.controller'
import { authenticate, requireRole } from '../middleware/auth'
import { kgLessonLimiter } from '../middleware/rateLimit'

const router = Router()
router.use(authenticate, kgLessonLimiter)
router.get('/narration/:id', requireRole('TEACHER', 'SCHOOL_ADMIN'), KGLevel3PreviewController.narration)
router.post('/attempt', requireRole('TEACHER', 'SCHOOL_ADMIN'), KGLevel3PreviewController.attempt)

export default router
