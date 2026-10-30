'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, BookOpen, Layers3, RotateCw, ExternalLink } from 'lucide-react'
import { SchoolShell } from '@/components/school/school-shell'
import { curriculumService, type CurriculumClass, type LevelItem } from '@/services/curriculum-service'
import { gradeLongLabel } from '@/lib/grade-label'
import { Breadcrumbs } from '@/components/portal/breadcrumbs'
import { StatusBadge } from '@/components/portal/status-badge'

export default function ClassCurriculumPreviewPage() {
  const { id } = useParams<{ id: string }>()
  const [curriculumClass, setCurriculumClass] = useState<CurriculumClass | null>(null)
  const [levels, setLevels] = useState<LevelItem[]>([])
  const [lessonsByLevel, setLessonsByLevel] = useState<Record<string, string[]>>({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [reload, setReload] = useState(0)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    void Promise.all([curriculumService.getClass(id), curriculumService.getLevels(id)])
      .then(async ([klass, items]) => {
        if (!active) return
        const sortedItems = [...items].sort((a, b) => a.order - b.order)
        setCurriculumClass(klass)
        setLevels(sortedItems)
        setError('')
        const lessonEntries = await Promise.all(
          sortedItems
            .filter((level) => level.availability === 'PUBLISHED')
            .map(async (level) => {
              try {
                const lessons = await curriculumService.getLessons(level.id)
                return [level.id, lessons.map((lesson) => lesson.title)] as const
              } catch {
                return [level.id, []] as const
              }
            })
        )
        if (active) setLessonsByLevel(Object.fromEntries(lessonEntries))
      })
      .catch((cause) => {
        if (active) setError(cause instanceof Error ? cause.message : 'Curriculum could not load.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [id, reload])

  const classTitle = curriculumClass ? `${gradeLongLabel(curriculumClass.grade)} Curriculum` : 'Class Levels'

  return (
    <SchoolShell
      title={classTitle}
      subtitle="Published and upcoming learning levels mapped for this classroom grade."
    >
      <Breadcrumbs
        items={[
          { label: 'Classes', href: '/school/classes' },
          { label: curriculumClass ? gradeLongLabel(curriculumClass.grade) : 'Levels' },
        ]}
      />

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
          marginBottom: 20,
          flexWrap: 'wrap',
        }}
      >
        <Link
          href="/school/classes"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            color: '#4f46e5',
            fontWeight: 700,
            fontSize: 13,
            textDecoration: 'none',
          }}
        >
          <ArrowLeft size={15} /> Back to all classes
        </Link>

        {curriculumClass ? (
          <Link
            href={`/school/students?grade=${curriculumClass.grade}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              color: '#0f172a',
              padding: '7px 12px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            View students in this grade →
          </Link>
        ) : null}
      </div>

      {loading ? (
        <div
          role="status"
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 18,
            padding: '48px 24px',
            textAlign: 'center',
            color: '#64748b',
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              border: '3px solid #e2e8f0',
              borderTopColor: '#4f46e5',
              borderRadius: '50%',
              margin: '0 auto 16px',
              animation: 'spin 1s linear infinite',
            }}
          />
          <p style={{ margin: 0, fontWeight: 700 }}>Loading curriculum levels…</p>
        </div>
      ) : null}

      {error ? (
        <div
          role="alert"
          style={{
            padding: 16,
            borderRadius: 14,
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#991b1b',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => {
              setLoading(true)
              setReload((v) => v + 1)
            }}
            style={{
              background: '#ffffff',
              border: '1px solid #fca5a5',
              color: '#b91c1c',
              padding: '6px 12px',
              borderRadius: 6,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            <RotateCw size={13} /> Retry
          </button>
        </div>
      ) : null}

      {!loading && !error && curriculumClass?.grade === 0 && !levels.some((l) => l.availability === 'PUBLISHED') ? (
        <div
          role="status"
          style={{
            padding: 16,
            margin: '12px 0 20px',
            borderRadius: 14,
            background: '#fffbeb',
            border: '1px solid #fde68a',
            color: '#92400e',
            lineHeight: 1.5,
            fontSize: 13,
          }}
        >
          KG curriculum is currently in draft. You can enroll Grade 0 students, but students will not see active lessons until a level is published. Staff can test via{' '}
          <Link href="/school/kg-preview" style={{ color: '#b45309', fontWeight: 800 }}>
            KG Previews
          </Link>.
        </div>
      ) : null}

      {!loading && !error && levels.length === 0 && curriculumClass?.grade !== 0 ? (
        <p style={{ color: '#64748b', fontSize: 13 }}>No levels have been authored for this class yet.</p>
      ) : null}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        {levels.map((level) => (
          <article
            key={level.id}
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 16,
              padding: 22,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#4f46e5', fontWeight: 800, fontSize: 12 }}>
                <BookOpen size={16} /> Level {level.number}
              </span>
              <StatusBadge status={level.availability || 'UPCOMING'} />
            </div>

            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: 0 }}>{level.title}</h2>
            <p style={{ color: '#64748b', fontSize: 13, lineHeight: 1.5, margin: 0, flex: 1 }}>
              {level.description}
            </p>

            {level.availability === 'PUBLISHED' ? (
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 10 }}>
                <strong style={{ color: '#334155', fontSize: 12 }}>Published lessons</strong>
                {lessonsByLevel[level.id]?.length ? (
                  <ul style={{ margin: '6px 0 0', paddingLeft: 16, color: '#475569', fontSize: 12, lineHeight: 1.6 }}>
                    {lessonsByLevel[level.id].map((title) => (
                      <li key={title}>{title}</li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: 12 }}>
                    No published lesson titles are available for preview yet.
                  </p>
                )}
              </div>
            ) : null}

            {level.learningObjectives?.length ? (
              <small style={{ color: '#475569', fontSize: 11 }}>
                Goals: {level.learningObjectives.slice(0, 3).join(' · ')}
              </small>
            ) : null}

            {curriculumClass ? (
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 10, marginTop: 'auto' }}>
                <Link
                  href={`/school/curriculum-studio/${curriculumClass.grade}/${level.number}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    color: '#4f46e5',
                    fontSize: 12,
                    fontWeight: 750,
                    textDecoration: 'none',
                  }}
                >
                  <ExternalLink size={13} />
                  Open staff preview workspace
                </Link>
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </SchoolShell>
  )
}
