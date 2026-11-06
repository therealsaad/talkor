/**
 * Read-only reconciliation of verified level completions.
 *
 * Compares Progress.levels[status=completed] against LearningEvent type=level_completed.
 * Does NOT mutate data. Does NOT promote activity/lesson records into completions.
 *
 * Usage: pnpm exec tsx src/scripts/reconcile-level-completions.ts [--schoolId=<id>]
 */
import mongoose from 'mongoose'
import { connectDatabase, disconnectDatabase } from '../config/db'
import { Progress } from '../models/Progress'
import { LearningEvent } from '../models/LearningEvent'
import { Student } from '../models/Student'

async function main() {
  const schoolArg = process.argv.find((arg) => arg.startsWith('--schoolId='))
  const schoolId = schoolArg ? schoolArg.slice('--schoolId='.length) : undefined
  if (schoolId && !mongoose.Types.ObjectId.isValid(schoolId)) {
    throw new Error('Invalid --schoolId')
  }

  await connectDatabase()
  try {
    const studentFilter = schoolId
      ? { schoolId: new mongoose.Types.ObjectId(schoolId) }
      : {}
    const students = await Student.find(studentFilter).select('_id schoolId').lean()
    const studentIds = students.map((s) => s._id)
    const schoolByStudent = new Map(students.map((s) => [String(s._id), String(s.schoolId)]))

    const completed = await Progress.aggregate([
      { $match: { studentId: { $in: studentIds } } },
      { $unwind: '$levels' },
      { $match: { 'levels.status': 'completed' } },
      {
        $group: {
          _id: { studentId: '$studentId', levelId: '$levels.levelId' },
          completedAt: { $min: '$levels.completedAt' },
        },
      },
    ]).allowDiskUse(true)

    const events = await LearningEvent.aggregate([
      { $match: { studentId: { $in: studentIds }, type: 'level_completed', levelId: { $exists: true } } },
      {
        $group: {
          _id: { studentId: '$studentId', levelId: '$levelId' },
          eventCount: { $sum: 1 },
          firstAt: { $min: '$createdAt' },
        },
      },
    ]).allowDiskUse(true)

    const progressKeys = new Map(
      completed.map((row) => [
        `${row._id.studentId}:${row._id.levelId}`,
        row,
      ]),
    )
    const eventKeys = new Map(
      events.map((row) => [
        `${row._id.studentId}:${row._id.levelId}`,
        row,
      ]),
    )

    const missingEvents: string[] = []
    const missingProgress: string[] = []
    const duplicateEvents: string[] = []
    const missingCompletedAt: string[] = []

    for (const [key, row] of progressKeys) {
      if (!row.completedAt) missingCompletedAt.push(key)
      if (!eventKeys.has(key)) missingEvents.push(key)
    }
    for (const [key, row] of eventKeys) {
      if (!progressKeys.has(key)) missingProgress.push(key)
      if (Number(row.eventCount) > 1) duplicateEvents.push(key)
    }

    const orphanStudents = completed.filter((row) => !schoolByStudent.has(String(row._id.studentId))).length

    const report = {
      mode: 'read-only',
      schoolId: schoolId || null,
      studentsScanned: students.length,
      uniqueProgressCompletions: progressKeys.size,
      uniqueLevelCompletedEvents: eventKeys.size,
      progressWithoutEvent: missingEvents.length,
      eventsWithoutProgressCompletion: missingProgress.length,
      duplicateLevelCompletedEvents: duplicateEvents.length,
      completionsMissingCompletedAt: missingCompletedAt.length,
      orphanedCompletionsNoStudent: orphanStudents,
      note:
        'Do not auto-backfill. Progress.levels.status===completed is the reporting source of truth. Events are audit only. Missing events do not invalidate Progress completions. Events without Progress are NOT treated as verified completions.',
      samples: {
        progressWithoutEvent: missingEvents.slice(0, 10),
        eventsWithoutProgressCompletion: missingProgress.slice(0, 10),
        duplicateLevelCompletedEvents: duplicateEvents.slice(0, 10),
        completionsMissingCompletedAt: missingCompletedAt.slice(0, 10),
      },
    }

    console.log(JSON.stringify(report, null, 2))
  } finally {
    await disconnectDatabase()
  }
}

void main().catch((error) => {
  console.error('Reconciliation failed:', error instanceof Error ? error.message : error)
  process.exitCode = 1
})
