import { Schema, model, Types } from 'mongoose'

interface IClass1IntroVisit {
  studentId: Types.ObjectId; schoolId: Types.ObjectId; lessonId: Types.ObjectId
  authVersion: number; sourceHash: string; ticketHash: string
  startedAt: Date; completedAt?: Date; expiresAt: Date; minimumMs: number
}
const schema = new Schema<IClass1IntroVisit>({
  studentId: { type: Schema.Types.ObjectId, required: true },
  schoolId: { type: Schema.Types.ObjectId, required: true },
  lessonId: { type: Schema.Types.ObjectId, required: true },
  authVersion: { type: Number, required: true }, sourceHash: { type: String, required: true },
  ticketHash: { type: String, required: true, select: false },
  startedAt: { type: Date, required: true }, completedAt: Date,
  expiresAt: { type: Date, required: true }, minimumMs: { type: Number, required: true },
})
schema.index({ studentId: 1, lessonId: 1, authVersion: 1 }, { unique: true })
schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })
export const Class1IntroVisit = model<IClass1IntroVisit>('Class1IntroVisit', schema)
