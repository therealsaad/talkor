import { gradeKGTranscription } from '../kg/kg-child-grading'
import { Request, Response } from 'express'
import { createHash, randomBytes, randomUUID } from 'node:crypto'
import { Types } from 'mongoose'
import { catchAsync } from '../utils/catchAsync'
import { ok } from '../utils/ApiResponse'
import { ApiError } from '../utils/ApiError'
import { Student } from '../models/Student'
import { KGAlphabetProgress } from '../models/KGAlphabetProgress'
import { KGAlphabetAttempt, type IKGAlphabetAttempt } from '../models/KGAlphabetAttempt'
import { KGAlphabetSubmission } from '../models/KGAlphabetSubmission'
import { KGIntroPlayback } from '../models/KGIntroPlayback'
import { AUDIO_IDS, AUDIO_LINES, AUDIO_MANIFEST, LETTERS, activityAt, evaluateKGSpeech, KG_ALPHABET_VERSION, KG_AUDIO_VERSION, type AudioId } from '../kg/alphabet-content'
import { isAuthorizedKGAlphabetStudent } from '../services/kg-pilot-access'
import { getKGAzureNarrationAudio } from '../services/kg-azure-narration.service'
import { PythonVoiceProvider } from '../providers/voice/PythonVoiceProvider'
import { AzureVoiceProvider } from '../providers/voice/AzureVoiceProvider'
import { KGQwenFeedbackService } from '../services/kg-qwen-feedback.service'
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
    // studentId is the model's unique key. Older progress rows can retain a
    // previous schoolId, so including schoolId in an upsert filter makes Mongo
    // try to insert a second row and fail with E11000 instead of loading it.
    { studentId: student._id },
    {
      $set: { schoolId: student.schoolId },
      $setOnInsert: { studentId: student._id, version: KG_ALPHABET_VERSION, currentIndex: 0, introSeen: false },
    },
    { upsert: true, new: true, runValidators: true },
  )
  if (!state) throw ApiError.internal('Unable to load KG progress')
  // Phase 2B: repair already-completed KG1 records written before Phase 1
  // rewards/homework existed. No replays, extra XP or cross-student writes.
  // Keep KGAlphabetProgress canonical rather than creating invalid generic
  // Progress rows without a published CurriculumClass/Level relationship.
  if (state.currentIndex === 8 && (state.xp < 100 || state.stars < 3 ||
      state.homeworkStatus === 'not-assigned' || !state.homeworkAssignedAt || !state.completedAt)) {
    const finalActivityId = activityAt(7)?.id
    const finalAttempt = finalActivityId ? await KGAlphabetAttempt.findOne({
      studentId: student._id, schoolId: student.schoolId,
      activityId: finalActivityId, outcome: 'correct', replay: false,
    }).select('createdAt').sort({ createdAt: 1 }).lean() : null
    const recordedAt = finalAttempt?.createdAt || state.completedAt || state.updatedAt || new Date()
    const set: Record<string, unknown> = {}
    if (state.homeworkStatus === 'not-assigned') set.homeworkStatus = 'pending'
    if (!state.homeworkAssignedAt) set.homeworkAssignedAt = recordedAt
    // Only claim a lesson-completion timestamp when supported by a saved
    // successful final answer. Do not fabricate historical completion times.
    if (!state.completedAt && finalAttempt?.createdAt) set.completedAt = finalAttempt.createdAt
    const refreshed = await KGAlphabetProgress.findOneAndUpdate(
      { _id: state._id, schoolId: student.schoolId, currentIndex: 8 },
      { $max: { xp: 100, stars: 3 }, ...(Object.keys(set).length ? { $set: set } : {}) },
      { new: true, runValidators: true },
    )
    if (refreshed) return { student, state: refreshed }
  }
  return { student, state }
}

