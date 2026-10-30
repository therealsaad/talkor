import { Schema, model, Types } from 'mongoose'

export interface IKGAlphabetAttempt {
  studentId: Types.ObjectId
  schoolId: Types.ObjectId
  activityId: string
  letter: string
  mode: 'speak' | 'touch'
  outcome: 'correct' | 'incorrect' | 'unclear' | 'supported'
  transcript?: string
  /** Final server-owned teacher words chosen once for an idempotent attempt. */
  feedbackText?: string
  selected?: string
  timeSpentMs?: number
  requestHash?: string
  sttProvider?: string
  sttConfidence?: number
  recognitionReason?: 'silence' | 'uncertain'
  replay: boolean
  submissionId: string
  createdAt: Date
}
const schema = new Schema<IKGAlphabetAttempt>({
  studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
  schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true, index: true },
  activityId: { type: String, required: true },
  letter: { type: String, enum: ['A', 'B', 'C', 'D'], required: true },
  mode: { type: String, enum: ['speak', 'touch'], required: true },
  outcome: { type: String, enum: ['correct', 'incorrect', 'unclear', 'supported'], required: true },
  transcript: { type: String, maxlength: 240 },
  feedbackText: { type: String, maxlength: 280 },
  selected: { type: String, maxlength: 20 },
  timeSpentMs: { type: Number, min: 0, max: 300000, default: 0 },
  requestHash: { type: String },
  sttProvider: { type: String },
  sttConfidence: { type: Number, min: 0, max: 1 },
  recognitionReason: { type: String, enum: ['silence', 'uncertain'] },
  replay: { type: Boolean, default: false },
  submissionId: { type: String, required: true },
}, { timestamps: { createdAt: true, updatedAt: false } })
schema.index({ studentId: 1, submissionId: 1 }, { unique: true })
schema.index({ schoolId: 1, studentId: 1, createdAt: -1 })
export const KGAlphabetAttempt = model<IKGAlphabetAttempt>('KGAlphabetAttempt', schema)
