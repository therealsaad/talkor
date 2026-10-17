import { Student } from '../models/Student'
import { Teacher } from '../models/Teacher'
import { Progress } from '../models/Progress'
import { ActivityAttempt } from '../models/ActivityAttempt'
import { MistakeRecord } from '../models/MistakeRecord'
import { activeLevelCountsByGrade } from './curriculum-level-counts'
import { HomePractice } from '../models/HomePractice'

/** Bounded aggregations: never load every raw attempt for 10,000 learners into Node memory. */
async function dataFor(schoolId: string, teacherId?: string) {
  const students = await Student.find({ schoolId, status: 'active', ...(teacherId ? { teacherId } : {}) })
    .select('_id fullName grade className').lean()
  const ids = students.map((student) => student._id)
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const [progress, scores] = ids.length ? await Promise.all([
    Progress.aggregate([
      { $match: { studentId: { $in: ids } } },
      { $project: { studentId: 1, xp: 1, lastActivityAt: 1,
        completed: { $size: { $filter: { input: { $ifNull: ['$levels', []] }, as: 'level', cond: { $eq: ['$$level.status', 'completed'] } } } } } },
      { $group: { _id: '$studentId', xp: { $sum: '$xp' }, completedLevels: { $sum: '$completed' }, lastActivityAt: { $max: '$lastActivityAt' } } },
    ]).allowDiskUse(true),
    ActivityAttempt.aggregate([
      { $match: { studentId: { $in: ids } } },
      { $group: { _id: '$studentId', attempts: { $sum: 1 }, totalScore: { $sum: '$score' },
        totalTimeMs: { $sum: '$timeTakenMs' }, todayAttempts: { $sum: { $cond: [{ $gte: ['$createdAt', today] }, 1, 0] } } } },
    ]).allowDiskUse(true),
  ]) : [[], []]
  const progressMap = new Map(progress.map((row) => [String(row._id), row]))
  const scoreMap = new Map(scores.map((row) => [String(row._id), row]))
  const rows = students.map((student) => {
    const progressRow = progressMap.get(student._id.toString())
    const scoreRow = scoreMap.get(student._id.toString())
    const attempts = Number(scoreRow?.attempts || 0)
    return { studentId: student._id.toString(), fullName: student.fullName, grade: student.grade,
      className: student.className, xp: Number(progressRow?.xp || 0),
      completedLevels: Number(progressRow?.completedLevels || 0),
      accuracy: attempts ? Math.round(Number(scoreRow.totalScore) / attempts) : 0,
      attempts, totalScore: Number(scoreRow?.totalScore || 0),
      todayAttempts: Number(scoreRow?.todayAttempts || 0),
      learningTimeMinutes: Math.round(Number(scoreRow?.totalTimeMs || 0) / 60000),
      totalTimeMs: Number(scoreRow?.totalTimeMs || 0),
      lastActivityAt: progressRow?.lastActivityAt || undefined,
    }
  })
  return { rows }
}

