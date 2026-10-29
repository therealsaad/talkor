import { Router } from 'express'
import { authenticate, requireRole } from '../middleware/auth'
import { KGAlphabetController } from '../controllers/kg-alphabet.controller'
import { kgLessonLimiter } from '../middleware/rateLimit'

const router = Router()
router.use(authenticate, kgLessonLimiter)
router.get('/state', requireRole('STUDENT'), KGAlphabetController.state)
router.post('/intro/start', requireRole('STUDENT'), KGAlphabetController.startIntro)
router.post('/intro-seen', requireRole('STUDENT'), KGAlphabetController.markIntro)
router.get('/audio/:version/:id', requireRole('STUDENT'), KGAlphabetController.audio)
router.get('/preview/audio/:version/:id', requireRole('TEACHER', 'SCHOOL_ADMIN'), KGAlphabetController.previewAudio)
router.post('/preview/attempt', requireRole('TEACHER', 'SCHOOL_ADMIN'), KGAlphabetController.previewAttempt)
router.post('/attempt', requireRole('STUDENT'), KGAlphabetController.attempt)
router.get('/attempt/:submissionId/feedback-audio', requireRole('STUDENT'), KGAlphabetController.feedbackAudio)
router.post('/attempt/:submissionId/feedback-played', requireRole('STUDENT'), KGAlphabetController.acknowledgeFeedback)
router.post('/homework/complete', requireRole('STUDENT'), KGAlphabetController.completeHomework)
router.get('/reports', requireRole('TEACHER', 'SCHOOL_ADMIN'), KGAlphabetController.reports)
router.get('/reports/:studentId', requireRole('TEACHER', 'SCHOOL_ADMIN'), KGAlphabetController.report)
export default router
