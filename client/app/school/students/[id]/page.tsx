'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  ArrowLeft,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock3,
  Flame,
  Mic,
  Printer,
  Sparkles,
  Target,
  Volume2,
  AlertCircle,
} from 'lucide-react'
import { SchoolShell } from '@/components/school/school-shell'
import { learnerAvatar } from '@/config/talkora-assets'
import { schoolService, type StudentDetail } from '@/services/school-service'
import { gradeLabel } from '@/lib/grade-label'
import { Breadcrumbs } from '@/components/portal/breadcrumbs'
import { StatusBadge } from '@/components/portal/status-badge'
import { MetricCard } from '@/components/portal/metric-card'

const cardStyle: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 18,
  padding: 24,
  boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
}

function readableAnswer(answer: string): string {
  if (!answer.startsWith('{')) return answer || 'No text captured'
  try {
    const reflection = JSON.parse(answer) as { kind?: string; ratings?: Array<{ skill?: string; rating?: string }> }
    if (reflection.kind === 'Favourite Finder reflection' && Array.isArray(reflection.ratings)) {
      return `Favourite Finder reflection: ${reflection.ratings.map(({ skill, rating }) => `${skill}: ${rating?.replace('_', ' ')}`).join('; ')}`
    }
  } catch {
    /* Preserve plain answer */
  }
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
    let active = true
    setLoading(true)
    schoolService
      .getStudent(id)
      .then((data) => {
        if (active) setStudent(data)
      })
      .catch(() => {
        if (active) setStudent(null)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [id])

  useEffect(() => {
    let alive = true
    let audioUrl = ''
    if (!student?.homePractice?.hasAudio) {
      setPracticeAudioUrl('')
      setPracticeAudioError('')
      return
    }
    const unit = student.homePractice.unitKey === 'CLASS1_L01_FIRST_DAY' ? 'class1-first-day' : 'favourites'
    setPracticeAudioLoading(true)
    schoolService
      .getHomePracticeAudio(id, unit)
      .then((audio) => {
        audioUrl = URL.createObjectURL(audio)
        if (alive) setPracticeAudioUrl(audioUrl)
        else URL.revokeObjectURL(audioUrl)
      })
      .catch(() => {
        if (alive) setPracticeAudioError('The home-practice recording could not be loaded.')
      })
      .finally(() => {
        if (alive) setPracticeAudioLoading(false)
      })
    return () => {
      alive = false
      if (audioUrl) URL.revokeObjectURL(audioUrl)
    }
  }, [id, student?.homePractice?.hasAudio, student?.homePractice?.unitKey])

  if (loading) {
    return (
      <SchoolShell title="Student Profile" subtitle="Loading verified learning records…">
        <div style={{ ...cardStyle, textAlign: 'center', padding: '48px 24px', color: '#64748b' }}>
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
          <p style={{ margin: 0, fontWeight: 700 }}>Retrieving student learning data…</p>
        </div>
      </SchoolShell>
    )
  }

  if (!student) {
    return (
      <SchoolShell title="Student Not Found" subtitle="This student record is unavailable.">
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#dc2626', marginBottom: 12 }}>
            <AlertCircle size={20} />
            <strong style={{ fontSize: 16 }}>Student record could not be found</strong>
          </div>
          <p style={{ color: '#64748b', fontSize: 13, margin: '0 0 18px' }}>
            This student may have been removed or belongs to another classroom.
          </p>
          <Link
            href="/school/students"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: '#0f172a',
              color: '#ffffff',
              padding: '8px 16px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            <ArrowLeft size={14} /> Back to student directory
          </Link>
        </div>
      </SchoolShell>
    )
  }

  const progress = student.progress ?? {
    accuracy: 0,
    completedLevels: 0,
    totalLevels: 10,
    completedLessons: 0,
    completedActivities: 0,
    totalXp: 0,
    learningTimeMinutes: 0,
    streak: 0,
  }
  const attempts = student.recentAttempts ?? []

  return (
    <SchoolShell
      title={student.fullName}
      subtitle={`${gradeLabel(student.grade)}${student.className ? ` · Class ${student.className}` : ''} · Roll No. ${student.rollNumber}`}
    >
      <Breadcrumbs
        items={[
          { label: 'Students', href: '/school/students' },
          { label: student.fullName },
        ]}
      />

      {/* Action Bar */}
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
          href="/school/students"
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
          <ArrowLeft size={15} /> Back to student directory
        </Link>

        <div style={{ display: 'flex', gap: 10 }}>
          <Link
            href={`/school/students/${encodeURIComponent(id)}/report`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              color: '#0f172a',
              padding: '8px 14px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            <Printer size={15} color="#64748b" />
            Printable parent / teacher report
          </Link>
          <Link
            href={`/school/classes`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: '#4f46e5',
              color: '#ffffff',
              padding: '8px 14px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            <BookOpen size={15} />
            Grade curriculum
          </Link>
        </div>
      </div>

      {/* Student Profile Header Card */}
      <section
        style={{
          ...cardStyle,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 20,
          marginBottom: 24,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, minWidth: 260 }}>
          <div
            style={{
              position: 'relative',
              width: 72,
              height: 72,
              borderRadius: 18,
              overflow: 'hidden',
              background: student.avatarType === 'GIRL' ? '#fdf2f8' : '#eff6ff',
              border: '2px solid #e2e8f0',
              flexShrink: 0,
            }}
          >
            <Image src={learnerAvatar(student.avatarType)} alt="" fill sizes="72px" style={{ objectFit: 'cover' }} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#0f172a' }}>{student.fullName}</h2>
              <StatusBadge status={student.status === 'active' ? 'Active' : 'Inactive'} size="md" />
            </div>
            <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: 13 }}>
              {gradeLabel(student.grade)} {student.className ? `· Section ${student.className}` : ''} · Roll No. {student.rollNumber}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <StatusBadge
            status={attempts.length ? (progress.accuracy >= 70 ? 'On Track' : 'Needs Attention') : 'Awaiting Activity'}
            variant={attempts.length ? (progress.accuracy >= 70 ? 'on-track' : 'needs-support') : 'draft'}
            size="md"
          />
        </div>
      </section>

      {/* KPI Overview Metrics */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <MetricCard
          label="Recent Accuracy"
          value={attempts.length ? `${progress.accuracy}%` : '—'}
          subtext="Speaking correctness"
          icon={Target}
          accent={progress.accuracy >= 70 ? 'emerald' : 'amber'}
        />
        <MetricCard
          label="Levels Completed"
          value={
            progress.totalLevels
              ? `${progress.completedLevels} / ${progress.totalLevels}`
              : String(progress.completedLevels)
          }
          subtext={`${progress.completedLessons ?? 0} lessons passed · verified Progress records`}
          icon={Award}
          accent="sky"
        />
        <MetricCard
          label="Learning Time"
          value={`${progress.learningTimeMinutes} min`}
          subtext="Interactive speaking"
          icon={Clock3}
          accent="purple"
        />
        <MetricCard
          label="Total XP"
          value={`${progress.totalXp} XP`}
          subtext="Recorded achievement score"
          icon={Sparkles}
          accent="indigo"
        />
        <MetricCard
          label="Current Streak"
          value={`${progress.streak} days`}
          subtext="Consecutive learning days"
          icon={Flame}
          accent="amber"
        />
        <MetricCard
          label="Recent Attempts"
          value={String(attempts.length)}
          subtext="Logged activities"
          icon={CheckCircle2}
          accent="slate"
        />
      </div>

      {/* Learning Progress Section */}
      <section style={{ ...cardStyle, marginBottom: 24 }}>
        <h3 style={{ margin: '0 0 10px', fontSize: 17, fontWeight: 800, color: '#0f172a' }}>
          Learning Progress & Activity Summary
        </h3>
        <p style={{ margin: '0 0 16px', color: '#64748b', fontSize: 13 }}>
          {progress.completedActivities ?? 0} individual activities completed · {progress.completedLessons ?? 0} lessons completed
        </p>

        <div style={{ height: 10, background: '#f1f5f9', borderRadius: 999, overflow: 'hidden', maxWidth: 480 }}>
          <div
            style={{
              height: '100%',
              width: progress.totalLevels
                ? `${Math.min(100, Math.max(0, (progress.completedLevels / progress.totalLevels) * 100))}%`
                : progress.completedLevels > 0
                  ? '100%'
                  : '0%',
              background: '#4f46e5',
              borderRadius: 'inherit',
            }}
          />
        </div>
        {!progress.totalLevels ? (
          <p style={{ margin: '8px 0 0', fontSize: 11, color: '#94a3b8' }}>
            Curriculum length unavailable — showing verified completed levels only (not a fabricated percentage).
          </p>
        ) : null}
      </section>

      {/* Home Practice / Audio Reflection Section */}
      <section style={{ ...cardStyle, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Mic size={18} color="#4f46e5" />
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0f172a' }}>
            {student.homePractice?.unitKey === 'CLASS1_L01_FIRST_DAY'
              ? 'Class 1 First Day Speaking Practice'
              : 'Level 1 Home Practice Reflection'}
          </h3>
        </div>

        {student.homePractice ? (
          <div>
            <blockquote
              style={{
                margin: '0 0 12px',
                padding: '12px 16px',
                background: '#f8fafc',
                borderLeft: '4px solid #4f46e5',
                borderRadius: '0 10px 10px 0',
                fontSize: 13,
                color: '#334155',
                lineHeight: 1.5,
              }}
            >
              &ldquo;{student.homePractice.reflection}&rdquo;
            </blockquote>
            <small style={{ color: '#64748b', fontSize: 12 }}>
              Submitted on {new Date(student.homePractice.submittedAt).toLocaleString()}
            </small>

            {student.homePractice.hasAudio ? (
              <div
                style={{
                  marginTop: 16,
                  padding: 16,
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 14,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <Volume2 size={16} color="#0284c7" />
                  <strong style={{ fontSize: 13, color: '#0f172a' }}>
                    {student.homePractice.unitKey === 'CLASS1_L01_FIRST_DAY'
                      ? 'Student Speaking Recording'
                      : 'Family Conversation Recording'}
                  </strong>
                </div>

                {practiceAudioLoading ? (
                  <p role="status" style={{ color: '#64748b', fontSize: 12, margin: 0 }}>
                    Loading verified recording from secure storage…
                  </p>
                ) : null}

                {practiceAudioUrl ? (
                  <audio
                    controls
                    src={practiceAudioUrl}
                    style={{ width: '100%', height: 40 }}
                    aria-label={`${student.fullName}'s ${student.homePractice.unitKey === 'CLASS1_L01_FIRST_DAY' ? 'speaking homework' : 'family conversation'} recording`}
                  />
                ) : null}

                {practiceAudioError ? (
                  <p role="alert" style={{ color: '#b91c1c', fontSize: 12, margin: '6px 0 0' }}>
                    {practiceAudioError}
                  </p>
                ) : null}
              </div>
            ) : (
              <p style={{ margin: '12px 0 0', color: '#64748b', fontSize: 12 }}>
                No voice recording was attached to this reflection.
              </p>
            )}
          </div>
        ) : (
          <p style={{ margin: 0, color: '#64748b', fontSize: 13 }}>
            {student.grade === 1
              ? 'No First Day speaking practice has been submitted yet.'
              : 'No family conversation reflection submitted yet.'}
          </p>
        )}
      </section>

      {/* Recent Learning Attempts Table */}
      <section style={cardStyle}>
        <div style={{ marginBottom: 16 }}>
          <h3 style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 800, color: '#0f172a' }}>
            Recent Learning Attempts
          </h3>
          <p style={{ margin: 0, color: '#64748b', fontSize: 13 }}>
            Verified attempts recorded by the Talkora backend evaluation engine.
          </p>
        </div>

        {!attempts.length ? (
          <div
            style={{
              padding: '36px 16px',
              textAlign: 'center',
              color: '#64748b',
              fontSize: 13,
              background: '#f8fafc',
              borderRadius: 12,
            }}
          >
            No activity attempts have been recorded for this student yet.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
              <thead>
                <tr style={{ textAlign: 'left', color: '#64748b', borderBottom: '2px solid #e2e8f0', fontSize: 12 }}>
                  <th style={{ padding: '12px 14px' }}>Learner Response</th>
                  <th style={{ padding: '12px 14px' }}>Evaluation</th>
                  <th style={{ padding: '12px 14px' }}>Score</th>
                  <th style={{ padding: '12px 14px' }}>Duration</th>
                  <th style={{ padding: '12px 14px' }}>Date & Time</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((attempt, index) => (
                  <tr
                    key={`${attempt.activityId}-${attempt.createdAt}-${index}`}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      fontSize: 13,
                    }}
                  >
                    <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0f172a' }}>
                      {readableAnswer(attempt.answer)}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          color: attempt.correct ? '#166534' : '#b91c1c',
                          fontWeight: 800,
                          fontSize: 12,
                        }}
                      >
                        {attempt.correct ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                        {attempt.correct ? 'Correct' : 'Retry'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: 700 }}>
                      {attempt.speakingAccuracy ?? attempt.score ?? '—'}
                      {typeof (attempt.speakingAccuracy ?? attempt.score) === 'number' ? '%' : ''}
                    </td>
                    <td style={{ padding: '12px 14px', color: '#64748b' }}>{attempt.timeTakenSeconds}s</td>
                    <td style={{ padding: '12px 14px', color: '#64748b', fontSize: 12 }}>
                      {new Date(attempt.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </SchoolShell>
  )
}
