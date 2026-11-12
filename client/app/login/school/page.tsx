
'use client'

import {
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
 LockKeyhole,
  School,
  ShieldCheck,
  GraduationCap,
  UserRound,
} from 'lucide-react'

import { useAuth } from '@/components/auth/auth-provider'
import './school-login.css'

export default function SchoolLoginPage() {
  const router = useRouter()
  const { loginSchool } = useAuth()

  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const codeInputRef = useRef<HTMLInputElement>(null)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (loading) return

    setError('')
    setLoading(true)

    try {
      await loginSchool(code.trim().toUpperCase(), password)

      router.replace('/school/dashboard')
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Invalid school credentials. Please check your school code and password.'

      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="school-portal">

      <div className="school-portal__layout">

        <section
          className="school-portal__card"
          aria-labelledby="school-login-title"
        >
          {/* TOP ICON */}
          <div className="school-portal__icon">
            <School size={29} strokeWidth={2.2} />
          </div>

          {/* HEADER */}
          <div className="school-portal__heading">
            <span className="school-portal__badge">
              SCHOOL ADMIN PORTAL
            </span>

            <h1 id="school-login-title">
              Welcome Back!
            </h1>

            <p>
              Login to your School Dashboard
            </p>
          </div>

          {/* LOGIN FORM */}
          <form
            className="school-portal__form"
            onSubmit={handleSubmit}
          >

            {/* SCHOOL CODE */}
            <div className="school-portal__field">
              <label htmlFor="school-code">
                School Code
              </label>

              <div className="school-portal__input-wrap">
                <School size={21} />

                <input
                  ref={codeInputRef}
                  id="school-code"
                  type="text"
                  autoFocus
                  autoComplete="username"
                  placeholder="Enter School Code"
                  value={code}
                  required
                  disabled={loading}
                  onChange={(e) => {
                    setCode(e.target.value)
                    setError('')
                  }}
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div className="school-portal__field">
              <label htmlFor="school-password">
                Password
              </label>

              <div className="school-portal__input-wrap">
                <LockKeyhole size={21} />

                <input
                  id="school-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter Password"
                  value={password}
                  required
                  disabled={loading}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setError('')
                  }}
                />

                <button
                  type="button"
                  className="school-portal__eye"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={
                    showPassword
                      ? 'Hide password'
                      : 'Show password'
                  }
                  aria-pressed={showPassword}
                >
                  {showPassword
                    ? <EyeOff size={21} />
                    : <Eye size={21} />}
                </button>
              </div>
            </div>

            {/* ERROR */}
            {error && (
              <div
                className="school-portal__error"
                role="alert"
              >
                {error}
              </div>
            )}

            {/* LOGIN BUTTON */}
            <button
              type="submit"
              className="school-portal__submit"
              disabled={loading}
            >
              {loading ? (
                <span>Logging in...</span>
              ) : (
                <>
                  <span>Login as School</span>
                  <ArrowRight size={22} />
                </>
              )}
            </button>

          </form>

          {/* OTHER LOGIN LINKS */}
          <div className="school-portal__divider">
            <span>OR CONTINUE AS</span>
          </div>

          <div className="school-portal__links">
            <Link href="/login/teacher">
              <GraduationCap size={19} />
              <span>Teacher</span>
            </Link>

            <Link href="/login/student">
              <UserRound size={19} />
              <span>Student</span>
            </Link>
          </div>

          {/* SECURITY MESSAGE */}
          <p className="school-portal__security">
            <ShieldCheck size={16} />
            Secure School Administration Login
          </p>

        </section>

      </div>

    </main>
  )
}
