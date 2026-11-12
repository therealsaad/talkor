/**
 * Local-only Class 1 E2E fixture. No writes without --apply AND an explicit opt-in.
 * Creates a new isolated school/student and seeds ONLY that student's progress
 * through the six non-AI prerequisites of the draft Class 1 lesson.
 *
 * NEVER use on a real student's record or outside the dedicated `test` DB.
 * No existing student, school, curriculum, activity or progress is updated.
 */
import { randomBytes } from 'node:crypto'
import mongoose from 'mongoose'
import { env } from '../config/env'
import { School } from '../models/School'
import { Student } from '../models/Student'
import { CurriculumClass } from '../models/CurriculumClass'
import { Level } from '../models/Level'
import { Lesson } from '../models/Lesson'
import { Activity } from '../models/Activity'
import { Progress } from '../models/Progress'
import { hashPassword } from '../utils/password'
import { newUniquePin } from '../utils/student-pin'
import { StudentLessonFastService } from '../services/student-lesson-fast.service'
import {
  CLASS1_DEMO_VERSION,
  CLASS1_DEMO_LESSON_FILTER,
  CLASS1_DEMO_ACTIVITY_FILTER,
} from '../services/class1-demo-access'

const fixtureSchoolName = 'Talkora Class 1 E2E Fixture School'
const fixtureStudentName = 'Talkora Class 1 E2E Fixture'
const fixtureClassName = 'E2E-ONLY'
const expectedKeys = [
  'class1-l01-v2-listen-am',
  'class1-l01-v2-build-an',
  'class1-l01-v2-listen-at',
  'class1-l01-v2-listen-in',
  'class1-l01-v2-use-on',
  'class1-l01-v2-it-is-up',
  'class1-l01-v2-review-little-words',
] as const

