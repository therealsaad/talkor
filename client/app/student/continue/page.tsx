'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { curriculumService } from '@/services/curriculum-service'
import { useAuth } from '@/components/auth/auth-provider'
import { TalkoraLoader } from '@/components/student/talkora-loader'

/** Never trust the URL for a student's grade, lesson unlock, or level. */
export default function ResumeMyLesson() {
  const router = useRouter()
  const { student, status } = useAuth()
  const [error, setError] = useState('')
  useEffect(() => {
    if (status !== 'authenticated') return
    if (student?.grade === 0) { router.replace('/student/kg'); return }
    let cancelled = false
    curriculumService.getNextLesson()
      .then((current) => {
        if (cancelled) return
        const next = current.lessonId
        router.replace(next ? `/student/lesson/${encodeURIComponent(next)}` : '/student/home')
      })
      .catch((cause) => {
        if (!cancelled) {
          setError(cause instanceof Error && cause.message
            ? cause.message
            : 'Your class lessons are not available yet. Please ask your teacher to publish the lessons for your grade.')
        }
      })
    return () => { cancelled = true }
  }, [router, status, student?.grade])

  if (!error) return <TalkoraLoader message="Miss Julie is opening your next lesson..." />
  return <main style={{maxWidth: 560, margin: '12vh auto', padding: 32, textAlign:'center'}}><h1>Miss Julie is waiting!</h1><p>{error}</p><Link href="/student/home">Go to my classroom</Link></main>
}
