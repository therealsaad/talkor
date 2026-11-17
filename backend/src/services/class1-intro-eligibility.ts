import { createHash } from 'node:crypto'
import { Class1IntroVisit } from '../models/Class1IntroVisit'
import { ApiError } from '../utils/ApiError'

export const CLASS1_INTRO_VALID_MS = 2 * 60 * 60_000
export function firstDayIntroSource(settings: Record<string, unknown> = {}) {
  const bundled = !settings.introVideoUrl || settings.introVideoUrl === '/lessons/class-01/level-01/miss-julie-first-day-intro.mp4'
  // Keep the ticket clock aligned with the shipped MP4, including older
  // lesson records that still describe the previous 90-second asset.
  const seconds = bundled ? 40.908798 : Number(settings.introDurationSeconds ?? 90)
  if (!Number.isFinite(seconds) || (!bundled && (seconds < 87 || seconds > 93))) throw ApiError.conflict('The reviewed story duration is unavailable')
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
