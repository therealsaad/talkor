import { Schema, model } from 'mongoose'

// A short database lease prevents duplicate STT calls across backend instances.
// The lease contains a hash only, never the recording or a transcript.
const schema = new Schema({
  studentId: { type: Schema.Types.ObjectId, required: true },
  schoolId: { type: Schema.Types.ObjectId, required: true },
  submissionId: { type: String, required: true },
  requestHash: { type: String, required: true },
  owner: { type: String, required: true },
  expiresAt: { type: Date, required: true },
})
schema.index({ studentId: 1, submissionId: 1 }, { unique: true })
schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })
export const KGAlphabetSubmission = model('KGAlphabetSubmission', schema)
