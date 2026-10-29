'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, BookOpen, GraduationCap, Layers3 } from 'lucide-react'
import { SchoolShell } from '@/components/school/school-shell'
import { useAuth } from '@/components/auth/auth-provider'
import { gradeLevelMapService, type GradeLevelMap, type EditorMappedLevel } from '@/services/grade-level-map'
import './curriculum-map.css'

const statusLabel: Record<EditorMappedLevel['status'], string> = {
  NOT_MAPPED: 'Not mapped',
  DRAFT: 'Draft — unavailable',
  INCOMPLETE: 'Published flag; no playable content',
  PUBLISHED: 'Playable content detected',
  ARCHIVED: 'Archived',
}

export default function SchoolCurriculumMapPage() {
  const { session } = useAuth()
  const isTeacher = session?.role === 'TEACHER'
  const [grade, setGrade] = useState(4)
  const [data, setData] = useState<GradeLevelMap | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<EditorMappedLevel | null>(null)
  const [detailBusy, setDetailBusy] = useState(false)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    setData(null)
    setSelected(null)
    gradeLevelMapService.grade(grade).then((result) => {
      if (active) setData(result)
    }).catch((reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason.message : 'Could not load curriculum mapping')
    }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [grade])

  async function showLevel(level: number) {
    setSelected(null)
    setDetailBusy(true)
    setError('')
    try {
      setSelected(await gradeLevelMapService.level(grade, level))
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not load this level')
    } finally {
      setDetailBusy(false)
    }
  }

  return (
    <SchoolShell
      title="Curriculum Map"
      subtitle="Explore mapped levels, lesson records, and publishing details across KG–Class 10."
    >
      <main className="school-curriculum" aria-label="Curriculum map">
        <section className="school-curriculum__intro" aria-labelledby="school-curriculum-heading">
          <div className="school-curriculum__intro-icon" aria-hidden="true">
            <Layers3 size={24} strokeWidth={1.8} />
          </div>
          <div>
            <span className="school-curriculum__eyebrow">SCHOOL CURRICULUM</span>
            <h2 id="school-curriculum-heading">Explore the learning framework</h2>
            <p>Review how the existing levels, lesson records, and activity availability are mapped by class.</p>
          </div>
        </section>

        <section className="school-curriculum__toolbar" aria-label="Curriculum filters">
          <div className="school-curriculum__filter-copy">
            <span className="school-curriculum__filter-icon" aria-hidden="true">
              <GraduationCap size={19} />
            </span>
            <div>
              <label htmlFor="talkora-grade-select">Choose a class</label>
              <p>View its mapped levels and lesson records.</p>
            </div>
          </div>
          <select
            id="talkora-grade-select"
            className="school-curriculum__select"
            value={grade}
            onChange={(event) => setGrade(Number(event.target.value))}
          >
            {Array.from({ length: 11 }, (_, id) => (
              <option disabled={isTeacher && id === 0} value={id} key={id}>
                {id === 0 ? 'Kindergarten (KG)' : `Class ${id}`}
              </option>
            ))}
          </select>
        </section>

        <p className="school-curriculum__note">
          These are curriculum addresses, not 110 completed lessons. Empty drafts cannot be played by students.
          {isTeacher ? ' KG authoring is restricted to school administrators.' : ''}
        </p>

        {loading ? (
          <div className="school-curriculum__grid" role="status" aria-label="Loading curriculum map" aria-busy="true">
            {[0, 1, 2].map((item) => (
              <div className="school-curriculum__skeleton" key={item} aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
            ))}
          </div>
        ) : null}

        {error ? (
          <section className="school-curriculum__message school-curriculum__message--error" role="alert">
            <BookOpen size={21} aria-hidden="true" />
            <p>{error}</p>
          </section>
        ) : null}

        {data ? (
          <>
            <section className="school-curriculum__summary" aria-label={`${data.name} curriculum summary`}>
              <div className="school-curriculum__summary-heading">
                <span className="school-curriculum__summary-icon" aria-hidden="true">
                  <BookOpen size={19} />
                </span>
                <div>
                  <span className="school-curriculum__eyebrow">SELECTED CLASS</span>
                  <h2>{data.name}</h2>
                </div>
              </div>
              <div className="school-curriculum__summary-content">
                <p>
                  <strong>{data.mappedCount}/{data.total}</strong>
                  <span>mapped in MongoDB</span>
                </p>
                <p>
                  <strong>{data.publishedCount}/{data.total}</strong>
                  <span>with active lesson activities</span>
                </p>
                {data.classId ? (
                  <Link className="school-curriculum__class-link" href={`/school/classes/${data.classId}`}>
                    Open class preview
                    <ArrowRight size={15} aria-hidden="true" />
                  </Link>
                ) : null}
              </div>
            </section>

            <section className="school-curriculum__levels" aria-labelledby="school-curriculum-levels-heading">
              <div className="school-curriculum__section-heading">
                <div>
                  <span className="school-curriculum__eyebrow">LEVEL OVERVIEW</span>
                  <h2 id="school-curriculum-levels-heading">Mapped levels</h2>
                </div>
                <span className="school-curriculum__level-count">{data.levels.length} levels</span>
              </div>

              <div className="school-curriculum__grid" aria-label="Available curriculum levels">
                {data.levels.map((item) => (
                  <button
                    className={`school-curriculum__level-card${selected?.address === item.address ? ' is-selected' : ''}`}
                    type="button"
                    key={item.address}
                    onClick={() => void showLevel(item.level)}
                    aria-label={`Inspect level ${item.level}: ${item.actualTitle || item.plannedTitle}`}
                    aria-pressed={selected?.address === item.address}
                  >
                    <span className="school-curriculum__level-top">
                      <span className="school-curriculum__level-address">{item.address.toUpperCase()}</span>
                      <span className="school-curriculum__level-number">Level {item.level}</span>
                    </span>
                    <span className="school-curriculum__level-title">{item.actualTitle || item.plannedTitle}</span>
                    <span className={`school-curriculum__status school-curriculum__status--${item.status.toLowerCase()}`}>
                      <span className="school-curriculum__status-dot" aria-hidden="true" />
                      {statusLabel[item.status]}
                    </span>
                    <span className="school-curriculum__level-activity">
                      {item.lessons.length} lesson records
                      <span aria-hidden="true"> · </span>
                      {item.lessons.reduce((total, lesson) => total + lesson.activityCount, 0)} active activities
                    </span>
                  </button>
                ))}
              </div>
            </section>

            {detailBusy ? (
              <p className="school-curriculum__loading-detail" role="status">Loading level details…</p>
            ) : null}

            {selected ? (
              <section className="school-curriculum__detail" aria-live="polite" aria-labelledby="school-curriculum-detail-heading">
                <div className="school-curriculum__detail-heading">
                  <div>
                    <span className="school-curriculum__eyebrow">LEVEL DETAILS</span>
                    <h2 id="school-curriculum-detail-heading">
                      Level {selected.level}: {selected.actualTitle || selected.plannedTitle}
                    </h2>
                  </div>
                  <Link className="school-curriculum__studio-link" href={`/school/curriculum-studio/${grade}/${selected.level}`}>
                    Open design workspace
                    <ArrowRight size={15} aria-hidden="true" />
                  </Link>
                </div>

                <p className="school-curriculum__objective">{selected.objective}</p>

                <dl className="school-curriculum__metadata">
                  <div>
                    <dt>Address</dt>
                    <dd>{selected.address}</dd>
                  </div>
                  <div>
                    <dt>Mongo level ID</dt>
                    <dd>{selected.levelId || 'Not created'}</dd>
                  </div>
                  <div>
                    <dt>Publication</dt>
                    <dd>{selected.publication}</dd>
                  </div>
                </dl>

                <div className="school-curriculum__lessons">
                  <h3>Mapped lesson records</h3>
                  {selected.lessons.length ? (
                    <ul>
                      {selected.lessons.map((lesson) => (
                        <li key={lesson.id}>
                          <span>{lesson.title}</span>
                          <span className="school-curriculum__lesson-meta">
                            {lesson.status}, {lesson.activityCount} active activities
                            {lesson.placeholder ? ' (empty placeholder)' : ''}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>No lesson records yet. Authoring is required.</p>
                  )}
                </div>

                <p className="school-curriculum__publication-note">
                  Publication and syllabus approval are intentionally separate from this read-only planning screen.
                </p>
              </section>
            ) : null}
          </>
        ) : null}
      </main>
    </SchoolShell>
  )
}
