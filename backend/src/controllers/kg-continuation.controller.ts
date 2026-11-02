import type { Request, Response } from 'express'
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import { Types } from 'mongoose'
import { Student } from '../models/Student'
import { KGAlphabetProgress } from '../models/KGAlphabetProgress'
import { KGLevel2Progress } from '../models/KGLevel2Progress'
import { KGContinuationProgress, type IKGContinuationProgress } from '../models/KGContinuationProgress'
import { KGContinuationAttempt, type IKGContinuationAttempt } from '../models/KGContinuationAttempt'
import { isAuthorizedKGAlphabetStudent } from '../services/kg-pilot-access'
import { KGSpeechService } from '../services/kg-speech.service'
import { AzureVoiceProvider } from '../providers/voice/AzureVoiceProvider'
import { PythonVoiceProvider } from '../providers/voice/PythonVoiceProvider'
import { issueKGFeedbackReceipt, verifyKGFeedbackReceipt } from '../services/kg-feedback-receipt'
import { isSupportedVoiceAudioMimeType } from '../schemas/voice.schema'
import { KG_CONTINUATION_LEVELS, isKGContinuationLevel, continuationLesson, getKGContinuationNarration, type KGContinuationLevel } from '../kg/student-continuation-catalog'
import { ApiError } from '../utils/ApiError'
import { ok } from '../utils/ApiResponse'
import { catchAsync } from '../utils/catchAsync'

