'use client'
import {
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  FileCheck2,
  Play,
  ShieldCheck,
} from 'lucide-react'
import type { EditorMappedLevel } from '@/services/grade-level-map'
import type { ExplorerPlan, PlanReviews } from './model'
import { gradeName } from './model'
import { PlanReview } from './PlanReview'
import styles from './explorer.module.css'

export const LIVE_STATUS = {
  NOT_MAPPED: 'Not mapped',
  DRAFT: 'Draft',
  INCOMPLETE: 'Published flag; no playable activities',
  PUBLISHED: 'Active lesson activities detected',
  ARCHIVED: 'Archived',
}
export function LevelDetail({
  plan,
  actual,
  reviews,
  onReview,
  onView,
  onBack,
}: {
  plan: ExplorerPlan
  actual?: EditorMappedLevel
  reviews: PlanReviews
  onReview: (
    id: string,
    value: { decision: 'pending' | 'revise' | 'reviewed'; note: string }
  ) => void
  onView: (view: 'coverage' | 'teaching') => void
  onBack: () => void
}) {
  const c = plan.config
  return (
    <aside className={styles.detail} aria-label="Selected level details">
      <div className={styles.detailBanner}>
        <span className={styles.eyebrow}>EXPLORING {c.id.toUpperCase()}</span>
        <h2>{c.title}</h2>
        <p>
          {gradeName(c.grade)} · Level {c.level}
        </p>
        <button className={styles.mobileBack} type="button" onClick={onBack}>
          <ArrowLeft size={13} />
          Back to level map
        </button>
      </div>
      <div className={styles.detailBody}>
        <p>{c.description}</p>
        <div className={styles.pills}>
          <span>
            <BookOpen size={12} />
            {plan.chapters.length} linked chapters
          </span>
          <span>
            <FileCheck2 size={12} />
            {plan.activities.length} authored activities
          </span>
        </div>
        <h3>Learning objectives</h3>
        <ul>
          {c.syllabus.objectives.map((o) => (
            <li key={o}>{o}</li>
          ))}
        </ul>
        <h3>Source coverage</h3>
        <p>
          {c.syllabus.sourceBook ||
            'No textbook source is linked to this level yet.'}
        </p>
        {c.syllabus.sourcePages.length ? (
          <p>Catalog page references: {c.syllabus.sourcePages.join(', ')}.</p>
        ) : null}
        <span className={styles.statusBadge}>
          {c.syllabus.syllabusVerified
            ? 'Catalog marked syllabus-verified'
            : 'Syllabus review pending'}
        </span>
        {c.grade === 1 && c.level === 1 ? (
          <div className={styles.softNote}>
            <b>Foundation first</b>
            <p>
              Welcome → two-letter words → lesson 1.1 “My First Day”. The full
              Class 1 chapter distribution stays intact.
            </p>
          </div>
        ) : null}
        <h3>Live school curriculum</h3>
        <p>
          {actual
            ? LIVE_STATUS[actual.status]
            : 'Availability has not been verified for this school.'}
        </p>
        {actual ? (
          <p>
            {actual.lessons.length} lesson records ·{' '}
            {actual.lessons.reduce((sum, l) => sum + l.activityCount, 0)} active
            activities
          </p>
        ) : null}
        {actual?.actualTitle && actual.actualTitle !== c.title ? (
          <p>
            Live title: <b>{actual.actualTitle}</b>
          </p>
        ) : null}
        <button
          type="button"
          className={styles.primaryButton}
          onClick={() => onView('teaching')}
        >
          <Play size={14} />
          Try the teaching flow
          <ArrowUpRight size={14} />
        </button>
        <button
          type="button"
          className={styles.textButton}
          onClick={() => onView('coverage')}
        >
          Inspect chapters & all activities
          <ArrowUpRight size={13} />
        </button>
        <div className={styles.safeNote}>
          <ShieldCheck size={15} />
          <span>
            Read-only inspection. Availability, progress, XP, and publication
            stay server-owned.
          </span>
        </div>
      </div>
      <PlanReview id={c.id} review={reviews[c.id]} onChange={onReview} />
    </aside>
  )
}
