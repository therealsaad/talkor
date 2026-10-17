import { Schema, model, Types } from 'mongoose'

/** Per-view KG video gate. One start record per browser visit, never client-generated. */
export interface IKGIntroPlayback {
  studentId: Types.ObjectId
  schoolId: Types.ObjectId
  tokenHash: string
  startedAt: Date
  completedAt?: Date
  expiresAt: Date
}
const schema = new Schema<IKGIntroPlayback>({
  studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
  schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true, index: true },
  tokenHash: { type: String, required: true, unique: true, select: false },
  startedAt: { type: Date, required: true, default: Date.now },
  completedAt: Date,
  expiresAt: { type: Date, required: true },
}, { timestamps: false })
schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })
schema.index({ studentId: 1, schoolId: 1, expiresAt: -1 })
export const KGIntroPlayback = model<IKGIntroPlayback>('KGIntroPlayback', schema)