export const AnalyticsService = {
  async studentDetail(schoolId: string, studentId: string, teacherId?: string) {
    const student = await Student.findOne({ _id: studentId, schoolId, ...(teacherId ? { teacherId } : {}) }).lean()
    if (!student) return null
    const [progress, scoreGroups, recentAttempts, levelCounts, homePractice] = await Promise.all([
      Progress.find({ studentId }).lean(),
      ActivityAttempt.aggregate([
        { $match: { studentId: student._id } },
        { $group: { _id: null, attempts: { $sum: 1 }, totalScore: { $sum: '$score' }, totalTimeMs: { $sum: '$timeTakenMs' } } },
      ]),
      ActivityAttempt.find({ studentId }).sort('-createdAt').limit(20).lean(),
      activeLevelCountsByGrade([student.grade]),
      HomePractice.findOne({ studentId, unitKey: 'UNIT1_FAVOURITES' }).select('reflection submittedAt audioSizeBytes').lean(),
    ])
    const scores = scoreGroups[0] || { attempts: 0, totalScore: 0, totalTimeMs: 0 }
    return {
      student: { ...student, id: student._id.toString() },
      progress: {
        accuracy: scores.attempts ? Math.round(scores.totalScore / scores.attempts) : 0,
        completedLevels: progress.reduce((sum, row) => sum + row.levels.filter((level) => level.status === 'completed').length, 0),
        totalLevels: levelCounts.get(student.grade) || 0,
        totalXp: progress.reduce((sum, row) => sum + row.xp, 0),
        learningTimeMinutes: Math.round(scores.totalTimeMs / 60000),
        streak: Math.max(0, ...progress.map((row) => row.streak)),
      },
      recentAttempts: recentAttempts.map((attempt) => ({ activityId: attempt.activityId.toString(), answer: attempt.answer, correct: attempt.correct, score: attempt.score, timeTakenSeconds: Math.round(attempt.timeTakenMs / 1000), createdAt: attempt.createdAt })),
      homePractice: homePractice ? { reflection: homePractice.reflection, submittedAt: homePractice.submittedAt, hasAudio: Boolean(homePractice.audioSizeBytes) } : null,
    }
  },
  async schoolOverview(schoolId: string, teacherId?: string) {
    const { rows } = await dataFor(schoolId, teacherId)
    const levelCounts = await activeLevelCountsByGrade(rows.map((row) => row.grade))
    const cutoff = Date.now() - 7 * 86400000
    return {
      studentCount: rows.length,
      activeStudentCount: rows.filter((row) => row.lastActivityAt && +new Date(row.lastActivityAt) >= cutoff).length,
      teacherCount: teacherId ? 1 : await Teacher.countDocuments({ schoolId, status: 'active' }),
      averageProgress: rows.length ? Math.round(rows.reduce((sum, row) => {
        const totalLevels = levelCounts.get(row.grade) || 0
        return sum + (totalLevels ? Math.min(100, row.completedLevels / totalLevels * 100) : 0)
      }, 0) / rows.length) : 0,
      totalLearningMinutes: rows.reduce((sum, row) => sum + row.learningTimeMinutes, 0),
      totalXp: rows.reduce((sum, row) => sum + row.xp, 0),
    }
  },
  async analyticsOverview(schoolId: string, teacherId?: string) {
    const { rows } = await dataFor(schoolId, teacherId)
    const totalAttempts = rows.reduce((sum, row) => sum + row.attempts, 0)
    const totalScore = rows.reduce((sum, row) => sum + row.totalScore, 0)
    const grades = [...new Set(rows.map((row) => row.grade))].sort((a, b) => a - b)
    return {
      totalAttempts,
      avgAccuracy: totalAttempts ? Math.round(totalScore / totalAttempts) : 0,
      totalLearningTimeMinutes: Math.round(rows.reduce((sum, row) => sum + row.totalTimeMs, 0) / 60000),
      activeTodayCount: rows.filter((row) => row.todayAttempts > 0).length,
      gradeBreakdown: grades.map((grade) => {
        const group = rows.filter((row) => row.grade === grade)
        const attempted = group.filter((row) => row.attempts > 0)
        return {
          grade,
          studentCount: group.length,
          attemptedStudentCount: attempted.length,
          avgAccuracy: attempted.length ? Math.round(attempted.reduce((sum, row) => sum + row.accuracy, 0) / attempted.length) : 0,
          avgLevelsCompleted: group.length ? Number((group.reduce((sum, row) => sum + row.completedLevels, 0) / group.length).toFixed(1)) : 0,
        }
      }),
      studentsNeedingAttention: rows.filter((row) => row.attempts >= 2 && row.accuracy < 70).sort((a, b) => a.accuracy - b.accuracy).slice(0, 6),
    }
  },
  async weakestSkillsForSchool(schoolId: string, limit = 5, teacherId?: string) { const students = await Student.find({ schoolId, ...(teacherId ? { teacherId } : {}) }).select('_id').lean(); return MistakeRecord.aggregate([{ $match: { studentId: { $in: students.map((s) => s._id) }, resolved: false } }, { $group: { _id: '$skill', occurrences: { $sum: '$attemptCount' }, students: { $addToSet: '$studentId' } } }, { $project: { skill: '$_id', occurrences: 1, studentCount: { $size: '$students' }, _id: 0 } }, { $sort: { occurrences: -1 } }, { $limit: limit }]) },
}
