'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'

/** Gentle state gestures, not phoneme-accurate lip sync. Audio remains a separate track. */
export type MissJulieState = 'idle' | 'speaking' | 'listening' | 'thinking' | 'pointing' | 'encouraging' | 'celebrating'

const poses: Record<MissJulieState, string> = {
  idle: '/miss-julie/welcome.webp',
  speaking: '/miss-julie/welcome.webp',
  listening: '/miss-julie/listening.webp',
  thinking: '/miss-julie/thinking.webp',
  pointing: '/miss-julie/pointing.webp',
  encouraging: '/miss-julie/encouraging.webp',
  celebrating: '/miss-julie/celebrating.webp',
}

export function AnimatedMissJulie({ state, reducedMotion = false }: { state: MissJulieState; reducedMotion?: boolean }) {
  const [visibleVideoState, setVisibleVideoState] = useState<MissJulieState | null>(null)
  const [videoFailed, setVideoFailed] = useState(false)
  const visibleVideo = visibleVideoState === state

  useEffect(() => {
    setVisibleVideoState(null)
    setVideoFailed(false)
  }, [state, reducedMotion])

  // The still is a loading/error/reduced-motion fallback. It is hidden as soon
  // as the matching public animation can play, avoiding two Julies on screen.
  const playGesture = !reducedMotion && !videoFailed
  return (
    <div className={`kg-alpha-teacher-image kg-julie-animated is-${state} ${visibleVideo ? 'is-video-visible' : ''}`} data-julie-state={state}>
      <Image
        className="kg-julie-animated__pose"
        src={poses[state]}
        alt={`Miss Julie ${state}`}
        fill
        priority={state === 'idle'}
        sizes="(max-width: 760px) 35vw, 420px"
      />
      {playGesture && (
        <video
          key={state}
          className={`kg-julie-animated__video ${visibleVideo ? 'is-visible' : ''}`}
          src={`/miss-julie-animations/transparent/${state}.webm`}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          disablePictureInPicture
          aria-hidden="true"
          onCanPlay={() => setVisibleVideoState(state)}
          onPlaying={() => setVisibleVideoState(state)}
          onWaiting={() => setVisibleVideoState(null)}
          onStalled={() => setVisibleVideoState(null)}
          onError={() => { setVisibleVideoState(null); setVideoFailed(true) }}
        />
      )}
      {state === 'speaking' && !reducedMotion && (
        <span className="kg-julie-animated__speaking-dots" aria-hidden="true"><i /><i /><i /></span>
      )}
    </div>
  )
}
