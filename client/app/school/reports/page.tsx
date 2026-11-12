'use client'

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Activity,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Download,
  RotateCw,
  Target,
  Users,
} from 'lucide-react'
import { SchoolShell } from '@/components/school/school-shell'
import {
  schoolService,
  type AnalyticsOverview,
  type LearningProgressLevelReport,
  type LearningProgressLevelsForGrade,
  type LearningProgressOverview,
  type LearningProgressState,
  type LearningProgressStudentDetail,
} from '@/services/school-service'
import { gradeLabel } from '@/lib/grade-label'
import { KGAlphabetReport } from '@/components/school/kg-alphabet-report'
import { ReportCsvDownload } from '@/components/school/report-csv-download'
import { useAuth } from '@/components/auth/auth-provider'

const cardStyle = { background: '#fff', border: '1px solid #e5e8ef', borderRadius: 16, padding: 20 } as const

function formatUtcDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

function stateLabel(state: LearningProgressState): string {
  if (state === 'completed') return 'Completed'
  if (state === 'in_progress') return 'In progress'
  return 'Not started'
}

export default function LearningProgressReportsPage() {
  return (
    <Suspense
      fallback={
        <SchoolShell title="Learning Progress" subtitle="Loading verified progress…">
          <p style={{ color: '#69728a' }}>Loading report…</p>
        </SchoolShell>
      }
    >
      <LearningProgressReportsContent />
    </Suspense>
  )
}

function LearningProgressReportsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { role } = useAuth()
  const isTeacher = role === 'TEACHER'

  const gradeParam = searchParams.get('grade')
  const levelParam = searchParams.get('levelId')
  const stateParam = searchParams.get('state') as LearningProgressState | null
  const studentParam = searchParams.get('studentId')
  const classNameParam = searchParams.get('className') || ''
  const fromParam = searchParams.get('from') || ''
  const toParam = searchParams.get('to') || ''

  const selectedGrade = gradeParam !== null && gradeParam !== '' ? Number(gradeParam) : undefined
  const selectedState =
    stateParam && ['completed', 'in_progress', 'not_started'].includes(stateParam) ? stateParam : undefined

  const [overview, setOverview] = useState<LearningProgressOverview | null>(null)
  const [levels, setLevels] = useState<LearningProgressLevelsForGrade | null>(null)
  const [levelReport, setLevelReport] = useState<LearningProgressLevelReport | null>(null)
  const [studentDetail, setStudentDetail] = useState<LearningProgressStudentDetail | null>(null)
  const [attemptAnalytics, setAttemptAnalytics] = useState<AnalyticsOverview | null>(null)
  const [weakSkills, setWeakSkills] = useState<Array<{ skill: string; occurrences: number; studentCount: number }>>([])
  const [showAttemptAnalytics, setShowAttemptAnalytics] = useState(false)

  const [from, setFrom] = useState(fromParam)
  const [to, setTo] = useState(toParam)
  const [className, setClassName] = useState(classNameParam)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)

  const [loading, setLoading] = useState(true)
  const [levelLoading, setLevelLoading] = useState(false)
  const [error, setError] = useState('')
  const [exportBusy, setExportBusy] = useState(false)
  const [reload, setReload] = useState(0)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => window.clearTimeout(timer)
  }, [search])

  const setQuery = useCallback(
    (patch: Record<string, string | null | undefined>) => {
      const next = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(patch)) {
        if (value === null || value === undefined || value === '') next.delete(key)
        else next.set(key, value)
      }
      router.replace(`/school/reports?${next.toString()}`)
    },
    [router, searchParams],
  )

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    const filters = {
      grade: selectedGrade,
      className: className.trim() || undefined,
      from: from || undefined,
      to: to || undefined,
    }
    Promise.all([
      schoolService.getLearningProgressOverview(filters),
      schoolService.getAnalytics().catch(() => null),
      schoolService.getWeakestSkills().catch(() => []),
    ])
      .then(([ov, analytics, skills]) => {
        if (!active) return
        setOverview(ov)
        setAttemptAnalytics(analytics)
        setWeakSkills(Array.isArray(skills) ? skills : [])
      })
      .catch(() => {
        if (active) setError('Learning progress could not be loaded. Please try again.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [selectedGrade, className, from, to, reload])

  useEffect(() => {
    if (selectedGrade === undefined || Number.isNaN(selectedGrade)) {
      setLevels(null)
      return
    }
    let active = true
    schoolService
      .getLearningProgressLevels(selectedGrade)
      .then((data) => {
        if (active) setLevels(data)
      })
      .catch(() => {
        if (active) setLevels({ grade: selectedGrade, classId: null, levels: [] })
      })
    return () => {
      active = false
    }
  }, [selectedGrade, reload])

  useEffect(() => {
    if (!levelParam) {
      setLevelReport(null)
      return
    }
    let active = true
    setLevelLoading(true)
    schoolService
      .getLearningProgressLevelReport(levelParam, {
        grade: selectedGrade,
        className: className.trim() || undefined,
        from: from || undefined,
        to: to || undefined,
        state: selectedState,
        search: debouncedSearch || undefined,
        page,
        limit: 25,
      })
      .then((report) => {
        if (active) setLevelReport(report)
      })
      .catch(() => {
        if (active) setError('Level report could not be loaded.')
      })
      .finally(() => {
        if (active) setLevelLoading(false)
      })
    return () => {
      active = false
    }
  }, [levelParam, selectedGrade, className, from, to, selectedState, debouncedSearch, page, reload])

  useEffect(() => {
    if (!studentParam) {
      setStudentDetail(null)
      return
    }
    let active = true
    schoolService
      .getLearningProgressStudent(studentParam)
      .then((detail) => {
        if (active) setStudentDetail(detail)
      })
      .catch(() => {
        if (active) setError('Student progress detail could not be loaded.')
      })
    return () => {
      active = false
    }
  }, [studentParam, reload])

  const metrics = useMemo(() => {
    const m = overview?.metrics
    return [
      ['Enrolled students', m?.enrolledStudents ?? '—', Users],
      ['Verified level completions', m?.uniqueVerifiedLevelCompletions ?? '—', CheckCircle2],
      ['Students with ≥1 completion', m?.studentsWhoCompletedAtLeastOneLevel ?? '—', Target],
      ['In progress', m?.studentsInProgress ?? '—', Activity],
      [
        'Learning time',
        m?.timeSpentMinutes == null ? 'Unavailable' : `${m.timeSpentMinutes} min`,
        Clock3,
      ],
    ] as const
  }, [overview])

  async function exportLevelCsv() {
    if (!levelParam) return
    setExportBusy(true)
    try {
      const blob = await schoolService.downloadLearningProgressLevelCsv(levelParam, {
        grade: selectedGrade,
        className: className.trim() || undefined,
        from: from || undefined,
        to: to || undefined,
        state: selectedState,
        search: debouncedSearch || undefined,
      })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `talkora-level-progress-${levelParam}.csv`
      document.body.append(anchor)
      anchor.click()
      anchor.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 30_000)
    } catch {
      setError('CSV export failed. Check your permissions and try again.')
    } finally {
      setExportBusy(false)
    }
  }

  return (
    <SchoolShell
      title="Learning Progress"
      subtitle={
        isTeacher
          ? 'Verified level completions for your assigned students — from actual recorded learning activity.'
          : 'Verified level completions across your school — from actual recorded learning activity.'
      }
    >
      {error ? (
        <div role="alert" style={{ background: '#fff0ed', color: '#9d3b33', padding: 12, borderRadius: 10, marginBottom: 16 }}>
          {error}{' '}
          <button
            type="button"
            onClick={() => {
              setError('')
              setReload((value) => value + 1)
            }}
          >
            Retry
          </button>
        </div>
      ) : null}

      <section style={{ ...cardStyle, marginBottom: 18 }} aria-label="Report filters">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'end' }}>
          <label style={{ display: 'grid', gap: 4, fontSize: 12, fontWeight: 700, color: '#69728a' }}>
            From (UTC)
            <input
              type="date"
              value={from}
              onChange={(event) => {
                setFrom(event.target.value)
                setQuery({ from: event.target.value || null })
              }}
              style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #d7dbe7' }}
            />
          </label>
          <label style={{ display: 'grid', gap: 4, fontSize: 12, fontWeight: 700, color: '#69728a' }}>
            To (UTC)
            <input
              type="date"
              value={to}
              onChange={(event) => {
                setTo(event.target.value)
                setQuery({ to: event.target.value || null })
              }}
              style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #d7dbe7' }}
            />
          </label>
          <label style={{ display: 'grid', gap: 4, fontSize: 12, fontWeight: 700, color: '#69728a' }}>
            Grade
            <select
              value={selectedGrade === undefined ? '' : String(selectedGrade)}
              onChange={(event) => {
                const value = event.target.value
                setPage(1)
                setQuery({
                  grade: value === '' ? null : value,
                  levelId: null,
                  state: null,
                  studentId: null,
                })
              }}
              style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #d7dbe7', minWidth: 140 }}
            >
              <option value="">All grades</option>
              {Array.from({ length: 11 }, (_, grade) => (
                <option key={grade} value={grade}>
                  {gradeLabel(grade)}
                </option>
              ))}
            </select>
          </label>
          <label style={{ display: 'grid', gap: 4, fontSize: 12, fontWeight: 700, color: '#69728a' }}>
            Class section
            <input
              value={className}
              placeholder="e.g. A"
              onChange={(event) => setClassName(event.target.value)}
              onBlur={() => {
                setPage(1)
                setQuery({ className: className.trim() || null })
              }}
              style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #d7dbe7', width: 100 }}
            />
          </label>
          <button
            type="button"
            onClick={() => setReload((value) => value + 1)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '9px 12px',
              borderRadius: 8,
              border: '1px solid #d7dbe7',
              background: '#f8fafc',
              fontWeight: 700,
              fontSize: 12,
            }}
          >
            <RotateCw size={14} /> Refresh
          </button>
        </div>
        <p style={{ margin: '12px 0 0', fontSize: 11, color: '#69728a' }}>
          Scope: {overview?.filters.from || overview?.filters.to
            ? `${overview?.filters.from?.slice(0, 10) || '…'} → ${overview?.filters.to?.slice(0, 10) || '…'}`
            : 'All time'}
          {selectedGrade !== undefined ? ` · ${gradeLabel(selectedGrade)}` : ''}
          {className.trim() ? ` · Section ${className.trim()}` : ''}
          {levelReport ? ` · Level ${levelReport.level.number}: ${levelReport.level.title}` : ''}
          {overview ? ` · Eligible roster ${overview.metrics.enrolledStudents}` : ''}
        </p>
      </section>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,170px),1fr))',
          gap: 14,
        }}
      >
        {metrics.map(([label, value, Icon]) => (
          <article key={label} style={cardStyle}>
            <Icon size={18} color="#7657d7" />
            <small style={{ display: 'block', color: '#69728a', fontWeight: 800, marginTop: 12 }}>{label}</small>
            <strong style={{ display: 'block', fontSize: 26, marginTop: 4 }}>
              {loading && value === '—' ? '…' : value}
            </strong>
          </article>
        ))}
      </div>

      {studentDetail ? (
        <section style={{ ...cardStyle, marginTop: 18 }} aria-label="Student progress detail">
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <button
                type="button"
                onClick={() => setQuery({ studentId: null })}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  border: 0,
                  background: 'transparent',
                  color: '#4f46e5',
                  fontWeight: 700,
                  padding: 0,
                  marginBottom: 8,
                  cursor: 'pointer',
                }}
              >
                <ArrowLeft size={14} /> Back to report
              </button>
              <h2 style={{ margin: 0, fontSize: 18 }}>
                {studentDetail.student.fullName}{' '}
                <small style={{ color: '#69728a', fontWeight: 600 }}>
                  · Roll {studentDetail.student.rollNumber} · {gradeLabel(studentDetail.student.grade)}
                  {studentDetail.student.className ? `-${studentDetail.student.className}` : ''}
                </small>
              </h2>
              <p style={{ margin: '8px 0 0', fontSize: 12, color: '#69728a' }}>
                {studentDetail.summary.verifiedLevelCompletions} verified completions ·{' '}
                {studentDetail.summary.inProgressLevels} in progress · Last activity{' '}
                {formatUtcDate(studentDetail.summary.lastActivityAt)}
              </p>
            </div>
            <Link
              href={`/school/students/${studentDetail.student.id}`}
              style={{ fontSize: 12, fontWeight: 700, color: '#4f46e5' }}
            >
              Open full student profile →
            </Link>
          </div>
          <div style={{ marginTop: 16, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ textAlign: 'left', color: '#69728a', fontSize: 11 }}>
                  <th style={{ padding: '8px 6px' }}>Level</th>
                  <th style={{ padding: '8px 6px' }}>State</th>
                  <th style={{ padding: '8px 6px' }}>Completed</th>
                  <th style={{ padding: '8px 6px' }}>Attempts</th>
                  <th style={{ padding: '8px 6px' }}>Source</th>
                </tr>
              </thead>
              <tbody>
                {studentDetail.levels.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: 12, color: '#69728a' }}>
                      No verified progress recorded for this student yet.
                    </td>
                  </tr>
                ) : (
                  studentDetail.levels.map((row) => (
                    <tr key={`${row.source}-${row.levelId}`} style={{ borderTop: '1px solid #eef0f4' }}>
                      <td style={{ padding: '10px 6px' }}>
                        {row.levelNumber != null ? `L${row.levelNumber} · ` : ''}
                        {row.levelTitle}
                      </td>
                      <td style={{ padding: '10px 6px' }}>{stateLabel(row.state)}</td>
                      <td style={{ padding: '10px 6px' }}>{formatUtcDate(row.completedAt)}</td>
                      <td style={{ padding: '10px 6px' }}>{row.attemptCount}</td>
                      <td style={{ padding: '10px 6px' }}>
                        {row.source === 'kg_alphabet' ? 'KG alphabet' : 'Curriculum progress'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {!studentDetail && levelParam && levelReport ? (
        <section style={{ ...cardStyle, marginTop: 18 }} aria-label="Level completion report">
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'start' }}>
            <div>
              <button
                type="button"
                onClick={() => {
                  setPage(1)
                  setQuery({ levelId: null, state: null })
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  border: 0,
                  background: 'transparent',
                  color: '#4f46e5',
                  fontWeight: 700,
                  padding: 0,
                  marginBottom: 8,
                  cursor: 'pointer',
                }}
              >
                <ArrowLeft size={14} /> Back to grade levels
              </button>
              <h2 style={{ margin: 0, fontSize: 18 }}>
                Level {levelReport.level.number}: {levelReport.level.title}
              </h2>
              <p style={{ margin: '8px 0 0', fontSize: 12, color: '#69728a' }}>
                Eligible {levelReport.summary.eligibleStudents} · Completed {levelReport.summary.completed} · In
                progress {levelReport.summary.inProgress} · Not started {levelReport.summary.notStarted} · Rate{' '}
                {levelReport.summary.completionRate == null
                  ? 'unavailable'
                  : `${levelReport.summary.completionRate}%`}
              </p>
            </div>
            <button
              type="button"
              disabled={exportBusy}
              onClick={() => void exportLevelCsv()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '9px 12px',
                borderRadius: 8,
                border: 0,
                background: '#7657d7',
                color: '#fff',
                fontWeight: 700,
                fontSize: 12,
              }}
            >
              <Download size={14} /> {exportBusy ? 'Exporting…' : 'Export CSV'}
            </button>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
            {(
              [
                [undefined, 'All', levelReport.summary.eligibleStudents],
                ['completed', 'Completed', levelReport.summary.completed],
                ['in_progress', 'In progress', levelReport.summary.inProgress],
                ['not_started', 'Not started', levelReport.summary.notStarted],
              ] as const
            ).map(([state, label, count]) => {
              const active = selectedState === state || (!selectedState && state === undefined)
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    setPage(1)
                    setQuery({ state: state || null })
                  }}
                  style={{
                    padding: '7px 11px',
                    borderRadius: 999,
                    border: active ? '1px solid #7657d7' : '1px solid #d7dbe7',
                    background: active ? '#f3efff' : '#fff',
                    fontWeight: 700,
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  {label} ({count})
                </button>
              )
            })}
          </div>

          <label style={{ display: 'grid', gap: 4, marginTop: 14, maxWidth: 280, fontSize: 12, fontWeight: 700, color: '#69728a' }}>
            Search roster
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(1)
              }}
              placeholder="Name or roll number"
              style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #d7dbe7' }}
            />
          </label>

          <div style={{ marginTop: 14, overflowX: 'auto' }}>
            {levelLoading ? (
              <p style={{ color: '#69728a', fontSize: 13 }}>Loading roster…</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: '#69728a', fontSize: 11 }}>
                    <th style={{ padding: '8px 6px' }}>Student</th>
                    <th style={{ padding: '8px 6px' }}>Roll</th>
                    <th style={{ padding: '8px 6px' }}>Class</th>
                    <th style={{ padding: '8px 6px' }}>State</th>
                    <th style={{ padding: '8px 6px' }}>Completed</th>
                    <th style={{ padding: '8px 6px' }} />
                  </tr>
                </thead>
                <tbody>
                  {levelReport.students.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: 12, color: '#69728a' }}>
                        No students match this filter in your authorized roster.
                      </td>
                    </tr>
                  ) : (
                    levelReport.students.map((row) => (
                      <tr key={row.studentId} style={{ borderTop: '1px solid #eef0f4' }}>
                        <td style={{ padding: '10px 6px', fontWeight: 700 }}>{row.fullName}</td>
                        <td style={{ padding: '10px 6px' }}>{row.rollNumber}</td>
                        <td style={{ padding: '10px 6px' }}>
                          {gradeLabel(row.grade)}
                          {row.className ? `-${row.className}` : ''}
                        </td>
                        <td style={{ padding: '10px 6px' }}>{stateLabel(row.state)}</td>
                        <td style={{ padding: '10px 6px' }}>{formatUtcDate(row.completedAt)}</td>
                        <td style={{ padding: '10px 6px' }}>
                          <button
                            type="button"
                            onClick={() => setQuery({ studentId: row.studentId })}
                            style={{
                              border: 0,
                              background: 'transparent',
                              color: '#4f46e5',
                              fontWeight: 700,
                              cursor: 'pointer',
                              fontSize: 12,
                            }}
                          >
                            History
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>

          {levelReport.pagination.pages > 1 ? (
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 14 }}>
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
              >
                Previous
              </button>
              <span style={{ fontSize: 12, color: '#69728a' }}>
                Page {levelReport.pagination.page} of {levelReport.pagination.pages}
              </span>
              <button
                type="button"
                disabled={page >= levelReport.pagination.pages}
                onClick={() => setPage((value) => value + 1)}
              >
                Next
              </button>
            </div>
          ) : null}
        </section>
      ) : null}

      {!studentDetail && !levelParam ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,340px),1fr))',
            gap: 18,
            marginTop: 18,
          }}
        >
          <section style={cardStyle}>
            <h2 style={{ fontSize: 16, margin: '0 0 8px' }}>Progress by grade</h2>
            <p style={{ color: '#69728a', fontSize: 11, marginTop: 0 }}>
              Counts come from verified Progress completions (and KG alphabet where applicable), not curriculum
              catalog size.
            </p>
            {overview?.gradeBreakdown.length ? (
              overview.gradeBreakdown.map((row) => (
                <button
                  key={row.grade}
                  type="button"
                  onClick={() => {
                    setPage(1)
                    setQuery({ grade: String(row.grade), levelId: null, state: null, studentId: null })
                  }}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    border: 0,
                    borderTop: '1px solid #eef0f4',
                    background: selectedGrade === row.grade ? '#f8f6ff' : 'transparent',
                    padding: '12px 0',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                    <b style={{ fontSize: 13 }}>{gradeLabel(row.grade)}</b>
                    <span style={{ fontSize: 11, color: '#69728a', fontWeight: 700 }}>
                      {row.uniqueVerifiedLevelCompletions} completions
                    </span>
                  </div>
                  <small style={{ display: 'block', color: '#69728a', marginTop: 4 }}>
                    {row.enrolledStudents} enrolled · {row.studentsWhoCompletedAtLeastOneLevel} completed ≥1 ·{' '}
                    {row.studentsInProgress} in progress · {row.studentsNotStarted} not started
                  </small>
                </button>
              ))
            ) : (
              <p style={{ color: '#69728a', fontSize: 12 }}>
                {loading ? 'Loading grade results…' : 'No enrolled students in this scope yet.'}
              </p>
            )}
          </section>

          <section style={cardStyle}>
            <h2 style={{ fontSize: 16, margin: '0 0 8px' }}>
              {selectedGrade === undefined ? 'Select a grade to view levels' : `${gradeLabel(selectedGrade)} levels`}
            </h2>
            <p style={{ color: '#69728a', fontSize: 11, marginTop: 0 }}>
              Open a level to see who completed it, who is in progress, and who has not started.
            </p>
            {selectedGrade === undefined ? (
              <p style={{ background: '#f5f7fa', borderRadius: 10, padding: 12, fontSize: 12 }}>
                Choose a grade from the filter or the breakdown on the left.
              </p>
            ) : levels?.levels.length ? (
              levels.levels.map((level) => (
                <button
                  key={level.id}
                  type="button"
                  onClick={() => {
                    setPage(1)
                    setQuery({ levelId: level.id, state: null, studentId: null })
                  }}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    border: 0,
                    borderTop: '1px solid #eef0f4',
                    background: 'transparent',
                    padding: '12px 0',
                    cursor: 'pointer',
                  }}
                >
                  <b style={{ fontSize: 13 }}>
                    Level {level.number}: {level.title}
                  </b>
                  {level.place ? (
                    <small style={{ display: 'block', color: '#69728a', marginTop: 3 }}>{level.place}</small>
                  ) : null}
                </button>
              ))
            ) : (
              <p style={{ color: '#69728a', fontSize: 12 }}>No published levels for this grade.</p>
            )}
          </section>
        </div>
      ) : null}

      {!studentDetail && !levelParam ? (
        <section style={{ ...cardStyle, marginTop: 18 }}>
          <h2 style={{ fontSize: 16, margin: '0 0 8px' }}>Recent verified completions</h2>
          <p style={{ color: '#69728a', fontSize: 11, marginTop: 0 }}>
            Only students who satisfied canonical level-completion rules appear here.
          </p>
          {overview?.recentCompletions.length ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: '#69728a', fontSize: 11 }}>
                    <th style={{ padding: '8px 6px' }}>Student</th>
                    <th style={{ padding: '8px 6px' }}>Level</th>
                    <th style={{ padding: '8px 6px' }}>When</th>
                    <th style={{ padding: '8px 6px' }} />
                  </tr>
                </thead>
                <tbody>
                  {overview.recentCompletions.map((row) => (
                    <tr key={`${row.studentId}-${row.levelId}-${row.completedAt}`} style={{ borderTop: '1px solid #eef0f4' }}>
                      <td style={{ padding: '10px 6px' }}>
                        <b>{row.fullName}</b>
                        <small style={{ display: 'block', color: '#69728a' }}>
                          Roll {row.rollNumber}
                          {row.grade != null ? ` · ${gradeLabel(row.grade)}` : ''}
                        </small>
                      </td>
                      <td style={{ padding: '10px 6px' }}>
                        {row.levelNumber != null ? `L${row.levelNumber} · ` : ''}
                        {row.levelTitle}
                      </td>
                      <td style={{ padding: '10px 6px' }}>{formatUtcDate(row.completedAt)}</td>
                      <td style={{ padding: '10px 6px' }}>
                        <button
                          type="button"
                          onClick={() => setQuery({ studentId: row.studentId })}
                          style={{
                            border: 0,
                            background: 'transparent',
                            color: '#4f46e5',
                            fontWeight: 700,
                            cursor: 'pointer',
                            fontSize: 12,
                          }}
                        >
                          History
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ background: '#f5f7fa', borderRadius: 10, padding: 12, fontSize: 12 }}>
              {loading ? 'Loading completions…' : 'No verified level completions in this scope yet.'}
            </p>
          )}
        </section>
      ) : null}

      <section style={{ ...cardStyle, marginTop: 18 }}>
        <button
          type="button"
          onClick={() => setShowAttemptAnalytics((value) => !value)}
          style={{
            border: 0,
            background: 'transparent',
            padding: 0,
            fontWeight: 800,
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          {showAttemptAnalytics ? 'Hide' : 'Show'} attempt & skill analytics (not level-completion rates)
        </button>
        {showAttemptAnalytics ? (
          <div style={{ marginTop: 14 }}>
            <p style={{ fontSize: 11, color: '#69728a' }}>
              These figures are attempt scores and unresolved mistakes — separate from verified level completion
              above.
            </p>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,160px),1fr))',
                gap: 12,
                marginTop: 12,
              }}
            >
              <article style={{ background: '#f8fafc', borderRadius: 12, padding: 14 }}>
                <small style={{ color: '#69728a', fontWeight: 800 }}>Avg attempt score</small>
                <strong style={{ display: 'block', fontSize: 22, marginTop: 4 }}>
                  {attemptAnalytics && attemptAnalytics.totalAttempts
                    ? `${attemptAnalytics.avgAccuracy}%`
                    : '—'}
                </strong>
              </article>
              <article style={{ background: '#f8fafc', borderRadius: 12, padding: 14 }}>
                <small style={{ color: '#69728a', fontWeight: 800 }}>Speaking attempts</small>
                <strong style={{ display: 'block', fontSize: 22, marginTop: 4 }}>
                  {attemptAnalytics?.totalAttempts ?? '—'}
                </strong>
              </article>
            </div>
            <div style={{ marginTop: 12 }}>
              {weakSkills.length ? (
                weakSkills.map((row) => (
                  <div key={row.skill} style={{ borderTop: '1px solid #eef0f4', padding: '10px 0' }}>
                    <b style={{ fontSize: 12, textTransform: 'capitalize' }}>{row.skill}</b>
                    <small style={{ display: 'block', color: '#69728a', marginTop: 3 }}>
                      {row.occurrences} occurrences · {row.studentCount} students
                    </small>
                  </div>
                ))
              ) : (
                <p style={{ fontSize: 12, color: '#69728a' }}>No unresolved skill gaps recorded.</p>
              )}
            </div>
            <KGAlphabetReport />
            <ReportCsvDownload />
          </div>
        ) : null}
      </section>
    </SchoolShell>
  )
}
