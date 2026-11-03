'use client'
import { useEffect, useState } from 'react'
import { BookOpen, RotateCcw } from 'lucide-react'
import {
  curriculumService,
  type ActivityItem,
} from '@/services/curriculum-service'
import type { EditorMappedLevel } from '@/services/grade-level-map'
import styles from './explorer.module.css'

/** Reads existing authenticated lesson records. Never sends attempts or changes content. */
export function SchoolLessonRecords({ record }: { record: EditorMappedLevel }) {
  const [lessonId, setLessonId] = useState<string | null>(null)
  const [retry, setRetry] = useState(0)
  const [response, setResponse] = useState<{
    key: string
    activities?: ActivityItem[]
    error?: string
  }>({ key: '' })
  const key = `${lessonId}:${retry}`
  useEffect(() => {
    if (!lessonId) return
    let active = true
    curriculumService
      .getActivities(lessonId)
      .then((activities) => {
        if (activities.some((a) => a.lessonId !== lessonId))
          throw new Error(
            'Activity response does not match the selected lesson.'
          )
        if (active) setResponse({ key, activities })
      })
      .catch((error: unknown) => {
        if (active)
          setResponse({
            key,
            error:
              error instanceof Error
                ? error.message
                : 'Recorded activities could not load.',
          })
      })
    return () => {
      active = false
    }
  }, [lessonId, key])
  return (
    <section
      className={styles.recordSection}
      aria-label="Existing school lesson records"
    >
      <h4>
        <BookOpen size={16} />
        Live curriculum records
      </h4>
      <p>
        These are the existing server records, separate from the editorial plan
        above.
      </p>
      {!record.lessons.length ? (
        <p>No lesson records are mapped to this address.</p>
      ) : (
        record.lessons.map((lesson) => (
          <article key={lesson.id} className={styles.recordCard}>
            <div>
              <b>{lesson.title}</b>
              <small>
                {lesson.status} · {lesson.activeCount ?? (lesson.status === 'active' ? lesson.activityCount : 0)} active of {lesson.activityCount} activities
                {lesson.placeholder ? ' · empty placeholder' : ''}
              </small>
            </div>
            <button
              type="button"
              className={styles.textButton}
              aria-expanded={lessonId === lesson.id}
              onClick={() =>
                setLessonId((id) => (id === lesson.id ? null : lesson.id))
              }
            >
              {lessonId === lesson.id
                ? 'Close activities'
                : 'Inspect activities'}
            </button>
            {lessonId === lesson.id ? (
              <div className={styles.recordActivities}>
                {response.key !== key ? (
                  <p role="status">Reading recorded activities…</p>
                ) : response.error ? (
                  <div role="alert">
                    <p>{response.error}</p>
                    <button
                      type="button"
                      className={styles.textButton}
                      onClick={() => setRetry((v) => v + 1)}
                    >
                      <RotateCcw size={12} />
                      Retry
                    </button>
                  </div>
                ) : !response.activities?.length ? (
                  <p>
                    No activities were returned. This is not evidence of a
                    completed lesson.
                  </p>
                ) : (
                  response.activities.map((a) => (
                    <article key={a.id}>
                      <span className={styles.subtleBadge}>
                        {a.type} · {a.stage}
                      </span>
                      <h4>{a.title}</h4>
                      <p>{a.prompt}</p>
                      {a.instruction ? (
                        <p>Instruction: {a.instruction}</p>
                      ) : null}
                      {a.modelSentence ? (
                        <p>Recorded model: {a.modelSentence}</p>
                      ) : null}
                      {a.target ? <p>Target: {a.target}</p> : null}
                      {a.hint ? <p>Hint: {a.hint}</p> : null}
                      {a.expectedPatterns?.length ? (
                        <p>
                          Expected patterns: {a.expectedPatterns.join(' · ')}
                        </p>
                      ) : null}
                      {a.source ? (
                        <p>
                          Source:{' '}
                          {a.source.label ||
                            a.source.pdf ||
                            a.source.sourceType}
                          {a.source.pageStart
                            ? ` · p. ${a.source.pageStart}${a.source.pageEnd && a.source.pageEnd !== a.source.pageStart ? `–${a.source.pageEnd}` : ''}`
                            : ''}
                        </p>
                      ) : null}
                      <small>
                        {a.difficulty} · voice{' '}
                        {a.voiceEnabled ? 'enabled' : 'disabled'} · AI{' '}
                        {a.aiEnabled ? 'enabled' : 'disabled'} ·{' '}
                        {a.estimatedSeconds}s estimated. No student records are
                        read or changed.
                      </small>
                    </article>
                  ))
                )}
              </div>
            ) : null}
          </article>
        ))
      )}
    </section>
  )
}
