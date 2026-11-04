import type { Request, Response } from 'express'
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import { Types } from 'mongoose'
import { KGAlphabetProgress } from '../models/KGAlphabetProgress'
import { KGLevel2Attempt, type IKGLevel2Attempt } from '../models/KGLevel2Attempt'
import { KGLevel2Progress, type IKGLevel2Progress } from '../models/KGLevel2Progress'
import { Student } from '../models/Student'
import { isAuthorizedKGAlphabetStudent } from '../services/kg-pilot-access'
import { KGSpeechService } from '../services/kg-speech.service'
import { AzureVoiceProvider } from '../providers/voice/AzureVoiceProvider'
import { PythonVoiceProvider } from '../providers/voice/PythonVoiceProvider'
import { issueKGFeedbackReceipt, verifyKGFeedbackReceipt } from '../services/kg-feedback-receipt'
import { isSupportedVoiceAudioMimeType } from '../schemas/voice.schema'
import { LEVEL2_LETTERS, LEVEL2_NARRATION, gradeLevel2Transcription } from '../kg/level2-content'
import { composeKGTeachingTurn, type KGTeachingLocale } from '../teaching/kg-teaching-turn'
import { ApiError } from '../utils/ApiError'
import { ok } from '../utils/ApiResponse'
import { catchAsync } from '../utils/catchAsync'
import { logger } from '../utils/logger'
import { createTurnTimer, logTurnTiming, parseSlowTurnMs, serverTimingHeader, type TurnTimer } from '../services/kg-turn-timing'

/**
 * Student Level 2 pilot: E–J repeat-after-Julie with authoritative saved
 * progress, no staff-preview endpoint access and no browser-awarded credit.
 * A complete KG1 is the only prerequisite, NOT the homework check-in.
 */
