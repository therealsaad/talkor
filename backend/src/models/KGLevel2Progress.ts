import { Schema, model, Types } from 'mongoose'

/** Student-authoritative, independent from the staff-only E–J preview. */
export interface IKGLevel2Progress {
  studentId: Types.ObjectId
  schoolId: Types.ObjectId
  currentIndex: number
  introTicketHash?: string
  introStartedAt?: Date
  introCompletedAt?: Date
  completedAt?: Date
  updatedAt: Date
}
const schema = new Schema<IKGLevel2Progress>({
  studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, unique: true },
  schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true, index: true },
  currentIndex: { type: Number, required: true, min: 0, max: 6, default: 0 },
  introTicketHash: { type: String, select: false },
  introStartedAt: Date,
  introCompletedAt: Date,
  completedAt: Date,
}, { timestamps: true })
export const KGLevel2Progress = model<IKGLevel2Progress>('KGLevel2Progress', schema)
