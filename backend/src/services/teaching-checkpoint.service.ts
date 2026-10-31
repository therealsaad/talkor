import { createHash } from 'node:crypto'
import { Types } from 'mongoose'
import { z } from 'zod'
import { TeachingCheckpoint, type AdvisoryTeachingStrategy, type ITeachingTurnReceipt } from '../models/TeachingCheckpoint'
import { CurriculumAccessService } from './curriculum-access.service'
import { Student } from '../models/Student'
import { ApiError } from '../utils/ApiError'

/**
 * Additive, EXPERIMENT-ONLY durable advisory turn checkpoint.
 *
 * This module is deliberately not registered in Express, QwenProvider, voice,
 * or ProgressService. A live grant for school/book/edition/teacher review does
 * not yet exist. Enabling this internal experiment never enables student routes.
 *
 * No raw transcript, teacher text, audio, PIN, mastery or XP is stored.
 */
const scopeSchema = z.object({
  namespace: z.literal('talkora.mh.english.g01'),
  bookId: z.enum(['ENGLISH_BALBHARATI_G01', 'MY_ENGLISH_BOOK_G01_NON_ENGLISH_MEDIUM']),
  trackId: z.enum(['ENGLISH_MEDIUM', 'NON_ENGLISH_MEDIUM']),
  edition: z.string().regex(/^20[0-9]{2}-[0-9]{2}$/),
  lessonId: z.string().regex(/^[0-9a-f]{24}$/i),
  activityId: z.string().regex(/^[0-9a-f]{24}$/i),
  objectiveId: z.string().regex(/^(?:bal|meb)-g01-u[1-4]-c[1-4]\.(?:0[1-9]|1[01])-o0[1-9]$/),
  version: z.string().min(3).max(80).regex(/^[a-zA-Z0-9._-]+$/),
  approvedRevision: z.string().min(8).max(100).regex(/^approved-[a-zA-Z0-9._-]+$/),
}).strict().superRefine((scope, ctx) => {
  const bal = scope.trackId === 'ENGLISH_MEDIUM'
  if ((bal && scope.bookId !== 'ENGLISH_BALBHARATI_G01') ||
      (!bal && scope.bookId !== 'MY_ENGLISH_BOOK_G01_NON_ENGLISH_MEDIUM') ||
      !scope.objectiveId.startsWith(bal ? 'bal-' : 'meb-')) {
    ctx.addIssue({ code: 'custom', message: 'Mixed textbook identity is forbidden' })
  }
})

export type ApprovedTeachingScopeDraft = z.input<typeof scopeSchema>

const turnSchema = z.object({
  studentId: z.string().regex(/^[0-9a-f]{24}$/i),
  scope: scopeSchema,
  requestId: z.string().uuid(),
  expectedRevision: z.number().int().min(0).max(63),
  // Only bounded, de-identified teaching signals. No arbitrary child words.
  observation: z.enum([
    'UNAVAILABLE', 'LEXICAL_MATCH', 'LEXICAL_OVERLAP', 'LEXICAL_MISMATCH',
    'AMBIGUOUS', 'OFF_TOPIC',
  ]),
  strategy: z.enum([
    'EXPLAIN', 'MODEL', 'ASK', 'GUIDE', 'LISTEN', 'CORRECT',
    'RETEACH', 'INDEPENDENT_CHECK', 'RECALL', 'REDIRECT',
  ]),
  answerSupport: z.enum(['UNKNOWN', 'SUPPORTED', 'UNVERIFIED_INDEPENDENT']),
  hintLevel: z.number().int().min(0).max(3),
  retryPending: z.boolean(),
}).strict()

export type TeachingCheckpointTurnDraft = z.input<typeof turnSchema>

function assertCheckpointExperiment() {
  if (process.env.NODE_ENV === 'production' ||
      process.env.TALKORA_ENV?.toLowerCase() === 'production' ||
      process.env.ENVIRONMENT?.toLowerCase() === 'production' ||
      process.env.TALKORA_TEACHING_CHECKPOINT_EXPERIMENT !== 'true') {
    throw ApiError.forbidden('Teaching checkpoint experiment is disabled')
  }
}

function parseScope(scope: ApprovedTeachingScopeDraft) {
  const result = scopeSchema.safeParse(scope)
  if (!result.success) throw ApiError.badRequest('Invalid or unapproved teaching scope')
  return result.data
}

function fingerprint(scope: z.infer<typeof scopeSchema>): string {
  return createHash('sha256').update(JSON.stringify(scope)).digest('hex')
}

async function assertAuthorizedCurrentActivity(studentId: string, scope: z.infer<typeof scopeSchema>) {
  // The old draft/pilot curriculum is NOT an approved book/track grant.
  // These are only necessary conditions, not sufficient school-track approval.
  const access = await CurriculumAccessService.assertActivity(studentId, scope.activityId)
  const student = await Student.findById(studentId).select('grade status').lean()
  if (!student || student.grade !== 1 || student.status !== 'active' ||
      access.isKGPilot || access.isClass1Demo ||
      access.activity.status !== 'active' || access.lesson.status !== 'active' ||
      access.level.status !== 'active' || access.level.availability !== 'PUBLISHED' ||
      access.level.number !== 1 ||
      access.lesson._id.toString() !== scope.lessonId) {
    throw ApiError.forbidden('Teaching scope cannot use an unapproved Class 1 pilot or other activity')
  }
}

