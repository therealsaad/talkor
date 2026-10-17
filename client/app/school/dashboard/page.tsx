'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { SchoolShell } from '@/components/school/school-shell'
import { schoolService, SchoolOverview, StudentListItem, AnalyticsOverview } from '@/services/school-service'
import { useAuth } from '@/components/auth/auth-provider'
import { gradeLabel } from '@/lib/grade-label'

export default function SchoolDashboardPage() {
  const { role } = useAuth()
  const [overview, setOverview] = useState<SchoolOverview | null>(null)
  const [students, setStudents] = useState<StudentListItem[]>([])
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reload, setReload] = useState(0)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      setError('')
      try {
        const [ov, stList, an] = await Promise.allSettled([
          schoolService.getOverview(),
          schoolService.listStudents({ limit: 6 }),
          schoolService.getAnalytics(),
        ])

        if (ov.status === 'fulfilled') setOverview(ov.value)
        if (stList.status === 'fulfilled') setStudents(Array.isArray(stList.value.students) ? stList.value.students : [])
        if (an.status === 'fulfilled') setAnalytics(an.value)
        if ([ov, stList, an].some((result) => result.status === 'rejected')) setError('Some dashboard data could not load. Refresh to try again.')
      } catch (err) {
        console.error('Failed to load dashboard', err)
        setError('Dashboard data could not load. Refresh to try again.')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [reload])

  const totalStudents = overview?.studentCount ?? '—'
  const activeStudents = overview?.activeStudentCount ?? '—'
  const avgAccuracy = analytics?.avgAccuracy
  const totalMinutes = overview?.totalLearningMinutes

  return (
    <SchoolShell
      title={role === 'TEACHER' ? 'Teacher Dashboard' : 'School Dashboard'}
      subtitle="Live overview of student enrollment, accuracy, learning minutes, and classroom mastery."
    >
      {error ? <div role="alert" style={{ background: '#fff1f0', color: '#9f332d', padding: 14, borderRadius: 12, marginBottom: 18, display: 'flex', justifyContent: 'space-between', gap: 12 }}>{error}<button type="button" onClick={() => setReload((value) => value + 1)}>Refresh</button></div> : null}
      {/* Hero Welcome Card */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          color: '#ffffff',
          borderRadius: '20px',
          padding: '28px 32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '28px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          flexWrap: 'wrap',
          gap: '20px',
        }}
      >
        <div>
          <span style={{ color: '#ffd83d', fontWeight: 800, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Classroom Overview
          </span>
          <h2 style={{ fontSize: '28px', margin: '6px 0', color: '#ffffff' }}>
            Empowering students to speak English with confidence.
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '14px', maxWidth: '580px', margin: '4px 0 16px' }}>
            Review recorded speaking attempts, accuracy, and classroom progress.
          </p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Link
              href="/school/students"
              style={{
                background: '#ffd83d',
                color: '#0f172a',
                padding: '10px 18px',
                borderRadius: '10px',
                fontWeight: 900,
                fontSize: '13px',
                textDecoration: 'none',
              }}
            >
              + Manage Students
            </Link>
            <Link
              href="/school/reports"
              style={{
                background: 'rgba(255,255,255,0.12)',
                color: '#ffffff',
                padding: '10px 18px',
                borderRadius: '10px',
                fontWeight: 800,
                fontSize: '13px',
                textDecoration: 'none',
                border: '1px solid rgba(255,255,255,0.2)',
              }}
            >
              View Learning Reports
            </Link>
          </div>
        </div>

        <div aria-hidden="true" style={{ width: '118px', height: '118px', background: 'linear-gradient(145deg,#7657d7,#36a6c9)', borderRadius: '28px', border: '1px solid rgba(255,255,255,.3)', display: 'grid', placeItems: 'center', fontSize: '42px' }}>✦</div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <span style={{ color: '#64748b', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase' }}>Total Enrolled</span>
          <strong style={{ display: 'block', fontSize: '32px', color: '#0f172a', margin: '4px 0' }}>{totalStudents}</strong>
          <small style={{ color: '#16a34a', fontWeight: 800 }}>Classes 4 to 10</small>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <span style={{ color: '#64748b', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase' }}>Active This Week</span>
          <strong style={{ display: 'block', fontSize: '32px', color: '#0284c7', margin: '4px 0' }}>{activeStudents}</strong>
          <small style={{ color: '#64748b', fontWeight: 700 }}>Actively practicing speaking</small>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <span style={{ color: '#64748b', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase' }}>Average Accuracy</span>
          <strong style={{ display: 'block', fontSize: '32px', color: '#16a34a', margin: '4px 0' }}>{avgAccuracy === undefined || analytics?.totalAttempts === 0 ? '—' : `${avgAccuracy}%`}</strong>
          <small style={{ color: '#16a34a', fontWeight: 800 }}>Across all attempts</small>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <span style={{ color: '#64748b', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase' }}>Total Learning Time</span>
          <strong style={{ display: 'block', fontSize: '32px', color: '#8b5cf6', margin: '4px 0' }}>{totalMinutes === undefined ? '—' : `${totalMinutes} mins`}</strong>
          <small style={{ color: '#64748b', fontWeight: 700 }}>Interactive session time</small>
        </div>
      </div>

      {/* Two Column Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))', gap: '24px' }}>
        {/* Student Progress Stream */}
        <section style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '18px', padding: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div>
              <h3 style={{ fontSize: '18px', color: '#0f172a', margin: 0 }}>Classroom Students</h3>
              <small style={{ color: '#64748b' }}>Recent learners and individual accuracy</small>
            </div>
            <Link href="/school/students" style={{ color: '#0284c7', fontWeight: 800, fontSize: '13px' }}>
              View All Students →
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {students.slice(0, 5).map((student) => {
              const initials = student.fullName
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
              const acc = student.progress?.attemptCount ? student.progress.accuracy : undefined
              return (
                <Link
                  key={student.id}
                  href={`/school/students/${student.id}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '12px',
                    borderRadius: '12px',
                    background: '#f8fafc',
                    border: '1px solid #f1f5f9',
                    textDecoration: 'none',
                    color: 'inherit',
                  }}
                >
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      background: '#ffd83d',
                      border: '1px solid #cbd5e1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 900,
                      fontSize: '13px',
                      color: '#0f172a',
                    }}
                  >
                    {initials}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong style={{ display: 'block', fontSize: '14px', color: '#0f172a' }}>{student.fullName}</strong>
                    <span style={{ color: '#64748b', fontSize: '12px' }}>
                      {gradeLabel(student.grade)}
                      {student.className ? ` (${student.className})` : ''} · Roll No. {student.rollNumber}
                    </span>
                    <small style={{ display: 'block', color: '#64748b' }}>{student.progress?.completedActivities ?? 0} activities · {student.progress?.completedLessons ?? 0} lessons completed</small>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <strong style={{ display: 'block', fontSize: '14px', color: acc !== undefined && acc >= 75 ? '#16a34a' : '#ea580c' }}>
                      {acc === undefined ? '—' : `${acc}%`}
                    </strong>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>Accuracy</span>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>

        {/* Grade Breakdown & Diagnostics */}
        <section style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '18px', padding: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div>
              <h3 style={{ fontSize: '18px', color: '#0f172a', margin: 0 }}>Grade Performance Breakdown</h3>
              <small style={{ color: '#64748b' }}>Curriculum progress across Kindergarten (KG) and Classes 1–10</small>
            </div>
            <span style={{ fontSize: '12px', background: '#f1f5f9', padding: '4px 10px', borderRadius: '8px', fontWeight: 800 }}>
              Recorded progress
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {(analytics?.gradeBreakdown ?? []).map((item) => (
              <div key={item.grade}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                  <span style={{ color: '#0f172a' }}>{gradeLabel(item.grade)}</span>
                  <span style={{ color: '#64748b' }}>{item.attemptedStudentCount ? `${Math.round(item.avgAccuracy)}% avg` : 'No attempts'} · {item.studentCount} students</span>
                </div>
                <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min(100, Math.max(0, item.avgAccuracy))}%`, background: item.grade === 4 ? '#ffd83d' : '#0284c7', borderRadius: 'inherit' }} />
                </div>
              </div>
            ))}
            {!loading && (analytics?.gradeBreakdown?.length ?? 0) === 0 && (
              <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>No learning activity has been recorded yet. Add students and start their first adventure to see live insights.</p>
            )}
          </div>
        </section>
      </div>

      <section style={{ marginTop: 24, background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 18, padding: 24, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 14, flexWrap: 'wrap' }}>
          <div>
            <h3 style={{ fontSize: 18, color: '#0f172a', margin: 0 }}>Students Who May Need Support</h3>
            <small style={{ color: '#64748b' }}>Shown only when a learner has at least two recorded attempts and average accuracy below 70%.</small>
          </div>
          <Link href="/school/reports" style={{ color: '#0284c7', fontWeight: 800, fontSize: 13 }}>Open full reports →</Link>
        </div>
        {(analytics?.studentsNeedingAttention?.length ?? 0) > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: 12 }}>
            {analytics!.studentsNeedingAttention!.map((item) => (
              <Link key={item.studentId} href={`/school/students/${item.studentId}`} style={{ textDecoration: 'none', color: 'inherit', background: '#fff8ed', border: '1px solid #fed7aa', borderRadius: 14, padding: 14 }}>
                <strong style={{ display: 'block', color: '#0f172a' }}>{item.fullName}</strong>
                <span style={{ display: 'block', color: '#64748b', fontSize: 12, marginTop: 4 }}>{gradeLabel(item.grade)}{item.className ? ` · ${item.className}` : ''}</span>
                <div style={{ display: 'flex', gap: 12, marginTop: 10, fontSize: 12 }}>
                  <b style={{ color: '#c2410c' }}>{item.accuracy}% accuracy</b>
                  <span>{item.attempts} attempts</span>
                  <span>{item.xp} XP</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>
            {loading ? 'Checking recorded attempts…' : 'No students currently meet the support-alert rule.'}
          </p>
        )}
      </section>
    </SchoolShell>
  )
}
