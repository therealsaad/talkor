'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Eye,
  Layers3,
  ShieldAlert,
  Sparkles,
  BookOpen,
  Info,
  CheckCircle2,
} from 'lucide-react'
import { SchoolShell } from '@/components/school/school-shell'
import { useAuth } from '@/components/auth/auth-provider'
import { loadWorkspace, type LevelWorkspace } from '@/features/lessons/registry'
import { gradeLevelMapService, type EditorMappedLevel } from '@/services/grade-level-map'
import { gradeLongLabel } from '@/lib/grade-label'
import { Breadcrumbs } from '@/components/portal/breadcrumbs'
import { StatusBadge } from '@/components/portal/status-badge'

export default function CurriculumStudioPage() {
  const params = useParams()
  const router = useRouter()
  const { session } = useAuth()
  const grade = Number(params?.grade)
  const level = Number(params?.level)

  const [module, setModule] = useState<LevelWorkspace | null>(null)
  const [actual, setActual] = useState<EditorMappedLevel | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let live = true
    setLoading(true)
    setModule(null)
    setError('')
    setActual(null)

    const entry = loadWorkspace(grade, level)
    if (!entry) {
      setError('Invalid grade or level requested.')
      setLoading(false)
      return
    }

    Promise.all([
      entry,
      gradeLevelMapService.level(grade,level),
      gradeLevelMapService.studio(grade,level),
    ])
      .then(([workspace, levelStatus, serverDesign]) => {
        if (!live) return
        if (
          workspace.config.id !== serverDesign.id ||
          workspace.config.experience.themeId !== serverDesign.designTheme
        ) {
          throw new Error(
            'Backend/frontend level design catalog mismatch. Ask the lead to synchronize the manifests.'
          )
        }
        setModule(workspace)
        setActual(levelStatus)
      })
      .catch((e: unknown) => {
        if (live) setError(e instanceof Error ? e.message : 'Could not verify staff curriculum access')
      })
      .finally(() => {
        if (live) setLoading(false)
      })

    return () => {
      live = false
    }
  }, [grade, level])

  const prevLevel = level > 1 ? level - 1 : null
  const nextLevel = level < 10 ? level + 1 : null
  const levelTitle = actual?.actualTitle || actual?.plannedTitle || module?.config.title || `Level ${level}`
  const canonicalAddress = `g${String(grade).padStart(2, '0')}-l${String(level).padStart(2, '0')}`

  return (
    <SchoolShell
      title={`Staff Preview · ${gradeLongLabel(grade)} Level ${level}`}
      subtitle="Interactive lesson inspection workspace · read-only staff review"
    >
      <Breadcrumbs
        items={[
          { label: 'Curriculum Map', href: '/school/curriculum-map' },
          { label: gradeLongLabel(grade), href: `/school/curriculum-map` },
          { label: `Level ${level}: ${levelTitle}` },
        ]}
      />

      {/* Top Toolbar */}
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
          href="/school/curriculum-map"
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
          <ArrowLeft size={15} /> Back to curriculum map
        </Link>

        {/* Level Navigation Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {prevLevel ? (
            <Link
              href={`/school/curriculum-studio/${grade}/${prevLevel}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                padding: '7px 12px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 700,
                color: '#0f172a',
                textDecoration: 'none',
              }}
            >
              <ChevronLeft size={14} /> Level {prevLevel}
            </Link>
          ) : null}

          <span
            style={{
              fontSize: 12,
              fontWeight: 800,
              padding: '6px 12px',
              borderRadius: 8,
              background: '#f1f5f9',
              color: '#334155',
            }}
          >
            Level {level} of 10
          </span>

          {nextLevel ? (
            <Link
              href={`/school/curriculum-studio/${grade}/${nextLevel}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                padding: '7px 12px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 700,
                color: '#0f172a',
                textDecoration: 'none',
              }}
            >
              Level {nextLevel} <ChevronRight size={14} />
            </Link>
          ) : null}
        </div>
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
          <p style={{ margin: 0, fontWeight: 700 }}>Loading staff level preview workspace…</p>
        </div>
      ) : null}

      {error ? (
        <div
          role="alert"
          style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#991b1b',
            borderRadius: 16,
            padding: '20px 24px',
            marginBottom: 20,
          }}
        >
          <strong style={{ display: 'block', fontSize: 15, marginBottom: 6 }}>
            Could not open level preview
          </strong>
          <p style={{ margin: 0, fontSize: 13 }}>{error}</p>
        </div>
      ) : null}

      {module && actual ? (
        <div>
          {/* Safe Preview Mode Banner */}
          <section
            style={{
              background: '#fffbeb',
              border: '1px solid #fde68a',
              borderRadius: 14,
              padding: '16px 20px',
              marginBottom: 20,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
            }}
          >
            <ShieldAlert size={20} color="#d97706" style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ fontSize: 13, color: '#92400e', lineHeight: 1.5 }}>
              <strong style={{ fontWeight: 800 }}>Staff Review Mode:</strong> This is a staff-only preview workspace.
              Interacting with this preview <b>does not mutate student records</b>, record attempts, unlock levels, or award XP.
              MongoDB publication status:{' '}
              <span style={{ fontWeight: 800, textTransform: 'uppercase' }}>{actual.status}</span>.
            </div>
          </section>

          {/* Level Header Panel */}
          <section
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 18,
              padding: '24px 28px',
              marginBottom: 24,
              boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: 16,
                flexWrap: 'wrap',
                marginBottom: 16,
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: 6,
                      background: '#f1f5f9',
                      color: '#475569',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {canonicalAddress.toUpperCase()}
                  </span>
                  <StatusBadge status={actual.status} />
                </div>
                <h1 style={{ fontSize: 24, fontWeight: 850, color: '#0f172a', margin: '0 0 6px' }}>
                  {levelTitle}
                </h1>
                <p style={{ fontSize: 14, color: '#64748b', margin: 0, maxWidth: 720, lineHeight: 1.5 }}>
                  {actual.objective || 'Focus on foundational English speaking and listening skills.'}
                </p>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  padding: '10px 16px',
                  borderRadius: 12,
                  fontSize: 12,
                }}
              >
                <div>
                  <span style={{ color: '#64748b', display: 'block' }}>Lesson records</span>
                  <strong style={{ color: '#0f172a', fontSize: 15 }}>{actual.lessons.length}</strong>
                </div>
                <div style={{ width: 1, height: 28, background: '#e2e8f0' }} />
                <div>
                  <span style={{ color: '#64748b', display: 'block' }}>Active activities</span>
                  <strong style={{ color: '#0f172a', fontSize: 15 }}>
                    {actual.lessons.reduce((acc, l) => acc + l.activityCount, 0)}
                  </strong>
                </div>
              </div>
            </div>

            {/* Skills Pills */}
            {actual.skills?.length ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', paddingTop: 14, borderTop: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>Skills targeted:</span>
                {actual.skills.map((skill) => (
                  <span
                    key={skill}
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '2px 9px',
                      borderRadius: 999,
                      background: '#eff6ff',
                      color: '#1d4ed8',
                    }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : null}
          </section>

          {/* Interactive Lesson Experience Container (Safe Preview) */}
          <section
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 20,
              padding: 24,
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
              marginBottom: 24,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: 16,
                marginBottom: 20,
                borderBottom: '1px solid #f1f5f9',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Eye size={17} color="#4f46e5" />
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a' }}>
                  Interactive Level Inspection
                </h3>
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: '#475569',
                  background: '#f8fafc',
                  padding: '4px 10px',
                  borderRadius: 6,
                  border: '1px solid #e2e8f0',
                }}
              >
                Safe Read-Only Mode
              </span>
            </div>

            {/* Render the actual level workspace in preview mode */}
            <div style={{ minHeight: 460 }}>
              <module.LevelExperience preview />
            </div>
          </section>

          {/* Developer / Teacher Metadata Footer */}
          <p style={{ color: '#64748b', fontSize: 12, margin: '16px 0 0' }}>
            Workspaces are authored under{' '}
            <code>
              client/features/lessons/grades/{grade === 0 ? 'kg' : `class-${String(grade).padStart(2, '0')}`}/level-{String(level).padStart(2, '0')}/
            </code>
          </p>
        </div>
      ) : null}
    </SchoolShell>
  )
}
