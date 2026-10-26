'use client'

import { useEffect, useRef, useState } from 'react'
import { Play, Sparkles } from 'lucide-react'

/** The video is a separately produced, reviewed 90-second Priya/Miss Julie asset.
 * It is intentionally NOT bundled as a fake/blank placeholder. */
// Set this to the approved CloudFront/media URL backed by private S3 in production.
// The local path is for a teacher's offline media preview; no video is committed.
export const CLASS1_FIRST_DAY_VIDEO = process.env.NEXT_PUBLIC_TALKORA_CLASS1_INTRO_URL?.trim() ||
  '/lessons/class-01/level-01/miss-julie-first-day-intro.mp4'

const MIN_DURATION_SECONDS = 87
const MAX_DURATION_SECONDS = 93
const REQUIRED_WATCH_SECONDS = 85

export function Class1LessonIntro({ onAvailable, onDone }: {
  onAvailable: () => void
  onDone: () => void
}) {
  const frame = useRef<HTMLDivElement>(null)
  const video = useRef<HTMLVideoElement>(null)
  const watchedUntil = useRef(0)
  const [canPlay, setCanPlay] = useState(false)
  const [needsTap, setNeedsTap] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    function pauseIfInterrupted() {
      if (document.hidden || document.fullscreenElement !== frame.current) {
        video.current?.pause()
        setNeedsTap(true)
      }
    }
    document.addEventListener('visibilitychange', pauseIfInterrupted)
    document.addEventListener('fullscreenchange', pauseIfInterrupted)
    return () => {
      document.removeEventListener('visibilitychange', pauseIfInterrupted)
      document.removeEventListener('fullscreenchange', pauseIfInterrupted)
      video.current?.pause()
    }
  }, [])

  function validateVideo() {
    const duration = video.current?.duration ?? NaN
    if (!Number.isFinite(duration) || duration < MIN_DURATION_SECONDS || duration > MAX_DURATION_SECONDS) {
      setError('Miss Julie needs the approved 90-second lesson video. Please ask your teacher to check the video.')
      setCanPlay(false)
      return
    }
    setCanPlay(true)
    setError('')
    onAvailable()
  }

  async function begin() {
    if (!canPlay || !video.current || !frame.current) return
    try {
      if (!frame.current.requestFullscreen) throw new Error('Fullscreen is unavailable')
      if (document.fullscreenElement !== frame.current) await frame.current.requestFullscreen()
      video.current.muted = false
      await video.current.play()
      setNeedsTap(false)
      setError('')
    } catch {
      video.current?.pause()
      setNeedsTap(true)
      setError('Tap again to play with sound in fullscreen. Please ask a teacher if the browser blocks fullscreen.')
    }
  }

  function finish() {
    if (document.fullscreenElement !== frame.current || video.current?.muted || watchedUntil.current < REQUIRED_WATCH_SECONDS) {
      video.current?.pause()
      setNeedsTap(true)
      setError('Let’s finish the complete story with sound before we start practising.')
      return
    }
    onDone()
    if (document.fullscreenElement === frame.current) void document.exitFullscreen?.().catch(() => undefined)
  }

  return <div ref={frame} className="kg-intro-overlay" role="dialog" aria-modal="true" aria-label="Miss Julie Class 1 first day story">
    <div className="kg-intro-card">
      <div className="kg-intro-heading"><span><Sparkles size={18} aria-hidden="true" /> First, a little story with Miss Julie!</span></div>
      <video
        ref={video}
        className="kg-intro-video"
        src={CLASS1_FIRST_DAY_VIDEO}
        playsInline preload="metadata" controls={false}
        disablePictureInPicture controlsList="nodownload noplaybackrate noremoteplayback"
        aria-label="90-second Class 1 foundation and My First Day introduction"
        onLoadedMetadata={validateVideo}
        onTimeUpdate={(event) => {
          const player = event.currentTarget
          if (document.fullscreenElement !== frame.current || player.muted || player.seeking) return
          if (player.currentTime <= watchedUntil.current + 1.5) {
            watchedUntil.current = Math.max(watchedUntil.current, player.currentTime)
          }
        }}
        onSeeking={(event) => {
          if (event.currentTarget.currentTime > watchedUntil.current + 0.5) {
            event.currentTarget.currentTime = watchedUntil.current
          }
        }}
        onEnded={finish}
        onError={() => {
          setCanPlay(false)
          setError('Miss Julie’s 90-second video is not uploaded yet. Please ask your teacher; the lesson cannot start without it.')
        }}
      />
      {error ? <p role="alert" style={{ padding: 12, color: '#991b1b' }}>{error}</p> : null}
      {needsTap && canPlay ? <div className="kg-intro-play-prompt">
        <p>Let’s watch the whole 90-second story together, then practise our words!</p>
        <button type="button" onClick={() => void begin()}><Play size={18} fill="currentColor" /> Play story with sound</button>
      </div> : null}
    </div>
  </div>
}
