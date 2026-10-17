import { Request, Response } from 'express'
import { createHash, randomUUID, randomBytes } from 'node:crypto'
import { Types } from 'mongoose'
import { catchAsync } from '../utils/catchAsync'
import { ok } from '../utils/ApiResponse'
import { ApiError } from '../utils/ApiError'
import { Student } from '../models/Student'
import { KGAlphabetProgress } from '../models/KGAlphabetProgress'
import { KGAlphabetAttempt, type IKGAlphabetAttempt } from '../models/KGAlphabetAttempt'
import { KGAlphabetSubmission } from '../models/KGAlphabetSubmission'
import { KGIntroPlayback } from '../models/KGIntroPlayback'
import { AUDIO_IDS, AUDIO_LINES, LETTERS, activityAt, audioKey, evaluateKGSpeech, KG_ALPHABET_VERSION, KG_AUDIO_VERSION, type AudioId } from '../kg/alphabet-content'
import { isAuthorizedKGAlphabetStudent } from '../services/kg-pilot-access'
import { getKGStaticAudio } from '../services/kg-static-audio-cache'
import { KGSpeechService } from '../services/kg-speech.service'
import { kgTeachingHint } from '../services/kg-teaching-hint'
import { env } from '../config/env'
import { isSupportedVoiceAudioMimeType } from '../schemas/voice.schema'

async function studentContext(req: Request) {
  if (req.auth?.role !== 'STUDENT') throw ApiError.forbidden('Student login required')
  const student = await Student.findById(req.auth.id).select('grade status schoolId fullName kgAlphabetPilotEnabled')
  if (!student || student.schoolId.toString() !== req.auth.schoolId ||
      !isAuthorizedKGAlphabetStudent({ id: student._id.toString(), grade: student.grade, status: student.status, kgAlphabetPilotEnabled: student.kgAlphabetPilotEnabled })) {
    throw ApiError.forbidden('KG Level 1 is not enabled for this student. Ask your school administrator to enable the ABCD pilot in Students.')
  }
  return student
}

async function ensureState(req: Request) {
  const student = await studentContext(req)
  const state = await KGAlphabetProgress.findOneAndUpdate(
    { studentId: student._id, schoolId: student.schoolId },
    { $setOnInsert: { studentId: student._id, schoolId: student.schoolId, version: KG_ALPHABET_VERSION, currentIndex: 0, introSeen: false } },
    { upsert: true, new: true, runValidators: true },
  )
  if (!state) throw ApiError.internal('Unable to load KG progress')
  return { student, state }
}

function presentState(state: { currentIndex: number; introSeen: boolean; completedAt?: Date }) {
  const index = state.currentIndex
  return {
    version: KG_ALPHABET_VERSION,
    level: 1,
    title: 'ABCD Picture Garden',
    currentIndex: index,
    totalActivities: 8,
    audioVersion: KG_AUDIO_VERSION,
    introSeen: state.introSeen,
    completed: index === 8,
    completedAt: state.completedAt || null,
    level2Unlocked: index === 8,
    // Level 2 is not yet published; never provide a clickable lesson link for it.
    level2Available: false,
    letters: LETTERS,
    activity: activityAt(index),
    audio: Object.fromEntries(AUDIO_IDS.map((id) => [id, { text: AUDIO_LINES[id], url: `/kg-alphabet/audio/${KG_AUDIO_VERSION}/${id}` }])),
  }
}

function validateSubmissionId(value: unknown): string {
  if (typeof value !== 'string' || !/^[a-zA-Z0-9_-]{12,80}$/.test(value)) throw ApiError.badRequest('Invalid submission ID')
  return value
}

function feedbackFor(outcome: string, reason?: string) {
  return outcome === 'correct' ? 'great' : outcome === 'incorrect' ? 'try-again' : reason === 'silence' ? 'silence' : 'repeat'
}

async function applyRecordedProgress(attempt: { studentId: Types.ObjectId; schoolId: Types.ObjectId; activityId: string; outcome: string; replay: boolean; createdAt: Date }) {
  if (attempt.outcome !== 'correct' || attempt.replay) return
  const index = Array.from({ length: 8 }, (_, i) => i).find((i) => activityAt(i)?.id === attempt.activityId)
  if (index === undefined) return
  // This also repairs a request interrupted between saving the attempt and progress.
  await KGAlphabetProgress.updateOne({ studentId: attempt.studentId, schoolId: attempt.schoolId, currentIndex: index }, {
    $set: { currentIndex: index + 1, ...(index === 7 ? { completedAt: attempt.createdAt } : {}) },
  })
}

