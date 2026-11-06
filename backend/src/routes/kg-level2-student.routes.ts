import { Router } from 'express'
import { authenticate, requireRole } from '../middleware/auth'
import { kgLessonLimiter } from '../middleware/rateLimit'
import { KGLevel2StudentController } from '../controllers/kg-level2-student.controller'

const router = Router()
router.use(authenticate, kgLessonLimiter, requireRole('STUDENT'))
router.get('/state', KGLevel2StudentController.state)
router.post('/intro/start', KGLevel2StudentController.startIntro)
router.post('/intro/complete', KGLevel2StudentController.finishIntro)
router.get('/narration/:id', KGLevel2StudentController.narration)
router.get('/review/narration/:id', KGLevel2StudentController.reviewNarration)
router.post('/attempt', KGLevel2StudentController.attempt)
router.get('/attempt/:submissionId/feedback-audio', KGLevel2StudentController.feedbackAudio)
router.post('/attempt/:submissionId/feedback-played', KGLevel2StudentController.acknowledge)
export default router
