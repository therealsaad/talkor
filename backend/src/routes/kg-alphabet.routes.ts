import { Router } from 'express'
import { authenticate, requireRole } from '../middleware/auth'
import { KGAlphabetController } from '../controllers/kg-alphabet.controller'

const router = Router()
router.use(authenticate)
router.get('/state', requireRole('STUDENT'), KGAlphabetController.state)
router.post('/intro/start', requireRole('STUDENT'), KGAlphabetController.startIntro)
router.post('/intro-seen', requireRole('STUDENT'), KGAlphabetController.markIntro)
router.get('/audio/:version/:id', requireRole('STUDENT'), KGAlphabetController.audio)
router.post('/attempt', requireRole('STUDENT'), KGAlphabetController.attempt)
router.get('/reports', requireRole('TEACHER', 'SCHOOL_ADMIN'), KGAlphabetController.reports)
router.get('/reports/:studentId', requireRole('TEACHER', 'SCHOOL_ADMIN'), KGAlphabetController.report)
export default router
