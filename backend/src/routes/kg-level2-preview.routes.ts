import { Router } from 'express'
import { KGLevel2PreviewController } from '../controllers/kg-level2-preview.controller'
import { authenticate, requireRole } from '../middleware/auth'
import { kgLessonLimiter } from '../middleware/rateLimit'

const router = Router()
router.use(authenticate, kgLessonLimiter)
router.get('/narration/:id', requireRole('TEACHER', 'SCHOOL_ADMIN'), KGLevel2PreviewController.narration)
router.post('/attempt', requireRole('TEACHER', 'SCHOOL_ADMIN'), KGLevel2PreviewController.attempt)

export default router