function checkpointKey(studentId: string, scope: z.infer<typeof scopeSchema>) {
  return {
    studentId: new Types.ObjectId(studentId),
    activityId: new Types.ObjectId(scope.activityId),
    scopeHash: fingerprint(scope),
  }
}

export const TeachingCheckpointService = {
  /**
   * Stage an advisory-only cursor for an already-published, authorized activity.
   * No unaudited school track can be made live by calling this: no route calls it,
   * production usage is forbidden, and teacher-approval remains a release gate.
   */
  async begin(studentId: string, proposedScope: ApprovedTeachingScopeDraft) {
    assertCheckpointExperiment()
    if (!Types.ObjectId.isValid(studentId) || !/^[0-9a-f]{24}$/i.test(studentId)) {
      throw ApiError.badRequest('Invalid student identifier')
    }
    const scope = parseScope(proposedScope)
    await assertAuthorizedCurrentActivity(studentId, scope)
    const key = checkpointKey(studentId, scope)
    const inserted = await TeachingCheckpoint.findOneAndUpdate(key, {
      $setOnInsert: {
        ...key,
        lessonId: new Types.ObjectId(scope.lessonId),
        revision: 0,
        hintLevel: 0,
        retryPending: false,
        turnReceipts: [],
      },
    }, { new: true, upsert: true, runValidators: true })
    if (!inserted) throw ApiError.internal('Teaching checkpoint could not be started')
    return { revision: inserted.revision, hintLevel: inserted.hintLevel,
      retryPending: inserted.retryPending, latestStrategy: inserted.lastStrategy || null }
  },

  /**
   * Exactly-once advisory revision commit, isolated by authenticated student,
   * canonical activity, immutable textbook scope and expected revision.
   * MongoDB CAS makes two concurrent requests with the same revision mutually
   * exclusive. Receipts are retained for all 64 bounded turns and replays.
   */
  async commitTurn(input: TeachingCheckpointTurnDraft) {
    assertCheckpointExperiment()
    const parsed = turnSchema.safeParse(input)
    if (!parsed.success) throw ApiError.badRequest('Invalid teaching turn or scope')
    const turn = parsed.data
    await assertAuthorizedCurrentActivity(turn.studentId, turn.scope)
    const key = checkpointKey(turn.studentId, turn.scope)
    const payloadHash = createHash('sha256').update(JSON.stringify({
      expectedRevision: turn.expectedRevision,
      observation: turn.observation,
      strategy: turn.strategy,
      answerSupport: turn.answerSupport,
      hintLevel: turn.hintLevel,
      retryPending: turn.retryPending,
    })).digest('hex')

    const found = await TeachingCheckpoint.findOne(key)
    if (!found) throw ApiError.conflict('No teaching checkpoint to resume')
    const replay = (checkpoint: { turnReceipts: ITeachingTurnReceipt[] }) =>
      checkpoint.turnReceipts.find(receipt => receipt.requestId === turn.requestId)
    const existing = replay(found)
    if (existing) {
      if (existing.payloadHash !== payloadHash) throw ApiError.conflict('Teaching request ID reused with different evidence')
      return { revision: existing.revision, replayed: true, hintLevel: existing.hintLevel,
        retryPending: existing.retryPending, strategy: existing.strategy, evidenceAccepted: false, xpAwarded: 0 }
    }
    if (found.revision !== turn.expectedRevision) throw ApiError.conflict('Stale teaching checkpoint revision')
    if (found.revision >= 64) throw ApiError.conflict('Teaching checkpoint maximum turns reached')

    const receipt: ITeachingTurnReceipt = {
      requestId: turn.requestId,
      payloadHash,
      revision: turn.expectedRevision + 1,
      strategy: turn.strategy as AdvisoryTeachingStrategy,
      answerSupport: turn.answerSupport,
      hintLevel: turn.hintLevel,
      retryPending: turn.retryPending,
      committedAt: new Date(),
    }
    const updated = await TeachingCheckpoint.findOneAndUpdate({
      _id: found._id,
      ...key,
      revision: turn.expectedRevision,
      'turnReceipts.requestId': { $ne: turn.requestId },
    }, {
      $inc: { revision: 1 },
      $set: {
        hintLevel: turn.hintLevel,
        retryPending: turn.retryPending,
        lastStrategy: turn.strategy,
      },
      $push: { turnReceipts: receipt },
    }, { new: true, runValidators: true })

    if (!updated) {
      // CAS winner may have completed between the initial read and update.
      // The same replay is safe; an unrelated concurrent turn is a conflict.
      const winner = await TeachingCheckpoint.findOne(key)
      const previous = winner ? replay(winner) : undefined
      if (previous && previous.payloadHash === payloadHash) {
        return { revision: previous.revision, replayed: true, hintLevel: previous.hintLevel,
          retryPending: previous.retryPending, strategy: previous.strategy, evidenceAccepted: false, xpAwarded: 0 }
      }
      throw ApiError.conflict('Concurrent or stale teaching turn')
    }

    return {
      revision: updated.revision,
      replayed: false,
      hintLevel: updated.hintLevel,
      retryPending: updated.retryPending,
      strategy: turn.strategy,
      evidenceAccepted: false as const,
      xpAwarded: 0 as const,
    }
  },
}
