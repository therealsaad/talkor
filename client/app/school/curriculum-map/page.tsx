'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { SchoolShell } from '@/components/school/school-shell'
import { useAuth } from '@/components/auth/auth-provider'
import { gradeLevelMapService, type GradeLevelMap, type EditorMappedLevel } from '@/services/grade-level-map'

const statusLabel: Record<EditorMappedLevel['status'], string> = {
  NOT_MAPPED: 'Not mapped', DRAFT: 'Draft — unavailable',
  INCOMPLETE: 'Published flag; no playable content', PUBLISHED: 'Playable content detected',
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
    setLoading(true); setError(''); setData(null); setSelected(null)
    gradeLevelMapService.grade(grade).then((result) => {
      if (active) setData(result)
    }).catch((reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason.message : 'Could not load curriculum mapping')
    }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [grade])

  async function showLevel(level: number) {
    setSelected(null); setDetailBusy(true); setError('')
    try { setSelected(await gradeLevelMapService.level(grade, level)) }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not load this level') }
    finally { setDetailBusy(false) }
  }

  return <SchoolShell title="KG–Class 10 Curriculum Map" subtitle="110 class-specific level addresses, using your existing lesson models and APIs.">
    <section style={{ border: '1px solid #e2e8f0', borderRadius: 16, background: '#fff', padding: 20, marginBottom: 18 }}>
      <label htmlFor="talkora-grade-select" style={{ fontWeight: 800, display: 'block', marginBottom: 8 }}>Choose a class</label>
      <select id="talkora-grade-select" value={grade} onChange={(event) => setGrade(Number(event.target.value))}
        style={{ width: '100%', maxWidth: 320, background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 10, padding: 12 }}>
        {Array.from({ length: 11 }, (_, id) => <option disabled={isTeacher && id === 0} value={id} key={id}>{id === 0 ? 'Kindergarten (KG)' : `Class ${id}`}</option>)}
      </select>
      <p style={{ color: '#64748b', marginBottom: 0, lineHeight: 1.5 }}>
        These are curriculum addresses, not 110 completed lessons. Empty drafts cannot be played by students.
        {isTeacher ? ' KG authoring is restricted to school administrators.' : ''}
      </p>
    </section>
    {loading ? <p role="status">Loading the level map…</p> : null}
    {error ? <p role="alert" style={{ color: '#b91c1c' }}>{error}</p> : null}
    {data ? <>
      <section style={{ marginBottom: 16, color: '#475569' }}>
        <strong style={{ color: '#0f172a' }}>{data.name}:</strong> {data.mappedCount}/10 mapped in MongoDB, {data.publishedCount}/10 with active lesson activities.
        {data.classId ? <span> <Link href={`/school/classes/${data.classId}`}>Open existing class preview →</Link></span> : null}
      </section>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
        {data.levels.map((item) => <button type="button" key={item.address} onClick={() => void showLevel(item.level)}
          aria-label={`Inspect level ${item.level}: ${item.plannedTitle}`}
          style={{ textAlign: 'left', border: selected?.address === item.address ? '2px solid #0284c7' : '1px solid #e2e8f0', borderRadius: 15, padding: 18, background: '#fff', cursor: 'pointer' }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: '#64748b' }}>{item.address.toUpperCase()} · Level {item.level}</span>
          <h2 style={{ color: '#0f172a', fontSize: 16, margin: '8px 0' }}>{item.actualTitle || item.plannedTitle}</h2>
          <p style={{ fontSize: 13, color: item.status === 'PUBLISHED' ? '#166534' : '#92400e', marginBottom: 4 }}>
            {statusLabel[item.status]}
          </p>
          <span style={{ color: '#64748b', fontSize: 12 }}>{item.lessons.length} lesson records · {item.lessons.reduce((total, l) => total + l.activityCount, 0)} active activities</span>
        </button>)}
      </div>
      {detailBusy ? <p role="status">Loading level details…</p> : null}
      {selected ? <section aria-live="polite" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, marginTop: 20, padding: 20 }}>
        <h2 style={{ fontSize: 19, marginTop: 0 }}>Level {selected.level}: {selected.actualTitle || selected.plannedTitle}</h2>
        <p>{selected.objective}</p>
        <p style={{ color: '#64748b' }}>Address: {selected.address} · Mongo level ID: {selected.levelId || 'Not created'} · Publication: {selected.publication}</p>
        <p><Link href={`/school/curriculum-studio/${grade}/${selected.level}`} style={{ fontWeight: 800 }}>Open design workspace →</Link></p>
        <h3 style={{ fontSize: 15 }}>Mapped lesson records</h3>
        {selected.lessons.length ? <ul>{selected.lessons.map((lesson) => <li key={lesson.id} style={{ marginBottom: 9 }}>
          {lesson.title} — {lesson.status}, {lesson.activityCount} active activities{lesson.placeholder ? ' (empty placeholder)' : ''}
        </li>)}</ul> : <p>No lesson records yet. Authoring is required.</p>}
        <p style={{ color: '#92400e' }}>Publication and syllabus approval are intentionally separate from this read-only planning screen.</p>
      </section> : null}
    </> : null}
  </SchoolShell>
}
