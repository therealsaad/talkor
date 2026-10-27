'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ActivityEngine } from '@/components/lessons/activity-engine'
import { TalkoraLoader } from '@/components/student/talkora-loader'
import { useAuth } from '@/components/auth/auth-provider'
import { curriculumService, type FastLessonPackage } from '@/services/curriculum-service'

/** A single grade-authoritative request replaces the old five-request waterfall.
 * The server checks student grade and unit unlock status; URL parameters never
 * select the student's class or reveal hidden activity answers.
 */
export default function StudentLessonPage() {
  const params = useParams()
  const router = useRouter()
  const { session, student } = useAuth()
  const lessonId = useMemo(() => {
    const id = params?.id
    return typeof id === 'string' ? id : Array.isArray(id) ? (id[0] || '') : ''
  }, [params])
  const [lesson, setLesson] = useState<FastLessonPackage | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let live = true
    if (!lessonId) { setError('This lesson link is missing.'); return }
    setLesson(null)
    setError('')
    curriculumService.getLessonPackage(lessonId)
      .then(data => { if (live) setLesson(data) })
      .catch(err => {
        if (live) setError(err instanceof Error ? err.message : 'Unable to load your lesson. Please ask your teacher for help.')
      })
    return () => { live = false }
  }, [lessonId])

  if (error) {
    return <main className="talkora-error" style={{ textAlign: 'center', padding: 32 }}>
      <h1>Miss Julie could not open the lesson</h1>
      <p>{error}</p>
      <button type="button" onClick={() => router.replace('/student/continue')}>Try my next lesson</button>
    </main>
  }
  if (!lesson || !session?.student) return <TalkoraLoader message="Miss Julie is getting your lesson ready..." />
  if (!lesson.activities.length) {
    return <main className="talkora-error"><h1>This lesson has no activities yet.</h1>
      <button type="button" onClick={() => router.replace('/student/home')}>Back to classroom</button>
    </main>
  }
  return <ActivityEngine
    key={`${lesson.level.id}:${lesson.lesson.id}`}
    activities={lesson.activities}
    levelTitle={lesson.level.place || lesson.level.title}
    syllabusName={lesson.level.title}
    levelNumber={lesson.level.unitNumber ?? lesson.level.number}
    avatarType={session.student.avatarType}
    studentName={student?.fullName?.trim() || 'Explorer'}
    completedActivityIds={lesson.completedActivityIds}
    experienceId={lesson.experienceId}
    backgroundSrc={lesson.experienceId === 'g01-l01'
      ? '/lessons/class-01/level-01/two-letter-word-meadow.webp'
      : undefined}
    completionMessage={lesson.experienceId === 'g01-l01'
      ? `You did it, ${student?.fullName?.trim() || 'Explorer'}! You practised am, an, at, in, is, it, on, and up, then began learning about your first day at school. Your progress is saved.`
      : undefined}
    homeworkMessage={lesson.experienceId === 'g01-l01'
      ? 'Homework: say “It is up” and “I walk to school” with someone at home.'
      : undefined}
    introVideoKey={lesson.experienceId === 'g01-l01' && lesson.completedActivityIds.length === 0
      ? 'class1-g01-l01'
      : lesson.grade === 0 && typeof lesson.lesson.settings?.lessonKey === 'string'
        ? lesson.lesson.settings.lessonKey
        : undefined}
  />
}
