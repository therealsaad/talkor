import { Router } from 'express'
import { AnalyticsController } from '../controllers/analytics.controller'
import { authenticate, requireRole } from '../middleware/auth'

const router = Router()
router.use(authenticate, requireRole('SCHOOL_ADMIN', 'TEACHER'))
router.get('/reports/export.csv', AnalyticsController.exportReports)
router.get('/students/:studentId/report', AnalyticsController.studentReport)
router.get('/overview', AnalyticsController.overview)
router.get('/weakest-skills', AnalyticsController.weakestSkills)
export default router
