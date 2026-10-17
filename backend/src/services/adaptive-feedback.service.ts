import { Student } from '../models/Student'
import { ActivityAttempt } from '../models/ActivityAttempt'
import { KGAlphabetAttempt } from '../models/KGAlphabetAttempt'
import { KGAlphabetProgress } from '../models/KGAlphabetProgress'
import { MistakeRecord } from '../models/MistakeRecord'
import { ApiError } from '../utils/ApiError'

/** Read-only, age-appropriate recommendation built from the learner's own recorded data. */
export const AdaptiveFeedbackService = {
  async forStudent(studentId: string, schoolId: string) {
    const student = await Student.findOne({ _id: studentId, schoolId, status: 'active' }).select('grade').lean()
    if (!student) throw ApiError.forbidden('Student access denied')
    if (student.grade === 0) {
      const [progress, recent] = await Promise.all([
        KGAlphabetProgress.findOne({ studentId, schoolId }).select('currentIndex introSeen').lean(),
        KGAlphabetAttempt.find({ studentId, schoolId, replay: false }).select('letter outcome').sort('-createdAt').limit(12).lean(),
      ])
      const struggling = [...new Set(recent.filter((a) => a.outcome !== 'correct').map((a) => a.letter))]
      return { grade: 0, nextActivityIndex: progress?.currentIndex ?? 0, introRequired: !progress?.introSeen,
        mode: struggling.length ? 'REVIEW' : 'CONTINUE', focus: struggling.slice(0, 3),
        teacherCue: struggling.length ? `Miss Julie should model ${struggling.join(', ')} with pictures before asking the child to repeat.` : 'Continue with the next picture and spoken word.',
        evidence: recent.length, visibleLevelSelection: false }
    }
    const [attempts, mistakes] = await Promise.all([
      ActivityAttempt.find({ studentId }).select('score correct').sort('-createdAt').limit(20).lean(),
      MistakeRecord.find({ studentId, resolved: false }).select('skill attemptCount').sort('-attemptCount').limit(3).lean(),
    ])
    const average = attempts.length ? Math.round(attempts.reduce((sum, item) => sum + item.score, 0) / attempts.length) : null
    const focus = mistakes.map((item) => item.skill)
    const mode = focus.length || (average !== null && average < 70) ? 'REVIEW' : 'CONTINUE'
    return { grade: student.grade, mode, focus, observedAverageScore: average,
      evidence: attempts.length, visibleLevelSelection: false,
      teacherCue: mode === 'REVIEW' ? `Repeat examples for ${focus.join(', ') || 'recent questions'} with hints, then re-check understanding.` :
        'Continue to the next available syllabus activity.',
    }
  },
}
