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
  // The KG garden is a voluntary review/dashboard destination. It must not
  // intercept the PIN -> /student/continue -> /student/kg lesson flow.
  const isKGGardenHub = pathname === '/student/home' || pathname === '/student/levels'
  const showKGGardenHub = status === 'authenticated' && role === 'STUDENT' && student?.grade === 0 && isKGGardenHub

  useEffect(() => {
    if (status === 'unauthenticated') {
      const next = encodeURIComponent(pathname || '/student/levels')
      router.replace(`/login/student?next=${next}`)
    } else if (status === 'authenticated' && role !== 'STUDENT') {
      router.replace(role === 'TEACHER' || role === 'SCHOOL_ADMIN' ? '/school/dashboard' : '/login/student')
    } else if (showKGGardenHub) {
      router.replace('/student/kg/map')
    }
  }, [showKGGardenHub, pathname, role, router, status])

  if (showKGGardenHub) return <TalkoraLoader message="Miss Julie is opening your letter garden..." />

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
