import { KGIntroPlayback } from '../models/KGIntroPlayback'
import { KGLevel2Progress } from '../models/KGLevel2Progress'
import { KGContinuationProgress } from '../models/KGContinuationProgress'

/**
 * A new authenticated school-lab visit must never inherit another visit's
 * completed introduction. Keep every Mongo lesson cursor, attempt, score and
 * completion untouched; only invalidate short-lived intro permissions.
 *
 * Await this before responding to PIN login/logout: a best-effort fire-and-
 * forget write could expose a still-valid intro ticket after another login.
 */
export async function revokeKGIntroTicketsForStudent(studentId: string, schoolId: string): Promise<void> {
  const scope = { studentId, schoolId }
  const now = new Date()
  const unsetIntro = {
    $unset: { introTicketHash: 1, introStartedAt: 1, introCompletedAt: 1 },
  }
  await Promise.all([
    KGIntroPlayback.updateMany({ ...scope, expiresAt: { $gt: now } }, { $set: { expiresAt: now } }),
    KGLevel2Progress.updateMany(scope, unsetIntro),
    KGContinuationProgress.updateMany(scope, unsetIntro),
  ])
}
