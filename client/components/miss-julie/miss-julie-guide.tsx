'use client'

import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useReducedMotion } from 'framer-motion'
import { Volume2 } from 'lucide-react'

import { useAuth } from '@/components/auth/auth-provider'
import { useMissJulieVoice } from '@/hooks/use-miss-julie-voice'

type Props = {
  message?: string
  compact?: boolean
  standalone?: boolean
}

type PageGreeting = {
  message: string
  mood: 'welcome' | 'guide' | 'proud' | 'practice'
}

function getPageGreeting(pathname: string, name: string): PageGreeting {
  if (pathname === '/student/home' || pathname === '/student/dashboard') {
    return {
      message: `Hi ${name}! Welcome back to Talkora. Ready for another English adventure?`,
      mood: 'welcome',
    }
  }

  if (pathname === '/student/classes') {
    return {
      message: `Let us choose your English adventure, ${name}. I will stay with you all the way.`,
      mood: 'guide',
    }
  }

  if (pathname === '/student/levels') {
    return {
      message: `Great to see you, ${name}! Choose an adventure and let us continue learning English together.`,
      mood: 'guide',
    }
  }

  if (pathname.startsWith('/student/levels/')) {
    return {
      message: `This adventure looks exciting, ${name}! Choose a stage and I will guide you.`,
      mood: 'guide',
    }
  }

  if (pathname === '/student/practice') {
    return {
      message: `Ready to practise, ${name}? Choose a skill and let us get stronger together.`,
      mood: 'practice',
    }
  }

  if (pathname === '/student/progress') {
    return {
      message: `Look how far you have come, ${name}! Let us check your progress together.`,
      mood: 'proud',
    }
  }

  if (pathname === '/student/rewards') {
    return {
      message: `You have earned some lovely rewards, ${name}. Keep speaking bravely and kindly!`,
      mood: 'proud',
    }
  }

  if (pathname === '/student/profile') {
    return {
      message: `Hi ${name}! This is your Talkora profile. You can always come back and see how much you have grown.`,
      mood: 'welcome',
    }
  }

  return {
    message: `Hi ${name}! I am Miss Julie. I am right here whenever you need help with English.`,
    mood: 'welcome',
  }
}

export function MissJulieGuide({
  message,
  compact = false,
  standalone = false,
}: Props) {
  const pathname = usePathname()
  const { student } = useAuth()
  const reduceMotion = useReducedMotion()
  const name = student?.fullName?.trim().split(/\s+/)[0] || 'Explorer'
  const [queued, setQueued] = useState(false)
  const [animationReady, setAnimationReady] = useState(false)
  const voice = useMissJulieVoice()

  const pageGreeting = useMemo(
    () => getPageGreeting(pathname, name),
    [pathname, name],
  )

  const text = message || pageGreeting.message
  const guidePose = voice.isSpeaking
    ? 'speaking'
    : voice.state === 'loading'
      ? 'thinking'
      : pageGreeting.mood === 'proud'
        ? 'celebrating'
        : pageGreeting.mood === 'guide'
          ? 'pointing'
          : pageGreeting.mood === 'practice'
            ? 'encouraging'
            : 'idle'
  const animationSrc = reduceMotion ? null : `/miss-julie-animations/transparent/${guidePose}.webm`
  const turnId = useMemo(
    () => `page:${pathname}:${text.trim().toLowerCase().replace(/\s+/g, '-')}`,
    [pathname, text],
  )

  const speak = async () => {
    const result = await voice.speak(text, turnId)
    setQueued(result === 'autoplay-blocked' || result === 'unavailable')
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void speak(), 280)
    return () => {
      window.clearTimeout(timer)
      voice.stop()
    }
  }, [pathname, text])

  useEffect(() => {
    setAnimationReady(false)
  }, [animationSrc])

  useEffect(() => {
    if (!queued) return

    const retry = () => {
      setQueued(false)
      void speak()
    }

    window.addEventListener('pointerdown', retry, { once: true })
    window.addEventListener('keydown', retry, { once: true })
    return () => {
      window.removeEventListener('pointerdown', retry)
      window.removeEventListener('keydown', retry)
    }
  }, [queued])

  if (!standalone) {
    return queued || voice.needsUserGesture ? (
      <button
        type="button"
        className="talkora-autoplay-tap-badge"
        onClick={() => void speak()}
        aria-label="Tap to play Miss Julie voice"
      >
        <span className="talkora-autoplay-pulse">🔊</span>
        <span>Tap to hear Miss Julie</span>
      </button>
    ) : null
  }

  return (
    <aside
      className={`julie-page-guide ${compact ? 'julie-page-guide--compact' : ''}`}
      data-mood={pageGreeting.mood}
      aria-live="polite"
    >
      <div className={`julie-page-guide__portrait-wrap${animationReady ? ' has-transparent-animation' : ''}`}>
        <Image
          src="/miss-julie-portrait.png"
          alt="Miss Julie, your Talkora English teacher"
          width={132}
          height={132}
          className="julie-page-guide__portrait"
          priority={pathname === '/student/home'}
        />
        {animationSrc ? <video
          key={animationSrc}
          className="julie-page-guide__animation"
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
        <span className={`julie-page-guide__status ${voice.isSpeaking ? 'is-speaking' : ''}`} />
      </div>

      <div className="julie-page-guide__bubble">
        <div className="julie-page-guide__title-row">
          <strong>Miss Julie</strong>
          <span>{voice.isSpeaking ? 'Speaking…' : voice.state === 'loading' ? 'Getting ready…' : 'Your English guide'}</span>
        </div>
        <p>{text}</p>
        <button type="button" onClick={() => void speak()} aria-label="Hear Miss Julie again">
          <Volume2 size={17} />
          <span>{queued || voice.needsUserGesture ? 'Hear Miss Julie' : 'Replay'}</span>
        </button>
      </div>
    </aside>
  )
}
