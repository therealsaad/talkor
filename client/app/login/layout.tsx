'use client'

import { useEffect, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'

import { homeForRole, useAuth } from '@/components/auth/auth-provider'

export default function LoginLayout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const { status, role } = useAuth()

  useEffect(() => {
    if (status === 'authenticated' && role) {
      router.replace(homeForRole(role))
    }
  }, [role, router, status])

  return children
}