function presentState(state: { currentIndex: number; introSeen: boolean; completedAt?: Date; xp?: number; stars?: number; homeworkStatus?: string; homeworkAssignedAt?: Date; homeworkCompletedAt?: Date; pronunciationNeedsPractice?: string[] }) {
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
    fallbackAvailable: false,
    pronunciationNeedsPractice: state.pronunciationNeedsPractice || [],
    completedAt: state.completedAt || null,
    xp: state.xp ?? 0,
    stars: state.stars ?? 0,
    homework: { id: 'kg-abcd-picture-homework-v1', audioId: 'homework-abcd', text: AUDIO_LINES['homework-abcd'], status: state.homeworkStatus || 'not-assigned', assignedAt: state.homeworkAssignedAt || null, completedAt: state.homeworkCompletedAt || null },
    level2Unlocked: index === 8,
    // Level 2 is not yet published; never provide a clickable lesson link for it.
    level2Available: false,
    letters: LETTERS,
    activity: activityAt(index),
    audio: Object.fromEntries(AUDIO_IDS.map((id) => [id, {
      text: AUDIO_LINES[id],
      kind: AUDIO_MANIFEST.find((clip) => clip.id === id)!.kind,
      url: `/kg-alphabet/audio/${KG_AUDIO_VERSION}/${id}`,
    }])),
  }
}

/** Once two speaking attempts fail, let the learner demonstrate comprehension.
 * This never certifies speaking mastery, and the count is trusted server-side.
 */
async function canUsePictureSupport(studentId: Types.ObjectId, schoolId: Types.ObjectId, currentIndex: number): Promise<boolean> {
  const activity = activityAt(currentIndex)
  if (!activity || activity.mode !== 'speak') return false
  const failures = await KGAlphabetAttempt.countDocuments({ studentId, schoolId, activityId: activity.id,
    mode: 'speak', replay: false, outcome: { $in: ['incorrect', 'unclear', 'supported'] } })
  return failures >= 2
}

function validateSubmissionId(value: unknown): string {
  if (typeof value !== 'string' || !/^[a-zA-Z0-9_-]{12,80}$/.test(value)) throw ApiError.badRequest('Invalid submission ID')
  return value
}

function feedbackFor(outcome: string, reason?: string, letter?: typeof LETTERS[number]['letter'], mode?: 'speak' | 'touch'): AudioId {
  if (reason === 'silence') return 'silence'
  if (outcome === 'supported' && mode === 'touch') return 'picture-support'
  if (outcome === 'supported' && letter) return `bridge-${letter.toLowerCase()}` as AudioId
  if (outcome === 'correct') return 'great'
  if (mode === 'speak' && letter) return `model-${letter.toLowerCase()}` as AudioId
  return outcome === 'incorrect' ? 'try-again' : 'repeat'
}

/** Feedback text is a reviewed server-owned line spoken by the live Priya service. */
function spokenFeedback(input: { letter: typeof LETTERS[number]['letter']; mode: 'speak' | 'touch'; outcome: string; noSpeech?: boolean }) {
  const id = feedbackFor(input.outcome, input.noSpeech ? 'silence' : undefined, input.letter, input.mode)
  return { feedbackText: AUDIO_LINES[id], feedbackAudioBase64: null, feedbackVoice: 'dynamic_tts', feedbackSource: 'reviewed' }
}

async function sendKGVoice(res: Response, text: string) {
  // Fixed navigation/feedback lines use the same verified Azure-first path as
  // submitted feedback. No dependency on local Python for normal KG playback.
  return sendKGAzure(res, text)
}

async function kgDynamicFeedback(input: { letter: typeof LETTERS[number]['letter']; mode: 'speak' | 'touch'; outcome: 'correct' | 'incorrect' | 'unclear' | 'supported'; transcript?: string; selected?: string; noSpeech?: boolean }) {
  const coached = await KGQwenFeedbackService.compose(input)
  return { feedbackText: coached.text, feedbackAudioBase64: null, feedbackVoice: 'azure' as const }
}

