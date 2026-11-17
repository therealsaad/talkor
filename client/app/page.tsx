
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
  GraduationCap,
  LockKeyhole,
  Eye,
  EyeOff,
  LogIn,
  School,
  Sparkles,
} from 'lucide-react'

import { useAuth } from '@/components/auth/auth-provider'
import './home-login.css'

export default function HomePage() {
  const router = useRouter()
  const { loginStudentByPin } = useAuth()

  // PIN State
  const [pin, setPin] = useState('')

  // Show / Hide PIN
  const [showPin, setShowPin] = useState(false)

  // Login Loading
  const [loading, setLoading] = useState(false)

  // Error Message
  const [error, setError] = useState('')

  // PIN Input Reference
  const pinInputRef = useRef<HTMLInputElement>(null)

  // Automatically focus PIN on page load / reload
  useEffect(() => {
    pinInputRef.current?.focus()
  }, [])

  // Handle Login
  async function handleLogin(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault()

    if (!/^\d{5}$/.test(pin) || loading) {
      return
    }

    setLoading(true)
    setError('')

    try {
      const signedIn = await loginStudentByPin(pin)

      // Clear PIN after successful login
      setPin('')

      // Redirect based on student grade
      router.replace(
        signedIn.student?.grade === 0
          ? '/student/kg/map'
          : '/student/continue'
      )
    } catch {
      setError(
        'Invalid PIN. Please ask your teacher for help.'
      )

      setPin('')

      // Focus PIN input again after failed login
      pinInputRef.current?.focus()
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="talkora-home">

      <div className="talkora-home__layout">

        {/* LOGIN CARD */}
        <section
          className="talkora-home__card"
          aria-labelledby="talkora-login-title"
        >

          {/* GRADUATION CAP */}
          <div className="talkora-home__cap">
            <GraduationCap
              size={43}
              strokeWidth={2.1}
            />
          </div>

          {/* HEADING */}
          <div className="talkora-home__heading">
            <h1 id="talkora-login-title">
              Welcome to <span>Talkora</span>
            </h1>

            <p>Student Login</p>
          </div>

          {/* LOGIN FORM */}
          <form
            className="talkora-home__form"
            onSubmit={handleLogin}
          >

            <label
              className="talkora-home__label"
              htmlFor="talkora-pin"
            >
              Enter your 5-digit student PIN
            </label>

            {/* PIN INPUT */}
            <div className="talkora-home__input-wrap">

              <LockKeyhole
                className="talkora-home__input-icon"
                size={23}
              />

              <input
                ref={pinInputRef}
                autoFocus
                id="talkora-pin"
                type={showPin ? 'text' : 'password'}
                inputMode="numeric"
                autoComplete="off"
                maxLength={5}
                placeholder="Student PIN"
                value={pin}
                disabled={loading}
                required
                pattern="[0-9]{5}"
                aria-describedby={
                  error ? 'talkora-login-error' : undefined
                }
                onChange={(e) => {
                  setPin(
                    e.target.value
                      .replace(/\D/g, '')
                      .slice(0, 5)
                  )

                  setError('')
                }}
              />

              {/* SHOW / HIDE PIN */}
              <button
                type="button"
                className="talkora-home__eye"
                onClick={() => {
                  setShowPin(!showPin)
                  pinInputRef.current?.focus()
                }}
                aria-label={
                  showPin ? 'Hide PIN' : 'Show PIN'
                }
                aria-pressed={showPin}
              >
                {showPin ? (
                  <EyeOff size={22} />
                ) : (
                  <Eye size={22} />
                )}
              </button>

            </div>

            {/* HELP TEXT */}
            <p className="talkora-home__help">
              <Sparkles size={16} />
              Your teacher will provide your PIN
            </p>

            {/* ERROR MESSAGE */}
            {error && (
              <p
                id="talkora-login-error"
                className="talkora-home__error"
                role="alert"
              >
                {error}
              </p>
            )}

            {/* LOGIN BUTTON */}
            <button
              className="talkora-home__submit"
              type="submit"
              disabled={loading || pin.length !== 5}
            >
              <LogIn size={27} />

              {loading ? 'Logging in...' : 'Login'}
            </button>

          </form>

          {/* TEACHER & SCHOOL LINKS */}
          <div className="talkora-home__links">

            <Link href="/login/teacher">
              <GraduationCap size={18} />
              Teacher Login
            </Link>

            <Link href="/login/school">
              <School size={18} />
              School Login
            </Link>

          </div>

          {/* DECORATIVE STARS */}
          <div
            className="talkora-home__decor"
            aria-hidden="true"
          >
            <span>✦</span>
            <span>✦</span>
            <span>✦</span>
          </div>

          {/* BOOKS & GLOBE */}
          <div
            className="talkora-home__books"
            aria-hidden="true"
          >
            <span>📚</span>
            <span>🌎</span>
          </div>

        </section>

      </div>

    </main>
  )
}
