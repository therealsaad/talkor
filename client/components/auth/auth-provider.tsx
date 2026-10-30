'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

import { AUTH_INVALIDATED_EVENT, getStoredToken, getStoredUser } from '@/lib/api-client'
import { KG_SESSION_END_EVENT } from '@/lib/kg-microphone'
import {
  authService,
  type AuthSession,
} from '@/services/auth-service'
import { voiceService } from '@/services/voice-service'

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

interface AuthContextValue {
  status: AuthStatus
  session: AuthSession | null
  user: AuthSession['user'] | undefined
  student: AuthSession['student'] | undefined
  role: AuthSession['role'] | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  restore: () => Promise<AuthSession | null>
  loginSchool: (schoolCode: string, password: string) => Promise<AuthSession>
  loginTeacher: (schoolCode: string, email: string, password: string) => Promise<AuthSession>
  loginStudent: (schoolCode: string, studentId: string, studentCode: string) => Promise<AuthSession>
  loginStudentByPin: (pin: string) => Promise<AuthSession>
  updateStudentAvatar: (avatar: string, avatarType: 'BOY' | 'GIRL') => Promise<AuthSession | null>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function homeForRole(role: AuthSession['role']): string {
  return role === 'STUDENT' ? '/student/continue' : '/school/dashboard'
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // The server cannot read local/sessionStorage. Both SSR and the first
  // browser render must start from the same snapshot to hydrate safely.
  // Rehydrate the cached login AFTER hydration, then verify it via /auth/me.
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [session, setSession] = useState<AuthSession | null>(null)
  const sessionRef = useRef<AuthSession | null>(session)

  const acceptSession = useCallback((next: AuthSession) => {
    sessionRef.current = next
    setSession(next)
    setStatus('authenticated')
    return next
  }, [])

  const clearSession = useCallback(() => {
    sessionRef.current = null
    setSession(null)
    setStatus('unauthenticated')
  }, [])

  const restore = useCallback(async () => {
    const hadSession = Boolean(sessionRef.current)
    if (!hadSession) setStatus('loading')
    try {
      const next = await authService.getMe()
      if (!next) {
        clearSession()
        return null
      }
      return acceptSession(next)
    } catch {
      // A transient backend failure is not proof that the stored JWT is invalid.
      // Keep an already verified session usable; public routes remain available
      // when bootstrap has no session to preserve.
      if (hadSession) {
        setStatus('authenticated')
      } else {
        setStatus('unauthenticated')
      }
      return null
    }
  }, [acceptSession, clearSession])

  useEffect(() => {
    // Preserve the existing cached-session behavior (including resilience
    // to temporary backend outages), but never read browser storage during
    // React's initial server/client render.
    const cached = getStoredToken() ? getStoredUser<AuthSession>() : null
    if (cached) {
      sessionRef.current = cached
      setSession(cached)
      setStatus('authenticated')
    }
    void restore()

    const invalidate = () => clearSession()
    const syncAcrossTabs = (event: StorageEvent) => {
      if (event.key === 'talkora_token' && !window.sessionStorage.getItem('talkora_token')) void restore()
    }

    window.addEventListener(AUTH_INVALIDATED_EVENT, invalidate)
    window.addEventListener('storage', syncAcrossTabs)
    return () => {
      window.removeEventListener(AUTH_INVALIDATED_EVENT, invalidate)
      window.removeEventListener('storage', syncAcrossTabs)
    }
  }, [clearSession, restore])

  useEffect(() => {
    if (session?.role !== 'STUDENT') return
    const MAX_IDLE_MS = 20 * 60 * 1000
    let lastActivity = Date.now()
    const activity = () => { lastActivity = Date.now() }
    const events = ['pointerdown', 'keydown', 'touchstart', 'talkora:student-activity'] as const
    events.forEach(event => window.addEventListener(event, activity, { passive: true }))
    const interval = window.setInterval(() => {
      if (Date.now() - lastActivity >= MAX_IDLE_MS) {
        window.dispatchEvent(new Event(KG_SESSION_END_EVENT))
        voiceService.stop()
        void authService.logout().finally(() => { clearSession(); window.location.replace('/login/student') })
      }
    }, 60_000)
    return () => { window.clearInterval(interval); events.forEach(event => window.removeEventListener(event, activity)) }
  }, [session?.role, clearSession])

  const value = useMemo<AuthContextValue>(() => ({
    status,
    session,
    user: session?.user,
    student: session?.student,
    role: session?.role ?? null,
    token: session?.token ?? null,
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'loading',
    restore,
    loginSchool: async (schoolCode, password) => acceptSession(await authService.loginSchool(schoolCode, password)),
    loginTeacher: async (schoolCode, email, password) => acceptSession(await authService.loginTeacher(schoolCode, email, password)),
    loginStudent: async (schoolCode, studentId, studentCode) => acceptSession(await authService.loginStudent(schoolCode, studentId, studentCode)),
    loginStudentByPin: async (pin) => acceptSession(await authService.loginStudentByPin(pin)),
    updateStudentAvatar: async (avatar, avatarType) => {
      await authService.updateStudentAvatar(avatar, avatarType)
      return restore()
    },
    logout: async () => {
      window.dispatchEvent(new Event(KG_SESSION_END_EVENT))
      voiceService.stop()
      await authService.logout()
      clearSession()
    },
  }), [acceptSession, clearSession, restore, session, status])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside AuthProvider')
  return value
}
