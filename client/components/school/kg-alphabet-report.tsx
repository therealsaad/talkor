'use client'

import { useEffect, useState } from 'react'
import { apiClient } from '@/lib/api-client'

type Row = { studentId: string; studentName: string; currentIndex: number; completed: boolean; attempts: number; timeSpentMs?: number; replayTimeSpentMs?: number; accuracy: number | null; retryLetters: string[] }
type Report = { level: number; totalStudents: number; completedCount: number; students: Row[]; reportType: string; page: number; hasNext: boolean }
type StudentDetail = { studentName: string; currentIndex: number; totalAttempts: number; timeSpentMs?: number; replayTimeSpentMs?: number; completedAt: string | null; needsPractice: string[]; letters: Array<{ letter: string; attempts: number; correct: number; accuracy: number | null; retries: number; unclear: number; timeSpentMs?: number; replayTimeSpentMs?: number }> }

function timeLabel(milliseconds = 0) {
  const seconds = Math.round(milliseconds / 1000)
  if (seconds < 60) return `${seconds} sec`
  const minutes = Math.floor(seconds / 60)
  const remainder = seconds % 60
  return remainder ? `${minutes} min ${remainder} sec` : `${minutes} min`
}

/** School/teacher-scoped deterministic report; never shows another school's children. */
export function KGAlphabetReport() {
  const [data, setData] = useState<Report | null>(null)
  const [page, setPage] = useState(1)
  const [error, setError] = useState('')
  const [detail, setDetail] = useState<StudentDetail | null>(null)
  const [detailError, setDetailError] = useState('')
  const [detailLoading, setDetailLoading] = useState(false)
  useEffect(() => {
    let alive = true
    setError('')
    apiClient<Report>(`/kg-alphabet/reports?page=${page}`)
      .then((report) => { if (alive) setData(report) })
      .catch((reason) => { if (alive) setError(reason instanceof Error ? reason.message : 'KG report unavailable') })
    return () => { alive = false }
  }, [page])
  async function openStudentReport(id: string) {
    setDetail(null); setDetailError(''); setDetailLoading(true)
    try { setDetail(await apiClient<StudentDetail>(`/kg-alphabet/reports/${encodeURIComponent(id)}`)) }
    catch (reason) { setDetailError(reason instanceof Error ? reason.message : 'Could not load student details') }
    finally { setDetailLoading(false) }
  }
  return <section style={{ marginTop: 20, padding: 20, background: '#fff', border: '1px solid #e5e8ef', borderRadius: 16 }}>
    <h2 style={{ fontSize: 18, fontWeight: 900, margin: '0 0 6px' }}>KG Level 1 · ABCD</h2>
      <p style={{ color: '#69728a', fontSize: 12, marginBottom: 16 }}>Speaking and picture-puzzle attempts, active time, and letter practice. Unclear audio is excluded from accuracy.</p>
    {error ? <p role="alert" style={{ color: '#b34354' }}>{error}</p> : !data ? <p role="status">Loading KG reports…</p> : <>
      <p style={{ fontWeight: 800, marginBottom: 14 }}>{data.completedCount} completed on this page · {data.totalStudents} KG students total</p>
      {data.students.length ? <div style={{ overflowX: 'auto' }}><table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 13 }}>
        <thead><tr>{['Student', 'Progress', 'Attempts', 'Time spent', 'Accuracy', 'Practice needed', 'Details'].map((name) => <th key={name} style={{ padding: 9, textAlign: 'left', borderBottom: '2px solid #eee' }}>{name}</th>)}</tr></thead>
        <tbody>{data.students.map((student) => <tr key={student.studentId}>
          <td style={{ padding: 9 }}>{student.studentName}</td>
          <td style={{ padding: 9 }}>{student.completed ? 'Complete ⭐' : `${student.currentIndex}/8 activities`}</td>
          <td style={{ padding: 9 }}>{student.attempts}</td>
          <td style={{ padding: 9 }}>{timeLabel(student.timeSpentMs)}</td>
          <td style={{ padding: 9 }}>{student.accuracy === null ? '—' : `${student.accuracy}%`}</td>
          <td style={{ padding: 9 }}>{student.retryLetters.join(', ') || '—'}</td>
          <td style={{ padding: 9 }}><a href={`/school/students/${encodeURIComponent(student.studentId)}/report`} style={{ display: 'block', marginBottom: 5, color: '#7657d7', fontWeight: 700 }}>Parent PDF</a><button type="button" onClick={() => void openStudentReport(student.studentId)} style={{ padding: '7px 11px', background: '#eee8ff', border: 'none', borderRadius: 9, cursor: 'pointer', fontWeight: 800 }}>View letters</button></td>
        </tr>)}</tbody>
      </table></div> : <p style={{ color: '#69728a' }}>No KG students are assigned yet.</p>}
      {detailLoading ? <p role="status">Loading individual KG report…</p> : null}
      {detailError ? <p role="alert" style={{ color: '#b34354' }}>{detailError}</p> : null}
      {detail ? <section aria-label={`ABCD report for ${detail.studentName}`} style={{ marginTop: 18, padding: 15, borderRadius: 14, background: '#f8f7ff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}><h3 style={{ margin: 0, fontSize: 16 }}>{detail.studentName} · ABCD progress</h3><button type="button" onClick={() => setDetail(null)} aria-label="Close KG detail">Close</button></div>
        <p style={{ fontSize: 13 }}>Saved activity: {detail.currentIndex}/8 · Attempts: {detail.totalAttempts} · Active time: {timeLabel(detail.timeSpentMs)} · Replay time: {timeLabel(detail.replayTimeSpentMs)} · {detail.completedAt ? 'Level completed' : 'In progress'}</p>
        <p style={{ fontSize: 13, fontWeight: 750 }}>Needs practice: {detail.needsPractice.join(', ') || 'No flagged letters'}</p>
        <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}><thead><tr>{['Letter', 'Attempts', 'Correct', 'Retries', 'Unclear', 'Time', 'Accuracy'].map((name) => <th key={name} style={{ padding: 8, textAlign: 'left' }}>{name}</th>)}</tr></thead><tbody>{detail.letters.map((item) => <tr key={item.letter}><td style={{ padding: 8, fontWeight: 800 }}>{item.letter}</td><td>{item.attempts}</td><td>{item.correct}</td><td>{item.retries}</td><td>{item.unclear}</td><td>{timeLabel(item.timeSpentMs)}</td><td>{item.accuracy === null ? '—' : `${item.accuracy}%`}</td></tr>)}</tbody></table></div>
        <p style={{ fontSize: 11, color: '#64748b' }}>These are recorded metrics, not AI-generated conclusions. Unclear speech is excluded from accuracy.</p>
      </section> : null}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 16 }}>
        <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
        <span>Page {page}</span>
        <button type="button" disabled={!data.hasNext} onClick={() => setPage((p) => p + 1)}>Next</button>
      </div>
    </>}
  </section>
}
