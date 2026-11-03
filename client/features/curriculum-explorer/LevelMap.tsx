'use client'
import {
  ArrowUpRight,
  BookOpen,
  Check,
  GraduationCap,
  Layers3,
  MessageCircle,
  Music2,
  Shapes,
  Sparkles,
  Sun,
  Trees,
  WandSparkles,
} from 'lucide-react'
import type { ExplorerPlan, PlanReviews } from './model'
import { gradeName } from './model'
import styles from './explorer.module.css'

const icons = [
  BookOpen,
  Music2,
  Shapes,
  Trees,
  Sparkles,
  Sun,
  MessageCircle,
  GraduationCap,
  WandSparkles,
  Layers3,
]
export function LevelMap({
  plans,
  selected,
  reviews,
  onSelect,
}: {
  plans: ExplorerPlan[]
  selected?: string
  reviews: PlanReviews
  onSelect: (id: string) => void
}) {
  const grades = [...new Set(plans.map((p) => p.config.grade))]
  return (
    <div className={styles.mapGroups}>
      {grades.map((grade) => (
        <section
          className={styles.mapGroup}
          key={grade}
          aria-label={`${gradeName(grade)} level map`}
        >
          <div className={styles.sectionHead}>
            <div>
              <span className={styles.eyebrow}>
                {grade === 0 ? 'A GENTLE BEGINNING' : 'THE LEARNING JOURNEY'}
              </span>
              <h2>
                {gradeName(grade)}
                <span> · 10 curriculum addresses</span>
              </h2>
            </div>
            <span className={styles.subtleBadge}>KG–10 catalog</span>
          </div>
          <div className={styles.mapGrid}>
            {plans
              .filter((p) => p.config.grade === grade)
              .map((p) => {
                const Icon = icons[(p.config.level - 1) % icons.length]
                return (
                  <button
                    type="button"
                    key={p.config.id}
                    className={styles.levelButton}
                    aria-pressed={selected === p.config.id}
                    onClick={() => onSelect(p.config.id)}
                    aria-label={`${gradeName(grade)} Level ${p.config.level}: ${p.config.title}`}
                  >
                    <span
                      className={styles.levelArt}
                      data-palette={p.config.level % 5}
                    >
                      <Icon size={31} strokeWidth={1.6} />
                      <i>{String(p.config.level).padStart(2, '0')}</i>
                    </span>
                    <span className={styles.levelNumber}>
                      LEVEL {String(p.config.level).padStart(2, '0')}
                    </span>
                    <b>{p.config.title}</b>
                    <small>
                      {p.chapters.length
                        ? `${p.chapters.length} linked ${p.chapters.length === 1 ? 'chapter' : 'chapters'}`
                        : p.activities.length
                          ? `${p.activities.length} authored activities`
                          : 'Activity authoring pending'}
                    </small>
                    {reviews[p.config.id]?.decision === 'reviewed' ? (
                      <span className={styles.reviewedMini}>
                        <Check size={11} />
                        Plan reviewed
                      </span>
                    ) : null}
                  </button>
                )
              })}
          </div>
          <div className={styles.mapLegend}>
            <span>
              <i />
              Selected level
            </span>
            <span>Every level remains inspectable by staff.</span>
            <ArrowUpRight size={13} />
          </div>
        </section>
      ))}
    </div>
  )
}
