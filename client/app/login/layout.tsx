'use client'

import { useEffect, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'

import { homeForRole, useAuth } from '@/components/auth/auth-provider'
import { nextKGStudentRoute } from '@/services/kg-resume-service'

export default function LoginLayout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const { status, role, student } = useAuth()

  useEffect(() => {
    if (status !== 'authenticated' || !role) return
    if (role === 'STUDENT' && student?.grade === 0) {
      let active = true
      nextKGStudentRoute()
        .then((destination) => { if (active) router.replace(destination) })
        .catch(() => { if (active) router.replace('/student/continue') })
      return () => { active = false }
    }
    router.replace(homeForRole(role))
  }, [role, router, status, student?.grade, student?.id])

  return children
}
