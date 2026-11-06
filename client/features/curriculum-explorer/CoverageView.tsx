'use client'
import { useState } from 'react'
import { ArrowUpRight, BookOpen, ChevronDown, Info } from 'lucide-react'
import type { ExplorerPlan } from './model'
import type { EditorMappedLevel } from '@/services/grade-level-map'
import { gradeName } from './model'
import { SchoolLessonRecords } from './SchoolLessonRecords'
import styles from './explorer.module.css'

export function CoverageView({
  plans,
  unit,
  search,
  records = [],
  onPreview,
}: {
  plans: ExplorerPlan[]
  unit: string
  search: string
  records?: EditorMappedLevel[]
  onPreview: (id: string, sample?: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const q = search.trim().toLowerCase()
  return (
    <section aria-label="Lesson coverage">
      <div className={styles.sectionHead}>
        <div>
          <span className={styles.eyebrow}>CONTENT, WITHOUT THE GAPS</span>
          <h2>Every chapter has a place.</h2>
          <p>
            Existing assignments and authored prompts, with exercise audits
            where available.
          </p>
        </div>
        <button
          type="button"
          className={styles.textButton}
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? 'Collapse all' : 'Expand all'}
        </button>
      </div>
      <div className={styles.coverageRows}>
        {plans.map((plan) => (
          <details
            className={styles.coverageRow}
            key={`${plan.config.id}:${expanded}`}
            open={expanded || undefined}
          >
            <summary>
              <span className={styles.levelStamp}>
                {plan.config.grade === 0 ? 'KG' : `C${plan.config.grade}`} /{' '}
                {String(plan.config.level).padStart(2, '0')}
              </span>
              <div>
                <h3>{plan.config.title}</h3>
                <small>
                  {plan.chapters.length} linked chapters ·{' '}
                  {plan.activities.length} authored activities ·{' '}
                  {plan.suggestedActivities.length} editorial ideas
                </small>
              </div>
              <ChevronDown size={15} />
            </summary>
            <div className={styles.coverageBody}>
              {records.find((r) => r.address === plan.config.id) ? (
                <SchoolLessonRecords
                  key={plan.config.id}
                  record={records.find((r) => r.address === plan.config.id)!}
                />
              ) : null}
              {!plan.chapters.length ? (
                <div className={styles.notice}>
                  <BookOpen size={18} />
                  <p>
                    <b>Textbook chapters are not linked in the file catalog.</b>{' '}
                    {gradeName(plan.config.grade)}’s topic is recorded, but this
                    catalog does not identify a complete chapter syllabus.
                    Inspect any live lesson records separately; source
                    verification and exercise authoring are still required.
                  </p>
                </div>
              ) : null}
              {plan.chapters
                .filter(
                  (c) =>
                    (unit === 'all' || String(c.unit) === unit) &&
                    (!q ||
                      [
                        c.code,
                        c.title,
                        c.prompt,
                        ...c.tasks.flatMap((t) => [t.title, t.detail]),
                      ]
                        .join(' ')
                        .toLowerCase()
                        .includes(q) ||
                      plan.config.title.toLowerCase().includes(q) ||
                      plan.config.id.includes(q))
                )
                .map((c) => (
                  <article className={styles.chapter} key={c.code} aria-label={`${c.code} ${c.title}`}>
                    <div className={styles.chapterHead}>
                      <span className={styles.chapterCode}>{c.code}</span>
                      <div>
                        <h4>{c.title}</h4>
                        <small>
                          Unit {c.unit} · printed{' '}
                          {c.pages.length > 1
                            ? `pages ${c.pages.join('–')}`
                            : `page ${c.pages[0]}`}
                        </small>
                      </div>
                      <button
                        type="button"
                        className={styles.textButton}
                        onClick={() =>
                          onPreview(plan.config.id, `chapter-${c.code}`)
                        }
                      >
                        Try flow <ArrowUpRight size={13} />
                      </button>
                    </div>
                    {c.issues.map((issue) => (
                      <p className={styles.warning} key={issue}>
                        {issue}
                      </p>
                    ))}
                    {c.tasks.length ? (
                      <>
                        <span className={styles.smallLabel}>
                          {c.tasks.length} NUMBERED TEXTBOOK ACTIVITIES MAPPED
                        </span>
                        <ol className={styles.taskList}>
                          {c.tasks.map((t) => (
                            <li key={t.number}>
                              <span>{t.number}</span>
                              <div>
                                <b>{t.title}</b>
                                <p>{t.detail}</p>
                                <small>{t.delivery}</small>
                              </div>
                            </li>
                          ))}
                        </ol>
                      </>
                    ) : (
                      <p className={styles.auditPending}>
                        <Info size={14} />
                        Chapter assigned. Full numbered-exercise audit pending;
                        one draft prompt does not cover an entire textbook
                        chapter.
                      </p>
                    )}
                    <div className={styles.teacherNote}>
                      <b>Teacher involvement</b>
                      <p>{c.teacherNote}</p>
                    </div>
                    <div className={styles.teacherNote}>
                      <b>Existing Talkora draft prompt</b>
                      <p>{c.prompt}</p>
                      <small>Proposed evidence: {c.evidence}</small>
                    </div>
                  </article>
                ))}
              <div className={styles.authoredList}>
                <h4>
                  Authored workspace activities · {plan.activities.length}
                </h4>
                {plan.activities.length ? (
                  plan.activities.map((a) => (
                    <article key={a.id}>
                      <span className={styles.subtleBadge}>{a.type}</span>
                      <b>{a.prompt}</b>
                      <p>{a.successCriteria}</p>
                      <small>
                        {a.approved
                          ? 'Marked approved in source; live publication is separate.'
                          : 'Draft · approval pending.'}
                      </small>
                      <button
                        type="button"
                        className={styles.textButton}
                        onClick={() => onPreview(plan.config.id, a.id)}
                      >
                        Inspect teaching flow <ArrowUpRight size={12} />
                      </button>
                    </article>
                  ))
                ) : (
                  <p>
                    No authored workspace activities. This level remains an
                    editorial plan.
                  </p>
                )}
              </div>
              {plan.suggestedActivities.length ? (
                <div className={styles.authoredList}>
                  <h4>Editorial ideas · not authored activities</h4>
                  {plan.suggestedActivities.map((a, i) => (
                    <article key={`${a.label}:${i}`}>
                      <b>{a.label}</b>
                      <p>{a.educatorNote}</p>
                      <small>{a.mode}</small>
                    </article>
                  ))}
                </div>
              ) : null}
            </div>
          </details>
        ))}
      </div>
      <div className={styles.notice}>
        <Info size={18} />
        <p>
          <b>Mapped is different from mastered.</b> Tracing, writing, movement,
          craft and peer work remain teacher-led. Chapter and exercise counts
          are planning coverage, never student completion.
        </p>
      </div>
    </section>
  )
}
