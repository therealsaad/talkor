/**
 * Read-only readiness check for the development-only Class 1 demo allowlist.
 * Intentionally prints no student identifiers, names, PIN data, or credentials.
 */
import { Types } from 'mongoose'
import { connectDatabase, disconnectDatabase } from '../config/db'
import { Student } from '../models/Student'

async function main() {
  const configuredId = process.env.TALKORA_CLASS1_DEMO_STUDENT_ID?.trim() || ''
  const configuredIdValid = Types.ObjectId.isValid(configuredId) && /^[a-f0-9]{24}$/i.test(configuredId)

  await connectDatabase()
  try {
    const [activeGrade1Students, matchingActiveStudents] = await Promise.all([
      Student.countDocuments({ grade: 1, status: 'active' }),
      configuredIdValid
        ? Student.countDocuments({ _id: configuredId, grade: 1, status: 'active' })
        : Promise.resolve(0),
    ])

    console.log(JSON.stringify({
      demoFlagEnabled: process.env.TALKORA_CLASS1_STUDENT_DEMO === 'true',
      configuredIdPresent: configuredId.length > 0,
      configuredIdValid,
      activeGrade1Students,
      matchingActiveStudents,
      ready: process.env.NODE_ENV !== 'production'
        && process.env.TALKORA_CLASS1_STUDENT_DEMO === 'true'
        && configuredIdValid
        && matchingActiveStudents === 1,
    }, null, 2))
  } finally {
    await disconnectDatabase()
  }
}

main().catch((error: unknown) => {
  console.error('Class 1 demo configuration audit failed:', error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
