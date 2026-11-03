'use client'
import { CheckCircle2, ClipboardCheck } from 'lucide-react'
import type { PlanReview as Review, ReviewDecision } from './model'
import styles from './explorer.module.css'

export function PlanReview({
  id,
  review,
  onChange,
}: {
  id: string
  review?: Review
  onChange: (id: string, review: Review) => void
}) {
  const value = review ?? { decision: 'pending', note: '' }
  return (
    <section className={styles.reviewBox} aria-label="Local planning review">
      <h3>
        <ClipboardCheck size={16} />
        Your planning review
      </h3>
      <label htmlFor={`review-${id}`}>Review decision</label>
      <select
        id={`review-${id}`}
        value={value.decision}
        onChange={(e) =>
          onChange(id, { ...value, decision: e.target.value as ReviewDecision })
        }
      >
        <option value="pending">Pending review</option>
        <option value="revise">Needs revision</option>
        <option value="reviewed">Plan reviewed</option>
      </select>
      <label htmlFor={`notes-${id}`}>Teacher notes</label>
      <textarea
        id={`notes-${id}`}
        rows={3}
        maxLength={2000}
        value={value.note}
        placeholder="What should be checked before implementation?"
        onChange={(e) => onChange(id, { ...value, note: e.target.value })}
      />
      <p>
        <CheckCircle2 size={12} />
        Browser-only notes for your school account. This is not publication
        approval or student completion.
      </p>
    </section>
  )
}