async function sendKGAzure(res: Response, text: string) {
  // Live Azure is the preferred voice. If its audio generation fails, use
  // local Priya 8001 for this *same, server-owned* feedback sentence. Never
  // let a failed provider mark the attempt heard or silently progress.
  let azure: Awaited<ReturnType<AzureVoiceProvider['synthesizeUncached']>> | null = null
  try {
    azure = await new AzureVoiceProvider().synthesizeUncached(text)
  } catch (error) {
    console.warn('KG1_FEEDBACK_AZURE_FAILED', {
      reason: error instanceof Error ? error.name : 'upstream-error',
    })
  }
  if (azure?.audio.length) {
    res.setHeader('Content-Type', azure.contentType)
    res.setHeader('Content-Length', String(azure.audio.length))
    res.setHeader('Cache-Control', 'private, no-store')
    res.setHeader('X-Voice-Provider', 'azure')
    return res.send(azure.audio)
  }

  try {
    const priya = await new PythonVoiceProvider().synthesize(text)
    const bytes = priya.audioBase64 ? Buffer.from(priya.audioBase64, 'base64') : Buffer.alloc(0)
    const contentType = priya.contentType?.trim() || ''
    if (!priya.available || bytes.length < 256 || bytes.length > 8 * 1024 * 1024 ||
        !/^audio\/[a-z0-9.+-]+(?:\s*;.*)?$/i.test(contentType)) {
      throw new Error('Invalid fallback audio')
    }
    res.setHeader('Content-Type', contentType)
    res.setHeader('Content-Length', String(bytes.length))
    res.setHeader('Cache-Control', 'private, no-store')
    res.setHeader('X-Voice-Provider', 'python-priya-fallback')
    return res.send(bytes)
  } catch {
    // A failed emergency fallback must remain a retryable voice error,
    // not a generic 500 that strands the child's replay button.
    throw new ApiError(503, 'TTS_SERVICE_UNAVAILABLE', 'Miss Julie voice is temporarily unavailable.', {
      retryable: true,
    })
  }
}

async function sendManifestAudio(res: Response, id: AudioId, options: { preview?: boolean; ifNoneMatch?: string } = {}) {
  const line = AUDIO_MANIFEST.find((clip) => clip.id === id)
  if (!line) throw ApiError.notFound('Audio clip not found')
  if (line.kind === 'dynamic_tts') return sendKGVoice(res, line.text)

  const result = await getKGAzureNarrationAudio({ level: 1, id, text: line.text })
  const audio = result.audio
  const etag = `"${createHash('sha256').update(audio).digest('hex')}"`
  res.setHeader('Content-Type', result.contentType)
  res.setHeader('Content-Length', String(audio.length))
  res.setHeader('Content-Disposition', `inline; filename="${id}.${result.contentType === 'audio/wav' ? 'wav' : 'mp3'}"`)
  res.setHeader('X-Talkora-Cache', result.source.toUpperCase())
  res.setHeader('Cache-Control', options.preview ? 'private, no-store' : 'private, max-age=300')
  res.setHeader('Vary', 'Authorization')
  res.setHeader('ETag', etag)
  res.setHeader('X-Content-Type-Options', 'nosniff')
  if (!options.preview && options.ifNoneMatch === etag) return res.status(304).end()
  res.send(audio)
}

function validatedAudioId(req: Request): AudioId {
  const id = req.params.id as AudioId
  if (req.params.version !== KG_AUDIO_VERSION || !AUDIO_IDS.includes(id)) throw ApiError.notFound('Audio clip not found')
  return id
}

/** Audio validation shared by student submissions and teacher preview; never accept a transcript as trusted grading input. */
type KGPreviewOutcome = {
  activity: NonNullable<ReturnType<typeof activityAt>>
  outcome: 'correct' | 'incorrect' | 'unclear' | 'supported'
  selected?: string
  transcript?: string
  noSpeech?: boolean
}

