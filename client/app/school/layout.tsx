'use client'

import { useEffect, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { usePathname } from 'next/navigation'

import { useAuth } from '@/components/auth/auth-provider'

export default function SchoolLayout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { status, role } = useAuth()
  const isEducator = role === 'SCHOOL_ADMIN' || role === 'TEACHER'
  const teacherOnAdminOnlyRoute = role === 'TEACHER' && pathname.startsWith('/school/teachers')

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login/school')
    if (status === 'authenticated' && role === 'STUDENT') router.replace('/student/home')
    if (status === 'authenticated' && teacherOnAdminOnlyRoute) router.replace('/school/dashboard')
  }, [role, router, status, teacherOnAdminOnlyRoute])

  if (status !== 'authenticated' || !isEducator || teacherOnAdminOnlyRoute) {
    return <div className="educator-loading"><i /><span>Opening Educator OS...</span></div>
  }

  return children
}
