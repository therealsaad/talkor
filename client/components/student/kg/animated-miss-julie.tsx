'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'

/** Reusable tiny asset-swap animation for the original Miss Julie artwork.
 * Mouth movement is stylized speaking motion, not phoneme-accurate lip sync.
 * Requires no canvas, WebGL or third-party animation video downloads.
 */
export type MissJulieState = 'idle' | 'speaking' | 'listening' | 'thinking' | 'pointing' | 'encouraging' | 'celebrating'

const poses: Record<MissJulieState, string> = {
  idle: '/miss-julie/welcome.webp',
  speaking: '/miss-julie/speaking.webp',
  listening: '/miss-julie/listening.webp',
  thinking: '/miss-julie/thinking.webp',
  pointing: '/miss-julie/pointing.webp',
  encouraging: '/miss-julie/encouraging.webp',
  celebrating: '/miss-julie/celebrating.webp',
}

export function AnimatedMissJulie({ state, reducedMotion = false }: { state: MissJulieState; reducedMotion?: boolean }) {
  const [videoFailed, setVideoFailed] = useState(false)
  useEffect(() => { setVideoFailed(false) }, [state])
  // Set NEXT_PUBLIC_MISS_JULIE_ANIMATIONS=1 only after actual optimized WebM clips
  // have been copied into public/miss-julie/animations/<state>.webm.
  // Silent loops reflect teacher state; actual spoken audio is handled separately.
  const videoReady = process.env.NEXT_PUBLIC_MISS_JULIE_ANIMATIONS === '1' && !reducedMotion && !videoFailed
  return <div className={`kg-alpha-teacher-image kg-julie-animated is-${state}`} data-julie-state={state}>
    {videoReady ? <video
      key={state}
      className="kg-julie-animated__video"
      src={`/miss-julie/animations/${state}.webm`}
      autoPlay muted loop playsInline disablePictureInPicture preload="metadata"
      aria-label={`Miss Julie ${state}`}
      onError={() => setVideoFailed(true)}
    /> : <Image
      className="kg-julie-animated__pose"
      src={poses[state]}
      alt={`Miss Julie ${state === 'idle' ? 'welcoming you' : state}`}
      width={390}
      height={500}
      priority={state === 'idle'}
      sizes="(max-width: 760px) 35vw, 390px"
    />}
    {state === 'speaking' && !reducedMotion ? <span className="kg-julie-animated__speaking-dots" aria-hidden="true"><i /><i /><i /></span> : null}
  </div>
}
