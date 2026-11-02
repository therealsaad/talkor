'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { curriculumService } from '@/services/curriculum-service'
import { kgAlphabetService } from '@/features/lessons/grades/kg/level-01/services/kg-alphabet-service'
import { kgLevel2StudentService } from '@/features/lessons/grades/kg/level-02/services/kg-level2-student-service'
import { kgContinuationStudentService } from '@/features/lessons/grades/kg/continuation/continuation-service'
import { useAuth } from '@/components/auth/auth-provider'
import { TalkoraLoader } from '@/components/student/talkora-loader'

/** Never trust the URL for a student's grade, lesson unlock, or level. */
export default function ResumeMyLesson() {
  const router = useRouter()
  const { student, status } = useAuth()
  const [error, setError] = useState('')
  useEffect(() => {
    if (status !== 'authenticated') return
    let cancelled = false
    // Always derive the next KG level from authenticated MongoDB progress.
    // A new tab/PIN login must not inherit yesterday's client-side selection.
    const nextLesson = student?.grade === 0
      ? kgAlphabetService.state().then(async (level1) => {
          if (!level1.completed || !level1.level2Available) return '/student/kg'
          const level2 = await kgLevel2StudentService.state()
          if (!level2.completed) return '/student/kg/level-2'
          const continuation = await kgContinuationStudentService.overview()
          return continuation.nextLevel ? '/student/kg/level-' + continuation.nextLevel : '/student/kg/map'
        })
      : curriculumService.getNextLesson().then((current) => current.lessonId
          ? `/student/lesson/${encodeURIComponent(current.lessonId)}` : '/student/home')
    nextLesson
      .then((next) => {
        if (cancelled) return
        router.replace(next)
      })
      .catch((cause) => {
        if (!cancelled) {
          setError(cause instanceof Error && cause.message
            ? cause.message
            : 'Your class lessons are not available yet. Please ask your teacher to publish the lessons for your grade.')
        }
      })
    return () => { cancelled = true }
  }, [router, status, student?.grade, student?.id])

  if (!error) return <TalkoraLoader message="Miss Julie is opening your next lesson..." />
  return <main style={{maxWidth: 560, margin: '12vh auto', padding: 32, textAlign:'center'}}><h1>Miss Julie is waiting!</h1><p>{error}</p><Link href="/student/home">Go to my classroom</Link></main>
}
