'use client'

import { useRef, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, BookOpenCheck, Delete, GraduationCap, LockKeyhole, School, Sparkles } from 'lucide-react'
import { useAuth } from '@/components/auth/auth-provider'
import { TalkoraLogo } from '@/components/brand/talkora-logo'
import './student-login.css'

/** School lab-friendly: no student roster, school code, or persistent student session. */
export default function StudentLoginPage() {
  const router = useRouter()
  const { loginStudentByPin } = useAuth()
  const [pin, setPin] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const complete = /^\d{5}$/.test(pin)

  function addNumber(value: string) {
    if (busy) return
    setError('')
    setPin(current => (current + value).slice(0, 5))
    inputRef.current?.focus()
  }

  function removeNumber() {
    if (busy) return
    setError('')
    setPin(current => current.slice(0, -1))
    inputRef.current?.focus()
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy || !complete) return
    setBusy(true)
    setError('')
    try {
      const signedIn = await loginStudentByPin(pin)
      setPin('')
      router.replace(signedIn.student?.grade === 0 ? '/student/kg/map' : '/student/continue')
    } catch {
      setError('That PIN did not work. Please ask your teacher for help.')
      setPin('')
      inputRef.current?.focus()
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="lab-login">
      <header className="lab-login__header">
        <Link href="/" aria-label="Talkora home" className="lab-login__brand"><TalkoraLogo priority /></Link>
        <nav className="lab-login__staff" aria-label="Staff sign-in">
          <Link href="/login/teacher"><GraduationCap size={17} /> Teacher Login</Link>
          <Link href="/login/school"><School size={17} /> School Login</Link>
        </nav>
      </header>

      <div className="lab-login__main">
        <section className="lab-login__story" aria-label="Welcome to Talkora">
          <div className="lab-login__picture" role="img" aria-label="Miss Julie teaching English to happy students in a colorful classroom" />
          <div className="lab-login__story-footer">
            <div className="lab-login__story-label"><Sparkles size={16} /> YOUR ENGLISH ADVENTURE</div>
            <h1>Big dreams start<br />with <span>little words.</span></h1>
            <p>Learn, speak, and shine with Miss Julie!</p>
          </div>
        </section>

        <section className="lab-login__panel" aria-labelledby="student-login-heading">
          <div className="lab-login__student-badge"><BookOpenCheck size={21} /> STUDENT LOGIN</div>
          <h2 id="student-login-heading">Hello, Superstar! <span aria-hidden="true">🌟</span></h2>
          <p className="lab-login__intro">Enter your <strong>5-digit PIN</strong> to meet Miss Julie.</p>

          <form onSubmit={submit} className="lab-login__form">
            <label className="lab-login__pin-label" htmlFor="lab-student-pin">Your secret PIN</label>
            <div className="lab-login__pin-digits" aria-hidden="true">
              {Array.from({ length: 5 }, (_, i) => <div key={i} className={`lab-login__digit ${pin.length > i ? 'lab-login__digit--filled' : ''}`}>{pin.length > i ? '●' : '·'}</div>)}
            </div>
            <input
              id="lab-student-pin"
              ref={inputRef}
              className="lab-login__real-input"
              autoFocus
              type="password"
              autoComplete="off"
              inputMode="numeric"
              maxLength={5}
              pattern="[0-9]{5}"
              aria-label="Enter your five digit student PIN"
              aria-describedby={error ? 'lab-pin-error' : 'lab-pin-help'}
              value={pin}
              onChange={event => { setPin(event.target.value.replace(/\D/g, '').slice(0, 5)); setError('') }}
              disabled={busy}
            />
            <p id="lab-pin-help" className="lab-login__hint">Type your PIN or tap the numbers</p>
            <div className="lab-login__keypad" aria-label="PIN number keypad">
              {['1','2','3','4','5','6','7','8','9','clear','0','delete'].map(value => (
                <button
                  type="button" key={value} disabled={busy}
                  className={`lab-login__key ${value === 'clear' || value === 'delete' ? 'lab-login__key--subtle' : ''}`}
                  aria-label={value === 'delete' ? 'Delete last digit' : value === 'clear' ? 'Clear PIN' : `Digit ${value}`}
                  onClick={() => value === 'delete' ? removeNumber() : value === 'clear' ? setPin('') : addNumber(value)}
                >
                  {value === 'delete' ? <Delete size={23}/> : value === 'clear' ? 'Clear' : value}
                </button>
              ))}
            </div>
            {error && <p id="lab-pin-error" role="alert" className="lab-login__error">{error}</p>}
            <button className="lab-login__start" type="submit" disabled={busy || !complete}>
              {busy ? 'Opening your classroom…' : 'Start Learning'} <ArrowRight size={22}/>
            </button>
          </form>
          <p className="lab-login__privacy"><LockKeyhole size={16}/> Shared school computer? Your student login ends when you finish or the session expires.</p>
          <Link href="/" className="lab-login__back"><ArrowLeft size={15}/> Back to homepage</Link>
        </section>
      </div>
    </main>
  )
}
