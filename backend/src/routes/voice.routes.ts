import { Router } from 'express'
import { Class1IntroController } from '../controllers/class1-intro.controller'
import { startClass1IntroSchema, completeClass1IntroSchema } from '../schemas/voice.schema'
import { VoiceController } from '../controllers/voice.controller'
import { authenticate, requireRole } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { voiceLimiter, voiceMediaLimiter } from '../middleware/rateLimit'
import { parseVoiceUpload } from '../middleware/voice-upload'
import { startVoiceSessionSchema, submitVoiceTranscriptSchema, synthesizeVoiceSchema, transcribeVoiceSchema } from '../schemas/voice.schema'

const router = Router()

router.use(authenticate, voiceLimiter)
router.post('/first-day/intro/start', requireRole('STUDENT'), validate(startClass1IntroSchema), Class1IntroController.start)
router.post('/first-day/intro/complete', requireRole('STUDENT'), validate(completeClass1IntroSchema), Class1IntroController.complete)
router.post('/sessions', requireRole('STUDENT'), validate(startVoiceSessionSchema), VoiceController.start)
router.post('/sessions/:sessionId/transcript', requireRole('STUDENT'), validate(submitVoiceTranscriptSchema), VoiceController.submitTranscript)
router.post('/sessions/:sessionId/cancel', requireRole('STUDENT'), VoiceController.cancel)
router.get('/activities/:activityId/pending-teacher-audio', requireRole('STUDENT'), VoiceController.pendingTeacherAudio)
router.post('/sessions/:sessionId/teacher-audio-played', requireRole('STUDENT'), VoiceController.teacherAudioPlayed)
router.post('/synthesize', voiceMediaLimiter, requireRole('STUDENT'), validate(synthesizeVoiceSchema), VoiceController.synthesize)
router.post('/transcribe', voiceMediaLimiter, requireRole('STUDENT'), parseVoiceUpload, validate(transcribeVoiceSchema), VoiceController.transcribe)
router.post('/warmup', requireRole('STUDENT'), VoiceController.warmup)

export default router
