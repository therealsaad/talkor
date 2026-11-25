import { Router } from 'express'
import { authenticate, requireRole } from '../middleware/auth'
import { kgLessonLimiter } from '../middleware/rateLimit'
import { KGRewardsController } from '../controllers/kg-rewards.controller'

const router = Router()
router.use(authenticate, kgLessonLimiter, requireRole('STUDENT'))
router.get('/access', KGRewardsController.access)
router.get('/mine', KGRewardsController.mine)
export default router
