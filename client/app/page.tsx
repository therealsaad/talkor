'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, BookOpen, GraduationCap, Mic2, School, Sparkles, TrendingUp, Users, Volume2, VolumeX, ShieldCheck, Headphones } from 'lucide-react'
import { useAuth } from '@/components/auth/auth-provider'
import { voiceService } from '@/services/voice-service'
import './talkora-home.css'

const benefits = [
  { title: 'Interactive Lessons', detail: 'Listen, speak and learn with Miss Julie', icon: Mic2, color: 'pink' },
  { title: 'Class-wise Syllabus', detail: 'A learning journey for every grade', icon: BookOpen, color: 'blue' },
  { title: 'Personalised Learning', detail: 'Practice adjusts as you improve', icon: TrendingUp, color: 'green' },
  { title: 'Progress Reports', detail: 'Teachers can follow every step', icon: Users, color: 'purple' },
] as const

export default function HomePage() {
  const router = useRouter()
  const { loginStudentByPin } = useAuth()
  const [pin, setPin] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [speaking, setSpeaking] = useState(false)
  const [benefitsVisible, setBenefitsVisible] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  const benefitsRef = useRef<HTMLElement>(null)
  const pinRef = useRef<HTMLInputElement>(null)
  const complete = /^\d{5}$/.test(pin)

  useEffect(() => {
    const element = benefitsRef.current
    if (!element || typeof IntersectionObserver === 'undefined') {
      setBenefitsVisible(true)
      return
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setBenefitsVisible(true)
        observer.disconnect()
      }
    }, { threshold: 0.12 })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    if (!complete) {
      setError('Enter your five-digit PIN to begin.')
      pinRef.current?.focus()
      return
    }
    // A student has deliberately interacted with Talkora. Try unlocking sound
    // inside that gesture; the lesson still provides a manual sound fallback.
    void voiceService.unlockPlayback().catch(() => undefined)
    setBusy(true)
    setError('')
    try {
      await loginStudentByPin(pin)
      setPin('')
      router.replace('/student/continue')
    } catch {
      setPin('')
      setError('That PIN did not work. Please ask your teacher for help.')
      pinRef.current?.focus()
    } finally {
      setBusy(false)
    }
  }

  async function toggleJulieAudio() {
    const audio = audioRef.current
    if (!audio) return
    if (!audio.paused) {
      audio.pause()
      audio.currentTime = 0
      return
    }
    try {
      audio.currentTime = 0
      await audio.play()
    } catch {
      setSpeaking(false)
    }
  }

  return (
    <main className="tkp-page" id="top">
      <audio ref={audioRef} src="/assets/audio/miss-julie-welcome.mp3" preload="none"
        onPlay={() => setSpeaking(true)} onPause={() => setSpeaking(false)}
        onEnded={() => setSpeaking(false)} aria-hidden="true" />

      <header className="tkp-header">
        <Link href="/" className="tkp-logo" aria-label="Talkora home">Talkora<span aria-hidden="true">✦</span></Link>
        <nav className="tkp-nav" aria-label="Main navigation">
          <a href="#student-login">Student login</a>
          <a href="#how-it-works">How it works</a>
          <Link href="/login/school">For schools</Link>
        </nav>
        <Link className="tkp-staff-top" href="/login"><GraduationCap size={18} aria-hidden="true" /> Teacher / School Login</Link>
      </header>

      <div className="tkp-hero" id="welcome">
        <section className="tkp-intro" aria-labelledby="tkp-heading">
          <p className="tkp-eyebrow"><Sparkles size={17} aria-hidden="true" /> AI-powered English speaking tutor</p>
          <h1 id="tkp-heading">Small<br />Conversations<span className="tkp-period">.</span><br /><span className="tkp-blue-text">Big Futures<span className="tkp-period">.</span></span></h1>
          <p className="tkp-lead">Talkora helps KG–Class 10 students speak English confidently with Miss Julie — through fun, syllabus-based, voice-first learning.</p>
          <div className="tkp-pills" aria-label="Learning benefits">
            <span><span className="tkp-pill-icon tkp-pill-pink"><Mic2 size={22} aria-hidden="true" /></span><span>Speak<br />confidently</span></span>
            <span><span className="tkp-pill-icon tkp-pill-blue"><BookOpen size={22} aria-hidden="true" /></span><span>Learn<br />step by step</span></span>
            <span><span className="tkp-pill-icon tkp-pill-green"><TrendingUp size={22} aria-hidden="true" /></span><span>Grow<br />every day</span></span>
          </div>
          <button className="tkp-hear" type="button" onClick={toggleJulieAudio} aria-pressed={speaking}>
            {speaking ? <VolumeX size={18} aria-hidden="true" /> : <Volume2 size={18} aria-hidden="true" />}
            {speaking ? 'Stop Miss Julie' : 'Hear Miss Julie say hello'}
            <span className={speaking ? 'tkp-sound-bars is-playing' : 'tkp-sound-bars'} aria-hidden="true"><i /><i /><i /><i /></span>
          </button>
        </section>

        <div className="tkp-characters" aria-label="Miss Julie and two happy schoolchildren">
          <div className="tkp-character tkp-character-julie">
            <Image src="/assets/talkora-hero-julie.webp" alt="Miss Julie smiling and waving" fill priority sizes="(max-width: 680px) 52vw, (max-width: 1100px) 34vw, 24vw" className="tkp-character-image" />
          </div>
          <div className="tkp-character tkp-character-boy">
            <Image src="/assets/talkora-hero-boy.webp" alt="A happy boy ready to learn" fill priority sizes="(max-width: 680px) 32vw, (max-width: 1100px) 24vw, 19vw" className="tkp-character-image" />
          </div>
          <div className="tkp-character tkp-character-girl">
            <Image src="/assets/talkora-hero-girl.webp" alt="A happy girl ready to learn" fill priority sizes="(max-width: 680px) 32vw, (max-width: 1100px) 24vw, 19vw" className="tkp-character-image" />
          </div>
        </div>

        <section className="tkp-login" id="student-login" aria-labelledby="tkp-login-title">
          <div className="tkp-login-heading"><span className="tkp-login-icon"><GraduationCap size={25} aria-hidden="true" /></span><h2 id="tkp-login-title">Student Login</h2></div>
          <p className="tkp-login-description">Enter your 5-digit PIN to start learning with Miss Julie.</p>
          <form onSubmit={signIn}>
            <label className="tkp-visually-hidden" htmlFor="tkp-pin">Your 5-digit student PIN</label>
            <div className="tkp-pin-shell" onClick={() => pinRef.current?.focus()}>
              <div className="tkp-pin-digits" aria-hidden="true">
                {Array.from({ length: 5 }, (_, index) => <span key={index} className={pin.length > index ? 'tkp-pin-filled' : ''}>{pin.length > index ? '●' : ''}</span>)}
              </div>
              <input ref={pinRef} id="tkp-pin" type="password" autoFocus inputMode="numeric" autoComplete="off"
                maxLength={5} pattern="[0-9]{5}" value={pin} disabled={busy} aria-label="Five digit student PIN"
                aria-describedby={error ? 'tkp-pin-error' : 'tkp-pin-help'}
                onChange={event => { setPin(event.target.value.replace(/\D/g, '').slice(0, 5)); setError('') }} />
            </div>
            <p id="tkp-pin-help" className="tkp-visually-hidden">Enter five digits using the keyboard.</p>
            {error && <p className="tkp-login-error" id="tkp-pin-error" role="alert">{error}</p>}
            <button className="tkp-enter" type="submit" disabled={busy}>
              {busy ? 'Opening classroom…' : 'Enter Classroom'} <ArrowRight size={21} aria-hidden="true" />
            </button>
          </form>
          <div className="tkp-login-divider"><span>or</span></div>
          <Link href="/login/teacher" className="tkp-secondary-link"><span className="tkp-staff-icon tkp-staff-teacher"><GraduationCap size={22} aria-hidden="true" /></span><span>Teacher Login</span><ArrowRight size={19} aria-hidden="true" /></Link>
          <Link href="/login/school" className="tkp-secondary-link"><span className="tkp-staff-icon tkp-staff-school"><School size={22} aria-hidden="true" /></span><span>School / Admin Login</span><ArrowRight size={19} aria-hidden="true" /></Link>
          <p className="tkp-session-note"><ShieldCheck size={13} aria-hidden="true" /> Temporary student sessions on shared school computers.</p>
        </section>
      </div>

      <section ref={benefitsRef} className={benefitsVisible ? 'tkp-benefits is-visible' : 'tkp-benefits'} aria-label="What Talkora offers">
        {benefits.map(({ title, detail, icon: Icon, color }) => <div className="tkp-benefit" key={title}>
          <span className={`tkp-benefit-icon tkp-benefit-${color}`}><Icon size={29} aria-hidden="true" /></span>
          <span><strong>{title}</strong><small>{detail}</small></span>
        </div>)}
      </section>

      <section className="tkp-how" id="how-it-works" aria-labelledby="tkp-how-title">
        <div className="tkp-how-intro"><p>THE TALKORA EXPERIENCE</p><h2 id="tkp-how-title">Less clicking. More speaking.</h2><span>Miss Julie guides each child through their own class syllabus, one conversation at a time.</span></div>
        <div className="tkp-how-grid">
          <div><span><GraduationCap size={23} /></span><strong>1. Enter your PIN</strong><p>Start with your private five-digit school PIN. No student password to remember.</p></div>
          <div><span><Headphones size={23} /></span><strong>2. Talk with Miss Julie</strong><p>Listen, speak and practise. Lessons advance automatically, with touch as a fallback.</p></div>
          <div><span><TrendingUp size={23} /></span><strong>3. Keep growing</strong><p>Vocabulary, mistakes and progress are saved so learning resumes where you stopped.</p></div>
        </div>
      </section>
    </main>
  )
}
