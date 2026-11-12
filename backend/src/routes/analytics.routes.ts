import { Router } from 'express'
import { AnalyticsController } from '../controllers/analytics.controller'
import { LearningProgressController } from '../controllers/learning-progress.controller'
import { authenticate, requireRole } from '../middleware/auth'

const router = Router()
router.use(authenticate, requireRole('SCHOOL_ADMIN', 'TEACHER'))
router.get('/reports/export.csv', AnalyticsController.exportReports)
router.get('/students/:studentId/report', AnalyticsController.studentReport)
router.get('/overview', AnalyticsController.overview)
router.get('/weakest-skills', AnalyticsController.weakestSkills)

/** Verified level-completion reporting (Progress is the source of truth). */
router.get('/learning-progress/overview', LearningProgressController.overview)
router.get('/learning-progress/grades/:grade/levels', LearningProgressController.levelsForGrade)
router.get('/learning-progress/levels/:levelId', LearningProgressController.levelReport)
router.get('/learning-progress/levels/:levelId/export.csv', LearningProgressController.exportLevelCsv)
router.get('/learning-progress/students/:studentId', LearningProgressController.studentDetail)
export default router
