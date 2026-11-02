import { Router } from 'express'
import { authenticate, requireRole } from '../middleware/auth'
import { kgLessonLimiter } from '../middleware/rateLimit'
import { KGContinuationController } from '../controllers/kg-continuation.controller'
const router = Router()
router.use(authenticate, kgLessonLimiter, requireRole('STUDENT'))
router.get('/overview', KGContinuationController.overview)
router.get('/:level/state', KGContinuationController.getState)
router.post('/:level/intro/start', KGContinuationController.startIntro)
router.post('/:level/intro/complete', KGContinuationController.completeIntro)
router.get('/:level/narration/:id', KGContinuationController.narration)
router.post('/:level/attempt', KGContinuationController.attempt)
router.get('/:level/attempt/:submissionId/feedback-audio', KGContinuationController.feedbackAudio)
router.post('/:level/attempt/:submissionId/feedback-played', KGContinuationController.acknowledge)
export default router
