'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { SchoolShell } from '@/components/school/school-shell'
import { apiClient } from '@/lib/api-client'
import { gradeLabel } from '@/lib/grade-label'

type Period = 'daily' | 'weekly' | 'monthly'
type Report = {
  type: string; period: Period; generatedAt: string; window: { from: string; to: string }
  student: { id: string; fullName: string; grade: number; className: string | null; rollNumber: string }
  metrics: { activeDays: number; attemptCount: number; correctAttempts: number; accuracyPercent: number | null;
    totalMinutes: number; completedLevels: number; totalXp: number; kgLevel1Activities: number | null;
    kgLevel1Complete: boolean; unclearSpeechAttempts: number }
  needsPractice: string[]; homePractice: string[]; disclaimer: string
}

export default function PrintableStudentReport() {
  const { id } = useParams<{ id: string }>()
  const [period, setPeriod] = useState<Period>('weekly')
  const [report, setReport] = useState<Report | null>(null)
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    setReport(null); setError('')
    apiClient<Report>(`/analytics/students/${encodeURIComponent(id)}/report?period=${period}`)
      .then((value) => { if (active) setReport(value) })
      .catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : 'Report unavailable') })
    return () => { active = false }
  }, [id, period])
  return <SchoolShell title="Parent & teacher progress report" subtitle="Recorded learning facts, ready to print or save as PDF">
    <style>{`@media print { @page { size: A4; margin: 15mm; } nav, aside, button, select, .report-noprint { display: none !important; } .report-print { box-shadow: none !important; border: none !important; padding: 0 !important; color: #111 !important; } }`}</style>
    <div className="report-noprint" style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 18, flexWrap: 'wrap' }}>
      <Link href={`/school/students/${encodeURIComponent(id)}`}>← Student details</Link>
      <label htmlFor="report-period">Report period</label>
      <select id="report-period" value={period} onChange={(e) => setPeriod(e.target.value as Period)}>
        <option value="daily">Today (UTC)</option><option value="weekly">Last 7 days (UTC)</option><option value="monthly">Last 30 days (UTC)</option>
      </select>
      <button type="button" disabled={!report} onClick={() => window.print()} style={{ padding: '10px 15px', borderRadius: 9, background: '#7657d7', color: '#fff' }}>Print / Save PDF for parents</button>
    </div>
    {error ? <p role="alert">{error}</p> : !report ? <p role="status">Loading verified report…</p> :
      <article className="report-print" style={{ background: '#fff', border: '1px solid #e5e8ef', padding: 28, borderRadius: 15, maxWidth: 820 }}>
        <h2 style={{ marginTop: 0 }}>TALKORA · Learning Progress</h2>
        <p style={{ color: '#64748b' }}>For parents and teachers · {period} · {new Date(report.generatedAt).toLocaleDateString()}</p>
        <h3>{report.student.fullName}</h3>
        <p>{gradeLabel(report.student.grade)} {report.student.className || ''} · Roll {report.student.rollNumber}</p>
        <p style={{ fontSize: 12, color: '#64748b' }}>Reporting window: {new Date(report.window.from).toLocaleDateString()} – {new Date(report.window.to).toLocaleDateString()}</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 14 }}>
          {([
            ['Active learning days', report.metrics.activeDays], ['Attempts this period', report.metrics.attemptCount],
            ['Average recorded score', report.metrics.accuracyPercent === null ? 'No attempts' : `${report.metrics.accuracyPercent}%`],
            ['Recorded learning minutes', report.metrics.totalMinutes], ['Levels completed (lifetime)', report.metrics.completedLevels],
            ['XP earned (lifetime)', report.metrics.totalXp],
          ] as Array<[string, string | number]>).map(([label, value]) =>
            <div key={label} style={{ padding: 14, background: '#f8fafc', borderRadius: 9 }}><small>{label}</small><strong style={{ display: 'block', fontSize: 22 }}>{value}</strong></div>)}
        </div>
        {report.student.grade === 0 ? <p>KG ABCD: {report.metrics.kgLevel1Activities ?? 0}/8 activities · {report.metrics.kgLevel1Complete ? 'Completed' : 'In progress'} · Unclear speech attempts: {report.metrics.unclearSpeechAttempts}</p> : null}
        <h3>Skills to practise</h3><p>{report.needsPractice.length ? report.needsPractice.join(', ') : 'No specific weak skills flagged yet.'}</p>
        <h3>Practice together at home</h3><ul>{report.homePractice.map((item) => <li key={item}>{item}</li>)}</ul>
        <p style={{ fontSize: 11, color: '#64748b' }}>{report.disclaimer}</p>
      </article>}
  </SchoolShell>
}
