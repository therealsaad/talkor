/** REVIEW DRAFT ONLY. Not imported by runtime or an approved persistence schema. */
export type TeachingState =
  | 'INTRODUCTION' | 'DISCOVERY' | 'EXPLANATION' | 'GUIDED_PRACTICE'
  | 'INDEPENDENT_PRACTICE' | 'FEEDBACK' | 'REMEDIATION'
  | 'MASTERY_CHECK' | 'REVISION' | 'COMPLETED'

export type TeachingAction = 'ANSWER' | 'RETRY' | 'REQUEST_HINT' | 'REPLAY_AUDIO' | 'PAUSE'
export type EvidenceDimension = 'UNDERSTANDING' | 'RECOGNITION' | 'RECALL' | 'APPLICATION'

export interface TeachingEvidenceV1 {
  objectiveId: string
  dimension: EvidenceDimension
  support: 'INDEPENDENT' | 'SUPPORTED'
  source: 'STRUCTURED_CHECK' | 'REVIEWED_RUBRIC' | 'PRONUNCIATION_ASSESSMENT'
  /** Reference to persisted, student-owned evidence; no transcript in this envelope. */
  attemptId: string
  activityId: string
  criterionId: string
}

/** Optional `teaching` property on the existing turn response; existing fields stay intact. */
export interface TeachingResponseV1 {
  contractVersion: 'teaching.v1'
  curriculumVersion: string
  conversationId: string
  /** Opaque server concurrency token. Durable storage strategy requires review. */
  revision: string
  lessonId: string
  activityId: string
  teachingState: TeachingState
  /** Mirrors existing message; model can propose wording but cannot set state/evidence. */
  teacherUtterance: string
  language: 'en' | 'hi' | 'mr'
  /** Registry-owned asset/action identifiers; never arbitrary model URLs or commands. */
  visualAction: { kind: 'NONE' } | { kind: 'SHOW_ASSET'; assetKey: string }
  expectedStudentAction: 'LISTEN' | 'SPEAK' | 'SELECT' | 'TYPE' | 'NONE'
  feedbackType: 'NONE' | 'CORRECT' | 'PARTIAL' | 'INCORRECT' | 'SILENCE' | 'OFF_TOPIC' | 'UNAVAILABLE'
  masteryEvidence: TeachingEvidenceV1[]
  masteryStatus: 'IN_PROGRESS' | 'MASTERED' | 'COMPLETED_WITH_SUPPORT' | 'NEEDS_PRACTICE'
  nextAllowedActions: TeachingAction[]
  /** Describes confirmed writes only. Does not authorize or request unlocking. */
  progressUpdate: {
    persisted: boolean
    activityCompleted: boolean
    lessonCompleted: boolean
    levelUnlocked: boolean
  }
}

/** Proposed opt-in request extension; identity comes exclusively from authentication. */
export interface TeachingTurnV1 {
  contractVersion: 'teaching.v1'
  conversationId: string
  expectedRevision: string
  idempotencyKey: string
  action: TeachingAction
  input?: { mode: 'OPTION' | 'MIC' | 'TEXT'; text: string }
  preferredExplanationLanguage?: 'en' | 'hi' | 'mr'
}
