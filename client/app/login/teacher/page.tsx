
'use client'

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  Eye,
  EyeOff,
  GraduationCap,
  LockKeyhole,
  Mail,
  School,
  ShieldCheck,
  Sparkles,
  UserRound,
} from 'lucide-react'

import { useAuth } from '@/components/auth/auth-provider'
import './teacher-login.css'

export default function TeacherLoginPage() {
  const router = useRouter()
  const { loginTeacher } = useAuth()

  const [schoolCode, setSchoolCode] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const schoolInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    schoolInputRef.current?.focus()
  }, [])

  async function handleSubmit(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault()

    if (loading) return

    setError('')
    setLoading(true)

    try {
      await loginTeacher(
        schoolCode.trim().toUpperCase(),
        email.trim(),
        password
      )

      router.replace('/school/dashboard')
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Invalid teacher credentials. Please check your details.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="teacher-portal">

      <div className="teacher-portal__layout">
        <section
          className="teacher-portal__card"
          aria-labelledby="teacher-login-heading"
        >

          <div className="teacher-portal__top-icon">
            <GraduationCap size={30} strokeWidth={2.2} />
          </div>

          <div className="teacher-portal__heading">
            <span className="teacher-portal__badge">
              <Sparkles size={14} />
              TEACHER PORTAL
            </span>

            <h1 id="teacher-login-heading">
              Welcome, Teacher!
            </h1>

            <p>
              Sign in to manage your classroom
              and track student progress.
            </p>
          </div>

          <form
            className="teacher-portal__form"
            onSubmit={handleSubmit}
          >

            {/* SCHOOL CODE */}
            <div className="teacher-portal__field">
              <label htmlFor="teacher-school-code">
                School Code
              </label>

              <div className="teacher-portal__input-wrap">
                <School size={20} />

                <input
                  ref={schoolInputRef}
                  id="teacher-school-code"
                  type="text"
                  autoFocus
                  autoComplete="organization"
                  placeholder="Enter School Code"
                  value={schoolCode}
                  disabled={loading}
                  required
                  onChange={(e) => {
                    setSchoolCode(
                      e.target.value.toUpperCase()
                    )
                    setError('')
                  }}
                />
              </div>
            </div>

            {/* TEACHER EMAIL */}
            <div className="teacher-portal__field">
              <label htmlFor="teacher-email">
                Teacher Email
              </label>

              <div className="teacher-portal__input-wrap">
                <Mail size={20} />

                <input
                  id="teacher-email"
                  type="email"
                  autoComplete="username"
                  placeholder="teacher@school.org"
                  value={email}
                  disabled={loading}
                  required
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setError('')
                  }}
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div className="teacher-portal__field">
              <label htmlFor="teacher-password">
                Password
              </label>

              <div className="teacher-portal__input-wrap">
                <LockKeyhole size={20} />

                <input
                  id="teacher-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter Password"
                  value={password}
                  disabled={loading}
                  required
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setError('')
                  }}
                />

                <button
                  type="button"
                  className="teacher-portal__eye"
                  aria-label={
                    showPassword
                      ? 'Hide password'
                      : 'Show password'
                  }
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword
                    ? <EyeOff size={20} />
                    : <Eye size={20} />}
                </button>
              </div>
            </div>

            {error && (
              <div
                className="teacher-portal__error"
                role="alert"
              >
                {error}
              </div>
            )}

            {/* LOGIN BUTTON */}
            <button
              type="submit"
              className="teacher-portal__submit"
              disabled={loading}
            >
              {loading ? (
                'Signing in...'
              ) : (
                <>
                  Login as Teacher
                  <ArrowRight size={21} />
                </>
              )}
            </button>
          </form>

          <div className="teacher-portal__divider">
            <span>OR CONTINUE AS</span>
          </div>

          <nav
            className="teacher-portal__links"
            aria-label="Other login options"
          >
            <Link href="/login/school">
              <School size={18} />
              School
            </Link>

            <Link href="/login/student">
              <UserRound size={18} />
              Student
            </Link>
          </nav>

          <p className="teacher-portal__security">
            <ShieldCheck size={16} />
            Secure Teacher Workspace
          </p>

        </section>
      </div>
    </main>
  )
}
