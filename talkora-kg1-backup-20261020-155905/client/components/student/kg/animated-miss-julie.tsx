'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'

/** These clips are pose animations, NOT audio-aligned phoneme lip-sync. */
export type MissJulieState = 'idle' | 'speaking' | 'listening' | 'thinking' | 'pointing' | 'encouraging' | 'celebrating'

const poses: Record<MissJulieState, string> = {
  idle: '/miss-julie/welcome.webp',
  speaking: '/miss-julie/welcome.webp', // neutral face after the initial short speaking gesture
  listening: '/miss-julie/listening.webp',
  thinking: '/miss-julie/thinking.webp',
  pointing: '/miss-julie/pointing.webp',
  encouraging: '/miss-julie/encouraging.webp',
  celebrating: '/miss-julie/celebrating.webp',
}

export function AnimatedMissJulie({ state, reducedMotion = false }: { state: MissJulieState; reducedMotion?: boolean }) {
  const [playing, setPlaying] = useState(false)
  const [failed, setFailed] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  useEffect(() => { setPlaying(false); setFailed(false) }, [state, reducedMotion])
  const active = !reducedMotion && !failed
  const shortGesture = state === 'speaking' || state === 'encouraging' || state === 'pointing'
  return <div className={`kg-alpha-teacher-image kg-julie-animated is-${state}`} data-julie-state={state}>
    {!playing && <Image className="kg-julie-animated__pose"
      src={poses[state]} alt={`Miss Julie ${state}`} width={420} height={540}
      priority={state === 'idle'} sizes="(max-width:760px) 30vw,420px" />}
    {active ? <video ref={videoRef} key={state} className="kg-julie-animated__video"
      style={{ opacity: playing ? 1 : 0, pointerEvents: 'none' }}
      src={`/miss-julie-animations/${state}.webm`} autoPlay muted
      loop={!shortGesture && state !== 'celebrating'} playsInline
      disablePictureInPicture preload="metadata" aria-hidden="true"
      onPlaying={() => setPlaying(true)} onError={() => { setPlaying(false); setFailed(true) }}
      onTimeUpdate={(event) => {
        // The generated speaking clip contains big, repeated hand gestures.
        // Show only its short natural opening, then rest on the calm neutral pose.
        if (shortGesture && event.currentTarget.currentTime >= 2.4) {
          event.currentTarget.pause(); setPlaying(false)
        }
      }}
      onEnded={() => setPlaying(false)} onStalled={() => setPlaying(false)} /> : null}
    {state === 'speaking' && !reducedMotion ? <span className="kg-julie-animated__speaking-dots" aria-hidden="true"><i /><i /><i /></span> : null}
  </div>
}
