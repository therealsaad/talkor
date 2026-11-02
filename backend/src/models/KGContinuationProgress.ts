import { Schema, model, Types } from 'mongoose'

/** One authoritative cursor per student+approved continuation level. */
export interface IKGContinuationProgress {
  studentId: Types.ObjectId
  schoolId: Types.ObjectId
  level: number
  currentIndex: number
  introTicketHash?: string
  introStartedAt?: Date
  introCompletedAt?: Date
  completedAt?: Date
}
const schema = new Schema<IKGContinuationProgress>({
  studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
  schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
  level: { type: Number, enum: [3, 4, 5], required: true },
  currentIndex: { type: Number, required: true, min: 0, max: 6, default: 0 },
  introTicketHash: { type: String, select: false },
  introStartedAt: Date,
  introCompletedAt: Date,
  completedAt: Date,
}, { timestamps: true })
schema.index({ studentId: 1, level: 1 }, { unique: true })
export const KGContinuationProgress = model<IKGContinuationProgress>('KGContinuationProgress', schema)
