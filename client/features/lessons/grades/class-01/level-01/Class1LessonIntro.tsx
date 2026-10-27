'use client'

import { useEffect, useRef, useState } from 'react'
import { Play, RotateCcw, Sparkles } from 'lucide-react'

/** This reviewed 90-second video is delivered separately from the application. */
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
  const fullscreenActive = useRef(false)
  const [canPlay, setCanPlay] = useState(false)
  const [needsTap, setNeedsTap] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    function pauseWhenHidden() {
      if (document.hidden) {
        video.current?.pause()
        setNeedsTap(true)
      }
    }

    function pauseWhenFullscreenEnds() {
      const isFullscreen = document.fullscreenElement === frame.current
      if (isFullscreen) {
        fullscreenActive.current = true
      } else if (fullscreenActive.current) {
        fullscreenActive.current = false
        video.current?.pause()
        setNeedsTap(true)
      }
    }

    document.addEventListener('visibilitychange', pauseWhenHidden)
    document.addEventListener('fullscreenchange', pauseWhenFullscreenEnds)
    return () => {
      document.removeEventListener('visibilitychange', pauseWhenHidden)
      document.removeEventListener('fullscreenchange', pauseWhenFullscreenEnds)
      video.current?.pause()
    }
  }, [])

  function validateVideo() {
    const duration = video.current?.duration ?? NaN
    if (!Number.isFinite(duration) || duration < MIN_DURATION_SECONDS || duration > MAX_DURATION_SECONDS) {
      setError('Miss Julie needs the approved 90-second lesson video. Please ask your teacher to check it.')
      setCanPlay(false)
      setLoading(false)
      return
    }
    if (watchedUntil.current > 0 && video.current) {
      video.current.currentTime = Math.min(watchedUntil.current, duration)
    }
    setCanPlay(true)
    setLoading(false)
    setError('')
    onAvailable()
  }

  async function begin() {
    if (!canPlay || !video.current || !frame.current) return
    try {
      // Fullscreen is an enhancement; school browser policies can reject it.
      if (typeof frame.current.requestFullscreen === 'function' && document.fullscreenElement !== frame.current) {
        try {
          await frame.current.requestFullscreen()
          fullscreenActive.current = document.fullscreenElement === frame.current
        } catch {
          fullscreenActive.current = false
        }
      }
      video.current.muted = false
      await video.current.play()
      setNeedsTap(false)
      setError('')
    } catch {
      video.current?.pause()
      setNeedsTap(true)
      setError('The story could not start. Tap to try again, or ask your teacher to check the sound settings.')
    }
  }

  function finish() {
    if (video.current?.muted || watchedUntil.current < REQUIRED_WATCH_SECONDS) {
      video.current?.pause()
      setNeedsTap(true)
      setError("Let's finish the complete story with sound before we start practising.")
      return
    }
    if (document.fullscreenElement === frame.current) void document.exitFullscreen?.().catch(() => undefined)
    onDone()
  }

  function retryVideo() {
    if (!video.current) return
    setError('')
    setCanPlay(false)
    setLoading(true)
    setNeedsTap(true)
    video.current.load()
  }

  return <div ref={frame} className="class1-intro-overlay" role="dialog" aria-modal="true" aria-label="Miss Julie Class 1 first day story">
    <div className="class1-intro-card">
      <div className="class1-intro-heading">
        <span><Sparkles size={20} aria-hidden="true" /> First, a little story with Miss Julie</span>
        <small>90-second welcome</small>
      </div>
      <video
        ref={video}
        className="class1-intro-video"
        src={CLASS1_FIRST_DAY_VIDEO}
        playsInline preload="metadata" controls={false}
        disablePictureInPicture controlsList="nodownload noplaybackrate noremoteplayback"
        aria-label="90-second Class 1 foundation and My First Day introduction"
        onLoadedMetadata={validateVideo}
        onTimeUpdate={(event) => {
          const player = event.currentTarget
          if (document.hidden || player.muted || player.seeking || player.paused) return
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
          setLoading(false)
          setError("Miss Julie's approved 90-second video could not load. Check the video link or ask your teacher.")
        }}
      />
      {loading ? <p className="class1-intro-status" role="status">Getting Miss Julie's story ready...</p> : null}
      {error ? <div className="class1-intro-error" role="alert"><p>{error}</p><button type="button" onClick={retryVideo}><RotateCcw size={16} /> Try loading again</button></div> : null}
      {needsTap && canPlay ? <div className="class1-intro-play-prompt">
        <p>Watch the whole story with sound. Then we will practise our little words together.</p>
        <button type="button" onClick={() => void begin()}><Play size={18} fill="currentColor" /> Play story</button>
      </div> : null}
    </div>
  </div>
}
