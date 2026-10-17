'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { SchoolShell } from '@/components/school/school-shell'
import { learnerAvatar } from '@/config/talkora-assets'
import { schoolService, StudentDetail } from '@/services/school-service'
import { gradeLabel } from '@/lib/grade-label'

const card = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 18, padding: 22 }

function readableAnswer(answer: string): string {
  if (!answer.startsWith('{')) return answer || 'No text captured'
  try {
    const reflection = JSON.parse(answer) as { kind?: string; ratings?: Array<{ skill?: string; rating?: string }> }
    if (reflection.kind === 'Favourite Finder reflection' && Array.isArray(reflection.ratings)) {
      return `Favourite Finder reflection: ${reflection.ratings.map(({ skill, rating }) => `${skill}: ${rating?.replace('_', ' ')}`).join('; ')}`
    }
  } catch { /* Preserve a plain learner answer. */ }
  return answer
}

export default function StudentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [student, setStudent] = useState<StudentDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [practiceAudioUrl, setPracticeAudioUrl] = useState('')
  const [practiceAudioLoading, setPracticeAudioLoading] = useState(false)
  const [practiceAudioError, setPracticeAudioError] = useState('')

  useEffect(() => {
    schoolService.getStudent(id).then(setStudent).catch(() => setStudent(null)).finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    let alive = true
    let audioUrl = ''
    if (!student?.homePractice?.hasAudio) {
      setPracticeAudioUrl('')
      setPracticeAudioError('')
      return
    }
    setPracticeAudioLoading(true)
    schoolService.getHomePracticeAudio(id).then((audio) => {
      audioUrl = URL.createObjectURL(audio)
      if (alive) setPracticeAudioUrl(audioUrl)
      else URL.revokeObjectURL(audioUrl)
    }).catch(() => {
      if (alive) setPracticeAudioError('The home-practice recording could not be loaded.')
    }).finally(() => {
      if (alive) setPracticeAudioLoading(false)
    })
    return () => {
      alive = false
      if (audioUrl) URL.revokeObjectURL(audioUrl)
    }
  }, [id, student?.homePractice?.hasAudio])

  if (loading) return <SchoolShell title="Student progress"><div className="educator-loading">Loading verified learning data...</div></SchoolShell>
  if (!student) return <SchoolShell title="Student not found"><div style={card}><p>This student is unavailable or outside your access.</p><Link href="/school/students">Back to students</Link></div></SchoolShell>

  const progress = student.progress ?? { accuracy: 0, completedLevels: 0, totalXp: 0, learningTimeMinutes: 0, streak: 0 }
  const attempts = student.recentAttempts ?? []

  return <SchoolShell title={student.fullName} subtitle={`${gradeLabel(student.grade)}${student.className ? ` · ${student.className}` : ''} · Roll ${student.rollNumber}`}>
    <div style={{ marginBottom: 18, display: 'flex', gap: 18, flexWrap: 'wrap' }}><Link href="/school/students" style={{ color: '#0369a1', fontWeight: 800 }}>← Back to student directory</Link><Link href={`/school/students/${encodeURIComponent(id)}/report`} style={{ color: '#7657d7', fontWeight: 800 }}>Printable parent / teacher report →</Link></div>
    <section style={{ ...card, display: 'flex', alignItems: 'center', gap: 18, marginBottom: 20, flexWrap: 'wrap' }}>
      <Image src={learnerAvatar(student.avatarType)} alt="" width={72} height={72} style={{ borderRadius: 18, objectFit: 'cover', background: '#dbeafe' }} />
      <div style={{ flex: 1 }}><h2 style={{ margin: 0, color: '#0f172a' }}>{student.fullName}</h2><p style={{ margin: '6px 0 0', color: '#64748b' }}>{student.avatarType === 'GIRL' ? 'Girl' : 'Boy'} character · {student.status === 'active' ? 'Active learner' : 'Inactive learner'}</p></div>
      <span style={{ padding: '7px 12px', borderRadius: 999, background: progress.accuracy >= 75 ? '#dcfce7' : '#fff7ed', color: progress.accuracy >= 75 ? '#166534' : '#9a3412', fontWeight: 800 }}>{attempts.length ? (progress.accuracy >= 75 ? 'On track' : 'Needs attention') : 'Awaiting activity'}</span>
    </section>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 14, marginBottom: 20 }}>
      {[["Recent accuracy", attempts.length ? `${progress.accuracy}%` : '—'], ["Levels completed", `${progress.completedLevels} / ${progress.totalLevels || '—'}`], ["Learning time", `${progress.learningTimeMinutes} min`], ["Total XP", `${progress.totalXp} XP`], ["Current streak", `${progress.streak} days`], ["Recent attempts", String(attempts.length)]].map(([label, value]) => <div key={label} style={card}><small style={{ color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>{label}</small><strong style={{ display: 'block', marginTop: 7, fontSize: 25, color: '#0f172a' }}>{value}</strong></div>)}
    </div>
    <section style={{ ...card, marginBottom: 20 }}>
      <h3 style={{ margin: '0 0 12px', color: '#0f172a' }}>Learning progress</h3>
      <p style={{ margin: 0, color: '#334155', fontWeight: 700 }}>
        {progress.completedActivities ?? 0} activities completed · {progress.completedLessons ?? 0} lessons completed
      </p>
    </section>
    <section style={{ ...card, marginBottom: 20 }}>
      <h3 style={{ margin: '0 0 12px', color: '#0f172a' }}>Level 1 home practice</h3>
      {student.homePractice ? <>
        <p style={{ margin: '0 0 8px', color: '#334155' }}>{student.homePractice.reflection}</p>
        <small style={{ color: '#64748b' }}>Submitted {new Date(student.homePractice.submittedAt).toLocaleString()}</small>
        {student.homePractice.hasAudio ? <div style={{ marginTop: 14 }}>
          <h4 style={{ margin: '0 0 8px', color: '#0f172a' }}>Family conversation recording</h4>
          {practiceAudioLoading ? <p role="status" style={{ color: '#64748b' }}>Loading recording…</p> : null}
          {practiceAudioUrl ? <audio controls src={practiceAudioUrl} style={{ width: '100%' }} aria-label={`${student.fullName}'s family conversation recording`} /> : null}
          {practiceAudioError ? <p role="alert" style={{ color: '#b91c1c' }}>{practiceAudioError}</p> : null}
        </div> : <p style={{ margin: '12px 0 0', color: '#64748b' }}>No recording was saved with this reflection.</p>}
      </> : <p style={{ margin: 0, color: '#64748b' }}>No family conversation reflection submitted yet.</p>}
    </section>
    <section style={card}>
      <h3 style={{ margin: '0 0 6px', color: '#0f172a' }}>Recent learning attempts</h3>
      <p style={{ margin: '0 0 18px', color: '#64748b' }}>Only recorded learner activity is shown. Recommendations are not generated until the educator AI service is connected.</p>
      {!attempts.length ? <div style={{ padding: '28px 0', textAlign: 'center', color: '#64748b' }}>No activity attempts have been recorded yet.</div> : <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 650 }}>
        <thead><tr style={{ textAlign: 'left', color: '#64748b', borderBottom: '1px solid #e2e8f0' }}><th style={{ padding: 12 }}>Answer</th><th>Result</th><th>Score</th><th>Time</th><th>Date</th></tr></thead>
        <tbody>{attempts.map((attempt, index) => <tr key={`${attempt.activityId}-${attempt.createdAt}-${index}`} style={{ borderBottom: '1px solid #f1f5f9' }}><td style={{ padding: 12, fontWeight: 700 }}>{readableAnswer(attempt.answer)}</td><td><span style={{ color: attempt.correct ? '#166534' : '#b91c1c', fontWeight: 800 }}>{attempt.correct ? 'Correct' : 'Retry'}</span></td><td>{attempt.speakingAccuracy ?? attempt.score ?? '—'}{typeof (attempt.speakingAccuracy ?? attempt.score) === 'number' ? '%' : ''}</td><td>{attempt.timeTakenSeconds}s</td><td>{new Date(attempt.createdAt).toLocaleString()}</td></tr>)}</tbody>
      </table></div>}
    </section>
  </SchoolShell>
}
