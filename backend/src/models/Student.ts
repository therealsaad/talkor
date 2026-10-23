import { Schema, model, Document, Types } from 'mongoose'

export interface IStudent extends Document {
  _id: Types.ObjectId
  schoolId: Types.ObjectId
  teacherId?: Types.ObjectId
  fullName: string
  rollNumber: string
  studentCode?: string // legacy field; excluded from normal queries and no longer written
  passwordHash: string
  pinLookup?: string
  authVersion: number
  grade: number // 0 = KG, 1-10 = grades
  kgAlphabetPilotEnabled?: boolean // school-admin-approved ABCD pilot only; independent of legacy KG drafts
  className?: string // e.g. "4A" — display/section label, distinct from grade
  avatar?: string
  avatarType: 'BOY' | 'GIRL'
  status: 'active' | 'inactive'
  lastLoginAt?: Date
  createdAt: Date
  updatedAt: Date
}

const studentSchema = new Schema<IStudent>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true, index: true },
    teacherId: { type: Schema.Types.ObjectId, ref: 'Teacher' },
    fullName: { type: String, required: true, trim: true },
    rollNumber: { type: String, required: true, trim: true },
    studentCode: { type: String, trim: true, uppercase: true, select: false },
    passwordHash: { type: String, required: true, select: false },
    pinLookup: { type: String, select: false },
    authVersion: { type: Number, default: 0 },
    grade: { type: Number, required: true, min: 0, max: 10 },
    kgAlphabetPilotEnabled: { type: Boolean, default: false },
    className: { type: String, trim: true },
    avatar: { type: String },
    avatarType: { type: String, enum: ['BOY', 'GIRL'], required: true, default: 'BOY' },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    lastLoginAt: { type: Date },
  },
  { timestamps: true },
)

studentSchema.index({ pinLookup: 1 }, { unique: true, partialFilterExpression: { pinLookup: { $type: 'string' } } })
// Roll numbers restart for every class/section. Keeping grade and className in
// the database constraint prevents accidental duplicates inside one roster
// without reserving (for example) roll 1 across the whole school.
studentSchema.index(
  { schoolId: 1, grade: 1, className: 1, rollNumber: 1 },
  { unique: true, name: 'student_roll_per_class_unique_v2' },
)
studentSchema.index({ schoolId: 1, fullName: 1 })
studentSchema.index({ schoolId: 1, grade: 1, className: 1, fullName: 1 })
studentSchema.index({ schoolId: 1, teacherId: 1, grade: 1, fullName: 1 })

export const Student = model<IStudent>('Student', studentSchema)
