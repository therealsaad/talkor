import { Schema, model, Document, Types } from 'mongoose'

/**
 * Additive, DEVELOPMENT-ONLY, advisory teaching turn ledger.
 * Independent of Conversation, VoiceSession, ActivityAttempt and Progress.
 * No raw student speech, name, credential, Qwen prompt, audio or XP is stored.
 */
export type AdvisoryTeachingStrategy =
  | 'EXPLAIN' | 'MODEL' | 'ASK' | 'GUIDE' | 'LISTEN'
  | 'CORRECT' | 'RETEACH' | 'INDEPENDENT_CHECK' | 'RECALL'
  | 'REDIRECT'

export interface ITeachingTurnReceipt {
  requestId: string
  payloadHash: string
  revision: number
  strategy: AdvisoryTeachingStrategy
  answerSupport: 'UNKNOWN' | 'SUPPORTED' | 'UNVERIFIED_INDEPENDENT'
  hintLevel: number
  retryPending: boolean
  committedAt: Date
}

export interface ITeachingCheckpoint extends Document {
  _id: Types.ObjectId
  studentId: Types.ObjectId
  activityId: Types.ObjectId
  lessonId: Types.ObjectId
  scopeHash: string
  revision: number
  hintLevel: number
  retryPending: boolean
  lastStrategy?: AdvisoryTeachingStrategy
  turnReceipts: ITeachingTurnReceipt[]
  createdAt: Date
  updatedAt: Date
}

const receiptSchema = new Schema<ITeachingTurnReceipt>({
  requestId: { type: String, required: true, match: /^[0-9a-f-]{36}$/ },
  payloadHash: { type: String, required: true, match: /^[a-f0-9]{64}$/ },
  revision: { type: Number, required: true, min: 1, max: 64 },
  strategy: {
    type: String, required: true,
    enum: ['EXPLAIN', 'MODEL', 'ASK', 'GUIDE', 'LISTEN', 'CORRECT', 'RETEACH',
      'INDEPENDENT_CHECK', 'RECALL', 'REDIRECT'],
  },
  answerSupport: {
    type: String, required: true,
    enum: ['UNKNOWN', 'SUPPORTED', 'UNVERIFIED_INDEPENDENT'],
  },
  hintLevel: { type: Number, required: true, min: 0, max: 3 },
  retryPending: { type: Boolean, required: true },
  committedAt: { type: Date, required: true },
}, { _id: false })

const schema = new Schema<ITeachingCheckpoint>({
  studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
  activityId: { type: Schema.Types.ObjectId, ref: 'Activity', required: true },
  lessonId: { type: Schema.Types.ObjectId, ref: 'Lesson', required: true },
  scopeHash: { type: String, required: true, match: /^[a-f0-9]{64}$/ },
  revision: { type: Number, required: true, default: 0, min: 0, max: 64 },
  hintLevel: { type: Number, required: true, default: 0, min: 0, max: 3 },
  retryPending: { type: Boolean, required: true, default: false },
  lastStrategy: { type: String, enum: [
    'EXPLAIN', 'MODEL', 'ASK', 'GUIDE', 'LISTEN', 'CORRECT', 'RETEACH',
    'INDEPENDENT_CHECK', 'RECALL', 'REDIRECT',
  ] },
  turnReceipts: { type: [receiptSchema], default: [] },
}, { timestamps: true, strict: 'throw' })

// One immutable objective-version checkpoint per student/activity.
// Other students, books and approved editions are isolated by this key.
schema.index(
  { studentId: 1, activityId: 1, scopeHash: 1 },
  { unique: true, name: 'teaching_checkpoint_student_activity_scope_unique_v1' },
)
schema.index({ studentId: 1, updatedAt: -1 })

export const TeachingCheckpoint = model<ITeachingCheckpoint>('TeachingCheckpoint', schema)