const INTRO_MIN_MS = 10_000
const INTRO_VALID_MS = 2 * 60 * 60_000
const hash = (value: string) => createHash('sha256').update(value).digest('hex')
function safeSame(a: string, b: string) {
  const x = Buffer.from(a, 'hex'), y = Buffer.from(b, 'hex')
  return x.length === 32 && y.length === 32 && timingSafeEqual(x, y)
}
function safeId(raw: unknown) {
  if (typeof raw !== 'string' || !/^[a-zA-Z0-9_-]{12,80}$/.test(raw)) throw ApiError.badRequest('Invalid answer ID')
  return raw
}
function requestedLevel(req: Request): KGContinuationLevel {
  const raw = req.params.level
  const number = typeof raw === 'string' && /^[3-9]$/.test(raw) ? Number(raw) : NaN
  if (!isKGContinuationLevel(number)) throw ApiError.notFound('That level has not been approved for this student pilot')
  return number
}
async function identity(req: Request) {
  if (req.auth?.role !== 'STUDENT') throw ApiError.forbidden('Student login required')
  const student = await Student.findOne({ _id: req.auth.id, schoolId: req.auth.schoolId })
    .select('_id schoolId grade status kgAlphabetPilotEnabled')
  if (!student || !isAuthorizedKGAlphabetStudent({
    id: student._id.toString(), grade: student.grade, status: student.status,
    kgAlphabetPilotEnabled: student.kgAlphabetPilotEnabled,
  })) throw ApiError.forbidden('KG student pilot not enabled')
  return { studentId: student._id, schoolId: student.schoolId }
}
async function completedPrerequisite(studentId: Types.ObjectId, schoolId: Types.ObjectId, level: KGContinuationLevel): Promise<boolean> {
  if (level === 3) {
    const kg1 = await KGAlphabetProgress.findOne({ studentId, schoolId }).select('currentIndex').lean()
    if (kg1?.currentIndex !== 8) return false
    const kg2 = await KGLevel2Progress.findOne({ studentId, schoolId }).select('currentIndex').lean()
    return kg2?.currentIndex === 6
  }
  const previous = await KGContinuationProgress.findOne({ studentId, schoolId, level: level - 1 })
    .select('currentIndex completedAt').lean()
  return Boolean(previous?.completedAt && previous.currentIndex === continuationLesson((level - 1) as KGContinuationLevel).letters.length)
}
async function access(req: Request) {
  const level = requestedLevel(req)
  const { studentId, schoolId } = await identity(req)
  if (!(await completedPrerequisite(studentId, schoolId, level))) throw ApiError.forbidden('Complete the previous KG level before continuing')
  return { studentId, schoolId, level }
}
async function row(studentId: Types.ObjectId, schoolId: Types.ObjectId, level: KGContinuationLevel) {
  const existing = await KGContinuationProgress.findOneAndUpdate(
    { studentId, level }, { $setOnInsert: { studentId, schoolId, level, currentIndex: 0 } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).select('+introTicketHash')
  if (!existing || existing.schoolId.toString() !== schoolId.toString()) throw ApiError.forbidden('KG progress school mismatch')
  return existing
}
function ticket(req: Request, record: IKGContinuationProgress) {
  const id = req.get('X-KG-Continuation-Intro') || ''
  if (!/^[a-f0-9]{64}$/.test(id) || !record.introTicketHash ||
      !safeSame(record.introTicketHash, hash(id)) || !record.introStartedAt ||
      Date.now() - record.introStartedAt.getTime() > INTRO_VALID_MS ||
      !record.introCompletedAt || record.introCompletedAt.getTime() < record.introStartedAt.getTime()) {
    throw ApiError.conflict('Watch the full introduction with Miss Julie first')
  }
  return hash(id)
}
function publicState(record: IKGContinuationProgress, pending: IKGContinuationAttempt | null) {
  const lesson = continuationLesson(record.level as KGContinuationLevel)
  return {
    level: record.level, title: lesson.title, currentIndex: record.currentIndex,
    totalActivities: lesson.letters.length,
    completed: record.currentIndex === lesson.letters.length && Boolean(record.completedAt),
    completedAt: record.completedAt || null,
    activity: record.currentIndex < lesson.letters.length
      ? { letter: lesson.letters[record.currentIndex], mode: 'speak' } : null,
    pendingFeedback: pending ? {
      submissionId: pending.submissionId, letter: pending.letter,
      outcome: pending.outcome, feedbackText: pending.feedbackText,
    } : null,
  }
}
async function state(record: IKGContinuationProgress) {
  const pending = record.completedAt ? null : await KGContinuationAttempt.findOne({
    studentId: record.studentId, schoolId: record.schoolId, level: record.level,
    index: record.currentIndex, feedbackAcknowledgedAt: { $exists: false },
  }).sort({ createdAt: -1 })
  return publicState(record, pending)
}
function feedback(letter: string, verdict: IKGContinuationAttempt['outcome']) {
  if (verdict === 'correct') return 'Wonderful! You said ' + letter + '! You are learning English!'
  if (verdict === 'unclear') return 'I am listening. Take your time and say the letter ' + letter + '.'
  return 'Good try! Listen again and say the letter ' + letter + '.'
}
async function voice(res: Response, text: string, receipt?: string) {
  let audio: Buffer, contentType: string, provider: string
  try {
    const output = await new AzureVoiceProvider().synthesizeUncached(text)
    audio = output.audio; contentType = output.contentType; provider = 'azure'
    if (audio.length < 256 || audio.length > 8 * 1024 * 1024) throw Error('Azure response invalid')
  } catch {
    const output = await new PythonVoiceProvider().synthesize(text)
    audio = output.audioBase64 ? Buffer.from(output.audioBase64, 'base64') : Buffer.alloc(0)
    contentType = output.contentType || ''
    provider = 'python-priya-fallback'
    if (!output.available) throw ApiError.provider('KG_CONTINUATION_AUDIO_UNAVAILABLE')
  }
  if (audio.length < 256 || audio.length > 8 * 1024 * 1024 ||
      !/^audio\/[a-z0-9.+-]+(?:\s*;.*)?$/i.test(contentType)) throw ApiError.provider('KG_CONTINUATION_AUDIO_INVALID')
  res.setHeader('Content-Type', contentType)
  res.setHeader('Content-Length', String(audio.length))
  res.setHeader('Cache-Control', 'private, no-store')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Voice-Provider', provider)
  if (receipt) res.setHeader('X-KG-Feedback-Receipt', receipt)
  res.send(audio)
}

export const KGContinuationController = {
  // One server-owned progression projection for every KG stone. Level 6–10
  // remain locked until authored and explicitly listed in the pilot catalog.
  overview: catchAsync(async (req: Request, res: Response) => {
    const { studentId, schoolId } = await identity(req)
    const [kg1, kg2, rows] = await Promise.all([
      KGAlphabetProgress.findOne({ studentId, schoolId }).select('currentIndex').lean(),
      KGLevel2Progress.findOne({ studentId, schoolId }).select('currentIndex').lean(),
      KGContinuationProgress.find({ studentId, schoolId }).select('level currentIndex completedAt').lean(),
    ])
    let previousComplete = kg1?.currentIndex === 8 && kg2?.currentIndex === 6
    let nextLevel: KGContinuationLevel | null = null
    const levels = KG_CONTINUATION_LEVELS.map((level) => {
      const record = rows.find((r) => r.level === level)
      const finished = Boolean(previousComplete && record?.completedAt &&
        record.currentIndex === continuationLesson(level).letters.length)
      const status = !previousComplete ? 'LOCKED' : finished ? 'COMPLETED' : 'CURRENT'
      if (previousComplete && !finished && nextLevel === null) nextLevel = level
      previousComplete = finished
      return { level, title: continuationLesson(level).title, status, currentIndex: record?.currentIndex ?? 0,
        totalActivities: continuationLesson(level).letters.length }
    })
    res.setHeader('Cache-Control', 'private, no-store')
    ok(res, { nextLevel, levels, unavailableLevels: [6, 7, 8, 9, 10] })
  }),
  getState: catchAsync(async (req: Request, res: Response) => {
    const { studentId, schoolId, level } = await access(req)
    res.setHeader('Cache-Control', 'private, no-store')
    ok(res, await state(await row(studentId, schoolId, level)))
  }),
  startIntro: catchAsync(async (req: Request, res: Response) => {
    const { studentId, schoolId, level } = await access(req)
    const progress = await row(studentId, schoolId, level)
    if (progress.completedAt) return ok(res, { completed: true })
    const id = randomBytes(32).toString('hex')
    await KGContinuationProgress.updateOne({ studentId, schoolId, level }, {
      $set: { introTicketHash: hash(id), introStartedAt: new Date() },
      $unset: { introCompletedAt: 1 },
    })
    res.setHeader('Cache-Control', 'private, no-store')
    ok(res, { playbackId: id })
  }),
  completeIntro: catchAsync(async (req: Request, res: Response) => {
    const { studentId, schoolId, level } = await access(req)
    const progress = await row(studentId, schoolId, level)
    const id = req.body?.playbackId
    const elapsed = progress.introStartedAt ? Date.now() - progress.introStartedAt.getTime() : 0
    if (typeof id !== 'string' || !/^[a-f0-9]{64}$/.test(id) || !progress.introTicketHash ||
        !safeSame(progress.introTicketHash, hash(id)) || elapsed < INTRO_MIN_MS || elapsed > INTRO_VALID_MS ||
        req.body?.videoEnded !== true) throw ApiError.conflict('Finish the full introduction before the speaking practice')
    await KGContinuationProgress.updateOne({ studentId, schoolId, level, introTicketHash: progress.introTicketHash },
      { $set: { introCompletedAt: new Date() } })
    res.setHeader('Cache-Control', 'private, no-store')
    ok(res, { introSeen: true })
  }),
  narration: catchAsync(async (req: Request, res: Response) => {
    const { studentId, schoolId, level } = await access(req)
    ticket(req, await row(studentId, schoolId, level))
    const narration = getKGContinuationNarration(level, req.params.id)
    if (!narration) throw ApiError.notFound('Unapproved narration')
    await voice(res, narration)
  }),
  attempt: catchAsync(async (req: Request, res: Response) => {
    const { studentId, schoolId, level } = await access(req)
    const progress = await row(studentId, schoolId, level)
    ticket(req, progress)
    const lesson = continuationLesson(level)
    const index = progress.currentIndex
    if (index >= lesson.letters.length) throw ApiError.conflict('This level is already completed')
    const expected = lesson.letters[index]
    const id = safeId(req.body?.submissionId)
    if (req.body?.letter !== expected) throw ApiError.conflict('Continue with Miss Julie’s current letter')
    const existing = await KGContinuationAttempt.findOne({ studentId, schoolId, level, submissionId: id })
    if (existing) {
      if (existing.index !== index) throw ApiError.conflict('Attempt belongs to a previous letter')
      return ok(res, { ...publicState(progress, existing), submissionId: id, outcome: existing.outcome,
        feedbackText: existing.feedbackText, duplicate: true })
    }
    if (await KGContinuationAttempt.exists({ studentId, schoolId, level, index,
      feedbackAcknowledgedAt: { $exists: false } })) throw ApiError.conflict('Listen to the last response first')
    const durationMs = Number(req.body?.durationMs)
    if (!Number.isFinite(durationMs) || durationMs < 250 || durationMs > 12_000) throw ApiError.badRequest('Invalid recording duration')
    let verdict: IKGContinuationAttempt['outcome'] = 'unclear'
    if (req.body?.noSpeech !== true) {
      const mimeType = req.body?.mimeType
      const audioBase64 = req.body?.audioBase64
      if (!isSupportedVoiceAudioMimeType(mimeType) || typeof audioBase64 !== 'string' ||
          audioBase64.length < 128 || audioBase64.length > 11_000_000 ||
          !/^[A-Za-z0-9+/]+={0,2}$/.test(audioBase64) || audioBase64.length % 4 === 1) {
        throw ApiError.badRequest('Valid short microphone audio is required')
      }
      const stt = await KGSpeechService.transcribe({ mimeType, audioBase64, durationMs })
      if (!stt.available) throw ApiError.provider('Speech recognition temporarily unavailable')
      const confidence = 'confidence' in stt ? stt.confidence : undefined
      const uncertain = ('uncertain' in stt && stt.uncertain === true) ||
        (typeof confidence === 'number' && (!Number.isFinite(confidence) || confidence < 0.5))
      verdict = lesson.grade(String(stt.transcript || ''), expected, uncertain)
    }
    let saved: IKGContinuationAttempt
    try {
      saved = await KGContinuationAttempt.create({
        studentId, schoolId, level, index, submissionId: id, letter: expected,
        outcome: verdict, feedbackText: feedback(expected, verdict),
      })
    } catch (err) {
      if ((err as { code?: number }).code !== 11000) throw err
      const duplicate = await KGContinuationAttempt.findOne({ studentId, schoolId, level, submissionId: id })
      if (!duplicate || duplicate.index !== index) throw ApiError.conflict('Another answer is being processed')
      saved = duplicate
    }
    res.setHeader('Cache-Control', 'private, no-store')
    ok(res, { outcome: saved.outcome, submissionId: id, feedbackText: saved.feedbackText,
      state: await state(progress) })
  }),
  feedbackAudio: catchAsync(async (req: Request, res: Response) => {
    const { studentId, schoolId, level } = await access(req)
    const progress = await row(studentId, schoolId, level)
    const ticketHash = ticket(req, progress)
    const id = safeId(req.params.submissionId)
    const saved = await KGContinuationAttempt.findOne({ studentId, schoolId, level, submissionId: id })
    if (!saved || saved.index !== progress.currentIndex) throw ApiError.notFound('Current feedback not found')
    const receipt = issueKGFeedbackReceipt({ studentId: studentId.toString(), schoolId: schoolId.toString(),
      submissionId: level + ':' + id, introTicketHash: ticketHash, feedbackText: saved.feedbackText })
    await voice(res, saved.feedbackText, receipt)
  }),
  acknowledge: catchAsync(async (req: Request, res: Response) => {
    const { studentId, schoolId, level } = await access(req)
    const progress = await row(studentId, schoolId, level)
    const ticketHash = ticket(req, progress)
    const id = safeId(req.params.submissionId)
    const saved = await KGContinuationAttempt.findOne({ studentId, schoolId, level, submissionId: id })
    if (!saved || saved.index !== progress.currentIndex) throw ApiError.notFound('Current feedback not found')
    if (!verifyKGFeedbackReceipt(req.body?.feedbackReceipt, {
      studentId: studentId.toString(), schoolId: schoolId.toString(),
      submissionId: level + ':' + id, introTicketHash: ticketHash, feedbackText: saved.feedbackText,
    })) throw ApiError.conflict('Listen to Miss Julie before moving forward')
    await KGContinuationAttempt.updateOne({ studentId, schoolId, level, submissionId: id,
      feedbackAcknowledgedAt: { $exists: false } }, { $set: { feedbackAcknowledgedAt: new Date() } })
    // Crash recovery: an ACK may persist before the cursor update. Replaying
    // that signed ACK may finish this exact index once, but CAS prevents
    // additional credit after the cursor has advanced.
    if (saved.outcome === 'correct') {
      const final = saved.index + 1 === continuationLesson(level).letters.length
      await KGContinuationProgress.updateOne({ studentId, schoolId, level, currentIndex: saved.index },
        { $inc: { currentIndex: 1 }, ...(final ? { $set: { completedAt: new Date() } } : {}) })
    }
    const fresh = await row(studentId, schoolId, level)
    res.setHeader('Cache-Control', 'private, no-store')
    ok(res, await state(fresh))
  }),
}
