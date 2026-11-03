import { CLASS1_BALBHARATI_DRAFTS } from '../lessons/grades/class-01/balbharati-curriculum'
import { CLASS1_DRAFT_MODELS } from '../lessons/grades/class-01/class1-preview-scaffolds'
import type { WorkspacePlan } from './plan-loaders'
import { UNIT_ONE_COVERAGE, type CoverageTask } from './unit-one-coverage'

export type ExplorerView = 'map' | 'coverage' | 'teaching'
export type ReviewDecision = 'pending' | 'revise' | 'reviewed'
export interface PlanReview {
  decision: ReviewDecision
  note: string
}
export type PlanReviews = Record<string, PlanReview>
export interface ChapterPlan {
  code: string
  title: string
  unit: number
  pages: number[]
  prompt: string
  evidence: string
  model?: string
  tasks: CoverageTask[]
  teacherNote: string
  issues: string[]
}
export interface ExplorerPlan extends WorkspacePlan {
  chapters: ChapterPlan[]
}
export interface TeachingSample {
  id: string
  title: string
  prompt: string
  evidence: string
  model?: string
  kind: 'chapter' | 'activity' | 'idea'
  issues: string[]
}
export interface ExplorerFilters {
  grade: number | 'all'
  unit: string
  search: string
}

export function isEducator(role: string | null | undefined): boolean {
  return role === 'TEACHER' || role === 'SCHOOL_ADMIN'
}
export function validGrade(value: unknown, fallback = 1): number {
  const n =
    typeof value === 'number'
      ? value
      : typeof value === 'string' && /^\d{1,2}$/.test(value)
        ? Number(value)
        : NaN
  return Number.isInteger(n) && n >= 0 && n <= 10 ? n : fallback
}
export function validLevel(value: unknown): number {
  const n =
    typeof value === 'number'
      ? value
      : typeof value === 'string' && /^\d{1,2}$/.test(value)
        ? Number(value)
        : NaN
  return Number.isInteger(n) && n >= 1 && n <= 10 ? n : 1
}
export function gradeName(grade: number): string {
  return grade === 0 ? 'Kindergarten' : `Class ${grade}`
}

/** Display adapter only. Never mutates imported activities/configs or makes publication decisions. */
export function buildExplorerPlan(workspace: WorkspacePlan): ExplorerPlan {
  const draft =
    workspace.config.grade === 1
      ? CLASS1_BALBHARATI_DRAFTS.find((d) => d.level === workspace.config.level)
      : undefined
  const chapters: ChapterPlan[] =
    draft?.exercises.map((e) => {
      const audit = UNIT_ONE_COVERAGE[e.chapter]
      return {
        code: e.chapter,
        title: e.name,
        unit: Number(e.chapter.split('.')[0]),
        pages: audit ? [...audit.pages] : [e.page],
        prompt: e.prompt,
        evidence: e.evidence,
        model: CLASS1_DRAFT_MODELS[e.chapter],
        tasks: audit ? audit.tasks.map((t) => ({ ...t })) : [],
        teacherNote:
          audit?.teacher ??
          'The chapter is assigned in the existing draft. Audit every numbered textbook exercise, written task and teacher note before claiming full exercise coverage.',
        issues: [],
      }
    }) ?? []
  return { ...workspace, chapters }
}
export function matchesPlan(
  plan: ExplorerPlan,
  filters: ExplorerFilters
): boolean {
  if (filters.grade !== 'all' && plan.config.grade !== filters.grade)
    return false
  if (
    filters.unit !== 'all' &&
    !plan.chapters.some((c) => String(c.unit) === filters.unit)
  )
    return false
  const q = filters.search.trim().toLowerCase()
  return (
    !q ||
    [
      plan.config.title,
      plan.config.description,
      plan.config.id,
      ...plan.config.syllabus.objectives,
      ...plan.chapters.flatMap((c) => [
        c.code,
        c.title,
        c.prompt,
        ...c.tasks.flatMap((t) => [t.title, t.detail]),
      ]),
      ...plan.activities.map((a) => a.prompt),
      ...plan.suggestedActivities.map((a) => a.label),
    ]
      .join(' ')
      .toLowerCase()
      .includes(q)
  )
}
export function teachingSamples(plan: ExplorerPlan): TeachingSample[] {
  return [
    ...plan.chapters.map((c) => ({
      id: `chapter-${c.code}`,
      title: `${c.code} · ${c.title}`,
      prompt: c.prompt,
      evidence: c.evidence,
      model: c.model,
      kind: 'chapter' as const,
      issues: c.issues,
    })),
    ...plan.activities.map((a) => ({
      id: a.id,
      title: a.id.replaceAll('-', ' '),
      prompt: a.prompt,
      evidence: a.successCriteria,
      kind: 'activity' as const,
      issues: [],
    })),
    ...plan.suggestedActivities.map((a, i) => ({
      id: `idea-${i}`,
      title: a.label,
      prompt: a.educatorNote,
      evidence:
        'Editorial idea only. A teacher must author a prompt, model response and evidence rubric.',
      kind: 'idea' as const,
      issues: [],
    })),
  ]
}
export function reviewKey(
  schoolId: string | undefined,
  userId: string | undefined
): string | null {
  return schoolId && userId
    ? `talkora:curriculum-review:v1:${schoolId}:${userId}`
    : null
}
export function parseReviews(raw: string | null): PlanReviews {
  try {
    const data: unknown = JSON.parse(raw ?? '{}')
    if (!data || typeof data !== 'object' || Array.isArray(data)) return {}
    return Object.fromEntries(
      Object.entries(data)
        .filter(
          ([key, value]) =>
            /^g(?:0\d|10)-l(?:0[1-9]|10)$/.test(key) &&
            value &&
            typeof value === 'object' &&
            ['pending', 'revise', 'reviewed'].includes(value.decision) &&
            typeof value.note === 'string'
        )
        .map(([key, value]) => [
          key,
          { decision: value.decision, note: value.note.slice(0, 2000) },
        ])
    )
  } catch {
    return {}
  }
}
export function isValidLiveMap(
  value: {
    grade: number
    levels: { grade: number; level: number; address: string }[]
  },
  grade: number
): boolean {
  return (
    value.grade === grade &&
    value.levels.every(
      (l) =>
        l.grade === grade &&
        l.level >= 1 &&
        l.level <= 10 &&
        l.address ===
          `g${String(grade).padStart(2, '0')}-l${String(l.level).padStart(2, '0')}`
    ) &&
    new Set(value.levels.map((l) => l.address)).size === value.levels.length
  )
}
