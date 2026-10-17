'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, BookOpen, GraduationCap, Mic2, School, Sparkles, Volume2, VolumeX } from 'lucide-react'
import './talkora-home.css'

/** Public homepage only. Student PIN entry remains on /login/student. */
export default function HomePage() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [speaking, setSpeaking] = useState(false)
  const [audioError, setAudioError] = useState(false)

  async function toggleWelcome() {
    const audio = audioRef.current
    if (!audio) return
    if (!audio.paused) {
      audio.pause()
      audio.currentTime = 0
      setSpeaking(false)
      return
    }
    try {
      setAudioError(false)
      audio.currentTime = 0
      await audio.play()
    } catch {
      setSpeaking(false)
      setAudioError(true)
    }
  }

  return (
    <main className="tkh-home">
      <audio
        ref={audioRef}
        src="/assets/audio/miss-julie-welcome.mp3"
        preload="none"
        onPlay={() => setSpeaking(true)}
        onPause={() => setSpeaking(false)}
        onEnded={() => setSpeaking(false)}
        aria-hidden="true"
      />

      <header className="tkh-header">
        <Link className="tkh-brand" href="/" aria-label="Talkora homepage">
          <span className="tkh-brand-mark" aria-hidden="true"><Sparkles size={21} strokeWidth={2.5} /></span>
          <span>Talkora<span className="tkh-brand-dot">.</span></span>
        </Link>
        <nav className="tkh-staff-links" aria-label="Staff portals">
          <Link href="/login/teacher"><GraduationCap size={17} /> <span>Teacher</span></Link>
          <Link href="/login/school"><School size={17} /> <span>School</span></Link>
        </nav>
      </header>

      <div className="tkh-main">
        <section className="tkh-copy" aria-labelledby="tkh-heading">
          <div className="tkh-eyebrow"><span className="tkh-live-dot" /> Meet your English buddy, Miss Julie</div>
          <h1 id="tkh-heading">Little words.<br /><span>Big confidence.</span></h1>
          <p className="tkh-description">An English-speaking adventure for KG to Class 10. Listen, talk, and learn at your own pace — one conversation at a time.</p>
          <div className="tkh-actions">
            <Link href="/login/student" className="tkh-primary">Student Login <ArrowRight size={21} strokeWidth={2.6} /></Link>
            <button type="button" className="tkh-voice" onClick={toggleWelcome} aria-pressed={speaking} aria-label={speaking ? 'Stop Miss Julie welcome message' : 'Hear Miss Julie welcome message'}>
              {speaking ? <VolumeX size={21} /> : <Volume2 size={21} />}
              {speaking ? 'Stop welcome' : 'Hear Miss Julie'}
            </button>
          </div>
          {audioError ? <p className="tkh-audio-error" role="status">Audio is unavailable right now. You can still start learning.</p> : null}
          <p className="tkh-pin-hint">Students only need their 5-digit PIN. <span aria-hidden="true">✦</span> No level selection.</p>
        </section>

        <section className="tkh-visual" aria-label="Miss Julie with two Talkora students">
          <div className="tkh-sun" aria-hidden="true" />
          <div className="tkh-spark tkh-spark-one" aria-hidden="true">✦</div>
          <div className="tkh-spark tkh-spark-two" aria-hidden="true">✳</div>
          <div className="tkh-hero-trio">
            <Image
              src="/assets/talkora-hero-trio.webp?v=20261012"
              alt="Miss Julie smiling with two happy schoolchildren"
              fill
              priority
              sizes="(max-width: 700px) 94vw, (max-width: 1100px) 50vw, 620px"
              className="tkh-trio-image"
            />
          </div>
          <div className="tkh-julie-note"><span className="tkh-note-icon"><Mic2 size={18} /></span><span><strong>Hi, I’m Miss Julie!</strong><small>Ready when you are.</small></span></div>
        </section>
      </div>

      <footer className="tkh-footer" aria-label="How Talkora helps you learn">
        <span><Mic2 size={18} /> Speak naturally</span>
        <span><BookOpen size={18} /> Learn with your class</span>
        <span><Sparkles size={18} /> Grow every day</span>
      </footer>
    </main>
  )
}
