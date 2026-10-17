import { Schema, model, Types } from 'mongoose'
import { KG_ALPHABET_VERSION } from '../kg/alphabet-content'

export interface IKGAlphabetProgress {
  studentId: Types.ObjectId
  schoolId: Types.ObjectId
  version: string
  currentIndex: number
  introSeen: boolean
  completedAt?: Date
  updatedAt: Date
}

const schema = new Schema<IKGAlphabetProgress>({
  studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, unique: true },
  schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true, index: true },
  version: { type: String, default: KG_ALPHABET_VERSION },
  currentIndex: { type: Number, min: 0, max: 8, default: 0 },
  introSeen: { type: Boolean, default: false },
  completedAt: Date,
}, { timestamps: true })

export const KGAlphabetProgress = model<IKGAlphabetProgress>('KGAlphabetProgress', schema)