const INTRO_MAX_AGE_MS = 2 * 60 * 60_000
const INTRO_MIN_ELAPSED_MS = 10_000
const hash = (value: string) => createHash('sha256').update(value).digest('hex')
function safeEquals(a: string, b: string): boolean {
  const left = Buffer.from(a, 'hex'), right = Buffer.from(b, 'hex')
  return left.length === 32 && right.length === 32 && timingSafeEqual(left, right)
}
function submissionId(raw: unknown): string {
  if (typeof raw !== 'string' || !/^[a-zA-Z0-9_-]{12,80}$/.test(raw)) throw ApiError.badRequest('Invalid submission ID')
  return raw
}
async function authorized(req: Request) {
  if (!req.auth || req.auth.role !== 'STUDENT') throw ApiError.forbidden('Student login required')
  const student = await Student.findOne({ _id: req.auth.id, schoolId: req.auth.schoolId })
    .select('_id schoolId grade status kgAlphabetPilotEnabled')
  if (!student || !isAuthorizedKGAlphabetStudent({
    id: student._id.toString(), grade: student.grade, status: student.status,
    kgAlphabetPilotEnabled: student.kgAlphabetPilotEnabled,
  })) throw ApiError.forbidden('KG student access is not enabled')
  const kg1 = await KGAlphabetProgress.findOne({ studentId: student._id, schoolId: student.schoolId })
    .select('currentIndex').lean()
  if (kg1?.currentIndex !== 8) throw ApiError.forbidden('Complete Kindergarten Level 1 before opening Level 2')
  return { studentId: student._id, schoolId: student.schoolId }
}
async function levelState(studentId: Types.ObjectId, schoolId: Types.ObjectId) {
  const row = await KGLevel2Progress.findOneAndUpdate(
    { studentId },
    { $setOnInsert: { studentId, schoolId, currentIndex: 0 } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).select('+introTicketHash')
  if (!row || row.schoolId.toString() !== schoolId.toString()) {
    throw ApiError.forbidden('Level 2 progress school mismatch')
  }
  return row
}
async function introGuard(req: Request, row: IKGLevel2Progress) {
  const token = req.get('X-KG-Level2-Intro') || ''
  if (!/^[a-f0-9]{64}$/.test(token) || !row.introTicketHash ||
    !safeEquals(row.introTicketHash, hash(token)) || !row.introStartedAt ||
    Date.now() - row.introStartedAt.getTime() > INTRO_MAX_AGE_MS ||
    !row.introCompletedAt || row.introCompletedAt.getTime() < row.introStartedAt.getTime()) {
    throw ApiError.conflict('Watch the Level 2 introduction before continuing')
  }
  return hash(token)
}
function publicState(row: IKGLevel2Progress, pending: IKGLevel2Attempt | null) {
  return {
    version: 'kg-level2-v1',
    level: 2,
    title: 'Letters E to J',
    currentIndex: row.currentIndex,
    totalActivities: LEVEL2_LETTERS.length,
    completed: row.currentIndex === LEVEL2_LETTERS.length,
    completedAt: row.completedAt ?? null,
    activity: row.currentIndex < LEVEL2_LETTERS.length
      ? { letter: LEVEL2_LETTERS[row.currentIndex], mode: 'speak' } : null,
    pendingFeedback: pending ? {
      submissionId: pending.submissionId,
      letter: pending.letter,
      outcome: pending.outcome,
      feedbackText: pending.feedbackText,
    } : null,
  }
}
async function readState(row: IKGLevel2Progress) {
  const pending = row.currentIndex < LEVEL2_LETTERS.length
    ? await KGLevel2Attempt.findOne({
        studentId: row.studentId, schoolId: row.schoolId, index: row.currentIndex,
        feedbackAcknowledgedAt: { $exists: false },
      }).sort({ createdAt: -1 })
    : null
  return publicState(row, pending)
}
function feedbackText(letter: string, outcome: IKGLevel2Attempt['outcome']): string {
  if (outcome === 'correct') return 'Wonderful! You said ' + letter + '! Great speaking!'
  if (outcome === 'unclear') return 'I am listening. Take your time. Say the letter ' + letter + '.'
  return 'Good try! Listen and say the letter ' + letter + ' once more.'
}
async function speak(res: Response, words: string, receipt?: string, timer?: TurnTimer, language?: KGTeachingLocale) {
  const startedVoiceAt = Date.now()
  let bytes: Buffer, contentType: string, provider: string
  try {
    const azure = await new AzureVoiceProvider().synthesizeUncached(words, { language })
    if (azure.audio.length < 256 || azure.audio.length > 8 * 1024 * 1024) throw Error('Invalid Azure audio size')
    bytes = azure.audio; contentType = azure.contentType; provider = 'azure'
  } catch {
    const priya = await new PythonVoiceProvider().synthesize(words)
    bytes = priya.audioBase64 ? Buffer.from(priya.audioBase64, 'base64') : Buffer.alloc(0)
    contentType = priya.contentType || ''
    if (!priya.available || bytes.length < 256 || bytes.length > 8 * 1024 * 1024 ||
      !/^audio\/[a-z0-9.+-]+(?:\s*;.*)?$/i.test(contentType)) {
      throw ApiError.provider('KG_LEVEL2_AUDIO_UNAVAILABLE')
    }
    provider = 'python-priya-fallback'
  }
  if (!/^audio\/[a-z0-9.+-]+(?:\s*;.*)?$/i.test(contentType)) throw ApiError.provider('KG_LEVEL2_AUDIO_INVALID')
  if (timer) {
    timer.set('tts', Date.now() - startedVoiceAt)
    timer.note('ttsSource', provider === 'azure' ? 'azure' : 'fallback')
    res.setHeader('Server-Timing', serverTimingHeader(timer.finish().steps))
  }
  res.setHeader('Cache-Control', 'private, no-store')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Content-Type', contentType)
  res.setHeader('Content-Length', String(bytes.length))
  res.setHeader('X-Voice-Provider', provider)
  if (receipt) res.setHeader('X-KG-Feedback-Receipt', receipt)
  res.send(bytes)
}
export const KGLevel2StudentController = {
  state: catchAsync(async (req: Request, res: Response) => {
    const { studentId, schoolId } = await authorized(req)
    const row = await levelState(studentId, schoolId)
    res.setHeader('Cache-Control', 'private, no-store')
    ok(res, await readState(row))
  }),
  startIntro: catchAsync(async (req: Request, res: Response) => {
    const { studentId, schoolId } = await authorized(req)
    const row = await levelState(studentId, schoolId)
    if (row.currentIndex === 6) return ok(res, { completed: true })
    const token = randomBytes(32).toString('hex')
    await KGLevel2Progress.updateOne({ studentId, schoolId }, {
      $set: { introTicketHash: hash(token), introStartedAt: new Date() },
      $unset: { introCompletedAt: 1 },
    })
    res.setHeader('Cache-Control', 'private, no-store')
    ok(res, { playbackId: token })
  }),
  finishIntro: catchAsync(async (req: Request, res: Response) => {
    const { studentId, schoolId } = await authorized(req)
    const row = await levelState(studentId, schoolId)
    const token = req.body?.playbackId
    if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token) || !row.introTicketHash ||
      !safeEquals(row.introTicketHash, hash(token)) || !row.introStartedAt ||
      Date.now() - row.introStartedAt.getTime() < INTRO_MIN_ELAPSED_MS ||
      Date.now() - row.introStartedAt.getTime() > INTRO_MAX_AGE_MS ||
      req.body?.videoEnded !== true) {
      throw ApiError.conflict('Finish watching the Level 2 introduction before speaking')
    }
    const completedAt = new Date()
    await KGLevel2Progress.updateOne({ studentId, schoolId, introTicketHash: row.introTicketHash },
      { $set: { introCompletedAt: completedAt } })
    res.setHeader('Cache-Control', 'private, no-store')
    ok(res, { introSeen: true })
  }),
  narration: catchAsync(async (req: Request, res: Response) => {
    const { studentId, schoolId } = await authorized(req)
    const row = await levelState(studentId, schoolId)
    await introGuard(req, row)
    const id = req.params.id
    if (!Object.prototype.hasOwnProperty.call(LEVEL2_NARRATION, id)) throw ApiError.notFound('Unknown Level 2 narration')
    await speak(res, LEVEL2_NARRATION[id as keyof typeof LEVEL2_NARRATION])
  }),
  /** Authenticated read-only revision of a saved completed level.
   * No intro replay ticket, microphone, attempts, XP or Mongo mutations.
   * Only teacher-authored fixed narration, never arbitrary client text.
   */
  reviewNarration: catchAsync(async (req: Request, res: Response) => {
    const { studentId, schoolId } = await authorized(req)
    const completed = await KGLevel2Progress.exists({
      studentId, schoolId, currentIndex: LEVEL2_LETTERS.length, completedAt: { $exists: true },
    })
    if (!completed) throw ApiError.forbidden('Finish Level 2 before revising it')
    const id = req.params.id
    if (!Object.prototype.hasOwnProperty.call(LEVEL2_NARRATION, id)) {
      throw ApiError.notFound('Unknown reviewed Level 2 narration')
    }
    await speak(res, LEVEL2_NARRATION[id as keyof typeof LEVEL2_NARRATION])
  }),
  attempt: catchAsync(async (req: Request, res: Response) => {
    const { studentId, schoolId } = await authorized(req)
    const row = await levelState(studentId, schoolId)
    await introGuard(req, row)
    if (row.currentIndex >= LEVEL2_LETTERS.length) throw ApiError.conflict('Level 2 is completed')
    const timing = createTurnTimer()
    timing.note('level', 2)
    timing.note('feedbackSource', 'guided')
    const id = submissionId(req.body?.submissionId)
    const expected = LEVEL2_LETTERS[row.currentIndex]
    if (req.body?.letter !== expected) throw ApiError.conflict('Continue with Miss Julie’s current letter')
    const existing = await KGLevel2Attempt.findOne({ studentId, schoolId, submissionId: id })
    if (existing) {
      if (existing.index !== row.currentIndex || existing.letter !== expected) throw ApiError.conflict('This answer belongs to another letter')
      return ok(res, { ...publicState(row, existing), outcome: existing.outcome, submissionId: id, feedbackText: existing.feedbackText, duplicate: true })
    }
    const pending = await KGLevel2Attempt.exists({
      studentId, schoolId, index: row.currentIndex,
      feedbackAcknowledgedAt: { $exists: false },
    })
    if (pending) throw ApiError.conflict('Listen to the previous answer before trying again')
    const durationMs = Number(req.body?.durationMs)
    if (!Number.isFinite(durationMs) || durationMs < 250 || durationMs > 12_000) throw ApiError.badRequest('Invalid recording duration')
    let outcome: IKGLevel2Attempt['outcome'] = 'unclear'
    let transcript = ''
    let detectedLanguage: KGTeachingLocale | undefined
    if (req.body?.noSpeech !== true) {
      const audioBase64 = req.body?.audioBase64
      const mimeType = req.body?.mimeType
      if (!isSupportedVoiceAudioMimeType(mimeType) || typeof audioBase64 !== 'string' ||
        audioBase64.length < 128 || audioBase64.length > 11_000_000 ||
        !/^[A-Za-z0-9+/]+={0,2}$/.test(audioBase64) || audioBase64.length % 4 === 1) {
        throw ApiError.badRequest('Valid short microphone audio is required')
      }
      const recognition = await timing.time('stt', () => KGSpeechService.transcribe({ audioBase64, mimeType, durationMs }))
      if (!recognition.available) throw ApiError.provider('Speech recognition is temporarily unavailable')
      const confidence = 'confidence' in recognition ? recognition.confidence : undefined
      const uncertain = ('uncertain' in recognition && recognition.uncertain === true) ||
        (typeof confidence === 'number' && (!Number.isFinite(confidence) || confidence < 0.5))
      transcript = String(recognition.transcript || '').slice(0, 240)
      const locale = 'languageCode' in recognition ? recognition.languageCode : undefined
      if (locale === 'en-IN' || locale === 'hi-IN' || locale === 'mr-IN') detectedLanguage = locale
      outcome = gradeLevel2Transcription(transcript, expected, uncertain)
    }
    const teaching = await composeKGTeachingTurn({ level: 2, letter: expected,
      outcome, transcript, detectedLanguage, noSpeech: req.body?.noSpeech === true,
      uncertain: outcome === 'unclear', existingFeedbackText: feedbackText(expected, outcome) })
    timing.note('feedbackSource', teaching.source)
    const words = teaching.feedbackText
    let saved: IKGLevel2Attempt
    try {
      saved = await timing.time('save', () => KGLevel2Attempt.create({
        studentId, schoolId, submissionId: id, index: row.currentIndex, letter: expected,
        outcome, feedbackText: words, feedbackLanguageCode: teaching.languageCode,
      }))
    } catch (error) {
      if ((error as { code?: number }).code !== 11000) throw error
      const previous = await KGLevel2Attempt.findOne({ studentId, schoolId, submissionId: id })
      if (!previous || previous.index !== row.currentIndex) throw ApiError.conflict('Another answer is being checked')
      saved = previous
    }
    res.setHeader('Cache-Control', 'private, no-store')
    const updated = await readState(row)
    const measured = timing.finish()
    res.setHeader('Server-Timing', serverTimingHeader(measured.steps))
    logTurnTiming(logger, 'attempt', measured,
      { submissionId: id, outcome: saved.outcome, mode: 'speak' },
      { enabled: process.env.KG_TURN_TIMING_LOG !== 'false', slowMs: parseSlowTurnMs(process.env.KG_SLOW_TURN_MS) })
    ok(res, { outcome: saved.outcome, submissionId: id, feedbackText: saved.feedbackText, state: updated })
  }),
  feedbackAudio: catchAsync(async (req: Request, res: Response) => {
    const { studentId, schoolId } = await authorized(req)
    const row = await levelState(studentId, schoolId)
    const ticketHash = await introGuard(req, row)
    const id = submissionId(req.params.submissionId)
    const attempt = await KGLevel2Attempt.findOne({ studentId, schoolId, submissionId: id })
    if (!attempt || attempt.index !== row.currentIndex) throw ApiError.notFound('Current Level 2 response not found')
    const receipt = issueKGFeedbackReceipt({
      studentId: studentId.toString(), schoolId: schoolId.toString(), submissionId: id,
      introTicketHash: ticketHash, feedbackText: attempt.feedbackText,
    })
    const audioTiming = createTurnTimer()
    audioTiming.note('level', 2)
    await speak(res, attempt.feedbackText, receipt, audioTiming, attempt.feedbackLanguageCode)
    logTurnTiming(logger, 'audio', audioTiming.finish(),
      { submissionId: id, outcome: attempt.outcome, mode: 'speak' },
      { enabled: process.env.KG_TURN_TIMING_LOG !== 'false', slowMs: parseSlowTurnMs(process.env.KG_SLOW_TURN_MS) })
  }),
  acknowledge: catchAsync(async (req: Request, res: Response) => {
    const { studentId, schoolId } = await authorized(req)
    const row = await levelState(studentId, schoolId)
    const ticketHash = await introGuard(req, row)
    const id = submissionId(req.params.submissionId)
    const attempt = await KGLevel2Attempt.findOne({ studentId, schoolId, submissionId: id })
    if (!attempt || attempt.index !== row.currentIndex) throw ApiError.notFound('Current Level 2 response not found')
    if (!verifyKGFeedbackReceipt(req.body?.feedbackReceipt, {
      studentId: studentId.toString(), schoolId: schoolId.toString(), submissionId: id,
      introTicketHash: ticketHash, feedbackText: attempt.feedbackText,
    })) throw ApiError.conflict('Listen to Miss Julie before continuing')
    await KGLevel2Attempt.updateOne({ studentId, schoolId, submissionId: id, feedbackAcknowledgedAt: { $exists: false } },
      { $set: { feedbackAcknowledgedAt: new Date() } })
    if (attempt.outcome === 'correct') {
      const result = await KGLevel2Progress.updateOne(
        { studentId, schoolId, currentIndex: attempt.index },
        { $inc: { currentIndex: 1 }, ...(attempt.index === 5 ? { $set: { completedAt: new Date() } } : {}) },
      )
      // Concurrent duplicate ACKs never grant the next letter twice.
      if (result.modifiedCount === 0 && row.currentIndex === attempt.index) throw ApiError.conflict('Answer progress is being saved')
    }
    const fresh = await levelState(studentId, schoolId)
    res.setHeader('Cache-Control', 'private, no-store')
    ok(res, await readState(fresh))
  }),
}