async function previewOutcome(input: Record<string, unknown>): Promise<KGPreviewOutcome> {
  const activityId = String(input.activityId || '')
  const activityIndex = Array.from({ length: 8 }, (_, i) => i).find((i) => activityAt(i)?.id === activityId)
  if (activityIndex === undefined) throw ApiError.badRequest('Unknown KG activity')
  const activity = activityAt(activityIndex)!
  if (activity.mode === 'touch' || (activity.mode === 'speak' && input.assistedPicture === true)) {
    const selected = String(input.selected || '').toLowerCase().trim().slice(0, 20)
    if (!LETTERS.some((letter) => letter.word === selected)) throw ApiError.badRequest('Choose one of the four pictures')
    const outcome = LETTERS.find((item) => item.letter === activity.letter)?.word === selected ? 'correct' as const : 'incorrect' as const
    return { activity, outcome: activity.mode === 'speak' && outcome === 'correct' ? 'supported' : outcome, selected }
  }
  const durationMs = Number(input.durationMs)
  if (!Number.isFinite(durationMs) || durationMs < 250 || durationMs > 12000) throw ApiError.badRequest('Recording duration must be 0.25–12 seconds')
  if (input.noSpeech === true) return { activity, outcome: 'unclear' as const, noSpeech: true }
  const mimeType = String(input.mimeType || '')
  const audioBase64 = input.audioBase64
  if (!isSupportedVoiceAudioMimeType(mimeType) || typeof audioBase64 !== 'string' || audioBase64.length < 128 || audioBase64.length > 11_000_000 || !/^[A-Za-z0-9+/]+={0,2}$/.test(audioBase64)) {
    throw ApiError.badRequest('A valid short microphone recording is required')
  }
  const stt = await KGSpeechService.transcribe({ audioBase64, mimeType, durationMs })
  if (!stt.available) throw ApiError.provider('Speech recognition is temporarily unavailable')
  const transcript = String(stt.transcript || '').slice(0, 240)
  const confidence = 'confidence' in stt ? stt.confidence : undefined
  const outcome = gradeKGTranscription({
    transcript, letter: activity.letter,
    uncertain: 'uncertain' in stt && stt.uncertain === true,
    confidence: typeof confidence === 'number' ? confidence : undefined,
  })
  return { activity, outcome, transcript }
}

