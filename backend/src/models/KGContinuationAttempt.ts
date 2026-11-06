import { Schema, model, Types } from 'mongoose'

export interface IKGContinuationAttempt {
  studentId: Types.ObjectId
  schoolId: Types.ObjectId
  level: number
  submissionId: string
  index: number
  letter: string
  outcome: 'correct' | 'incorrect' | 'unclear'
  feedbackText: string
  feedbackLanguageCode?: 'en-IN' | 'hi-IN' | 'mr-IN'
  feedbackAcknowledgedAt?: Date
}
const schema = new Schema<IKGContinuationAttempt>({
  studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
  schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
  level: { type: Number, enum: [3, 4, 5], required: true },
  submissionId: { type: String, required: true },
  index: { type: Number, required: true, min: 0, max: 5 },
  letter: { type: String, required: true, match: /^[K-Z]$/ },
  outcome: { type: String, enum: ['correct', 'incorrect', 'unclear'], required: true },
  feedbackText: { type: String, required: true, maxlength: 240 },
  feedbackLanguageCode: { type: String, enum: ['en-IN', 'hi-IN', 'mr-IN'] },
  feedbackAcknowledgedAt: Date,
}, { timestamps: true })
schema.index({ studentId: 1, level: 1, submissionId: 1 }, { unique: true })
schema.index({ studentId: 1, level: 1, index: 1, feedbackAcknowledgedAt: 1 })
export const KGContinuationAttempt = model<IKGContinuationAttempt>('KGContinuationAttempt', schema)
