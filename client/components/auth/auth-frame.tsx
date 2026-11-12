'use client'

import Link from 'next/link'
import React from 'react'
import { useEffect, useState } from 'react'
import { useReducedMotion } from 'framer-motion'

interface AuthFrameProps {
  children: React.ReactNode
  title: string
  subtitle: string
  pose?: 'welcome' | 'standing' | 'teaching' | 'thinking' | 'encouraging' | 'celebrating' | 'reading' | 'goals' | 'desk'
  badgeText?: string
}

export function AuthFrame({
  children,
  title,
  subtitle,
  pose = 'welcome',
  badgeText = 'Talkora Adventure',
}: AuthFrameProps) {
  const poseSrc = `/miss-julie/${pose}.png`
  const reduceMotion = useReducedMotion()
  const animationName = pose === 'thinking'
    ? 'thinking'
    : pose === 'encouraging'
      ? 'encouraging'
      : pose === 'celebrating'
        ? 'celebrating'
        : pose === 'teaching' || pose === 'reading'
          ? 'pointing'
          : 'idle'
  const animationSrc = reduceMotion ? null : `/miss-julie-animations/transparent/${animationName}.webm`
  const [animationReady, setAnimationReady] = useState(false)

  useEffect(() => {
    setAnimationReady(false)
  }, [animationSrc])

  return (
    <main className="auth-page">
      <section className="auth-art">
        <div className="chalk-star" />
        <Link href="/" className="brand">
          <span className="brand-mark">T</span>
          <span>talkora</span>
        </Link>
        <span className="portal-pill mt-3" style={{ background: '#ffd83d', color: '#172554', border: '2px solid #172554' }}>
          {badgeText}
        </span>
        <h1>{title}</h1>
        <p>{subtitle}</p>
        <div className={`auth-character${animationReady ? ' has-transparent-animation' : ''}`}>
          <img
            src={poseSrc}
            alt="Miss Julie, your AI English Teacher"
            onError={(e) => {
              // Fallback to welcome pose if specific pose fails to load
              e.currentTarget.src = '/miss-julie/welcome.png'
            }}
          />
          {animationSrc ? <video
            key={animationSrc}
            className="auth-character-animation"
            src={animationSrc}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            aria-hidden="true"
            onCanPlay={() => setAnimationReady(true)}
            onPlaying={() => setAnimationReady(true)}
            onError={() => setAnimationReady(false)}
          /> : null}
        </div>
      </section>
      <section className="auth-form-area">{children}</section>
    </main>
  )
}
