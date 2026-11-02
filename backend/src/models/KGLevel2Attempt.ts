import { Schema, model, Types } from 'mongoose'

export interface IKGLevel2Attempt {
  studentId: Types.ObjectId
  schoolId: Types.ObjectId
  submissionId: string
  index: number
  letter: string
  outcome: 'correct' | 'incorrect' | 'unclear'
  feedbackText: string
  feedbackAcknowledgedAt?: Date
  createdAt: Date
}
const schema = new Schema<IKGLevel2Attempt>({
  studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
  schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
  submissionId: { type: String, required: true },
  index: { type: Number, required: true, min: 0, max: 5 },
  letter: { type: String, required: true, enum: ['E','F','G','H','I','J'] },
  outcome: { type: String, required: true, enum: ['correct','incorrect','unclear'] },
  feedbackText: { type: String, required: true, maxlength: 240 },
  feedbackAcknowledgedAt: Date,
}, { timestamps: { createdAt: true, updatedAt: false } })
schema.index({ studentId: 1, submissionId: 1 }, { unique: true })
schema.index({ studentId: 1, schoolId: 1, index: 1, feedbackAcknowledgedAt: 1 })
export const KGLevel2Attempt = model<IKGLevel2Attempt>('KGLevel2Attempt', schema)
