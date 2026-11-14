import { Schema, model, Types } from 'mongoose'
import { KG_ALPHABET_VERSION } from '../kg/alphabet-content'

export interface IKGAlphabetProgress {
  studentId: Types.ObjectId
  schoolId: Types.ObjectId
  version: string
  currentLevel: number
  unlockedLevels: number[]
  completedLevels: number[]
  levelProgress: Array<{ level: number; currentIndex: number; completedAt?: Date }>
  currentIndex: number
  introSeen: boolean
  pronunciationNeedsPractice: string[]
  completedAt?: Date
  xp: number
  stars: number
  homeworkStatus: 'not-assigned' | 'pending' | 'completed'
  homeworkAssignedAt?: Date
  homeworkCompletedAt?: Date
  updatedAt: Date
}

const schema = new Schema<IKGAlphabetProgress>({
  studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, unique: true },
  schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true, index: true },
  version: { type: String, default: KG_ALPHABET_VERSION },
  currentLevel: { type: Number, min: 1, max: 5, default: 1 },
  unlockedLevels: { type: [Number], default: [1] },
  completedLevels: { type: [Number], default: [] },
  levelProgress: [{
    _id: false,
    level: { type: Number, min: 2, max: 5, required: true },
    currentIndex: { type: Number, min: 0, default: 0 },
    completedAt: Date,
  }],
  currentIndex: { type: Number, min: 0, max: 8, default: 0 },
  introSeen: { type: Boolean, default: false },
  pronunciationNeedsPractice: { type: [String], default: [] },
  completedAt: Date,
  xp: { type: Number, default: 0, min: 0 },
  stars: { type: Number, default: 0, min: 0 },
  homeworkStatus: { type: String, enum: ['not-assigned', 'pending', 'completed'], default: 'not-assigned' },
  homeworkAssignedAt: Date,
  homeworkCompletedAt: Date,
}, { timestamps: true })

export const KGAlphabetProgress = model<IKGAlphabetProgress>('KGAlphabetProgress', schema)
