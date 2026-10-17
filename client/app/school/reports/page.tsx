'use client'

import { useEffect, useState } from 'react'
import { Activity, Clock3, Target, Users } from 'lucide-react'
import { SchoolShell } from '@/components/school/school-shell'
import { schoolService, type AnalyticsOverview } from '@/services/school-service'
import { gradeLabel } from '@/lib/grade-label'
import { KGAlphabetReport } from '@/components/school/kg-alphabet-report'
import { ReportCsvDownload } from '@/components/school/report-csv-download'

type Skill = { skill: string; occurrences: number; studentCount: number }

const cardStyle = { background: '#fff', border: '1px solid #e5e8ef', borderRadius: 16, padding: 20 }

export default function Reports() {
  const [data, setData] = useState<AnalyticsOverview | null>(null)
  const [skills, setSkills] = useState<Skill[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    let active = true
    Promise.all([schoolService.getAnalytics(), schoolService.getWeakestSkills()])
      .then(([analytics, weakSkills]) => {
        if (!active) return
        setData(analytics)
        setSkills(Array.isArray(weakSkills) ? weakSkills : [])
        setError('')
      })
      .catch(() => { if (active) setError("We couldn't load analytics. Try again.") })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [retry])

  const metrics = [
    ['Average attempt score', data && data.totalAttempts ? `${data.avgAccuracy}%` : '—', Target],
    ['Speaking attempts', data?.totalAttempts ?? '—', Activity],
    ['Active today', data?.activeTodayCount ?? '—', Users],
    ['Learning time', data ? `${data.totalLearningTimeMinutes} min` : '—', Clock3],
  ] as const

  return (
    <SchoolShell title="Reports & Analytics" subtitle="Cohort performance calculated from recorded learning attempts.">
      {error ? <div role="alert" style={{ background: '#fff0ed', color: '#9d3b33', padding: 12, borderRadius: 10, marginBottom: 16 }}>{error} <button type="button" onClick={() => { setLoading(true); setRetry((value) => value + 1) }}>Retry</button></div> : null}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,190px),1fr))', gap: 14 }}>
        {metrics.map(([label, value, Icon]) => <article key={label} style={cardStyle}><Icon size={18} color="#7657d7" /><small style={{ display: 'block', color: '#69728a', fontWeight: 800, marginTop: 12 }}>{label}</small><strong style={{ display: 'block', fontSize: 28, marginTop: 4 }}>{value}</strong></article>)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,340px),1fr))', gap: 18, marginTop: 18 }}>
        <section style={cardStyle}>
          <h2 style={{ fontSize: 16, margin: '0 0 18px' }}>Grade performance</h2>
          {data?.gradeBreakdown.length ? data.gradeBreakdown.map((row) => <div key={row.grade} style={{ marginTop: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 11, fontWeight: 800 }}>
              <span>{gradeLabel(row.grade)} · {row.studentCount} students</span>
              <span>{row.attemptedStudentCount ? `${row.avgAccuracy}%` : 'No attempts'}</span>
            </div>
            <div style={{ height: 8, background: '#eef0f4', borderRadius: 9, marginTop: 7 }}><i style={{ display: 'block', width: `${row.attemptedStudentCount ? Math.min(100, Math.max(0, row.avgAccuracy)) : 0}%`, height: '100%', background: '#46a9bd', borderRadius: 9 }} /></div>
          </div>) : <p style={{ color: '#69728a', fontSize: 12 }}>{loading ? 'Loading grade results…' : 'No students are enrolled yet.'}</p>}
        </section>
        <section style={cardStyle}>
          <h2 style={{ fontSize: 16, margin: '0 0 8px' }}>Skill attention</h2>
          <p style={{ color: '#69728a', fontSize: 11 }}>Unresolved mistakes grouped by recorded skill.</p>
          {skills.length ? skills.map((row) => <div key={row.skill} style={{ borderTop: '1px solid #eef0f4', padding: '12px 0' }}><b style={{ fontSize: 12, textTransform: 'capitalize' }}>{row.skill}</b><small style={{ display: 'block', color: '#69728a', marginTop: 3 }}>{row.occurrences} occurrences · {row.studentCount} students</small></div>) : <p style={{ background: '#f5f7fa', borderRadius: 10, padding: 12, fontSize: 11 }}>{loading ? 'Loading skill results…' : 'No unresolved skill gaps are recorded.'}</p>}
        </section>
      </div>
      <KGAlphabetReport />
      <ReportCsvDownload />
    </SchoolShell>
  )
}