async function applyRecordedProgress(attempt: { studentId: Types.ObjectId; schoolId: Types.ObjectId; activityId: string; mode: string; outcome: string; replay: boolean; createdAt: Date }) {
  if (!['correct', 'supported'].includes(attempt.outcome) || attempt.replay) return
  // Native-language comprehension is praised but does not certify spoken English.
  if (attempt.outcome === 'supported' && attempt.mode === 'speak') return
  const index = Array.from({ length: 8 }, (_, i) => i).find((i) => activityAt(i)?.id === attempt.activityId)
  if (index === undefined) return
  // This also repairs a request interrupted between saving the attempt and progress.
  await KGAlphabetProgress.updateOne({ studentId: attempt.studentId, schoolId: attempt.schoolId, currentIndex: index }, {
    $set: { currentIndex: index + 1, ...(index === 7 ? { completedAt: attempt.createdAt, xp: 100, stars: 3, homeworkStatus: 'pending', homeworkAssignedAt: attempt.createdAt } : {}) },
    ...(attempt.outcome === 'supported' ? { $addToSet: { pronunciationNeedsPractice: activityAt(index)!.letter } } : {}),
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
    res.setHeader('Cache-Control', 'private, no-store')
    ok(res, { ...presentState(state), fallbackAvailable: await canUsePictureSupport(state.studentId, state.schoolId, state.currentIndex) })
  }),
  /** Starts a per-visit watch; no client-side localStorage trust. */
  startIntro: catchAsync(async (req: Request, res: Response) => {
    const { student } = await ensureState(req)
    const playbackId = randomBytes(32).toString('hex')
    // A fresh entry invalidates prior watch tickets, including previously
    // completed tickets that could otherwise bypass this visit's intro.
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
  // A student's own practice check-in; not a verified pronunciation grade.
  // Scope the update to the authenticated student and only after KG1 completion.
  completeHomework: catchAsync(async (req: Request, res: Response) => {
    const { student, state } = await ensureState(req)
    if (req.body?.homeworkId !== 'kg-abcd-picture-homework-v1') {
      throw ApiError.badRequest('Unknown KG homework assignment')
    }
    if (state.currentIndex !== 8) throw ApiError.conflict('Finish Level 1 before checking in homework')
    if (state.homeworkStatus === 'pending') {
      await KGAlphabetProgress.updateOne({
        studentId: student._id, schoolId: student.schoolId, currentIndex: 8,
        homeworkStatus: 'pending',
      }, { $set: { homeworkStatus: 'completed', homeworkCompletedAt: new Date() } })
    }
    const latest = await KGAlphabetProgress.findOne({ studentId: student._id, schoolId: student.schoolId })
    if (!latest || latest.homeworkStatus !== 'completed') throw ApiError.conflict('Homework is not ready to check in')
    res.setHeader('Cache-Control', 'private, no-store')
    ok(res, presentState(latest))
  }),
  audio: catchAsync(async (req: Request, res: Response) => {
    await studentContext(req)
    const id = validatedAudioId(req)
    await sendManifestAudio(res, id, { ifNoneMatch: req.headers['if-none-match'] })
  }),
  previewAudio: catchAsync(async (req: Request, res: Response) => {
    const id = validatedAudioId(req)
    await sendManifestAudio(res, id, { preview: true })
  }),
  acknowledgeFeedback: catchAsync(async (req: Request, res: Response) => {
    const { student } = await ensureState(req)
    await assertIntroTicket(req, student._id, student.schoolId)
    const submissionId = validateSubmissionId(req.params.submissionId)
    const attempt = await KGAlphabetAttempt.findOne({ studentId: student._id, schoolId: student.schoolId, submissionId })
    if (!attempt) throw ApiError.notFound('KG answer not found')
    await applyRecordedProgress(attempt)
    const latest = await KGAlphabetProgress.findOne({ studentId: student._id, schoolId: student.schoolId })
    if (!latest) throw ApiError.internal('KG progress unavailable')
    ok(res, { state: { ...presentState(latest), fallbackAvailable: await canUsePictureSupport(student._id, student.schoolId, latest.currentIndex) } })
  }),
  feedbackAudio: catchAsync(async (req: Request, res: Response) => {
    const { student } = await ensureState(req)
    await assertIntroTicket(req, student._id, student.schoolId)
    const submissionId = validateSubmissionId(req.params.submissionId)
    const attempt = await KGAlphabetAttempt.findOne({ studentId: student._id, schoolId: student.schoolId, submissionId })
    if (!attempt) throw ApiError.notFound('KG answer not found')
    // Do NOT call Qwen again when fetching or retrying a previously
    // submitted turn. That second 8002 call regularly exceeds the browser's
    // 15-second dynamic audio timeout, and changes the actual words the
    // child hears versus the submitted feedback displayed on-screen.
    // Old attempts pre-dating feedbackText use the guarded deterministic line.
    const words = attempt.feedbackText ||
      (await spokenFeedback({ letter: attempt.letter as typeof LETTERS[number]['letter'],
        mode: attempt.mode, outcome: attempt.outcome,
        noSpeech: attempt.recognitionReason === 'silence' })).feedbackText
    await sendKGAzure(res, words)
  }),
  previewAttempt: catchAsync(async (req: Request, res: Response) => {
    // Staff preview uses the KG-selected STT and reviewed feedback without progress writes.
    const result = await previewOutcome((req.body || {}) as Record<string, unknown>)
    const voice = await kgDynamicFeedback({ letter: result.activity.letter, mode: result.selected ? 'touch' : result.activity.mode,
      outcome: result.outcome, transcript: result.transcript, selected: result.selected, noSpeech: result.noSpeech })
    res.setHeader('Cache-Control', 'no-store')
    ok(res, { outcome: result.outcome, advance: result.outcome === 'correct' || (result.outcome === 'supported' && Boolean(result.selected)), transcript: result.transcript || '',
      feedbackAudioId: feedbackFor(result.outcome, result.noSpeech ? 'silence' : undefined, result.activity.letter, result.activity.mode),
      teachingHint: kgTeachingHint(result.activity.letter, result.activity.mode, result.outcome), ...voice, preview: true })
  }),
  attempt: catchAsync(async (req: Request, res: Response) => {
    const { student, state } = await ensureState(req)
    if (!state.introSeen) throw ApiError.conflict('Watch Miss Julie\u2019s Level 1 story to the end before starting the activities.')
    await assertIntroTicket(req, student._id, student.schoolId)
    const submissionId = validateSubmissionId(req.body?.submissionId)
    const identity = { studentId: student._id, schoolId: student.schoolId, submissionId }
    const requestHash = createHash('sha256').update(JSON.stringify({
      activityId: req.body?.activityId, replay: req.body?.replay === true,
      selected: req.body?.selected, audioBase64: req.body?.audioBase64,
      mimeType: req.body?.mimeType, durationMs: req.body?.durationMs, timeSpentMs: req.body?.timeSpentMs,
      noSpeech: req.body?.noSpeech, assistedPicture: req.body?.assistedPicture === true,
    })).digest('hex')
    const returnRecorded = async (attempt: IKGAlphabetAttempt) => {
      if (attempt.requestHash && attempt.requestHash !== requestHash) throw ApiError.conflict('This submission ID was already used for another answer')
      const latest = await KGAlphabetProgress.findOne({ studentId: student._id, schoolId: student.schoolId })
      const recoveredState = latest || state
      return ok(res, { submissionId: attempt.submissionId, outcome: attempt.outcome, replay: attempt.replay,
        advance: attempt.outcome === 'correct' || (attempt.outcome === 'supported' && attempt.mode === 'touch'),
        state: { ...presentState(recoveredState), fallbackAvailable: await canUsePictureSupport(student._id, student.schoolId, recoveredState.currentIndex) }, duplicate: true,
        feedbackAudioId: feedbackFor(attempt.outcome, attempt.recognitionReason, attempt.letter as typeof LETTERS[number]['letter'], attempt.mode),
        teachingHint: kgTeachingHint(attempt.letter as typeof LETTERS[number]['letter'], attempt.mode, attempt.outcome),
        feedbackText: attempt.feedbackText ||
          (await spokenFeedback({ letter: attempt.letter as typeof LETTERS[number]['letter'], mode: attempt.mode,
            outcome: attempt.outcome,
            noSpeech: attempt.recognitionReason === 'silence' })).feedbackText,
        feedbackAudioBase64: null,
        feedbackVoice: 'azure' as const })
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
    let outcome: 'correct' | 'incorrect' | 'unclear' | 'supported'
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

      const assistedPicture = activity.mode === 'speak' && req.body?.assistedPicture === true
      if (assistedPicture) {
        if (replay || !(await canUsePictureSupport(student._id, student.schoolId, index))) {
          throw ApiError.forbidden('Complete two speech attempts before the picture helper')
        }
        selected = String(req.body?.selected || '').toLowerCase().trim().slice(0, 20)
        if (!LETTERS.some((item) => item.word === selected)) throw ApiError.badRequest('Choose one of the four pictures')
        outcome = LETTERS.find((item) => item.letter === activity.letter)?.word === selected ? 'supported' : 'incorrect'
      } else if (activity.mode === 'speak' && req.body?.noSpeech === true) {
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
        outcome = gradeKGTranscription({
          transcript, letter: activity.letter,
          uncertain: 'uncertain' in transcription && transcription.uncertain === true,
          confidence: sttConfidence,
        })
        if (outcome === 'unclear') recognitionReason = 'uncertain'
      } else {
        selected = String(req.body?.selected || '').toLowerCase().trim().slice(0, 20)
        if (!LETTERS.some((item) => item.word === selected)) throw ApiError.badRequest('Choose one of the four pictures')
        outcome = LETTERS.find((item) => item.letter === activity.letter)?.word === selected ? 'correct' : 'incorrect'
      }

      try {
        const saved = await KGAlphabetAttempt.create({ studentId: student._id, schoolId: student.schoolId, activityId, letter: activity.letter,
          mode: assistedPicture ? 'touch' : activity.mode, outcome, transcript, selected, replay, timeSpentMs: Math.round(reportedTimeMs), submissionId, requestHash, sttProvider, sttConfidence, recognitionReason })
        // The attempt is recorded, but progression waits for audible feedback acknowledgment.
      } catch (error) {
        if ((error as { code?: number }).code !== 11000) throw error
        const prior = await KGAlphabetAttempt.findOne(identity)
        if (!prior) throw error
        return await returnRecorded(prior)
      }

      const latest = await KGAlphabetProgress.findOne({ studentId: student._id, schoolId: student.schoolId })
      const voice = await kgDynamicFeedback({ letter: activity.letter, mode: assistedPicture ? 'touch' : activity.mode, outcome,
        transcript, selected, noSpeech: recognitionReason === 'silence' })
      // Persist only the guarded teacher sentence, never audio, after the
      // speech attempt is recorded. Duplicate submissions and replay-audio
      // endpoints must use the exact same line, not regenerate Qwen text.
      await KGAlphabetAttempt.updateOne(identity, { $set: { feedbackText: voice.feedbackText } })
      res.setHeader('Cache-Control', 'no-store')
      return ok(res, { submissionId, outcome, replay, advance: outcome === 'correct' || (outcome === 'supported' && assistedPicture), transcript: transcript || '', state: { ...presentState(latest || state),
        fallbackAvailable: await canUsePictureSupport(student._id, student.schoolId, (latest || state).currentIndex) },
        feedbackAudioId: feedbackFor(outcome, recognitionReason, activity.letter, assistedPicture ? 'touch' : activity.mode), teachingHint: kgTeachingHint(activity.letter, assistedPicture ? 'touch' : activity.mode, outcome), ...voice })
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
          scored: { $sum: { $cond: [{ $in: ['$outcome', ['correct', 'incorrect']] }, 1, 0] } },
          correct: { $sum: { $cond: [{ $eq: ['$outcome', 'correct'] }, 1, 0] } },
          supported: { $sum: { $cond: [{ $eq: ['$outcome', 'supported'] }, 1, 0] } },
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
        completed: progressById.get(id)?.currentIndex === 8,
        xp: progressById.get(id)?.xp || 0, stars: progressById.get(id)?.stars || 0,
        homeworkStatus: progressById.get(id)?.homeworkStatus || 'not-assigned',
        attempts: stats?.attempts || 0,
        timeSpentMs: stats?.timeSpentMs || 0,
        replayTimeSpentMs: stats?.replayTimeSpentMs || 0,
        accuracy: scored ? Math.round((stats?.correct || 0) / scored * 100) : null,
        retryLetters, pronunciationNeedsPractice: progressById.get(id)?.pronunciationNeedsPractice || [], supported: stats?.supported || 0 }
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
          scored: { $sum: { $cond: [{ $in: ['$outcome', ['correct', 'incorrect']] }, 1, 0] } },
          correct: { $sum: { $cond: [{ $eq: ['$outcome', 'correct'] }, 1, 0] } },
          supported: { $sum: { $cond: [{ $eq: ['$outcome', 'supported'] }, 1, 0] } },
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
        retries: stats?.retries || 0, supported: stats?.supported || 0, timeSpentMs: stats?.timeSpentMs || 0,
        replayTimeSpentMs: stats?.replayTimeSpentMs || 0, unclear: stats?.unclear || 0 }
    })
    ok(res, { studentId, studentName: student.fullName, level: 1, currentIndex: progress?.currentIndex || 0,
      completedAt: progress?.completedAt || null,
      xp: progress?.xp || 0, stars: progress?.stars || 0,
      homework: { status: progress?.homeworkStatus || 'not-assigned',
        assignedAt: progress?.homeworkAssignedAt || null, completedAt: progress?.homeworkCompletedAt || null },
      totalAttempts: letters.reduce((sum, row) => sum + row.attempts, 0),
      timeSpentMs: letters.reduce((sum, row) => sum + row.timeSpentMs, 0),
      replayTimeSpentMs: letters.reduce((sum, row) => sum + row.replayTimeSpentMs, 0),
      letters, needsPractice: letters.filter((l) => l.retries > 0 || l.supported > 0 || (l.accuracy !== null && l.accuracy < 70)).map((l) => l.letter),
      // Deterministic teacher-facing metrics. AI narrative can be added separately.
      reportType: 'deterministic' })
  }),
}