async function main() {
  const apply = process.argv.includes('--apply')
  if (process.argv.slice(2).some((arg) => arg !== '--apply')) {
    throw new Error('Only --apply is supported. Omit it for a read-only preview.')
  }
  if (process.env.NODE_ENV !== 'development') {
    throw new Error('E2E fixture is only permitted with NODE_ENV=development.')
  }
  if (apply && process.env.TALKORA_E2E_FIXTURE_WRITE !== 'YES') {
    throw new Error('Explicit TALKORA_E2E_FIXTURE_WRITE=YES is required for --apply.')
  }
  if (process.env.TALKORA_CLASS1_STUDENT_DEMO !== 'true') {
    throw new Error('The Class 1 development-only demo must be enabled.')
  }
  if (process.env.TALKORA_CLASS1_DEMO_ALL_STUDENTS === 'true') {
    throw new Error('Disable TALKORA_CLASS1_DEMO_ALL_STUDENTS: use a single student allowlist.')
  }

  // Disable Mongoose auto-index creation, including for read-only previews.
  await mongoose.connect(env.mongodbUri, { autoIndex: false, serverSelectionTimeoutMS: 10_000 })
  try {
    const dbName = mongoose.connection.db?.databaseName
    // Database name, not just NODE_ENV, is a mandatory write boundary.
    if (dbName !== 'test') {
      throw new Error('Refusing fixture access: connected MongoDB database is not exactly `test`.')
    }

    const klass = await CurriculumClass.findOne({ grade: 1, status: { $in: ['draft', 'active'] } }).lean()
    if (!klass) throw new Error('Class 1 curriculum class does not exist.')
    const level = await Level.findOne({
      classId: klass._id, number: 1, curriculumVersion: CLASS1_DEMO_VERSION,
      status: 'draft', availability: 'UPCOMING',
    }).lean()
    if (!level) throw new Error('Exact Class 1 draft Level 1 is unavailable.')
    const lesson = await Lesson.findOne({
      levelId: level._id, ...CLASS1_DEMO_LESSON_FILTER,
    }).lean()
    if (!lesson) throw new Error('Exact Class 1 demonstration lesson is unavailable.')

    const requiredActivities = await Activity.find({
      lessonId: lesson._id, ...CLASS1_DEMO_ACTIVITY_FILTER,
      core: { $ne: false }, required: { $ne: false },
    })
      .select('_id activityKey order type aiEnabled')
      .sort('order')
      .lean()
    if (requiredActivities.length !== 10 ||
      expectedKeys.some((key, index) => requiredActivities[index]?.activityKey !== key) ||
      requiredActivities[6]?.type !== 'CONVERSATION' ||
      requiredActivities[6]?.aiEnabled !== true) {
      throw new Error('Lesson ordering has changed; refusing to create a stale or unsafe fixture.')
    }

    const counts = await Promise.all([
      Student.countDocuments(),
      Activity.countDocuments(),
      Progress.countDocuments(),
    ])
    const existingFixtureSchool = await School.exists({ name: fixtureSchoolName, code: /^TLE2E/ })
    console.log(JSON.stringify({
      status: apply ? 'READY_TO_CREATE' : 'PREVIEW_ONLY',
      database: dbName,
      existingCounts: { students: counts[0], activities: counts[1], progress: counts[2] },
      lessonId: lesson._id.toString(),
      guidedActivityPosition: 7,
      guidedActivityKey: expectedKeys[6],
      fixtureAlreadyExists: Boolean(existingFixtureSchool),
      willCreate: apply ? ['one E2E school', 'one E2E student', 'one E2E progress document'] : [],
      existingRecordsWillBeChanged: false,
    }, null, 2))
    if (!apply) return
    if (existingFixtureSchool) {
      throw new Error('An E2E fixture already exists in `test`. Reuse it; refusing duplicate creation.')
    }

    const { pin, digest } = await newUniquePin()
    const schoolCode = 'TLE2E' + randomBytes(5).toString('hex').toUpperCase()
    const schoolPassword = randomBytes(32).toString('hex')
    let school: InstanceType<typeof School> | null = null
    let student: InstanceType<typeof Student> | null = null
    let progress: InstanceType<typeof Progress> | null = null
    try {
      school = await School.create({
        name: fixtureSchoolName,
        code: schoolCode,
        passwordHash: await hashPassword(schoolPassword),
        status: 'active',
      })
      student = await Student.create({
        schoolId: school._id,
        fullName: fixtureStudentName,
        rollNumber: 'E2E-1',
        passwordHash: await hashPassword(pin),
        pinLookup: digest,
        grade: 1,
        className: fixtureClassName,
        avatarType: 'BOY',
        status: 'active',
      })
      progress = await Progress.create({
        studentId: student._id,
        classId: klass._id,
        curriculumVersion: CLASS1_DEMO_VERSION,
        levels: [{
          levelId: level._id,
          status: 'in-progress',
          unlockedAt: new Date(),
          accuracy: 0,
          totalTimeMs: 0,
          lessons: [{
            lessonId: lesson._id,
            completedActivityIds: requiredActivities.slice(0, 6).map((item) => item._id),
            completed: false,
            accuracy: 0,
            totalTimeMs: 0,
          }],
        }],
        xp: 0, stars: 0, streak: 0,
      })

      // Verify the normal, production-shaped resolver against ONLY this fixture.
      const priorId = process.env.TALKORA_CLASS1_DEMO_STUDENT_ID
      process.env.TALKORA_CLASS1_DEMO_STUDENT_ID = student._id.toString()
      try {
        const next = await StudentLessonFastService.next(student._id.toString())
        if (next.activityId !== requiredActivities[6]?._id.toString()) {
          throw new Error('Fixture did not resolve to its guided conversation activity.')
        }
      } finally {
        if (priorId === undefined) delete process.env.TALKORA_CLASS1_DEMO_STUDENT_ID
        else process.env.TALKORA_CLASS1_DEMO_STUDENT_ID = priorId
      }
    } catch (error) {
      // Roll back only documents created by this invocation. Never bulk-delete.
      if (progress) await Progress.deleteOne({ _id: progress._id, studentId: student?._id })
      if (student) await Student.deleteOne({
        _id: student._id, schoolId: school?._id,
        fullName: fixtureStudentName, className: fixtureClassName,
      })
      if (school) await School.deleteOne({ _id: school._id, code: schoolCode, name: fixtureSchoolName })
      throw error
    }

    console.log('FIXTURE_CREATED: exactly one new school, student and progress record in `test`.')
    console.log('Override TALKORA_CLASS1_DEMO_STUDENT_ID with the fixture ID in the Node dev terminal, then restart Node.')
    console.log('Set TALKORA_E2E_STUDENT_PIN locally. Never share this PIN or commit it.')
    console.log('FIXTURE_STUDENT_ID:', student._id.toString())
    console.log('FIXTURE_PIN_PRIVATE:', pin)
    console.log('Do not run --apply again; reuse this fixture for future E2E checks.')
  } finally {
    await mongoose.disconnect()
  }
}

main().catch((error: unknown) => {
  console.error('CLASS1_FIXTURE_FAILED:', error instanceof Error ? error.message : 'Unknown failure')
  process.exitCode = 1
})
