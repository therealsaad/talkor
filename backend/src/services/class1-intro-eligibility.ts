import { createHash } from 'node:crypto'
import { Class1IntroVisit } from '../models/Class1IntroVisit'
import { ApiError } from '../utils/ApiError'

export const CLASS1_INTRO_VALID_MS = 2 * 60 * 60_000
export function firstDayIntroSource(settings: Record<string, unknown> = {}) {
  // The default matches the measured packaged 90-second film. A different
  // reviewed 87–93s film must pin its duration in authorized lesson metadata.
  const configured = settings.introDurationSeconds
  const seconds = configured === undefined ? 90 : Number(configured)
  if (!Number.isFinite(seconds) || seconds < 87 || seconds > 93) throw ApiError.conflict('The reviewed story duration is unavailable')
  const sourceHash = createHash('sha256').update(JSON.stringify([
    settings.lessonPlanRevision || 'first-day-v3-v4', settings.introVideoUrl || 'packaged-first-day', seconds,
  ])).digest('hex')
  return { sourceHash, minimumMs: Math.ceil(seconds * 1000) }
}

export async function assertFirstDayIntro(input: {
  studentId: string; schoolId: string; authVersion: number; lessonId: string;
  settings?: Record<string, unknown>; grade: number; activityKey?: string; lessonOnly?: boolean
}) {
  const modern = /^class1-l01-v(?:3|4)-/.test(input.activityKey || '') ||
    (input.lessonOnly && input.settings?.experienceId === 'g01-l01' && /v[34]/.test(String(input.settings?.lessonPlanRevision || '')))
  if (input.grade !== 1 || !modern) return
  const { sourceHash } = firstDayIntroSource(input.settings)
  const watched = await Class1IntroVisit.exists({ studentId: input.studentId, schoolId: input.schoolId,
    lessonId: input.lessonId, authVersion: input.authVersion, sourceHash,
    completedAt: { $type: 'date' }, expiresAt: { $gt: new Date() } })
  if (!watched) throw ApiError.conflict('Finish Miss Julie’s complete story before starting this lesson')
}
