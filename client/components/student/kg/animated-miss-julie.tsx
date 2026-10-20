'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'

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

// Avoid looping exaggerated arm gestures throughout a long spoken line.
const gestureSeconds: Partial<Record<MissJulieState, number>> = {
  speaking: 1.7,
  pointing: 2.0,
  encouraging: 1.8,
  celebrating: 2.6,
}

export function AnimatedMissJulie({ state, reducedMotion = false }: { state: MissJulieState; reducedMotion?: boolean }) {
  const [visibleVideo, setVisibleVideo] = useState(false)
  const [videoFailed, setVideoFailed] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    setVisibleVideo(false)
    setVideoFailed(false)
  }, [state, reducedMotion])

  // Still images are ALWAYS underneath the video. If playback stalls or ends,
  // the character stays visible and transitions smoothly instead of flashing.
  const playGesture = !reducedMotion && !videoFailed && gestureSeconds[state] !== undefined
  return (
    <div className={`kg-alpha-teacher-image kg-julie-animated is-${state}`} data-julie-state={state}>
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
          ref={videoRef}
          className={`kg-julie-animated__video ${visibleVideo ? 'is-visible' : ''}`}
          src={`/miss-julie-animations/${state}.webm`}
          autoPlay
          muted
          playsInline
          preload="metadata"
          disablePictureInPicture
          aria-hidden="true"
          onPlaying={() => setVisibleVideo(true)}
          onTimeUpdate={(event) => {
            if (event.currentTarget.currentTime >= (gestureSeconds[state] ?? 2)) {
              event.currentTarget.pause()
              setVisibleVideo(false)
            }
          }}
          onEnded={() => setVisibleVideo(false)}
          onStalled={() => setVisibleVideo(false)}
          onError={() => { setVisibleVideo(false); setVideoFailed(true) }}
        />
      )}
      {state === 'speaking' && !reducedMotion && (
        <span className="kg-julie-animated__speaking-dots" aria-hidden="true"><i /><i /><i /></span>
      )}
    </div>
  )
}
