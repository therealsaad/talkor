'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import { Star, Trophy, Volume2, VolumeX, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { KGRewardCollection } from '@/services/kg-rewards-service'
import './kg-reward-celebration.css'

function playChime() {
  if (typeof window === 'undefined' || !window.AudioContext) return
  try {
    const context = new AudioContext()
    const now = context.currentTime
    ;[659.25, 783.99, 987.77].forEach((frequency, index) => {
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      const start = now + index * 0.13
      oscillator.type = 'sine'
      oscillator.frequency.value = frequency
      gain.gain.setValueAtTime(0.0001, start)
      gain.gain.exponentialRampToValueAtTime(0.11, start + 0.025)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.28)
      oscillator.connect(gain)
      gain.connect(context.destination)
      oscillator.start(start)
      oscillator.stop(start + 0.3)
    })
    window.setTimeout(() => { void context.close().catch(() => undefined) }, 650)
  } catch { /* Audio is optional; the visual celebration remains available. */ }
}

export function KGRewardCelebration({
  level,
  reward,
  onContinue,
  onDismiss,
}: {
  level: number
  reward: KGRewardCollection
  onContinue: () => void
  onDismiss: () => void
}) {
  const reducedMotion = useReducedMotion()
  const [muted, setMuted] = useState(false)
  const soundPlayed = useRef(false)
  const champion = level === 5 && reward.championUnlocked

  useEffect(() => {
    if (muted || soundPlayed.current) return
    soundPlayed.current = true
    playChime()
  }, [muted])

  useEffect(() => {
    const timeout = window.setTimeout(onDismiss, 9000)
    return () => window.clearTimeout(timeout)
  }, [onDismiss])

  const confetti = Array.from({ length: 18 }, (_, index) => index)
  return (
    <aside className="kg-reward-celebration" role="status" aria-live="polite" aria-label="Level reward earned">
      {!reducedMotion ? <div className="kg-reward-celebration__confetti" aria-hidden="true">
        {confetti.map((piece) => <i key={piece} style={{ '--piece': piece } as React.CSSProperties} />)}
      </div> : null}
      <button className="kg-reward-celebration__dismiss" type="button" onClick={onDismiss} aria-label="Close celebration"><X size={18} /></button>
      <div className="kg-reward-celebration__julie">
        <Image src="/miss-julie/celebrating.webp" alt="Miss Julie celebrating with you" width={116} height={142} />
      </div>
      <div className="kg-reward-celebration__copy">
        <span className="kg-reward-celebration__eyebrow">{champion ? <><Trophy size={17} /> KG CHAMPION</> : <>LEVEL {level} COMPLETE</>}</span>
        <h2>{champion ? 'You are a KG Champion!' : 'Amazing learning, superstar!'}</h2>
        <p>{champion
          ? 'You completed all five levels and earned your golden trophy!'
          : `Miss Julie is proud of you. You earned a star for Level ${level}!`}</p>
        <div className="kg-reward-celebration__stars" aria-label={`${reward.totalStars} of 5 stars earned`}>
          <motion.span initial={reducedMotion ? false : { scale: 0, rotate: -35 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 250, damping: 14 }}><Star size={25} fill="currentColor" /></motion.span>
          <strong>{reward.totalStars}<small>/5 stars</small></strong>
          {champion ? <Trophy className="kg-reward-celebration__trophy" size={31} aria-label="KG Champion trophy unlocked" /> : null}
        </div>
        <div className="kg-reward-celebration__actions">
          <button className="kg-reward-celebration__continue" type="button" onClick={onContinue}>Continue learning</button>
          <Link className="kg-reward-celebration__collection" href="/student/rewards">View my stars</Link>
          <button className="kg-reward-celebration__sound" type="button" disabled={muted} onClick={playChime} aria-label="Play celebration sound"><Volume2 size={18} /></button>
          <button className="kg-reward-celebration__sound" type="button" onClick={() => setMuted((value) => !value)} aria-label={muted ? 'Turn celebration sound on' : 'Mute celebration sound'}>
            {muted ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
        </div>
      </div>
    </aside>
  )
}