const INTRO_MINIMUM_MS = 59_000 // The packaged film is 63.018 seconds; allow minor timer skew.
const INTRO_TICKET_LIFETIME_MS = 2 * 60 * 60 * 1000
function tokenHash(raw: string): string { return createHash('sha256').update(raw).digest('hex') }
function isPlaybackId(raw: unknown): raw is string { return typeof raw === 'string' && /^[a-f0-9]{64}$/.test(raw) }

/** A completed, unexpired ticket belongs to the authenticated student and school. */
async function assertIntroTicket(req: Request, studentId: Types.ObjectId, schoolId: Types.ObjectId) {
  const raw = req.get('x-kg-intro-playback')
  if (!isPlaybackId(raw)) throw ApiError.conflict('Please watch the full Miss Julie introduction before this activity.')
  const playback = await KGIntroPlayback.findOne({ studentId, schoolId, tokenHash: tokenHash(raw),
    completedAt: { $exists: true }, expiresAt: { $gt: new Date() } }).select('+tokenHash').lean()
  if (!playback) throw ApiError.conflict('Your introduction session has expired. Watch the introduction again.')
}

export const KGAlphabetController = {
  state: catchAsync(async (req: Request, res: Response) => {
    const { state } = await ensureState(req)
    ok(res, presentState(state))
  }),
  /** Starts a per-visit watch; no client-side localStorage trust. */
  startIntro: catchAsync(async (req: Request, res: Response) => {
    const { student } = await ensureState(req)
    const playbackId = randomBytes(32).toString('hex')
    // A fresh entry invalidates prior watch tickets, including previously completed
    // tickets that would otherwise allow an earlier visit to bypass the intro.
    await KGIntroPlayback.updateMany(
      { studentId: student._id, schoolId: student.schoolId, expiresAt: { $gt: new Date() } },
      { $set: { expiresAt: new Date() } },
    )
    await KGIntroPlayback.create({
      studentId: student._id, schoolId: student.schoolId, tokenHash: tokenHash(playbackId),
      startedAt: new Date(), expiresAt: new Date(Date.now() + INTRO_TICKET_LIFETIME_MS),
    })
    res.setHeader('Cache-Control', 'no-store')
    ok(res, { playbackId, minimumSeconds: Math.ceil(INTRO_MINIMUM_MS / 1000) })
  }),
  markIntro: catchAsync(async (req: Request, res: Response) => {
    if (req.body?.videoEnded !== true || !isPlaybackId(req.body?.playbackId)) {
      throw ApiError.badRequest('Complete the full Miss Julie story before continuing')
    }
    const { student } = await ensureState(req)
    const now = new Date()
    const playback = await KGIntroPlayback.findOne({ studentId: student._id, schoolId: student.schoolId,
      tokenHash: tokenHash(req.body.playbackId), expiresAt: { $gt: now } }).select('+tokenHash')
    if (!playback) throw ApiError.conflict('Video session expired. Restart the story.')
    if (!playback.completedAt) {
      if (now.getTime() - playback.startedAt.getTime() < INTRO_MINIMUM_MS) {
        throw ApiError.conflict('The full story has not finished yet.')
      }
      await KGIntroPlayback.updateOne({ _id: playback._id, completedAt: { $exists: false } }, { $set: { completedAt: now } })
    }
    await KGAlphabetProgress.updateOne({ studentId: student._id, schoolId: student.schoolId }, { $set: { introSeen: true } })
    res.setHeader('Cache-Control', 'no-store')
    ok(res, { introSeen: true })
  }),
  audio: catchAsync(async (req: Request, res: Response) => {
    await studentContext(req)
    const id = req.params.id as AudioId
    if (req.params.version !== KG_AUDIO_VERSION || !AUDIO_IDS.includes(id)) throw ApiError.notFound('Audio clip not found')
    const audio = await getKGStaticAudio(audioKey(id))
    if (!audio) throw ApiError.notFound('Miss Julie’s lesson audio is temporarily unavailable. Please try again later.')
    const etag = `"${createHash('sha256').update(audio).digest('hex')}"`
    if (req.headers['if-none-match'] === etag) return res.status(304).end()
    res.setHeader('Content-Type', 'audio/mpeg')
    res.setHeader('Content-Length', String(audio.length))
    res.setHeader('Content-Disposition', `inline; filename="${id}.mp3"`)
    res.setHeader('Cache-Control', 'private, max-age=31536000, immutable')
    res.setHeader('Vary', 'Authorization')
    res.setHeader('ETag', etag)
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.send(audio)
  }),
  attempt: catchAsync(async (req: Request, res: Response) => {
    const { student, state } = await ensureState(req)
    if (!state.introSeen) throw ApiError.conflict('Watch Miss Julie’s Level 1 story to the end before starting the activities.')
    await assertIntroTicket(req, student._id, student.schoolId)
    const submissionId = validateSubmissionId(req.body?.submissionId)
    const identity = { studentId: student._id, schoolId: student.schoolId, submissionId }
    const requestHash = createHash('sha256').update(JSON.stringify({
      activityId: req.body?.activityId, replay: req.body?.replay === true,
      selected: req.body?.selected, audioBase64: req.body?.audioBase64,
      mimeType: req.body?.mimeType, durationMs: req.body?.durationMs, timeSpentMs: req.body?.timeSpentMs,
      noSpeech: req.body?.noSpeech,
    })).digest('hex')
    const returnRecorded = async (attempt: IKGAlphabetAttempt) => {
      if (attempt.requestHash && attempt.requestHash !== requestHash) throw ApiError.conflict('This submission ID was already used for another answer')
      await applyRecordedProgress(attempt)
      const latest = await KGAlphabetProgress.findOne({ studentId: student._id, schoolId: student.schoolId })
      return ok(res, { outcome: attempt.outcome, replay: attempt.replay, state: presentState(latest || state), duplicate: true,
        feedbackAudioId: feedbackFor(attempt.outcome, attempt.recognitionReason),
        teachingHint: kgTeachingHint(attempt.letter as typeof LETTERS[number]['letter'], attempt.mode, attempt.outcome as 'correct' | 'incorrect' | 'unclear') })
    }
    const existing = await KGAlphabetAttempt.findOne(identity)
    if (existing) return returnRecorded(existing)

    const activityId = String(req.body?.activityId || '')
    const replay = req.body?.replay === true
    const index = Array.from({ length: 8 }, (_, i) => i).find((i) => activityAt(i)?.id === activityId)
    if (index === undefined) throw ApiError.badRequest('Unknown KG activity')
    if (replay ? index >= state.currentIndex : index !== state.currentIndex) {
      throw ApiError.conflict('This activity is not currently available. Reload your lesson.')
    }
    const activity = activityAt(index)!
    let outcome: 'correct' | 'incorrect' | 'unclear'
    let transcript: string | undefined
    let selected: string | undefined
    const reportedTimeMs = req.body?.timeSpentMs === undefined ? 0 : Number(req.body.timeSpentMs)
    if (!Number.isFinite(reportedTimeMs) || reportedTimeMs < 0 || reportedTimeMs > 300000) {
      throw ApiError.badRequest('Activity time must be between 0 and 300 seconds')
    }

    const owner = randomUUID()
    const lease = { ...identity, requestHash, owner, expiresAt: new Date(Date.now() + Math.max(60000, env.sttTimeoutMs * 2 + 10000)) }
    try { await KGAlphabetSubmission.create(lease) }
    catch (error) {
      if ((error as { code?: number }).code !== 11000) throw error
      const recovered = await KGAlphabetSubmission.findOneAndUpdate({ ...identity, requestHash, expiresAt: { $lt: new Date() } }, { $set: lease })
      if (!recovered) {
        res.setHeader('Retry-After', '1')
        throw new ApiError(409, 'CONFLICT', 'This answer is still being checked. Please retry shortly.', { retryable: true })
      }
    }
    try {
      const recordedDuringLease = await KGAlphabetAttempt.findOne(identity)
      if (recordedDuringLease) return await returnRecorded(recordedDuringLease)
      let sttProvider: string | undefined
      let sttConfidence: number | undefined
      let recognitionReason: 'silence' | 'uncertain' | undefined

      if (activity.mode === 'speak' && req.body?.noSpeech === true) {
        const durationMs = Number(req.body?.durationMs)
        if (!Number.isFinite(durationMs) || durationMs < 250 || durationMs > 12000) throw ApiError.badRequest('A valid listening duration is required')
        // A local silence event may only create an unclear attempt; it can never pass.
        outcome = 'unclear'; recognitionReason = 'silence'
      } else if (activity.mode === 'speak') {
        const mimeType = String(req.body?.mimeType || '')
        const audioBase64 = req.body?.audioBase64
        if (!isSupportedVoiceAudioMimeType(mimeType) || typeof audioBase64 !== 'string' || audioBase64.length > 11_000_000 || audioBase64.length < 128) {
          throw ApiError.badRequest('A short valid audio recording is required')
        }
        const durationMs = Number(req.body?.durationMs)
        if (!Number.isFinite(durationMs) || durationMs < 250 || durationMs > 12000) throw ApiError.badRequest('Audio must be between 0.25 and 12 seconds')
        if (!/^[A-Za-z0-9+/]+={0,2}$/.test(audioBase64) || audioBase64.length % 4 === 1) throw ApiError.badRequest('Invalid audio encoding')
        const transcription = await KGSpeechService.transcribe({ audioBase64, mimeType, durationMs })
        if (!transcription.available) throw ApiError.provider('Speech recognition is temporarily unavailable')
        transcript = String(transcription.transcript || '').slice(0, 240)
        sttProvider = transcription.provider
        const confidence = 'confidence' in transcription ? transcription.confidence : undefined
        sttConfidence = typeof confidence === 'number' && Number.isFinite(confidence) && confidence >= 0 && confidence <= 1 ? confidence : undefined
        outcome = ('uncertain' in transcription && transcription.uncertain === true) ||
          (confidence !== undefined && (sttConfidence === undefined || sttConfidence < 0.5))
          ? 'unclear' : evaluateKGSpeech(transcript, activity.letter, 'word')
        if (outcome === 'unclear') recognitionReason = 'uncertain'
      } else {
        selected = String(req.body?.selected || '').toLowerCase().trim().slice(0, 20)
        if (!LETTERS.some((item) => item.word === selected)) throw ApiError.badRequest('Choose one of the four pictures')
        outcome = LETTERS.find((item) => item.letter === activity.letter)?.word === selected ? 'correct' : 'incorrect'
      }

      try {
        const saved = await KGAlphabetAttempt.create({ studentId: student._id, schoolId: student.schoolId, activityId, letter: activity.letter,
          mode: activity.mode, outcome, transcript, selected, replay, timeSpentMs: Math.round(reportedTimeMs), submissionId, requestHash, sttProvider, sttConfidence, recognitionReason })
        await applyRecordedProgress(saved)
      } catch (error) {
        if ((error as { code?: number }).code !== 11000) throw error
        const prior = await KGAlphabetAttempt.findOne(identity)
        if (!prior) throw error
        return await returnRecorded(prior)
      }

      const latest = await KGAlphabetProgress.findOne({ studentId: student._id, schoolId: student.schoolId })
      return ok(res, { outcome, replay, state: presentState(latest || state), feedbackAudioId: feedbackFor(outcome, recognitionReason), teachingHint: kgTeachingHint(activity.letter, activity.mode, outcome) })
    } finally {
      await KGAlphabetSubmission.deleteOne({ ...identity, owner })
    }
  }),
  reports: catchAsync(async (req: Request, res: Response) => {
    if (!req.auth || !['TEACHER', 'SCHOOL_ADMIN'].includes(req.auth.role)) throw ApiError.forbidden()
    const filter = { schoolId: req.auth.schoolId, grade: 0, ...(req.auth.role === 'TEACHER' ? { teacherId: req.auth.id } : {}) }
    const page = Math.min(10000, Math.max(1, Math.floor(Number(req.query.page) || 1)))
    const limit = 40
    const [totalStudents, students] = await Promise.all([
      Student.countDocuments(filter),
      Student.find(filter).select('fullName teacherId').sort({ fullName: 1, _id: 1 }).skip((page - 1) * limit).limit(limit).lean(),
    ])
    const ids = students.map((student) => student._id)
    const [progresses, attempts] = await Promise.all([
      KGAlphabetProgress.find({ schoolId: req.auth.schoolId, studentId: { $in: ids } }).lean(),
      KGAlphabetAttempt.aggregate([
        { $match: { schoolId: new Types.ObjectId(req.auth.schoolId), studentId: { $in: ids } } },
        { $group: {
          _id: '$studentId', attempts: { $sum: 1 },
          scored: { $sum: { $cond: [{ $ne: ['$outcome', 'unclear'] }, 1, 0] } },
          correct: { $sum: { $cond: [{ $eq: ['$outcome', 'correct'] }, 1, 0] } },
          timeSpentMs: { $sum: '$timeSpentMs' },
          replayTimeSpentMs: { $sum: { $cond: ['$replay', '$timeSpentMs', 0] } },
          retryLetters: { $addToSet: { $cond: [{ $eq: ['$outcome', 'incorrect'] }, '$letter', null] } },
        } },
      ]),
    ])
    const progressById = new Map(progresses.map((p) => [p.studentId.toString(), p]))
    const attemptById = new Map(attempts.map((p) => [p._id.toString(), p]))
    const rows = students.map((student) => {
      const id = student._id.toString()
      const stats = attemptById.get(id)
      const scored = stats?.scored || 0
      const retryLetters = (stats?.retryLetters || []).filter((letter: unknown): letter is string => typeof letter === 'string')
      return { studentId: id, studentName: student.fullName, currentIndex: progressById.get(id)?.currentIndex || 0,
        completed: progressById.get(id)?.currentIndex === 8, attempts: stats?.attempts || 0,
        timeSpentMs: stats?.timeSpentMs || 0,
        replayTimeSpentMs: stats?.replayTimeSpentMs || 0,
        accuracy: scored ? Math.round((stats?.correct || 0) / scored * 100) : null,
        retryLetters }
    })
    ok(res, { level: 1, students: rows, completedCount: rows.filter((row) => row.completed).length,
      totalStudents, page, pageSize: limit, hasNext: page * limit < totalStudents, reportType: 'deterministic' })
  }),
  report: catchAsync(async (req: Request, res: Response) => {
    if (!req.auth || !['TEACHER', 'SCHOOL_ADMIN'].includes(req.auth.role)) throw ApiError.forbidden()
    const schoolId = req.auth.schoolId
    const studentId = String(req.params.studentId || '')
    if (!Types.ObjectId.isValid(studentId)) throw ApiError.badRequest('Invalid student ID')
    const student = await Student.findOne({ _id: studentId, schoolId, grade: 0 }).select('fullName grade teacherId').lean()
    if (!student) throw ApiError.notFound('KG student not found in your school')
    if (req.auth.role === 'TEACHER' && student.teacherId?.toString() !== req.auth.id) throw ApiError.forbidden('This student is not assigned to you')
    const [progress, attempts] = await Promise.all([
      KGAlphabetProgress.findOne({ studentId, schoolId }).lean(),
      KGAlphabetAttempt.aggregate([
        { $match: { studentId: new Types.ObjectId(studentId), schoolId: new Types.ObjectId(schoolId) } },
        { $group: {
          _id: '$letter', attempts: { $sum: 1 },
          scored: { $sum: { $cond: [{ $ne: ['$outcome', 'unclear'] }, 1, 0] } },
          correct: { $sum: { $cond: [{ $eq: ['$outcome', 'correct'] }, 1, 0] } },
          retries: { $sum: { $cond: [{ $eq: ['$outcome', 'incorrect'] }, 1, 0] } },
          unclear: { $sum: { $cond: [{ $eq: ['$outcome', 'unclear'] }, 1, 0] } },
          timeSpentMs: { $sum: '$timeSpentMs' },
          replayTimeSpentMs: { $sum: { $cond: ['$replay', '$timeSpentMs', 0] } },
        } },
      ]),
    ])
    const letterStats = new Map(attempts.map((attempt) => [attempt._id, attempt]))
    const letters = LETTERS.map(({ letter }) => {
      const stats = letterStats.get(letter)
      const scored = stats?.scored || 0
      const correct = stats?.correct || 0
      return { letter, attempts: stats?.attempts || 0, correct,
        accuracy: scored ? Math.round(correct / scored * 100) : null,
        retries: stats?.retries || 0, timeSpentMs: stats?.timeSpentMs || 0,
        replayTimeSpentMs: stats?.replayTimeSpentMs || 0, unclear: stats?.unclear || 0 }
    })
    ok(res, { studentId, studentName: student.fullName, level: 1, currentIndex: progress?.currentIndex || 0,
      completedAt: progress?.completedAt || null, totalAttempts: letters.reduce((sum, row) => sum + row.attempts, 0),
      timeSpentMs: letters.reduce((sum, row) => sum + row.timeSpentMs, 0),
      replayTimeSpentMs: letters.reduce((sum, row) => sum + row.replayTimeSpentMs, 0),
      letters, needsPractice: letters.filter((l) => l.retries > 0 || (l.accuracy !== null && l.accuracy < 70)).map((l) => l.letter),
      // Deterministic teacher-facing metrics. AI narrative can be added separately.
      reportType: 'deterministic' })
  }),
}
