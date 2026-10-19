import { Router } from 'express'
import { authenticate, requireRole } from '../middleware/auth'
import { LevelMapController } from '../controllers/level-map.controller'

const router = Router()
router.use(authenticate, requireRole('SCHOOL_ADMIN', 'TEACHER'))
router.get('/grades', LevelMapController.classes)
router.get('/grades/:grade', LevelMapController.grade)
router.get('/grades/:grade/levels/:level', LevelMapController.level)
router.get('/grades/:grade/levels/:level/studio', LevelMapController.studio)
export default router
