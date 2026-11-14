'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { curriculumService } from '@/services/curriculum-service'
import { useAuth } from '@/components/auth/auth-provider'
import { TalkoraLoader } from '@/components/student/talkora-loader'
import { nextKGStudentRoute } from '@/services/kg-resume-service'

/** Never trust the URL for a student's grade, lesson unlock, or level. */
export default function ResumeMyLesson() {
  const router = useRouter()
  const { student, status } = useAuth()
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    if (status !== 'authenticated') return
    let cancelled = false

    if (student?.grade === 0) {
      nextKGStudentRoute()
        .then((destination) => { if (!cancelled) router.replace(destination) })
        .catch((cause) => {
          if (!cancelled) setError(cause instanceof Error && cause.message
            ? cause.message
            : 'Your Kindergarten progress is not available. Please try again.')
        })
      return () => { cancelled = true }
    }

    curriculumService.getNextLesson()
      .then((current) => {
        if (current.blocked) throw new Error(current.blockedMessage ||
          'Miss Julie is preparing your next published lesson. Your progress is saved.')
        if (cancelled) return
        router.replace(current.lessonId
          ? `/student/lesson/${encodeURIComponent(current.lessonId)}`
          : '/student/home')
      })
      .catch((cause) => {
        if (!cancelled) setError(cause instanceof Error && cause.message
          ? cause.message
          : 'Your class lessons are not available yet. Please ask your teacher to publish the lessons for your grade.')
      })

    return () => { cancelled = true }
  }, [router, status, student?.grade, student?.id, retry])

  if (!error) return <TalkoraLoader message="Miss Julie is opening your next lesson..." />
  return <main role="alert" style={{ maxWidth: 560, margin: '12vh auto', padding: 32, textAlign: 'center' }}>
    <h1>Miss Julie is waiting!</h1>
    <p>{error}</p>
    <button type="button" onClick={() => { setError(''); setRetry((attempt) => attempt + 1) }}>Try again</button>{' '}
    <Link href="/student/home">Go to my classroom</Link>
  </main>
}
