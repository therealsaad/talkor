'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Users,
  Activity,
  Award,
  Clock3,
  ArrowRight,
  Sparkles,
  BookOpen,
  GraduationCap,
  Layers3,
  AlertTriangle,
  RotateCw,
} from 'lucide-react'
import { SchoolShell } from '@/components/school/school-shell'
import { schoolService, type SchoolOverview, type StudentListItem, type AnalyticsOverview } from '@/services/school-service'
import { useAuth } from '@/components/auth/auth-provider'
import { gradeLabel } from '@/lib/grade-label'
import { MetricCard } from '@/components/portal/metric-card'
import { StatusBadge } from '@/components/portal/status-badge'

export default function SchoolDashboardPage() {
  const { session, role } = useAuth()
  const isTeacher = role === 'TEACHER'
  const userName = session?.user?.name || (isTeacher ? 'Teacher' : 'Administrator')
  const schoolName = session?.school?.name || 'Talkora School'

  const [overview, setOverview] = useState<SchoolOverview | null>(null)
  const [students, setStudents] = useState<StudentListItem[]>([])
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reload, setReload] = useState(0)

  useEffect(() => {
    let active = true
    async function loadData() {
      setLoading(true)
      setError('')
      try {
        const [ov, stList, an] = await Promise.allSettled([
          schoolService.getOverview(),
          schoolService.listStudents({ limit: 6 }),
          schoolService.getAnalytics(),
        ])

        if (!active) return
        if (ov.status === 'fulfilled') setOverview(ov.value)
        if (stList.status === 'fulfilled') setStudents(Array.isArray(stList.value.students) ? stList.value.students : [])
        if (an.status === 'fulfilled') setAnalytics(an.value)

        if ([ov, stList, an].some((result) => result.status === 'rejected')) {
          setError('Some dashboard records could not be retrieved from the server. Refresh to try again.')
        }
      } catch (err) {
        if (active) {
          console.error('Failed to load dashboard data', err)
          setError('Dashboard data could not load. Please check your connection and retry.')
        }
      } finally {
        if (active) setLoading(false)
      }
    }
    loadData()
    return () => {
      active = false
    }
  }, [reload])

  const totalStudents = overview?.studentCount !== undefined ? overview.studentCount : '—'
  const activeStudents = overview?.activeStudentCount !== undefined ? overview.activeStudentCount : '—'
  const avgAccuracy = analytics?.avgAccuracy !== undefined && analytics.totalAttempts > 0 ? `${analytics.avgAccuracy}%` : '—'
  const totalMinutes = overview?.totalLearningMinutes !== undefined ? `${overview.totalLearningMinutes} mins` : '—'

  return (
    <SchoolShell
      title={isTeacher ? 'Teacher Dashboard' : 'School Dashboard'}
      subtitle={
        isTeacher
          ? `Classroom overview and student speaking growth for ${userName}.`
          : `Live overview of enrollment, accuracy, learning minutes, and curriculum progress for ${schoolName}.`
      }
    >
      {error ? (
        <div
          role="alert"
          style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#991b1b',
            padding: '14px 18px',
            borderRadius: 14,
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertTriangle size={18} color="#dc2626" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setReload((v) => v + 1)}
            style={{
              background: '#ffffff',
              border: '1px solid #fca5a5',
              color: '#b91c1c',
              padding: '6px 14px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <RotateCw size={13} /> Retry
          </button>
        </div>
      ) : null}

      {/* Hero Welcome Banner */}
      <section
        style={{
          background: isTeacher
            ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'
            : 'linear-gradient(135deg, #0b1736 0%, #17213b 100%)',
          color: '#ffffff',
          borderRadius: 20,
          padding: '28px 32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 28,
          boxShadow: '0 4px 14px rgba(11, 23, 54, 0.08)',
          flexWrap: 'wrap',
          gap: 20,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 640 }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              color: isTeacher ? '#7dd3fc' : '#f7ca3e',
              fontWeight: 800,
              fontSize: 12,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 8,
            }}
          >
            <Sparkles size={14} />
            {isTeacher ? 'Teacher Classroom Workspace' : 'School Administration Workspace'}
          </span>
          <h2 style={{ fontSize: 26, fontWeight: 800, margin: '4px 0 10px', color: '#ffffff', lineHeight: 1.25 }}>
            {isTeacher
              ? `Welcome back, ${userName}!`
              : `Empowering students to speak English with confidence.`}
          </h2>
          <p style={{ color: '#94a3b8', fontSize: 14, margin: '0 0 20px', lineHeight: 1.5 }}>
            {isTeacher
              ? 'Review speaking activity for your classes, inspect individual student responses, and preview curriculum lessons.'
              : `Review school-wide recorded speaking attempts, student accuracy, and verified progress across all grades.`}
          </p>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link
              href="/school/students"
              style={{
                background: isTeacher ? '#38bdf8' : '#f7ca3e',
                color: '#0b1736',
                padding: '10px 18px',
                borderRadius: 10,
                fontWeight: 800,
                fontSize: 13,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Users size={15} />
              {isTeacher ? 'View My Students' : '+ Manage Students'}
            </Link>
            <Link
              href="/school/curriculum-map"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                padding: '10px 18px',
                borderRadius: 10,
                fontWeight: 700,
                fontSize: 13,
                textDecoration: 'none',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Layers3 size={15} />
              Explore Curriculum Map
            </Link>
            <Link
              href="/school/reports"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#cbd5e1',
                padding: '10px 16px',
                borderRadius: 10,
                fontWeight: 600,
                fontSize: 13,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              Learning Reports →
            </Link>
          </div>
        </div>

        <div
          aria-hidden="true"
          style={{
            width: 110,
            height: 110,
            background: isTeacher
              ? 'linear-gradient(145deg, #0284c7, #38bdf8)'
              : 'linear-gradient(145deg, #7657d7, #36a6c9)',
            borderRadius: 24,
            border: '1px solid rgba(255, 255, 255, 0.25)',
            display: 'grid',
            placeItems: 'center',
            fontSize: 44,
            boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
            flexShrink: 0,
          }}
        >
          {isTeacher ? '🎓' : '🏫'}
        </div>
      </section>

      {/* KPI Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
          marginBottom: 28,
        }}
      >
        <MetricCard
          label={isTeacher ? 'My Students' : 'Total Enrolled'}
          value={totalStudents}
          subtext={isTeacher ? 'Authorized learners' : 'Active student roster'}
          icon={Users}
          accent="indigo"
          href="/school/students"
          loading={loading}
        />
        <MetricCard
          label="Active This Week"
          value={activeStudents}
          subtext="Engaged in voice learning"
          icon={Activity}
          accent="sky"
          href="/school/students"
          loading={loading}
        />
        <MetricCard
          label="Average Accuracy"
          value={avgAccuracy}
          subtext="Across recorded speaking turns"
          icon={Award}
          accent="emerald"
          href="/school/reports"
          loading={loading}
        />
        <MetricCard
          label="Learning Time"
          value={totalMinutes}
          subtext="Interactive classroom session time"
          icon={Clock3}
          accent="purple"
          href="/school/reports"
          loading={loading}
        />
      </div>

      {/* Two-Column Main Content */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 380px), 1fr))',
          gap: 24,
          marginBottom: 28,
        }}
      >
        {/* Left Column: Recent Students Stream */}
        <section
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 18,
            padding: 24,
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 18,
            }}
          >
            <div>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                {isTeacher ? 'My Assigned Students' : 'Classroom Students'}
              </h3>
              <small style={{ color: '#64748b', fontSize: 12 }}>
                Recent learners and verified speaking accuracy
              </small>
            </div>
            <Link
              href="/school/students"
              style={{
                color: '#4f46e5',
                fontWeight: 700,
                fontSize: 13,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              View all <ArrowRight size={14} />
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
            {loading && students.length === 0 ? (
              [0, 1, 2, 3].map((item) => (
                <div
                  key={item}
                  style={{
                    height: 58,
                    borderRadius: 12,
                    background: '#f8fafc',
                    border: '1px solid #f1f5f9',
                    animation: 'pulse 1.5s infinite',
                  }}
                />
              ))
            ) : students.length === 0 ? (
              <div
                style={{
                  padding: '36px 16px',
                  textAlign: 'center',
                  color: '#64748b',
                  fontSize: 13,
                }}
              >
                No students enrolled yet. Add students to begin tracking speaking growth.
              </div>
            ) : (
              students.slice(0, 5).map((student) => {
                const initials = student.fullName
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()
                const acc = student.progress?.attemptCount ? student.progress.accuracy : undefined
                return (
                  <Link
                    key={student.id}
                    href={`/school/students/${student.id}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      padding: '12px 14px',
                      borderRadius: 12,
                      background: '#f8fafc',
                      border: '1px solid #f1f5f9',
                      textDecoration: 'none',
                      color: 'inherit',
                      transition: 'background 150ms ease, border-color 150ms ease',
                    }}
                  >
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 10,
                        background: student.avatarType === 'GIRL' ? '#fdf2f8' : '#eff6ff',
                        color: student.avatarType === 'GIRL' ? '#be185d' : '#1d4ed8',
                        border: '1px solid #cbd5e1',
                        display: 'grid',
                        placeItems: 'center',
                        fontWeight: 800,
                        fontSize: 13,
                        flexShrink: 0,
                      }}
                    >
                      {initials}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <strong
                        style={{
                          display: 'block',
                          fontSize: 14,
                          fontWeight: 750,
                          color: '#0f172a',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {student.fullName}
                      </strong>
                      <span style={{ color: '#64748b', fontSize: 12 }}>
                        {gradeLabel(student.grade)}
                        {student.className ? ` (${student.className})` : ''} · Roll {student.rollNumber}
                      </span>
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <strong
                        style={{
                          display: 'block',
                          fontSize: 14,
                          fontWeight: 800,
                          color: acc !== undefined && acc >= 70 ? '#16a34a' : acc !== undefined ? '#ea580c' : '#94a3b8',
                        }}
                      >
                        {acc === undefined ? '—' : `${acc}%`}
                      </strong>
                      <span style={{ fontSize: 11, color: '#64748b' }}>
                        {acc === undefined ? 'Awaiting turns' : 'Accuracy'}
                      </span>
                    </div>
                  </Link>
                )
              })
            )}
          </div>
        </section>

        {/* Right Column: Grade Performance Breakdown */}
        <section
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 18,
            padding: 24,
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 18,
            }}
          >
            <div>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Grade Performance Breakdown
              </h3>
              <small style={{ color: '#64748b', fontSize: 12 }}>
                Recorded student performance across Kindergarten and Classes 1–10
              </small>
            </div>
            <StatusBadge status="Verified" variant="published" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
            {(analytics?.gradeBreakdown ?? []).map((item) => (
              <div key={item.grade}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 13,
                    fontWeight: 700,
                    marginBottom: 6,
                  }}
                >
                  <span style={{ color: '#0f172a' }}>{gradeLabel(item.grade)}</span>
                  <span style={{ color: '#64748b', fontSize: 12 }}>
                    {item.attemptedStudentCount ? `${Math.round(item.avgAccuracy)}% avg score` : 'No attempts yet'} ·{' '}
                    {item.studentCount} {item.studentCount === 1 ? 'student' : 'students'}
                  </span>
                </div>
                <div style={{ height: 8, background: '#f1f5f9', borderRadius: 999, overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${item.attemptedStudentCount ? Math.min(100, Math.max(0, item.avgAccuracy)) : 0}%`,
                      background: item.avgAccuracy >= 75 ? '#10b981' : item.avgAccuracy >= 60 ? '#f59e0b' : '#6366f1',
                      borderRadius: 'inherit',
                      transition: 'width 300ms ease',
                    }}
                  />
                </div>
              </div>
            ))}

            {!loading && (analytics?.gradeBreakdown?.length ?? 0) === 0 ? (
              <div
                style={{
                  padding: '36px 16px',
                  textAlign: 'center',
                  color: '#64748b',
                  fontSize: 13,
                }}
              >
                No learning activity has been recorded yet. Add students and assign levels to view live metrics.
              </div>
            ) : null}
          </div>
        </section>
      </div>

      {/* Students Who May Need Support Section */}
      <section
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 18,
          padding: 24,
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 16,
            marginBottom: 16,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={18} color="#d97706" />
              <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Students Who May Need Support
              </h3>
            </div>
            <small style={{ color: '#64748b', fontSize: 12, marginTop: 4, display: 'block' }}>
              Identified from at least 2 recorded activity attempts with average accuracy below 70%.
            </small>
          </div>
          <Link
            href="/school/reports"
            style={{
              color: '#4f46e5',
              fontWeight: 700,
              fontSize: 13,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            Open full reports <ArrowRight size={14} />
          </Link>
        </div>

        {(analytics?.studentsNeedingAttention?.length ?? 0) > 0 ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))',
              gap: 14,
            }}
          >
            {analytics!.studentsNeedingAttention!.map((item) => (
              <Link
                key={item.studentId}
                href={`/school/students/${item.studentId}`}
                style={{
                  textDecoration: 'none',
                  color: 'inherit',
                  background: '#fffbeb',
                  border: '1px solid #fde68a',
                  borderRadius: 14,
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  transition: 'border-color 150ms ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <strong style={{ fontSize: 14, fontWeight: 750, color: '#0f172a' }}>{item.fullName}</strong>
                  <StatusBadge status="Needs Review" variant="needs-support" size="sm" />
                </div>
                <span style={{ color: '#64748b', fontSize: 12 }}>
                  {gradeLabel(item.grade)}
                  {item.className ? ` · Class ${item.className}` : ''}
                </span>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    fontSize: 12,
                    fontWeight: 700,
                    marginTop: 4,
                  }}
                >
                  <span style={{ color: '#c2410c' }}>{item.accuracy}% accuracy</span>
                  <span style={{ color: '#475569' }}>{item.attempts} attempts</span>
                  <span style={{ color: '#6b21a8' }}>{item.xp} XP</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>
            {loading ? 'Checking recorded student attempts…' : 'Great news! No students currently meet the support-alert criteria.'}
          </p>
        )}
      </section>
    </SchoolShell>
  )
}
