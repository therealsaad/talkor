import { Router } from 'express'
import { KGLevel4PreviewController } from '../controllers/kg-level4-preview.controller'
import { authenticate, requireRole } from '../middleware/auth'
import { kgLessonLimiter } from '../middleware/rateLimit'

const router = Router()
router.use(authenticate, kgLessonLimiter)
router.get('/narration/:id', requireRole('TEACHER', 'SCHOOL_ADMIN'), KGLevel4PreviewController.narration)
router.post('/attempt', requireRole('TEACHER', 'SCHOOL_ADMIN'), KGLevel4PreviewController.attempt)

export default router
