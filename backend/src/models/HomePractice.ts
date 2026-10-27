import { Document, Schema, Types, model } from 'mongoose'

export interface IHomePractice extends Document {
  studentId: Types.ObjectId
  unitKey: 'UNIT1_FAVOURITES' | 'CLASS1_L01_FIRST_DAY'
  reflection: string
  audioData?: Buffer
  audioContentType?: string
  audioSizeBytes?: number
  submittedAt: Date
}

export const HOME_PRACTICE_UNIT_KEYS = {
  favourites: 'UNIT1_FAVOURITES',
  'class1-first-day': 'CLASS1_L01_FIRST_DAY',
} as const
export type HomePracticeUnitSlug = keyof typeof HOME_PRACTICE_UNIT_KEYS
export type HomePracticeUnitKey = typeof HOME_PRACTICE_UNIT_KEYS[HomePracticeUnitSlug]

export function homePracticeUnitKey(value: unknown): HomePracticeUnitKey | null {
  return typeof value === 'string' && value in HOME_PRACTICE_UNIT_KEYS
    ? HOME_PRACTICE_UNIT_KEYS[value as HomePracticeUnitSlug]
    : null
}

const homePracticeSchema = new Schema<IHomePractice>({
  studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
  unitKey: { type: String, enum: Object.values(HOME_PRACTICE_UNIT_KEYS), required: true },
  reflection: { type: String, required: true, trim: true, maxlength: 1000 },
  audioData: { type: Buffer },
  audioContentType: { type: String },
  audioSizeBytes: { type: Number },
  submittedAt: { type: Date, required: true },
}, { timestamps: true })

homePracticeSchema.index({ studentId: 1, unitKey: 1 }, { unique: true })

export const HomePractice = model<IHomePractice>('HomePractice', homePracticeSchema)
