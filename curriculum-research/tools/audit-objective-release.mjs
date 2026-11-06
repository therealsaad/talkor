#!/usr/bin/env node
/**
 * No-network, no-mutation educator review packet / curriculum release audit.
 * An AI agent cannot act as a qualified teacher or infer school book settings.
 * This tool NEVER changes the draft registry's approval or publishes lessons.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

const registryPath = new URL('../class1-objective-registry.draft.json', import.meta.url)
export const loadRegistry = () => JSON.parse(readFileSync(registryPath, 'utf8'))
const levelOrder = (levelId) => {
  const match = /^g01-l(0[1-9]|10)$/.exec(levelId || '')
  return match ? Number(match[1]) : null
}

export function auditObjectiveRelease(registry) {
  const books = []
  const allIds = new Set()
  const duplicateIds = []
  let pending = 0
  let unexpectedlyApproved = 0
  let total = 0
  for (const book of registry.books || []) {
    const chapterMap = new Map()
    for (const objective of book.objectives || []) {
      total++
      if (allIds.has(objective.objectiveId)) duplicateIds.push(objective.objectiveId)
      allIds.add(objective.objectiveId)
      if (!objective.approvedRevision && objective.reviewStatus === 'DRAFT_PENDING_TEACHER_REVIEW') pending++
      else unexpectedlyApproved++
      const chapterId = objective.sourceChapter
      if (!chapterMap.has(chapterId)) chapterMap.set(chapterId, {
        chapter: chapterId, sourceChapterOrder: objective.sourceChapterOrder, candidateLevels: new Set(),
      })
      for (const level of objective.candidateLevelIds || []) chapterMap.get(chapterId).candidateLevels.add(level)
    }

    const chapters = [...chapterMap.values()]
      .sort((a, b) => a.sourceChapterOrder - b.sourceChapterOrder)
      .map((chapter) => {
        const candidateLevels = [...chapter.candidateLevels].sort((a, b) => levelOrder(a) - levelOrder(b))
        return {
          chapter: chapter.chapter,
          sourceChapterOrder: chapter.sourceChapterOrder,
          candidateLevels,
          earliestCandidateLevel: candidateLevels[0] || null,
        }
      })
    const orderReviewFlags = []
    for (let i = 1; i < chapters.length; i++) {
      const previous = chapters[i - 1]
      const later = chapters[i]
      if (levelOrder(later.earliestCandidateLevel) !== null &&
          levelOrder(previous.earliestCandidateLevel) !== null &&
          levelOrder(later.earliestCandidateLevel) < levelOrder(previous.earliestCandidateLevel)) {
        orderReviewFlags.push({
          previousChapter: previous.chapter,
          previousEarliestLevel: previous.earliestCandidateLevel,
          laterChapter: later.chapter,
          laterEarliestLevel: later.earliestCandidateLevel,
          decision: 'TEACHER_CHRONOLOGY_REVIEW_REQUIRED',
        })
      }
    }
    books.push({
      bookId: book.textbookId,
      trackId: book.trackId,
      edition: book.edition,
      objectiveCount: book.objectives?.length || 0,
      chapters,
      orderReviewFlags,
    })
  }

  // A JSON value, even an apparently approved one, cannot verify a qualified
  // educator's identity, copyright permission, school-medium authorization,
  // real Node lesson/activity IDs, or acceptance of versioned objectives.
  return {
    reportVersion: 'talkora-class1-release-audit.v1',
    sourceRegistry: registry.registryVersion || null,
    sourceRuntimeStatus: registry.runtimeStatus || null,
    releaseDecision: 'BLOCKED_REQUIRES_EXTERNAL_HUMAN_APPROVAL',
    eligibleForStudents: false,
    totalObjectiveCount: total,
    draftPendingCount: pending,
    unexpectedReviewOrRevisionCount: unexpectedlyApproved,
    duplicateObjectiveIds: duplicateIds,
    chronologyReviewFlagCount: books.reduce((n, book) => n + book.orderReviewFlags.length, 0),
    books,
    unresolved: [
      'qualified teacher signs each objective and localized teaching sample',
      'copyright/asset rights are verified for the exact edition',
      'school administrator chooses the textbook track independently of explanation language',
      '10-level first-teach/practice/revisit/check sequence is approved and mapped to existing canonical Node IDs',
      'live AI/audio and no-progress-before-ACK acceptance gates are verified',
    ],
  }
}

export function buildUnsignedTeacherReviewPacket(registry) {
  const audit = auditObjectiveRelease(registry)
  return {
    packetVersion: 'unsigned-class1-review-packet.v1',
    state: 'UNSIGNED_DRAFT_DO_NOT_PUBLISH',
    releaseDecision: audit.releaseDecision,
    audit: {
      objectiveCount: audit.totalObjectiveCount,
      pending: audit.draftPendingCount,
      chronologyReviewFlags: audit.chronologyReviewFlagCount,
    },
    rows: (registry.books || []).flatMap(book => (book.objectives || []).map(objective => ({
      namespace: registry.namespace,
      bookId: book.textbookId,
      trackId: book.trackId,
      edition: book.edition,
      objectiveId: objective.objectiveId,
      sourceChapter: objective.sourceChapter,
      sourceObjectiveOrdinal: objective.sourceObjectiveOrdinal,
      proposedLevels: objective.candidateLevelIds,
      existingReviewStatus: objective.reviewStatus,
      existingApprovedRevision: objective.approvedRevision,
      teacherReview: {
        decision: null,
        reviewedAt: null,
        authorizedReviewerRef: null,
        correctedHindiMarathiScaffold: null,
        rightsPermissionRef: null,
        assessedIndependenceAndRecall: null,
      },
      schoolTrackAuthorizationRef: null,
      approvedCanonicalLessonId: null,
      approvedCanonicalActivityId: null,
      firstTeachLevel: null,
      reviewLevel: null,
      independentCheckLevel: null,
    }))),
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2)
  if (args.length > 1 || (args[0] && !['--audit', '--packet'].includes(args[0]))) {
    console.error('Usage: node curriculum-research/tools/audit-objective-release.mjs [--audit | --packet]')
    process.exitCode = 2
  } else {
    const registry = loadRegistry()
    console.log(JSON.stringify(args[0] === '--packet'
      ? buildUnsignedTeacherReviewPacket(registry)
      : auditObjectiveRelease(registry), null, 2))
  }
}
