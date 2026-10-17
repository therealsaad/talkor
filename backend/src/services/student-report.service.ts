import { Types } from 'mongoose'
import { Student } from '../models/Student'
import { ActivityAttempt } from '../models/ActivityAttempt'
import { KGAlphabetAttempt } from '../models/KGAlphabetAttempt'
import { KGAlphabetProgress } from '../models/KGAlphabetProgress'
import { Progress } from '../models/Progress'
import { MistakeRecord } from '../models/MistakeRecord'
import { ApiError } from '../utils/ApiError'

export type ReportPeriod = 'daily' | 'weekly' | 'monthly'

/** UTC reporting windows, bounded to avoid accidental unbounded scans at 10K students. */
export function reportWindow(period: ReportPeriod, now = new Date()) {
  const end = new Date(now)
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  if (period === 'weekly') start.setUTCDate(start.getUTCDate() - 6)
  if (period === 'monthly') start.setUTCDate(start.getUTCDate() - 29)
  return { start, end }
}

function recommendations(grade: number, weakSkills: string[], kgLetters: string[]) {
  if (grade === 0) {
    const letters = kgLetters.length ? kgLetters.join(', ') : 'A, B, C and D'
    return [`Say each letter and its picture-word aloud: ${letters}.`, 'Ask your child to point to one matching picture and say the word.']
  }
  if (weakSkills.length) return weakSkills.slice(0, 3).map((skill) => `Practise ${skill.replace(/[:_]/g, ' ')} aloud for five minutes with a family member.`)
  return ['Ask your child to describe their day in three English sentences.', 'Practise a short conversation with a family member.']
}

/** Generated only from saved attempts; avoids making up pronunciation or mastery scores. */
export const StudentReportService = {
  async generate(schoolId: string, studentId: string, role: 'TEACHER' | 'SCHOOL_ADMIN', requesterId: string, period: ReportPeriod) {
    if (!Types.ObjectId.isValid(studentId)) throw ApiError.badRequest('Invalid student ID')
    const student = await Student.findOne({ _id: studentId, schoolId,
      ...(role === 'TEACHER' ? { teacherId: requesterId } : {}) })
      .select('schoolId teacherId fullName grade className rollNumber status').lean()
    if (!student) throw ApiError.notFound('Student not found within your school and role')
    const { start, end } = reportWindow(period)
    const dates = { $gte: start, $lte: end }
    const [attemptStats, progress, mistakes, kgStats, kgWeakLetters, kgProgress] = await Promise.all([
      ActivityAttempt.aggregate([
        { $match: { studentId: student._id, createdAt: dates } },
        { $group: { _id: null, attempts: { $sum: 1 }, scoreSum: { $sum: '$score' },
          correct: { $sum: { $cond: ['$correct', 1, 0] } }, timeMs: { $sum: '$timeTakenMs' },
          activeDates: { $addToSet: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'UTC' } } },
        } },
      ]),
      Progress.find({ studentId: student._id }).select('levels xp').lean(),
      MistakeRecord.find({ studentId: student._id, resolved: false })
        .select('skill attemptCount').sort({ attemptCount: -1 }).limit(6).lean(),
      student.grade === 0 ? KGAlphabetAttempt.aggregate([
        { $match: { studentId: student._id, createdAt: dates } },
        { $group: { _id: null, attempts: { $sum: 1 }, scored: { $sum: { $cond: [{ $ne: ['$outcome', 'unclear'] }, 1, 0] } },
          correct: { $sum: { $cond: [{ $eq: ['$outcome', 'correct'] }, 1, 0] } },
          unclear: { $sum: { $cond: [{ $eq: ['$outcome', 'unclear'] }, 1, 0] } },
          timeMs: { $sum: '$timeSpentMs' },
          activeDates: { $addToSet: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'UTC' } } },
        } },
      ]) : Promise.resolve([]),
      student.grade === 0 ? KGAlphabetAttempt.distinct('letter', { studentId: student._id,
        createdAt: dates, outcome: 'incorrect' }) : Promise.resolve([]),
      student.grade === 0 ? KGAlphabetProgress.findOne({ studentId: student._id }).select('currentIndex introSeen completedAt').lean() : Promise.resolve(null),
    ])
    const legacy = attemptStats[0] || { attempts: 0, scoreSum: 0, correct: 0, timeMs: 0, activeDates: [] }
    const kg = kgStats[0] || { attempts: 0, scored: 0, correct: 0, unclear: 0, timeMs: 0, activeDates: [] }
    const attempts = Number(legacy.attempts) + Number(kg.attempts)
    const denominator = Number(legacy.attempts) + Number(kg.scored)
    const weakSkills = mistakes.map((item) => item.skill)
    const activeDays = new Set([...legacy.activeDates, ...kg.activeDates]).size
    return {
      type: 'recorded-learning-report', period, window: { from: start.toISOString(), to: end.toISOString() },
      generatedAt: new Date().toISOString(),
      student: { id: student._id.toString(), fullName: student.fullName, rollNumber: student.rollNumber,
        grade: student.grade, className: student.className || null },
      metrics: {
        activeDays,
        attemptCount: attempts,
        correctAttempts: Number(legacy.correct) + Number(kg.correct),
        // KG unclear speech is deliberately excluded from scored denominator.
        accuracyPercent: denominator ? Math.round((Number(legacy.scoreSum) + Number(kg.correct) * 100) / denominator) : null,
        totalMinutes: Math.round((Number(legacy.timeMs) + Number(kg.timeMs)) / 60000),
        completedLevels: progress.reduce((sum, item) => sum + item.levels.filter((level) => level.status === 'completed').length, 0),
        totalXp: progress.reduce((sum, item) => sum + item.xp, 0),
        kgLevel1Activities: kgProgress?.currentIndex ?? null,
        kgLevel1Complete: Boolean(kgProgress?.completedAt),
        unclearSpeechAttempts: Number(kg.unclear),
      },
      needsPractice: student.grade === 0 ? kgWeakLetters : weakSkills,
      homePractice: recommendations(student.grade, weakSkills, kgWeakLetters),
      disclaimer: 'Scores are derived from saved attempts, not AI assessments. No activity means no recorded performance. Some counts (completed levels and XP) are lifetime values.',
    }
  },
}
