/** CSV for school-authorized, audited report exports. All string fields are formula-escaped. */
import { Types } from 'mongoose'
import { Student } from '../models/Student'
import { StudentReportService, type ReportPeriod } from './student-report.service'
import { ApiError } from '../utils/ApiError'

export type StaffRole = 'SCHOOL_ADMIN' | 'TEACHER'

export const CSV_COLUMNS = [
  'Student ID', 'Student', 'Roll number', 'Grade', 'Section', 'Report period',
  'Active days', 'Attempts', 'Correct attempts', 'Average recorded score (%)',
  'Learning minutes', 'Completed levels (lifetime)', 'Total XP (lifetime)',
  'KG Level 1 activities', 'KG Level 1 complete', 'Unclear speech attempts',
  'Needs practice', 'Recommended home practice', 'Report generated at',
] as const

/** Prefix spreadsheet formulas, including those preceded by whitespace/control characters. */
export function csvCell(value: unknown): string {
  const raw = value === null || value === undefined ? '' : String(value)
  const safe = /^[\s\u0000-\u001f]*[=+@-]/u.test(raw) ? `'${raw}` : raw
  return `"${safe.replace(/"/g, '""')}"`
}
export function csvRow(values: readonly unknown[]): string {
  return `${values.map(csvCell).join(',')}\r\n`
}
export function reportCsvHeader(): string {
  return `\uFEFF${csvRow(CSV_COLUMNS)}` // BOM improves Windows Excel compatibility.
}
export function reportCsvRow(report: Awaited<ReturnType<typeof StudentReportService.generate>>): string {
  const { student, metrics } = report
  return csvRow([
    student.id, student.fullName, student.rollNumber, student.grade, student.className,
    report.period, metrics.activeDays, metrics.attemptCount, metrics.correctAttempts,
    metrics.accuracyPercent, metrics.totalMinutes, metrics.completedLevels, metrics.totalXp,
    metrics.kgLevel1Activities, metrics.kgLevel1Complete ? 'Yes' : 'No', metrics.unclearSpeechAttempts,
    report.needsPractice.join('; '), report.homePractice.join('; '), report.generatedAt,
  ])
}

/** Keyset pagination: bounded memory, deterministic cursor, no large skip() scans. */
export async function reportPage(input: {
  schoolId: string; requesterId: string; role: StaffRole; period: ReportPeriod;
  after?: string; limit?: number
}) {
  const { schoolId, requesterId, role, period, after } = input
  if (!Types.ObjectId.isValid(schoolId)) throw ApiError.badRequest('Invalid school')
  if (after && !/^[a-f0-9]{24}$/i.test(after)) throw ApiError.badRequest('Invalid report cursor')
  const limit = input.limit ?? 30
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw ApiError.badRequest('Limit must be 1–100')
  const students = await Student.find({ schoolId, status: 'active',
    ...(role === 'TEACHER' ? { teacherId: requesterId } : {}),
    ...(after ? { _id: { $gt: new Types.ObjectId(after) } } : {}),
  }).select('_id').sort({ _id: 1 }).limit(limit + 1).lean()
  const page = students.slice(0, limit)
  const csvRows: string[] = new Array(page.length)
  // Bound simultaneous Mongo queries, even if school has 10k accounts.
  for (let offset = 0; offset < page.length; offset += 4) {
    const batch = page.slice(offset, offset + 4)
    const values = await Promise.all(batch.map((student) => StudentReportService.generate(
      schoolId, student._id.toString(), role, requesterId, period,
    )))
    values.forEach((report, idx) => { csvRows[offset + idx] = reportCsvRow(report) })
  }
  return { csv: reportCsvHeader() + csvRows.join(''),
    nextCursor: students.length > limit && page.length ? page[page.length - 1]._id.toString() : null,
    records: page.length }
}
