'use client'

import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'

import { StudentPortalShell } from '@/components/student/shell/student-portal-shell'
import { TalkoraLoader } from '@/components/student/talkora-loader'
import { useAuth } from '@/components/auth/auth-provider'

export default function StudentLayout({
  children,
}: {
  children: ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()

  const { status, role, student } = useAuth()
  const isKGLessonRoute = pathname === '/student/kg' || pathname.startsWith('/student/kg/')
  const mustKeepKGStudentInGarden = status === 'authenticated' && role === 'STUDENT' && student?.grade === 0 && !isKGLessonRoute

  useEffect(() => {
    if (status === 'unauthenticated') {
      const next = encodeURIComponent(pathname || '/student/levels')
      router.replace(`/login/student?next=${next}`)
    } else if (status === 'authenticated' && role !== 'STUDENT') {
      router.replace(role === 'TEACHER' || role === 'SCHOOL_ADMIN' ? '/school/dashboard' : '/login/student')
    } else if (mustKeepKGStudentInGarden) {
      router.replace('/student/kg/map')
    }
  }, [mustKeepKGStudentInGarden, pathname, role, router, status])

  if (mustKeepKGStudentInGarden) return <TalkoraLoader message="Miss Julie is opening your letter garden..." />

  if (status === 'loading') {
    return (
      <TalkoraLoader message="Checking your Talkora adventure..." />
    )
  }

  if (status !== 'authenticated' || role !== 'STUDENT' || !student) return null

  return (
    <StudentPortalShell>
      {children}
    </StudentPortalShell>
  )
}
